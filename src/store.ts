import { closeSync, existsSync, openSync, renameSync, statSync, unlinkSync } from "node:fs";
import { constants } from "node:fs";
import { join } from "node:path";
import type { Issue, Template } from "./types.ts";

const { O_CREAT, O_EXCL, O_WRONLY } = constants;

// --- Lock parameters (stolen from mulch) ---
const LOCK_STALE_MS = 30_000;
const LOCK_RETRY_MS = 50;
const LOCK_TIMEOUT_MS = 5_000;

function lockPath(filePath: string): string {
	return `${filePath}.lock`;
}

async function acquireLock(filePath: string): Promise<void> {
	const lock = lockPath(filePath);
	const deadline = Date.now() + LOCK_TIMEOUT_MS;
	while (true) {
		try {
			const fd = openSync(lock, O_CREAT | O_EXCL | O_WRONLY, 0o600);
			closeSync(fd);
			return;
		} catch (e: unknown) {
			if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
			// Check if stale
			try {
				const stat = statSync(lock);
				if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
					unlinkSync(lock);
					continue;
				}
			} catch {
				// Lock was removed between our EEXIST and statSync — retry immediately
				continue;
			}
			if (Date.now() >= deadline) {
				throw new Error(`Timeout acquiring lock for ${filePath}`);
			}
			await sleep(LOCK_RETRY_MS);
		}
	}
}

function releaseLock(filePath: string): void {
	try {
		unlinkSync(lockPath(filePath));
	} catch {
		// Best-effort cleanup
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- JSONL helpers ---

async function readJsonl<T>(filePath: string): Promise<T[]> {
	const file = Bun.file(filePath);
	if (!(await file.exists())) return [];
	const text = await file.text();
	const results: T[] = [];
	for (const line of text.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		results.push(JSON.parse(trimmed) as T);
	}
	return results;
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
	const tmpFile = `${filePath}.tmp.${Math.random().toString(36).slice(2)}`;
	await Bun.write(tmpFile, content);
	renameSync(tmpFile, filePath);
}

// --- Issues ---

/**
 * Read all issues with dedup: last occurrence wins.
 * Handles duplicates produced by `merge=union` git merges.
 */
export async function readIssues(seedsDir: string): Promise<Issue[]> {
	const raw = await readJsonl<Issue>(join(seedsDir, "issues.jsonl"));
	const map = new Map<string, Issue>();
	for (const issue of raw) {
		map.set(issue.id, issue);
	}
	return Array.from(map.values());
}

/** Append a new issue under advisory lock. Creates file if needed. */
export async function appendIssue(seedsDir: string, issue: Issue): Promise<void> {
	const filePath = join(seedsDir, "issues.jsonl");
	await acquireLock(filePath);
	try {
		const line = `${JSON.stringify(issue)}\n`;
		const file = Bun.file(filePath);
		const existing = (await file.exists()) ? await file.text() : "";
		await Bun.write(filePath, existing + line);
	} finally {
		releaseLock(filePath);
	}
}

/** Atomically rewrite all issues under advisory lock. */
export async function writeIssues(seedsDir: string, issues: Issue[]): Promise<void> {
	const filePath = join(seedsDir, "issues.jsonl");
	await acquireLock(filePath);
	try {
		const content = `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`;
		await atomicWrite(filePath, content);
	} finally {
		releaseLock(filePath);
	}
}

// --- Templates ---

/**
 * Read all templates with dedup: last occurrence wins.
 */
export async function readTemplates(seedsDir: string): Promise<Template[]> {
	const raw = await readJsonl<Template>(join(seedsDir, "templates.jsonl"));
	const map = new Map<string, Template>();
	for (const tpl of raw) {
		map.set(tpl.id, tpl);
	}
	return Array.from(map.values());
}

/** Append a new template under advisory lock. */
export async function appendTemplate(seedsDir: string, tpl: Template): Promise<void> {
	const filePath = join(seedsDir, "templates.jsonl");
	await acquireLock(filePath);
	try {
		const line = `${JSON.stringify(tpl)}\n`;
		const file = Bun.file(filePath);
		const existing = (await file.exists()) ? await file.text() : "";
		await Bun.write(filePath, existing + line);
	} finally {
		releaseLock(filePath);
	}
}

/** Atomically rewrite all templates under advisory lock. */
export async function writeTemplates(seedsDir: string, templates: Template[]): Promise<void> {
	const filePath = join(seedsDir, "templates.jsonl");
	await acquireLock(filePath);
	try {
		const content = `${templates.map((t) => JSON.stringify(t)).join("\n")}\n`;
		await atomicWrite(filePath, content);
	} finally {
		releaseLock(filePath);
	}
}

// --- Seeds directory resolution ---

/**
 * Find the .seeds directory by walking up from cwd.
 * Returns null if not found.
 */
export function findSeedsDir(startDir?: string): string | null {
	let dir = startDir ?? process.cwd();
	// Walk up to filesystem root
	while (true) {
		const candidate = join(dir, ".seeds");
		if (existsSync(candidate)) return candidate;
		const parent = join(dir, "..");
		if (parent === dir) return null;
		dir = parent;
	}
}
