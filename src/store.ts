import { randomBytes } from "node:crypto";
import {
	closeSync,
	fstatSync,
	openSync,
	readFileSync,
	readSync,
	renameSync,
	statSync,
	unlinkSync,
	utimesSync,
	writeSync,
} from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { assertValidIssues, validateIssue } from "./issue-schema.ts";
import type { Issue, Plan, Template } from "./types.ts";
import {
	ISSUES_FILE,
	LOCK_HEARTBEAT_MS,
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
 * no longer delete a path we don't own. Returns true when the stale inode we
 * observed was the one removed.
 */
export function reclaimStaleLock(
	lock: string,
	originalStat: { ino: number; mtimeMs: number },
): boolean {
	const sidecar = `${lock}.stale.${randomBytes(8).toString("hex")}`;
	try {
		renameSync(lock, sidecar);
	} catch {
		return false; // another claimant won the rename; outer loop retries
	}
	let stSidecar: { ino: number; mtimeMs: number };
	try {
		stSidecar = statSync(sidecar);
	} catch {
		bestEffortUnlink(sidecar);
		return false;
	}
	if (stSidecar.ino === originalStat.ino && stSidecar.mtimeMs === originalStat.mtimeMs) {
		bestEffortUnlink(sidecar);
		return true;
	}
	try {
		renameSync(sidecar, lock);
	} catch {
		bestEffortUnlink(sidecar);
	}
	return false;
}

/** Owner record written into every lock file by its holder. */
export interface LockOwner {
	pid: number;
	host: string;
	startedAt: string;
}

function readLockOwner(lock: string): LockOwner | null {
	try {
		const parsed: unknown = JSON.parse(readFileSync(lock, "utf8"));
		if (typeof parsed !== "object" || parsed === null) return null;
		const { pid, host, startedAt } = parsed as Record<string, unknown>;
		if (typeof pid !== "number" || typeof host !== "string") return null;
		return { pid, host, startedAt: typeof startedAt === "string" ? startedAt : "" };
	} catch {
		return null; // missing, empty (holder mid-write), or legacy ownerless lock
	}
}

function processAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch (err: unknown) {
		return (err as NodeJS.ErrnoException).code !== "ESRCH"; // EPERM: alive, not ours
	}
}

/**
 * A lock is stale when its holder on this host is provably dead (reclaim at
 * once), or — for cross-host, legacy, or unreadable locks — when its mtime is
 * older than LOCK_STALE_MS. Live holders heartbeat the mtime, so the age
 * fallback only fires for holders that stopped running.
 */
export function isLockStale(lock: string, st: { mtimeMs: number }): boolean {
	if (Date.now() - st.mtimeMs > LOCK_STALE_MS) return true;
	const owner = readLockOwner(lock);
	return owner !== null && owner.host === hostname() && !processAlive(owner.pid);
}

function describeOwner(lock: string): string {
	const owner = readLockOwner(lock);
	if (!owner) return "";
	return ` (held by pid ${String(owner.pid)} on ${owner.host} since ${owner.startedAt})`;
}

/** Create the lock exclusively (throws EEXIST if held) and stamp it with our owner record. */
function createOwnedLock(lock: string): number {
	const fd = openSync(lock, "wx");
	try {
		const owner: LockOwner = {
			pid: process.pid,
			host: hostname(),
			startedAt: new Date().toISOString(),
		};
		writeSync(fd, JSON.stringify(owner));
	} catch (err: unknown) {
		closeSync(fd);
		bestEffortUnlink(lock); // never leave an ownerless lock we created
		throw err;
	}
	closeSync(fd);
	return statSync(lock).ino;
}

/** Acquire the lock; returns the lock file's inode so the holder can heartbeat it. */
async function acquireLock(dataFilePath: string): Promise<number> {
	const lock = lockFilePath(dataFilePath);
	const start = Date.now();
	while (true) {
		try {
			return createOwnedLock(lock);
		} catch (err: unknown) {
			const nodeErr = err as NodeJS.ErrnoException;
			if (nodeErr.code !== "EEXIST") throw err;
			try {
				const st = statSync(lock);
				if (isLockStale(lock, st)) {
					reclaimStaleLock(lock, st);
					continue;
				}
			} catch {
				continue;
			}
			if (Date.now() - start > LOCK_TIMEOUT_MS) {
				throw new Error(`Timeout acquiring lock for ${dataFilePath}${describeOwner(lock)}`);
			}
			await sleep(LOCK_RETRY_MS + Math.floor(Math.random() * LOCK_RETRY_MS));
		}
	}
}

/** Refresh the lock's mtime, but only while it is still the inode we created. */
function heartbeat(dataFilePath: string, ino: number): void {
	const lock = lockFilePath(dataFilePath);
	try {
		if (statSync(lock).ino !== ino) return;
		const now = new Date();
		utimesSync(lock, now, now);
	} catch {
		// lock gone; release will no-op
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
	const ino = await acquireLock(dataFilePath);
	const timer = setInterval(() => heartbeat(dataFilePath, ino), LOCK_HEARTBEAT_MS);
	timer.unref();
	try {
		return await fn();
	} finally {
		clearInterval(timer);
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

// Rows of issues.jsonl that parse but fail validateIssue, from the most recent
// read. They are quarantined: hidden from callers (so list/show/stats never see
// a 'Phigh' or id-less issue) yet written back on every rewrite, so a bad row
// is never silently deleted. `sd doctor` names them for repair by hand.
const quarantinedOnLastRead = new Map<string, unknown[]>();
const warnedQuarantine = new Set<string>();

function quarantineInvalid(rows: unknown[], filePath: string): Issue[] {
	const valid: Issue[] = [];
	const quarantined: unknown[] = [];
	for (const row of rows) {
		if (validateIssue(row).length === 0) valid.push(row as Issue);
		else quarantined.push(row);
	}
	quarantinedOnLastRead.set(filePath, quarantined);
	if (quarantined.length > 0 && !warnedQuarantine.has(filePath)) {
		warnedQuarantine.add(filePath); // once per process, not once per read
		process.stderr.write(
			`warning: ${String(quarantined.length)} invalid issue row(s) in ${filePath} ` +
				"are hidden from sd; run 'sd doctor' for details\n",
		);
	}
	return valid;
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
		quarantinedOnLastRead.delete(filePath);
		return [];
	}
	const content = await file.text();
	// Validate before dedup so a quarantined row never shadows a valid one.
	return deduplicateById(quarantineInvalid(parseJsonl<unknown>(content, filePath), filePath));
}

export async function writeIssues(seedsDir: string, issues: Issue[]): Promise<void> {
	const filePath = join(seedsDir, ISSUES_FILE);
	assertNoMalformedLoss(filePath);
	assertValidIssues(issues);
	const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
	const rows = [...issues, ...(quarantinedOnLastRead.get(filePath) ?? [])];
	const content = rows.length === 0 ? "" : `${rows.map((r) => JSON.stringify(r)).join("\n")}\n`;
	await Bun.write(tmpPath, content);
	renameSync(tmpPath, filePath);
}

/**
 * Append one row with O_APPEND (seeds-b79d): cost is O(row), not O(file), and
 * the existing bytes (malformed and quarantined rows included) are never
 * touched. Only the last byte is read, to terminate a line left without a
 * trailing newline. Caller holds the file's lock.
 */
function appendJsonlRow(filePath: string, row: unknown): void {
	const line = `${JSON.stringify(row)}\n`;
	const fd = openSync(filePath, "a+");
	try {
		const { size } = fstatSync(fd);
		const last = Buffer.alloc(1);
		const needsNewline = size > 0 && readSync(fd, last, 0, 1, size - 1) === 1 && last[0] !== 0x0a;
		writeSync(fd, needsNewline ? `\n${line}` : line);
	} finally {
		closeSync(fd);
	}
}

/**
 * Append a single issue to `.seeds/issues.jsonl`.
 *
 * Caller must hold `withLock(issuesPath(seedsDir), …)` for the duration of this
 * call — this helper does NOT acquire the file lock itself. Concurrent writes
 * without the lock can interleave with a rewrite and lose data.
 */
export async function appendIssue(seedsDir: string, issue: Issue): Promise<void> {
	assertValidIssues([issue]);
	appendJsonlRow(join(seedsDir, ISSUES_FILE), issue);
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
	appendJsonlRow(join(seedsDir, TEMPLATES_FILE), template);
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
	appendJsonlRow(join(seedsDir, PLANS_FILE), plan);
}
