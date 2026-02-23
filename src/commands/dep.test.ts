import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readIssues } from "../store.ts";
import { run as runBlocked } from "./blocked.ts";
import { run as runCreate } from "./create.ts";
import { run as runDep } from "./dep.ts";
import { run as runReady } from "./ready.ts";

let tmpDir: string;
let seedsDir: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "seeds-dep-test-"));
	seedsDir = join(tmpDir, ".seeds");
	mkdirSync(seedsDir, { recursive: true });
	writeFileSync(join(seedsDir, "config.yaml"), 'project: "proj"\nversion: "1"\n');
	writeFileSync(join(seedsDir, "issues.jsonl"), "");
	writeFileSync(join(seedsDir, "templates.jsonl"), "");
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

async function createIssue(title: string): Promise<string> {
	await runCreate(["--title", title], seedsDir);
	const issues = await readIssues(seedsDir);
	const issue = issues.find((i) => i.title === title);
	if (!issue) throw new Error(`Issue not created: ${title}`);
	return issue.id;
}

describe("sd dep add", () => {
	test("adds dependency between two issues", async () => {
		const id1 = await createIssue("A");
		const id2 = await createIssue("B");
		await runDep(["add", id1, id2], seedsDir);

		const issues = await readIssues(seedsDir);
		const a = issues.find((i) => i.id === id1)!;
		const b = issues.find((i) => i.id === id2)!;
		expect(a.blockedBy).toContain(id2);
		expect(b.blocks).toContain(id1);
	});

	test("does not duplicate existing deps", async () => {
		const id1 = await createIssue("A");
		const id2 = await createIssue("B");
		await runDep(["add", id1, id2], seedsDir);
		await runDep(["add", id1, id2], seedsDir);

		const issues = await readIssues(seedsDir);
		const a = issues.find((i) => i.id === id1)!;
		expect(a.blockedBy?.filter((x) => x === id2)).toHaveLength(1);
	});

	test("throws if issue not found", async () => {
		const id1 = await createIssue("A");
		await expect(runDep(["add", id1, "proj-9999"], seedsDir)).rejects.toThrow("not found");
	});
});

describe("sd dep remove", () => {
	test("removes dependency", async () => {
		const id1 = await createIssue("A");
		const id2 = await createIssue("B");
		await runDep(["add", id1, id2], seedsDir);
		await runDep(["remove", id1, id2], seedsDir);

		const issues = await readIssues(seedsDir);
		const a = issues.find((i) => i.id === id1)!;
		const b = issues.find((i) => i.id === id2)!;
		expect(a.blockedBy ?? []).not.toContain(id2);
		expect(b.blocks ?? []).not.toContain(id1);
	});
});

describe("sd dep list", () => {
	test("lists issue dependencies", async () => {
		const id1 = await createIssue("A");
		const id2 = await createIssue("B");
		await runDep(["add", id1, id2], seedsDir);
		// Should not throw
		await runDep(["list", id1], seedsDir);
	});
});

describe("sd blocked", () => {
	test("shows blocked issues", async () => {
		const id1 = await createIssue("A");
		const id2 = await createIssue("B");
		await runDep(["add", id2, id1], seedsDir); // B blocked by A

		const issues = await readIssues(seedsDir);
		const b = issues.find((i) => i.id === id2)!;
		expect(b.blockedBy).toContain(id1);
	});

	test("does not show issues blocked only by closed issues", async () => {
		const id1 = await createIssue("A");
		const id2 = await createIssue("B");
		await runDep(["add", id2, id1], seedsDir);

		// Close id1
		const { run: runClose } = await import("./close.ts");
		await runClose([id1], seedsDir);

		// B should not be in blocked (its only blocker is closed)
		const issues = await readIssues(seedsDir);
		const b = issues.find((i) => i.id === id2)!;
		const closedIds = new Set(issues.filter((i) => i.status === "closed").map((i) => i.id));
		const isBlocked = (b.blockedBy ?? []).some((bid) => !closedIds.has(bid));
		expect(isBlocked).toBe(false);
	});
});

describe("sd ready", () => {
	test("shows issues with no blockers", async () => {
		await createIssue("Ready issue");
		const issues = await readIssues(seedsDir);
		expect(issues.filter((i) => i.status === "open" && !i.blockedBy?.length)).toHaveLength(1);
	});

	test("excludes blocked issues", async () => {
		const id1 = await createIssue("Blocker");
		const id2 = await createIssue("Blocked");
		await runDep(["add", id2, id1], seedsDir);

		const issues = await readIssues(seedsDir);
		const closedIds = new Set(issues.filter((i) => i.status === "closed").map((i) => i.id));
		const ready = issues.filter(
			(i) => i.status === "open" && (i.blockedBy ?? []).every((bid) => closedIds.has(bid)),
		);
		// Only id1 (blocker) should be ready; id2 is blocked
		expect(ready.map((i) => i.id)).toContain(id1);
		expect(ready.map((i) => i.id)).not.toContain(id2);
	});

	test("run does not throw", async () => {
		await createIssue("Free");
		await expect(runReady([], seedsDir)).resolves.toBeUndefined();
	});
});
