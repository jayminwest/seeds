import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendIssue, issuesPath, readIssues, withLock, writeIssues } from "./store.ts";
import type { Issue } from "./types.ts";

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	const now = new Date().toISOString();
	return {
		id: "test-0001",
		title: "Test issue",
		status: "open",
		type: "task",
		priority: 2,
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

let tmpDir: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "seeds-store-test-"));
	// Create empty issues.jsonl
	writeFileSync(join(tmpDir, "issues.jsonl"), "");
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

describe("readIssues", () => {
	test("returns empty array for empty file", async () => {
		const issues = await readIssues(tmpDir);
		expect(issues).toEqual([]);
	});

	test("reads single issue", async () => {
		const issue = makeIssue();
		writeFileSync(join(tmpDir, "issues.jsonl"), `${JSON.stringify(issue)}\n`);
		const issues = await readIssues(tmpDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.id).toBe("test-0001");
	});

	test("reads multiple issues", async () => {
		const i1 = makeIssue({ id: "test-0001" });
		const i2 = makeIssue({ id: "test-0002", title: "Second" });
		writeFileSync(join(tmpDir, "issues.jsonl"), `${JSON.stringify(i1)}\n${JSON.stringify(i2)}\n`);
		const issues = await readIssues(tmpDir);
		expect(issues).toHaveLength(2);
	});

	test("deduplicates by id (last wins)", async () => {
		const v1 = makeIssue({ id: "test-0001", title: "Original" });
		const v2 = makeIssue({ id: "test-0001", title: "Updated" });
		writeFileSync(join(tmpDir, "issues.jsonl"), `${JSON.stringify(v1)}\n${JSON.stringify(v2)}\n`);
		const issues = await readIssues(tmpDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.title).toBe("Updated");
	});

	test("skips malformed lines", async () => {
		const issue = makeIssue();
		writeFileSync(join(tmpDir, "issues.jsonl"), `${JSON.stringify(issue)}\nnot-valid-json\n`);
		const issues = await readIssues(tmpDir);
		expect(issues).toHaveLength(1);
	});

	test("returns empty if file does not exist", async () => {
		rmSync(join(tmpDir, "issues.jsonl"));
		const issues = await readIssues(tmpDir);
		expect(issues).toEqual([]);
	});
});

describe("writeIssues", () => {
	test("writes issues atomically", async () => {
		const issues = [makeIssue({ id: "test-0001" }), makeIssue({ id: "test-0002" })];
		await writeIssues(tmpDir, issues);
		const read = await readIssues(tmpDir);
		expect(read).toHaveLength(2);
		expect(read[0]?.id).toBe("test-0001");
		expect(read[1]?.id).toBe("test-0002");
	});

	test("overwrites existing content", async () => {
		const v1 = [makeIssue({ id: "test-0001" })];
		await writeIssues(tmpDir, v1);
		const v2 = [makeIssue({ id: "test-0002" })];
		await writeIssues(tmpDir, v2);
		const read = await readIssues(tmpDir);
		expect(read).toHaveLength(1);
		expect(read[0]?.id).toBe("test-0002");
	});
});

describe("appendIssue", () => {
	test("appends to existing issues", async () => {
		const i1 = makeIssue({ id: "test-0001" });
		await appendIssue(tmpDir, i1);
		const i2 = makeIssue({ id: "test-0002" });
		await appendIssue(tmpDir, i2);
		const read = await readIssues(tmpDir);
		expect(read).toHaveLength(2);
	});

	test("works on empty file", async () => {
		const issue = makeIssue();
		await appendIssue(tmpDir, issue);
		const read = await readIssues(tmpDir);
		expect(read).toHaveLength(1);
		expect(read[0]?.id).toBe("test-0001");
	});
});

describe("withLock", () => {
	test("executes function and releases lock", async () => {
		const path = issuesPath(tmpDir);
		let executed = false;
		await withLock(path, async () => {
			executed = true;
		});
		expect(executed).toBe(true);
	});

	test("serializes concurrent operations", async () => {
		const path = issuesPath(tmpDir);
		const results: number[] = [];
		const ops = [1, 2, 3].map((n) =>
			withLock(path, async () => {
				results.push(n);
				await new Promise((resolve) => setTimeout(resolve, 10));
			}),
		);
		await Promise.all(ops);
		expect(results).toHaveLength(3);
	});
});
