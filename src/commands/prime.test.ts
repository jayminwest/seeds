import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;

const CLI = join(import.meta.dir, "../../src/index.ts");

async function run(
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
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

async function initSeeds(cwd: string): Promise<void> {
	await run(["init"], cwd);
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-prime-test-"));
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd prime", () => {
	test("outputs full prime content without .seeds/ initialized", async () => {
		const { stdout, exitCode } = await run(["prime"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Seeds Workflow Context");
		expect(stdout).toContain("Session Close Protocol");
		expect(stdout).toContain("sd ready");
	});

	test("outputs compact content with --compact", async () => {
		const { stdout, exitCode } = await run(["prime", "--compact"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Seeds Quick Reference");
		expect(stdout).not.toContain("Session Close Protocol");
	});

	test("outputs JSON with --json", async () => {
		const { stdout, exitCode } = await run(["prime", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { success: boolean; command: string; content: string };
		expect(result.success).toBe(true);
		expect(result.command).toBe("prime");
		expect(result.content).toContain("Seeds Workflow Context");
	});

	test("--export outputs default template even with custom PRIME.md", async () => {
		await initSeeds(tmpDir);
		await Bun.write(join(tmpDir, ".seeds", "PRIME.md"), "custom prime content");
		const { stdout, exitCode } = await run(["prime", "--export"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Seeds Workflow Context");
		expect(stdout).not.toContain("custom prime content");
	});

	test("uses custom PRIME.md when present", async () => {
		await initSeeds(tmpDir);
		await Bun.write(join(tmpDir, ".seeds", "PRIME.md"), "my custom agent context");
		const { stdout, exitCode } = await run(["prime"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toBe("my custom agent context");
	});

	test("full content includes essential command sections", async () => {
		const { stdout } = await run(["prime"], tmpDir);
		expect(stdout).toContain("Finding Work");
		expect(stdout).toContain("Creating & Updating");
		expect(stdout).toContain("Dependencies & Blocking");
		expect(stdout).toContain("Common Workflows");
	});

	test("--export with --json returns JSON", async () => {
		const { stdout, exitCode } = await run(["prime", "--export", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { success: boolean; content: string };
		expect(result.success).toBe(true);
		expect(result.content).toContain("Seeds Workflow Context");
	});
});
