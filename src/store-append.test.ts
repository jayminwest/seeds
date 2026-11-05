import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { statSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendIssue, appendPlan, readIssues, writeIssues } from "./store";
import type { Issue, Plan } from "./types";

// seeds-b79d: appends go through O_APPEND instead of read + rewrite + rename.

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
let issuesFile: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-store-append-test-"));
	seedsDir = join(tmpDir, ".seeds");
	issuesFile = join(seedsDir, "issues.jsonl");
	await Bun.write(join(seedsDir, ".gitignore"), "*.lock\n");
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("appendIssue (O_APPEND)", () => {
	test("appends in place: the file keeps its inode and its existing bytes", async () => {
		const first = `${JSON.stringify(makeIssue({ id: "test-0001" }))}\n`;
		await Bun.write(issuesFile, first);
		const inoBefore = statSync(issuesFile).ino;
		const issue = makeIssue({ id: "test-0002" });
		await appendIssue(seedsDir, issue);
		expect(statSync(issuesFile).ino).toBe(inoBefore);
		expect(await Bun.file(issuesFile).text()).toBe(`${first}${JSON.stringify(issue)}\n`);
	});

	test("leaves malformed and quarantined rows byte-for-byte intact", async () => {
		const existing = [
			JSON.stringify(makeIssue({ id: "test-0001" })),
			"{not json",
			JSON.stringify({ id: "test-bad1", title: "x", status: "open", priority: "high" }),
		].join("\n");
		await Bun.write(issuesFile, `${existing}\n`);
		await readIssues(seedsDir); // primes malformed + quarantine bookkeeping
		const issue = makeIssue({ id: "test-0002" });
		await appendIssue(seedsDir, issue);
		expect(await Bun.file(issuesFile).text()).toBe(`${existing}\n${JSON.stringify(issue)}\n`);
		// The rewrite guard still sees the malformed row after an append.
		await readIssues(seedsDir);
		await expect(writeIssues(seedsDir, [issue])).rejects.toThrow(/malformed line/);
	});

	test("terminates a final line that lacks a newline without touching other bytes", async () => {
		const existing = JSON.stringify(makeIssue({ id: "test-0001" }));
		await Bun.write(issuesFile, existing);
		const issue = makeIssue({ id: "test-0002" });
		await appendIssue(seedsDir, issue);
		expect(await Bun.file(issuesFile).text()).toBe(`${existing}\n${JSON.stringify(issue)}\n`);
	});

	test("rejects an invalid issue without writing", async () => {
		await Bun.write(issuesFile, "");
		const bad = { ...makeIssue(), priority: 9 } as Issue;
		await expect(appendIssue(seedsDir, bad)).rejects.toThrow();
		expect(await Bun.file(issuesFile).text()).toBe("");
	});
});

describe("appendPlan (O_APPEND)", () => {
	test("creates plans.jsonl when absent", async () => {
		const plan = { id: "pl-0001", seed: "test-0001", children: [] } as unknown as Plan;
		await appendPlan(seedsDir, plan);
		expect(await Bun.file(join(seedsDir, "plans.jsonl")).text()).toBe(`${JSON.stringify(plan)}\n`);
	});
});
