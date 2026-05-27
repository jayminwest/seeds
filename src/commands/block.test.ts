import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";

let tmpDir: string;

async function run(
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return runCli(args, cwd);
}

async function runJson<T = unknown>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

let id1: string;
let id2: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-block-test-"));
	await run(["init"], tmpDir);
	const c1 = await runJson<{ success: boolean; id: string }>(
		["create", "--title", "Issue A"],
		tmpDir,
	);
	const c2 = await runJson<{ success: boolean; id: string }>(
		["create", "--title", "Issue B"],
		tmpDir,
	);
	id1 = c1.id;
	id2 = c2.id;
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd block", () => {
	test("blocks one issue by another", async () => {
		const { exitCode } = await run(["block", id2, "--by", id1], tmpDir);
		expect(exitCode).toBe(0);
		const show = await runJson<{ success: boolean; issue: { blockedBy?: string[] } }>(
			["show", id2],
			tmpDir,
		);
		expect(show.issue.blockedBy).toContain(id1);
	});

	test("rejects self-block and writes nothing", async () => {
		const { exitCode, stderr } = await run(["block", id1, "--by", id1], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toMatch(/itself|self/i);
		const show = await runJson<{
			success: boolean;
			issue: { blockedBy?: string[]; blocks?: string[] };
		}>(["show", id1], tmpDir);
		expect(show.issue.blockedBy ?? []).toHaveLength(0);
		expect(show.issue.blocks ?? []).toHaveLength(0);
	});
});
