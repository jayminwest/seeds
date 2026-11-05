import { randomBytes } from "node:crypto";
import {
	copyFileSync,
	existsSync,
	readFileSync,
	renameSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { validateIssue } from "./issue-schema.ts";
import { isLockStale, reclaimStaleLock, withLock } from "./store.ts";
import type { Issue } from "./types.ts";
import { CONFIG_FILE, ISSUES_FILE, PLANS_FILE, TEMPLATES_FILE } from "./types.ts";

// Store access for `sd doctor` (seeds-499f): raw line reads for the checks, and
// a locked, atomic rewrite path for every --fix so a concurrent `sd` write is
// neither lost nor torn.

/** Every JSONL store doctor inspects for integrity and duplicates. */
export const JSONL_FILES = [ISSUES_FILE, TEMPLATES_FILE, PLANS_FILE] as const;

/** Every file a seeds command may lock (config.yaml is locked by `sd config set`). */
const LOCKED_FILES = [...JSONL_FILES, CONFIG_FILE] as const;

export interface RawLine {
	lineNumber: number;
	text: string;
	parsed?: unknown;
	error?: string;
}

export function readRawLines(filePath: string): RawLine[] {
	if (!existsSync(filePath)) return [];
	const content = readFileSync(filePath, "utf8");
	const lines: RawLine[] = [];
	for (const [i, raw] of content.split("\n").entries()) {
		const text = raw.trim();
		if (!text) continue;
		try {
			lines.push({ lineNumber: i + 1, text, parsed: JSON.parse(text) });
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			lines.push({ lineNumber: i + 1, text, error: msg });
		}
	}
	return lines;
}

/**
 * One read of every JSONL store, shared by all doctor checks (seeds-b79d: the
 * checks used to re-read and re-parse issues.jsonl once each). `issues` is what
 * readIssues() returns — valid rows, last occurrence wins — and `invalid`
 * holds the schema problems of every parsed row readIssues() would quarantine.
 */
export interface StoreSnapshot {
	lines: Record<(typeof JSONL_FILES)[number], RawLine[]>;
	issues: Issue[];
	invalid: { line: RawLine; problems: string[] }[];
}

export function readSnapshot(seedsDir: string): StoreSnapshot {
	const [issues, templates, plans] = JSONL_FILES.map((f) => readRawLines(join(seedsDir, f)));
	const issueLines = issues ?? [];
	const byId = new Map<string, Issue>();
	const invalid: StoreSnapshot["invalid"] = [];
	for (const line of issueLines) {
		if (line.error !== undefined) continue;
		const problems = validateIssue(line.parsed);
		if (problems.length > 0) invalid.push({ line, problems });
		else byId.set((line.parsed as Issue).id, line.parsed as Issue);
	}
	return {
		lines: {
			[ISSUES_FILE]: issueLines,
			[TEMPLATES_FILE]: templates ?? [],
			[PLANS_FILE]: plans ?? [],
		},
		issues: [...byId.values()],
		invalid,
	};
}

/** Re-serialize lines after in-place edits to `parsed`; malformed lines are kept verbatim. */
export function serializeLines(lines: RawLine[]): string[] {
	return lines.map((l) => (l.error === undefined ? JSON.stringify(l.parsed) : l.text));
}

/**
 * Rewrite one JSONL store under its lock. `edit` sees the lines as read under
 * the lock and returns the new lines, or null to leave the file untouched.
 * With `backup`, the pre-fix file is copied to `<file>.bak` first (for fixes
 * that delete rows). Returns whether the file was rewritten.
 */
export async function rewriteJsonl(
	seedsDir: string,
	file: string,
	edit: (lines: RawLine[]) => string[] | null,
	opts: { backup?: boolean } = {},
): Promise<boolean> {
	const filePath = join(seedsDir, file);
	if (!existsSync(filePath)) return false;
	return withLock(filePath, async () => {
		const next = edit(readRawLines(filePath));
		if (next === null) return false;
		if (opts.backup) copyFileSync(filePath, `${filePath}.bak`);
		const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
		writeFileSync(tmpPath, next.length > 0 ? `${next.join("\n")}\n` : "");
		renameSync(tmpPath, filePath);
		return true;
	});
}

export interface LockReport {
	file: string;
	state: "stale" | "active" | "unreadable";
	ageSec: number;
}

/** Lock files present in .seeds/, classified by the same isLockStale() the store uses. */
export function inspectLocks(seedsDir: string): LockReport[] {
	const reports: LockReport[] = [];
	for (const file of LOCKED_FILES) {
		const lockPath = join(seedsDir, `${file}.lock`);
		if (!existsSync(lockPath)) continue;
		try {
			const st = statSync(lockPath);
			const ageSec = Math.round((Date.now() - st.mtimeMs) / 1000);
			reports.push({ file, state: isLockStale(lockPath, st) ? "stale" : "active", ageSec });
		} catch {
			reports.push({ file, state: "unreadable", ageSec: 0 });
		}
	}
	return reports;
}

/** Reclaim stale locks via the store's race-safe rename; returns the files whose lock was removed. */
export function removeStaleLocks(seedsDir: string): string[] {
	const removed: string[] = [];
	for (const file of LOCKED_FILES) {
		const lockPath = join(seedsDir, `${file}.lock`);
		try {
			const st = statSync(lockPath);
			if (isLockStale(lockPath, st) && reclaimStaleLock(lockPath, st)) removed.push(file);
		} catch {
			// absent or unreadable: nothing to reclaim
		}
	}
	return removed;
}

/** Parsed rows that carry a string id, in file order (the shape every fixer edits in place). */
export function rowsWithId<T extends { id: string }>(lines: RawLine[]): T[] {
	const rows: T[] = [];
	for (const line of lines) {
		const row = line.parsed as { id?: unknown } | null | undefined;
		if (typeof row === "object" && row !== null && typeof row.id === "string") rows.push(row as T);
	}
	return rows;
}
