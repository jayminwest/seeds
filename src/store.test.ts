import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Issue } from "./types";
import { appendIssue, readIssues, withLock, writeIssues } from "./store";

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	const now = new Date().toISOString();
	return {
		id: "test-a1b2",
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
let seedsDir: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-store-test-"));
	seedsDir = join(tmpDir, ".seeds");
	await Bun.write(join(seedsDir, ".gitignore"), "*.lock\n");
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("readIssues", () => {
	test("returns empty array when issues.jsonl does not exist", async () => {
		const issues = await readIssues(seedsDir);
		expect(issues).toEqual([]);
	});

	test("returns empty array for empty file", async () => {
		await Bun.write(join(seedsDir, "issues.jsonl"), "");
		const issues = await readIssues(seedsDir);
		expect(issues).toEqual([]);
	});

	test("reads single issue", async () => {
		const issue = makeIssue();
		await Bun.write(join(seedsDir, "issues.jsonl"), JSON.stringify(issue) + "\n");
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]).toEqual(issue);
	});

	test("reads multiple issues", async () => {
		const issue1 = makeIssue({ id: "test-a1b2", title: "First" });
		const issue2 = makeIssue({ id: "test-c3d4", title: "Second" });
		const content = [JSON.stringify(issue1), JSON.stringify(issue2), ""].join("\n");
		await Bun.write(join(seedsDir, "issues.jsonl"), content);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(2);
		expect(issues[0]?.id).toBe("test-a1b2");
		expect(issues[1]?.id).toBe("test-c3d4");
	});

	test("deduplicates by id — last occurrence wins", async () => {
		const original = makeIssue({ id: "test-a1b2", title: "Original" });
		const updated = makeIssue({ id: "test-a1b2", title: "Updated" });
		const content = [JSON.stringify(original), JSON.stringify(updated), ""].join("\n");
		await Bun.write(join(seedsDir, "issues.jsonl"), content);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.title).toBe("Updated");
	});

	test("skips blank lines", async () => {
		const issue = makeIssue();
		const content = "\n" + JSON.stringify(issue) + "\n\n";
		await Bun.write(join(seedsDir, "issues.jsonl"), content);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
	});
});

describe("appendIssue", () => {
	test("creates issues.jsonl if it does not exist", async () => {
		const issue = makeIssue();
		await appendIssue(seedsDir, issue);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]).toEqual(issue);
	});

	test("appends to existing file", async () => {
		const issue1 = makeIssue({ id: "test-a1b2" });
		const issue2 = makeIssue({ id: "test-c3d4" });
		await appendIssue(seedsDir, issue1);
		await appendIssue(seedsDir, issue2);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(2);
	});

	test("each appended issue is on its own line", async () => {
		const issue = makeIssue();
		await appendIssue(seedsDir, issue);
		const content = await Bun.file(join(seedsDir, "issues.jsonl")).text();
		const lines = content.split("\n").filter((l) => l.trim() !== "");
		expect(lines).toHaveLength(1);
		expect(JSON.parse(lines[0] ?? "{}")).toEqual(issue);
	});
});

describe("writeIssues", () => {
	test("writes issues atomically (overwrites file)", async () => {
		const original = makeIssue({ id: "test-a1b2", title: "Original" });
		await appendIssue(seedsDir, original);

		const updated = makeIssue({ id: "test-a1b2", title: "Updated" });
		await writeIssues(seedsDir, [updated]);

		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.title).toBe("Updated");
	});

	test("writes empty array as empty file", async () => {
		const issue = makeIssue();
		await appendIssue(seedsDir, issue);
		await writeIssues(seedsDir, []);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(0);
	});

	test("each issue serialized to its own line", async () => {
		const issues = [
			makeIssue({ id: "test-a1b2" }),
			makeIssue({ id: "test-c3d4" }),
		];
		await writeIssues(seedsDir, issues);
		const content = await Bun.file(join(seedsDir, "issues.jsonl")).text();
		const lines = content.split("\n").filter((l) => l.trim() !== "");
		expect(lines).toHaveLength(2);
	});
});

describe("withLock", () => {
	test("executes function and returns result", async () => {
		const result = await withLock(seedsDir, async () => 42);
		expect(result).toBe(42);
	});

	test("serializes concurrent operations", async () => {
		// Run multiple concurrent withLock calls and verify they all succeed
		let counter = 0;
		await Promise.all(
			Array.from({ length: 5 }, () =>
				withLock(seedsDir, async () => {
					counter++;
				}),
			),
		);
		expect(counter).toBe(5);
	});

	test("releases lock even if function throws", async () => {
		await expect(
			withLock(seedsDir, async () => {
				throw new Error("intentional error");
			}),
		).rejects.toThrow("intentional error");

		// Lock should be released — another withLock should succeed
		const result = await withLock(seedsDir, async () => "ok");
		expect(result).toBe("ok");
	});
});
