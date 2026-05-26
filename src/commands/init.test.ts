import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { runCli } from "../test-harness.ts";

let tmpDir: string;

async function run(
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return runCli(args, cwd);
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-init-test-"));
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd init", () => {
	test("creates .seeds directory", async () => {
		const { exitCode } = await run(["init"], tmpDir);
		expect(exitCode).toBe(0);
		const stat = await Bun.file(join(tmpDir, ".seeds", "config.yaml")).exists();
		expect(stat).toBe(true);
	});

	test("creates config.yaml with project name derived from directory", async () => {
		await run(["init"], tmpDir);
		const config = await Bun.file(join(tmpDir, ".seeds", "config.yaml")).text();
		const dirName = basename(tmpDir);
		expect(config).toContain(`project: "${dirName}"`);
		expect(config).toContain("version:");
	});

	test("creates empty issues.jsonl", async () => {
		await run(["init"], tmpDir);
		const exists = await Bun.file(join(tmpDir, ".seeds", "issues.jsonl")).exists();
		expect(exists).toBe(true);
	});

	test("creates empty templates.jsonl", async () => {
		await run(["init"], tmpDir);
		const exists = await Bun.file(join(tmpDir, ".seeds", "templates.jsonl")).exists();
		expect(exists).toBe(true);
	});

	test("creates .gitignore ignoring lock files", async () => {
		await run(["init"], tmpDir);
		const gitignore = await Bun.file(join(tmpDir, ".seeds", ".gitignore")).text();
		expect(gitignore).toContain("*.lock");
	});

	test("appends gitattributes to project root", async () => {
		await run(["init"], tmpDir);
		const gitattributes = await Bun.file(join(tmpDir, ".gitattributes")).text();
		expect(gitattributes).toContain(".seeds/issues.jsonl merge=union");
		expect(gitattributes).toContain(".seeds/templates.jsonl merge=union");
	});

	test("is idempotent — second init does not fail", async () => {
		await run(["init"], tmpDir);
		const { exitCode } = await run(["init"], tmpDir);
		expect(exitCode).toBe(0);
	});

	test("--json flag returns success JSON", async () => {
		const { stdout, exitCode } = await run(["init", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { success: boolean };
		expect(result.success).toBe(true);
	});
});
