import { randomBytes } from "node:crypto";
import { closeSync, openSync, renameSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { Issue, Template } from "./types.ts";
import {
	ISSUES_FILE,
	LOCK_RETRY_MS,
	LOCK_STALE_MS,
	LOCK_TIMEOUT_MS,
	TEMPLATES_FILE,
} from "./types.ts";

function lockFilePath(dataFilePath: string): string {
	return `${dataFilePath}.lock`;
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
			// Check if stale
			try {
				const st = statSync(lock);
				if (Date.now() - st.mtimeMs > LOCK_STALE_MS) {
					unlinkSync(lock);
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

function parseJsonl<T>(content: string): T[] {
	const results: T[] = [];
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		try {
			results.push(JSON.parse(trimmed) as T);
		} catch {
			// skip malformed lines
		}
	}
	return results;
}

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
	const map = new Map<string, T>();
	for (const item of items) {
		map.set(item.id, item); // last occurrence wins
	}
	return Array.from(map.values());
}

export async function readIssues(seedsDir: string): Promise<Issue[]> {
	const file = Bun.file(join(seedsDir, ISSUES_FILE));
	if (!(await file.exists())) return [];
	const content = await file.text();
	return deduplicateById(parseJsonl<Issue>(content));
}

export async function writeIssues(seedsDir: string, issues: Issue[]): Promise<void> {
	const filePath = join(seedsDir, ISSUES_FILE);
	const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
	const content = `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`;
	await Bun.write(tmpPath, content);
	renameSync(tmpPath, filePath);
}

export async function appendIssue(seedsDir: string, issue: Issue): Promise<void> {
	const filePath = join(seedsDir, ISSUES_FILE);
	const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
	const file = Bun.file(filePath);
	const existing = (await file.exists()) ? await file.text() : "";
	await Bun.write(tmpPath, `${existing + JSON.stringify(issue)}\n`);
	renameSync(tmpPath, filePath);
}

export async function readTemplates(seedsDir: string): Promise<Template[]> {
	const file = Bun.file(join(seedsDir, TEMPLATES_FILE));
	if (!(await file.exists())) return [];
	const content = await file.text();
	return deduplicateById(parseJsonl<Template>(content));
}

export async function writeTemplates(seedsDir: string, templates: Template[]): Promise<void> {
	const filePath = join(seedsDir, TEMPLATES_FILE);
	const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
	const content = `${templates.map((t) => JSON.stringify(t)).join("\n")}\n`;
	await Bun.write(tmpPath, content);
	renameSync(tmpPath, filePath);
}

export async function appendTemplate(seedsDir: string, template: Template): Promise<void> {
	const filePath = join(seedsDir, TEMPLATES_FILE);
	const tmpPath = `${filePath}.tmp.${randomBytes(4).toString("hex")}`;
	const file = Bun.file(filePath);
	const existing = (await file.exists()) ? await file.text() : "";
	await Bun.write(tmpPath, `${existing + JSON.stringify(template)}\n`);
	renameSync(tmpPath, filePath);
}

export function issuesPath(seedsDir: string): string {
	return join(seedsDir, ISSUES_FILE);
}

export function templatesPath(seedsDir: string): string {
	return join(seedsDir, TEMPLATES_FILE);
}
