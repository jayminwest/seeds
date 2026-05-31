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
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-blocked-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd blocked", () => {
	test("--json lists issues with unresolved blockers and skips closed-blocker case", async () => {
		const a = await createSeed("A", tmpDir);
		const b = await createSeed("B", tmpDir);
		const c = await createSeed("C", tmpDir);
		const d = await createSeed("D", tmpDir);

		// b blocked by open a → counted; c blocked by closed d → not counted.
		await run(["dep", "add", b, "--blocked-by", a], tmpDir);
		await run(["dep", "add", c, "--blocked-by", d], tmpDir);
		await run(["close", d], tmpDir);

		const out = await runJson<{
			success: boolean;
			command: string;
			issues: Array<{ id: string }>;
			count: number;
		}>(["blocked"], tmpDir);
		expect(out.success).toBe(true);
		expect(out.command).toBe("blocked");
		expect(out.count).toBe(1);
		expect(out.issues.map((i) => i.id)).toEqual([b]);
	});

	test("empty store prints 'No blocked issues.' in human mode", async () => {
		const { stdout, exitCode } = await run(["blocked"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("No blocked issues.");
	});

	test("invalid --format errors out with non-zero exit", async () => {
		const { exitCode, stderr } = await run(["blocked", "--format", "bogus"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr.length).toBeGreaterThan(0);
	});
});
