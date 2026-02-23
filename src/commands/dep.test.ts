import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;

const CLI = join(import.meta.dir, "../../src/index.ts");

async function run(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(["bun", "run", CLI, ...args], {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
	});
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	return { stdout, stderr, exitCode };
}

async function runJson<T = unknown>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

let id1: string;
let id2: string;
let id3: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-dep-test-"));
	await run(["init"], tmpDir);

	const c1 = await runJson<{ success: boolean; id: string }>(
		["create", "--title", "Issue A"],
		tmpDir,
	);
	const c2 = await runJson<{ success: boolean; id: string }>(
		["create", "--title", "Issue B"],
		tmpDir,
	);
	const c3 = await runJson<{ success: boolean; id: string }>(
		["create", "--title", "Issue C"],
		tmpDir,
	);
	id1 = c1.id;
	id2 = c2.id;
	id3 = c3.id;
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd dep add", () => {
	test("adds dependency between two issues", async () => {
		const result = await runJson<{ success: boolean }>(
			["dep", "add", id2, id1],
			tmpDir,
		);
		expect(result.success).toBe(true);
	});

	test("blocked issue has blocker in blockedBy", async () => {
		await run(["dep", "add", id2, id1], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blockedBy?: string[] } }>(
			["show", id2],
			tmpDir,
		);
		expect(show.issue.blockedBy).toContain(id1);
	});

	test("blocker issue has blocked in blocks", async () => {
		await run(["dep", "add", id2, id1], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blocks?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.blocks).toContain(id2);
	});

	test("fails if issue does not exist", async () => {
		const { exitCode } = await run(["dep", "add", "proj-ffff", id1], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("fails if dependency target does not exist", async () => {
		const { exitCode } = await run(["dep", "add", id1, "proj-ffff"], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("supports multiple dependencies on one issue", async () => {
		await run(["dep", "add", id3, id1], tmpDir);
		await run(["dep", "add", id3, id2], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blockedBy?: string[] } }>(
			["show", id3],
			tmpDir,
		);
		expect(show.issue.blockedBy).toContain(id1);
		expect(show.issue.blockedBy).toContain(id2);
	});

	test("adding duplicate dependency is idempotent", async () => {
		await run(["dep", "add", id2, id1], tmpDir);
		await run(["dep", "add", id2, id1], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blockedBy?: string[] } }>(
			["show", id2],
			tmpDir,
		);
		// Should not have duplicate entries
		const count = show.issue.blockedBy?.filter((id) => id === id1).length ?? 0;
		expect(count).toBe(1);
	});
});

describe("sd dep remove", () => {
	beforeEach(async () => {
		await run(["dep", "add", id2, id1], tmpDir);
	});

	test("removes dependency", async () => {
		const result = await runJson<{ success: boolean }>(
			["dep", "remove", id2, id1],
			tmpDir,
		);
		expect(result.success).toBe(true);
	});

	test("blockedBy no longer contains removed dep", async () => {
		await run(["dep", "remove", id2, id1], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blockedBy?: string[] } }>(
			["show", id2],
			tmpDir,
		);
		expect(show.issue.blockedBy ?? []).not.toContain(id1);
	});

	test("blocks no longer contains removed dep", async () => {
		await run(["dep", "remove", id2, id1], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blocks?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.blocks ?? []).not.toContain(id2);
	});
});

describe("sd dep list", () => {
	test("lists dependencies for an issue", async () => {
		await run(["dep", "add", id2, id1], tmpDir);
		const result = await runJson<{ success: boolean; blockedBy: string[]; blocks: string[] }>(
			["dep", "list", id2],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.blockedBy).toContain(id1);
	});

	test("shows empty dependencies for issue with no deps", async () => {
		const result = await runJson<{ success: boolean; blockedBy: string[]; blocks: string[] }>(
			["dep", "list", id1],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.blockedBy).toHaveLength(0);
		expect(result.blocks).toHaveLength(0);
	});

	test("shows blocks for blocking issue", async () => {
		await run(["dep", "add", id2, id1], tmpDir);
		const result = await runJson<{ success: boolean; blockedBy: string[]; blocks: string[] }>(
			["dep", "list", id1],
			tmpDir,
		);
		expect(result.blocks).toContain(id2);
	});
});

describe("sd ready (dependency aware)", () => {
	test("blocked issue is not ready", async () => {
		await run(["dep", "add", id2, id1], tmpDir);
		const result = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["ready"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).not.toContain(id2);
	});

	test("issue becomes ready after blocker is closed", async () => {
		await run(["dep", "add", id2, id1], tmpDir);
		await run(["close", id1], tmpDir);

		const result = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["ready"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(id2);
	});

	test("issue with partial blockers still blocked", async () => {
		// id3 blocked by both id1 and id2
		await run(["dep", "add", id3, id1], tmpDir);
		await run(["dep", "add", id3, id2], tmpDir);
		// Close only id1
		await run(["close", id1], tmpDir);

		const result = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["ready"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		// id3 still blocked by id2
		expect(ids).not.toContain(id3);
	});
});
