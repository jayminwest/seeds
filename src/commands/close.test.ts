import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";

let tmpDir: string;

async function run(args: string[], cwd: string) {
	return runCli(args, cwd);
}

async function runJson<T>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

async function createSeed(title: string, cwd: string): Promise<string> {
	const out = await runJson<{ id: string }>(["create", "--title", title], cwd);
	return out.id;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-close-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd close", () => {
	test("closes an issue and records --reason; dependents keep blockedBy but become ready", async () => {
		const a = await createSeed("A", tmpDir);
		const b = await createSeed("B", tmpDir);
		const dep = await run(["dep", "add", b, a], tmpDir);
		expect(dep.exitCode).toBe(0);
		const before = await runJson<{ issue: { blockedBy?: string[] } }>(["show", b], tmpDir);
		expect(before.issue.blockedBy).toEqual([a]);

		const out = await runJson<{ success: boolean; command: string; closed: string[] }>(
			["close", a, "--reason", "shipped"],
			tmpDir,
		);
		expect(out.success).toBe(true);
		expect(out.command).toBe("close");
		expect(out.closed).toEqual([a]);

		const aShow = await runJson<{
			issue: { status: string; closeReason?: string; closedAt?: string };
		}>(["show", a], tmpDir);
		expect(aShow.issue.status).toBe("closed");
		expect(aShow.issue.closeReason).toBe("shipped");
		expect(aShow.issue.closedAt).toBeTruthy();

		const bShow = await runJson<{ issue: { blockedBy?: string[] } }>(["show", b], tmpDir);
		expect(bShow.issue.blockedBy).toEqual([a]);
		const ready = await runJson<{ issues: Array<{ id: string }> }>(["ready"], tmpDir);
		expect(ready.issues.map((i) => i.id)).toContain(b);
	});

	test("rewrites only the closed row; dependent rows stay byte-identical", async () => {
		const a = await createSeed("A", tmpDir);
		const b = await createSeed("B", tmpDir);
		const c = await createSeed("C", tmpDir);
		await run(["dep", "add", b, a], tmpDir);
		await run(["dep", "add", c, a], tmpDir);
		const file = join(tmpDir, ".seeds", "issues.jsonl");
		const rowsOf = async () => (await Bun.file(file).text()).split("\n").filter(Boolean);
		const before = await rowsOf();
		await Bun.sleep(5);
		await run(["close", a], tmpDir);
		const after = await rowsOf();
		expect(after).toHaveLength(before.length);
		const changed = after.filter((row, i) => row !== before[i]);
		expect(changed).toHaveLength(1);
		expect((JSON.parse(changed[0] ?? "{}") as { id: string }).id).toBe(a);
	});

	test("close keeps blocks/blockedBy consistent for doctor", async () => {
		const a = await createSeed("A", tmpDir);
		const b = await createSeed("B", tmpDir);
		await run(["dep", "add", b, a], tmpDir);
		await run(["close", a], tmpDir);
		const doc = await runJson<{ checks: Array<{ name: string; status: string }> }>(
			["doctor"],
			tmpDir,
		);
		const check = doc.checks.find((ch) => ch.name === "bidirectional-consistency");
		expect(check?.status).toBe("pass");
	});

	test("reopening a closed blocker re-blocks its dependents", async () => {
		const a = await createSeed("A", tmpDir);
		const b = await createSeed("B", tmpDir);
		await run(["dep", "add", b, a], tmpDir);
		await run(["close", a], tmpDir);
		const reopen = await run(["update", a, "--status", "open"], tmpDir);
		expect(reopen.exitCode).toBe(0);
		const ready = await runJson<{ issues: Array<{ id: string }> }>(["ready"], tmpDir);
		expect(ready.issues.map((i) => i.id)).not.toContain(b);
		const blocked = await runJson<{ issues: Array<{ id: string }> }>(["blocked"], tmpDir);
		expect(blocked.issues.map((i) => i.id)).toContain(b);
	});

	test("re-closing an already-closed issue leaves issues.jsonl byte-identical", async () => {
		const a = await createSeed("A", tmpDir);
		await run(["close", a, "--reason", "first"], tmpDir);
		const file = join(tmpDir, ".seeds", "issues.jsonl");
		const before = await Bun.file(file).text();
		await Bun.sleep(5);
		const out = await runJson<{ success: boolean; closed: string[] }>(
			["close", a, "--reason", "second"],
			tmpDir,
		);
		expect(out.success).toBe(true);
		expect(out.closed).toEqual([a]);
		expect(await Bun.file(file).text()).toBe(before);
	});

	test("closing multiple ids in one call closes each", async () => {
		const a = await createSeed("A", tmpDir);
		const b = await createSeed("B", tmpDir);
		const out = await runJson<{ closed: string[] }>(["close", a, b], tmpDir);
		expect(out.closed).toEqual([a, b]);
	});

	test("missing positional ids errors out", async () => {
		const { exitCode, stderr } = await run(["close"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Usage: sd close");
	});

	test("unknown id throws and exits non-zero", async () => {
		const { exitCode, stderr } = await run(["close", "seeds-9999"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Issue not found: seeds-9999");
	});
});
