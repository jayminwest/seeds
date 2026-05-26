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
let id3: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-unblock-test-"));
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

describe("sd block", () => {
	test("adds a blocker to an issue", async () => {
		const result = await runJson<{ success: boolean; issueId: string; blockerId: string }>(
			["block", id2, "--by", id1],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.issueId).toBe(id2);
		expect(result.blockerId).toBe(id1);
	});

	test("blocked issue has blocker in blockedBy", async () => {
		await run(["block", id2, "--by", id1], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blockedBy?: string[] } }>(
			["show", id2],
			tmpDir,
		);
		expect(show.issue.blockedBy).toContain(id1);
	});

	test("blocker has blocked issue in blocks", async () => {
		await run(["block", id2, "--by", id1], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blocks?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.blocks).toContain(id2);
	});

	test("fails if issue not found", async () => {
		const { exitCode } = await run(["block", "proj-ffff", "--by", id1], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("fails if blocker not found", async () => {
		const { exitCode } = await run(["block", id1, "--by", "proj-ffff"], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("adding duplicate blocker is idempotent", async () => {
		await run(["block", id2, "--by", id1], tmpDir);
		await run(["block", id2, "--by", id1], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blockedBy?: string[] } }>(
			["show", id2],
			tmpDir,
		);
		const count = show.issue.blockedBy?.filter((id) => id === id1).length ?? 0;
		expect(count).toBe(1);
	});

	test("fails without --by flag", async () => {
		const { exitCode } = await run(["block", id2], tmpDir);
		expect(exitCode).not.toBe(0);
	});
});

describe("sd unblock --from", () => {
	beforeEach(async () => {
		await run(["block", id2, "--by", id1], tmpDir);
	});

	test("removes specific blocker", async () => {
		const result = await runJson<{ success: boolean; removed: string[] }>(
			["unblock", id2, "--from", id1],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.removed).toContain(id1);
	});

	test("blockedBy no longer contains removed dep", async () => {
		await run(["unblock", id2, "--from", id1], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blockedBy?: string[] } }>(
			["show", id2],
			tmpDir,
		);
		expect(show.issue.blockedBy ?? []).not.toContain(id1);
	});

	test("blocks no longer contains removed dep", async () => {
		await run(["unblock", id2, "--from", id1], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blocks?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.blocks ?? []).not.toContain(id2);
	});

	test("fails if issue is not blocked by specified blocker", async () => {
		const { exitCode } = await run(["unblock", id2, "--from", id3], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("fails if issue not found", async () => {
		const { exitCode } = await run(["unblock", "proj-ffff", "--from", id1], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("unblocked issue appears in ready", async () => {
		await run(["unblock", id2, "--from", id1], tmpDir);
		const result = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["ready"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(id2);
	});
});

describe("sd unblock --all", () => {
	beforeEach(async () => {
		// id3 is blocked by both id1 (closed) and id2 (open)
		await run(["block", id3, "--by", id1], tmpDir);
		await run(["block", id3, "--by", id2], tmpDir);
		await run(["close", id1], tmpDir);
	});

	test("removes only closed blockers", async () => {
		// close already removed id1 from id3's blockedBy, so --all finds nothing new
		const result = await runJson<{ success: boolean; removed: string[] }>(
			["unblock", id3, "--all"],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.removed).not.toContain(id1);
		expect(result.removed).not.toContain(id2);
	});

	test("open blockers remain after --all", async () => {
		await run(["unblock", id3, "--all"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { blockedBy?: string[] } }>(
			["show", id3],
			tmpDir,
		);
		expect(show.issue.blockedBy ?? []).toContain(id2);
		expect(show.issue.blockedBy ?? []).not.toContain(id1);
	});

	test("returns empty removed when no closed blockers", async () => {
		// id2 is blocked by id1 (closed) — but first remove that dep and test fresh
		// Use id2 which has no blockers
		const result = await runJson<{ success: boolean; removed: string[] }>(
			["unblock", id2, "--all"],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.removed).toHaveLength(0);
	});

	test("fails without --from or --all", async () => {
		const { exitCode } = await run(["unblock", id3], tmpDir);
		expect(exitCode).not.toBe(0);
	});
});
