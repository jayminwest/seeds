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
	test("closes an issue and records --reason, removes blockedBy on dependents", async () => {
		const a = await createSeed("A", tmpDir);
		const b = await createSeed("B", tmpDir);
		await run(["dep", "add", b, "--blocked-by", a], tmpDir);

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
		expect(bShow.issue.blockedBy).toBeUndefined();
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
