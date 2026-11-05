import { randomBytes } from "node:crypto";
import { closeSync, openSync, renameSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { Issue, Plan, Template } from "./types.ts";
import {
	ISSUES_FILE,
	LOCK_RETRY_MS,
	LOCK_STALE_MS,
	LOCK_TIMEOUT_MS,
	PLANS_FILE,
	TEMPLATES_FILE,
} from "./types.ts";

function lockFilePath(dataFilePath: string): string {
	return `${dataFilePath}.lock`;
}

function bestEffortUnlink(path: string): void {
	try {
		unlinkSync(path);
	} catch {
		// best-effort cleanup
	}
}

/**
 * Try to remove a lock entry that looks stale, atomically.
 *
 * A bare `unlinkSync(lock)` here would be racy: between our stat and
 * unlink another process can win `openSync(wx)` for a fresh lock, and our
 * unlink would then delete their freshly-acquired lock, allowing two
 * writers.
 *
 * Instead, we atomically rename `lock` to a unique sidecar. POSIX rename
 * is atomic, so at most one concurrent claimant moves the entry; the
 * others get ENOENT and simply retry the outer loop. After the rename, we
 * verify the captured file is the same stale inode we observed
 * (ino + mtime). If it isn't, another claimant has already cycled the
 * lock — we restore the sidecar atomically so we don't drop their
 * (now-fresh) lock. We never call `unlinkSync(lock)` directly, so we can
 * no longer delete a path we don't own.
 */
function reclaimStaleLock(lock: string, originalStat: { ino: number; mtimeMs: number }): void {
	const sidecar = `${lock}.stale.${randomBytes(8).toString("hex")}`;
	try {
		renameSync(lock, sidecar);
	} catch {
		return; // another claimant won the rename; outer loop retries
	}
	let stSidecar: { ino: number; mtimeMs: number };
	try {
		stSidecar = statSync(sidecar);
	} catch {
		bestEffortUnlink(sidecar);
		return;
	}
	if (stSidecar.ino === originalStat.ino && stSidecar.mtimeMs === originalStat.mtimeMs) {
		bestEffortUnlink(sidecar);
		return;
	}
	try {
		renameSync(sidecar, lock);
	} catch {
		bestEffortUnlink(sidecar);
	}
}

async function acquireLock(dataFilePath: string): Promise<void> {
	const lock = lockFilePath(dataFilePath);
	const start = Date.now();
	while (true) {
		try {
			const fd = openSync(lock, "wx");
			closeSync(fd);
			return;
		} catch (err: unknown) {
			const nodeErr = err as NodeJS.ErrnoException;
			if (nodeErr.code !== "EEXIST") throw err;
			try {
				const st = statSync(lock);
				if (Date.now() - st.mtimeMs > LOCK_STALE_MS) {
					reclaimStaleLock(lock, st);
					continue;
				}
			} catch {
				continue;
			}
			if (Date.now() - start > LOCK_TIMEOUT_MS) {
				throw new Error(`Timeout acquiring lock for ${dataFilePath}`);
			}
			await sleep(LOCK_RETRY_MS + Math.floor(Math.random() * LOCK_RETRY_MS));
		}
	}
}

function releaseLock(dataFilePath: string): void {
	try {
		unlinkSync(lockFilePath(dataFilePath));
	} catch {
		// best-effort
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withLock<T>(dataFilePath: string, fn: () => Promise<T>): Promise<T> {
	await acquireLock(dataFilePath);
	try {
		return await fn();
	} finally {
		releaseLock(dataFilePath);
	}
}

// Malformed-line count from the most recent read of each JSONL file. Every
// rewrite path reads under the same lock first, so a rewrite can tell it is
// about to drop rows it could not parse and refuse instead of deleting them.
const malformedOnLastRead = new Map<string, number>();

function parseJsonl<T>(content: string, filePath: string): T[] {
	const results: T[] = [];
	let malformed = 0;
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		try {
			results.push(JSON.parse(trimmed) as T);
		} catch {
			malformed++; // skipped on read; guarded on rewrite
		}
	}
	malformedOnLastRead.set(filePath, malformed);
	return results;
}

function assertNoMalformedLoss(filePath: string): void {
	const n = malformedOnLastRead.get(filePath) ?? 0;
	if (n === 0) return;
	throw new Error(
		`Refusing to rewrite ${filePath}: ${String(n)} malformed line(s) would be lost. ` +
			"Run 'sd doctor' to inspect them, then repair by hand or drop them with 'sd doctor --fix'.",
	);
}

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
	const map = new Map<string, T>();
	for (const item of items) {
		map.set(item.id, item); // last occurrence wins
	}
	return Array.from(map.values());
}

export async function readIssues(seedsDir: string): Promise<Issue[]> {
	const filePath = join(seedsDir, ISSUES_FILE);
	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		malformedOnLastRead.delete(filePath);
		return [];
	}
	const content = await file.text();
	return deduplicateById(parseJsonl<Issue>(content, filePath));
}

export async function writeIssues(seedsDir: string, issues: Issue[]): Promise<void> {
	const filePath = join(seedsDir, ISSUES_FILE);
	assertNoMalformedLoss(filePath);
	const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
	const content = issues.length === 0 ? "" : `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`;
	await Bun.write(tmpPath, content);
	renameSync(tmpPath, filePath);
}

/**
 * Append a single issue to `.seeds/issues.jsonl`.
 *
 * Caller must hold `withLock(issuesPath(seedsDir), …)` for the duration of this
 * call — this helper does NOT acquire the file lock itself. Concurrent writes
 * without the lock can lose data (read/append/rename is not atomic across
 * processes on its own).
 */
export async function appendIssue(seedsDir: string, issue: Issue): Promise<void> {
	const filePath = join(seedsDir, ISSUES_FILE);
	const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
	const file = Bun.file(filePath);
	const existing = (await file.exists()) ? await file.text() : "";
	const prefix = existing === "" || existing.endsWith("\n") ? existing : `${existing}\n`;
	await Bun.write(tmpPath, `${prefix}${JSON.stringify(issue)}\n`);
	renameSync(tmpPath, filePath);
}

export async function readTemplates(seedsDir: string): Promise<Template[]> {
	const filePath = join(seedsDir, TEMPLATES_FILE);
	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		malformedOnLastRead.delete(filePath);
		return [];
	}
	const content = await file.text();
	return deduplicateById(parseJsonl<Template>(content, filePath));
}

export async function writeTemplates(seedsDir: string, templates: Template[]): Promise<void> {
	const filePath = join(seedsDir, TEMPLATES_FILE);
	assertNoMalformedLoss(filePath);
	const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
	const content =
		templates.length === 0 ? "" : `${templates.map((t) => JSON.stringify(t)).join("\n")}\n`;
	await Bun.write(tmpPath, content);
	renameSync(tmpPath, filePath);
}

/**
 * Append a single template to `.seeds/templates.jsonl`.
 *
 * Caller must hold `withLock(templatesPath(seedsDir), …)` for the duration of
 * this call — this helper does NOT acquire the file lock itself. Concurrent
 * writes without the lock can lose data.
 */
export async function appendTemplate(seedsDir: string, template: Template): Promise<void> {
	const filePath = join(seedsDir, TEMPLATES_FILE);
	const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
	const file = Bun.file(filePath);
	const existing = (await file.exists()) ? await file.text() : "";
	const prefix = existing === "" || existing.endsWith("\n") ? existing : `${existing}\n`;
	await Bun.write(tmpPath, `${prefix}${JSON.stringify(template)}\n`);
	renameSync(tmpPath, filePath);
}

export function issuesPath(seedsDir: string): string {
	return join(seedsDir, ISSUES_FILE);
}

export function templatesPath(seedsDir: string): string {
	return join(seedsDir, TEMPLATES_FILE);
}

export function plansPath(seedsDir: string): string {
	return join(seedsDir, PLANS_FILE);
}

export async function readPlans(seedsDir: string): Promise<Plan[]> {
	const filePath = join(seedsDir, PLANS_FILE);
	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		malformedOnLastRead.delete(filePath);
		return [];
	}
	const content = await file.text();
	return deduplicateById(parseJsonl<Plan>(content, filePath));
}

export async function writePlans(seedsDir: string, plans: Plan[]): Promise<void> {
	const filePath = join(seedsDir, PLANS_FILE);
	assertNoMalformedLoss(filePath);
	const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
	const content = plans.length === 0 ? "" : `${plans.map((p) => JSON.stringify(p)).join("\n")}\n`;
	await Bun.write(tmpPath, content);
	renameSync(tmpPath, filePath);
}

/**
 * Append a single plan to `.seeds/plans.jsonl`.
 *
 * Caller must hold `withLock(plansPath(seedsDir), …)` for the duration of this
 * call — this helper does NOT acquire the file lock itself. Concurrent writes
 * without the lock can lose data.
 */
export async function appendPlan(seedsDir: string, plan: Plan): Promise<void> {
	const filePath = join(seedsDir, PLANS_FILE);
	const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
	const file = Bun.file(filePath);
	const existing = (await file.exists()) ? await file.text() : "";
	const prefix = existing === "" || existing.endsWith("\n") ? existing : `${existing}\n`;
	await Bun.write(tmpPath, `${prefix}${JSON.stringify(plan)}\n`);
	renameSync(tmpPath, filePath);
}
