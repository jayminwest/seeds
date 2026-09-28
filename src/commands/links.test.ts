import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";
import type { Issue } from "../types.ts";

let tmpDir: string;

async function runJson<T = unknown>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await runCli([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

async function create(args: string[], cwd: string): Promise<string> {
	return (await runJson<{ id: string }>(["create", ...args], cwd)).id;
}

async function show(id: string, cwd: string): Promise<Issue> {
	return (await runJson<{ issue: Issue }>(["show", id], cwd)).issue;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-links-test-"));
	await runCli(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd create --from", () => {
	test("records discoveredFrom and shows it", async () => {
		const parent = await create(["--title", "parent"], tmpDir);
		const child = await create(["--title", "found it", "--from", parent], tmpDir);
		const issue = await show(child, tmpDir);
		expect(issue.discoveredFrom).toBe(parent);
		const { stdout } = await runCli(["show", child], tmpDir);
		expect(stdout).toContain(`From:     ${parent}`);
	});

	test("is non-blocking: no blocks/blockedBy on either side", async () => {
		const parent = await create(["--title", "parent"], tmpDir);
		const child = await create(["--title", "child", "--from", parent], tmpDir);
		expect((await show(child, tmpDir)).blockedBy).toBeUndefined();
		expect((await show(parent, tmpDir)).blocks).toBeUndefined();
	});

	test("rejects an unknown source issue", async () => {
		const res = await runCli(["create", "--title", "x", "--from", "nope-0000"], tmpDir);
		expect(res.exitCode).not.toBe(0);
		expect(res.stderr).toContain("--from issue not found: nope-0000");
	});

	test("rejects --from without a value", async () => {
		const res = await runCli(["create", "--title", "x", "--from"], tmpDir);
		expect(res.exitCode).not.toBe(0);
		expect(res.stderr).toContain("--from requires an issue id");
	});
});

describe("--intent", () => {
	test("create stores a single id as a top-level string", async () => {
		const id = await create(["--title", "x", "--intent", "r-a1b2"], tmpDir);
		expect((await show(id, tmpDir)).intent).toBe("r-a1b2");
		// roots reads the raw JSONL, so assert the on-disk shape too.
		const raw = await readFile(join(tmpDir, ".seeds", "issues.jsonl"), "utf8");
		expect(raw).toContain('"intent":"r-a1b2"');
	});

	test("create stores repeated ids as an array, deduped and lowercased", async () => {
		const id = await create(
			["--title", "x", "--intent", "r-a1b2", "--intent=R-C3D4", "--intent", "r-a1b2"],
			tmpDir,
		);
		expect((await show(id, tmpDir)).intent).toEqual(["r-a1b2", "r-c3d4"]);
		const { stdout } = await runCli(["show", id], tmpDir);
		expect(stdout).toContain("Intent:   r-a1b2, r-c3d4");
	});

	test("rejects ids that are not r-xxxx shaped", async () => {
		for (const bad of ["a1b2", "r-xyz1", "r-12", "seeds-a1b2"]) {
			const res = await runCli(["create", "--title", "x", "--intent", bad], tmpDir);
			expect(res.exitCode).not.toBe(0);
			expect(res.stderr).toContain("Invalid --intent value");
		}
	});

	test("update replaces intent and leaves it alone when not given", async () => {
		const id = await create(["--title", "x", "--intent", "r-a1b2"], tmpDir);
		await runCli(["update", id, "--title", "renamed"], tmpDir);
		expect((await show(id, tmpDir)).intent).toBe("r-a1b2");
		await runCli(["update", id, "--intent", "r-c3d4", "--intent", "r-e5f6"], tmpDir);
		expect((await show(id, tmpDir)).intent).toEqual(["r-c3d4", "r-e5f6"]);
	});

	test("update rejects a malformed id without writing", async () => {
		const id = await create(["--title", "x", "--intent", "r-a1b2"], tmpDir);
		const res = await runCli(["update", id, "--intent", "bogus"], tmpDir);
		expect(res.exitCode).not.toBe(0);
		expect((await show(id, tmpDir)).intent).toBe("r-a1b2");
	});
});
