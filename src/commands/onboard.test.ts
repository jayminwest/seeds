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
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-onboard-test-"));
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd onboard", () => {
	test("fails without .seeds/ initialized", async () => {
		const { exitCode, stderr } = await run(["onboard"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Not in a seeds project");
	});

	test("creates CLAUDE.md when no target file exists", async () => {
		await initSeeds(tmpDir);
		const { exitCode } = await run(["onboard"], tmpDir);
		expect(exitCode).toBe(0);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(content).toContain("<!-- seeds:start -->");
		expect(content).toContain("<!-- seeds:end -->");
		expect(content).toContain("Issue Tracking (Seeds)");
		expect(content).toContain("sd prime");
	});

	test("appends to existing CLAUDE.md", async () => {
		await initSeeds(tmpDir);
		await Bun.write(join(tmpDir, "CLAUDE.md"), "# My Project\n\nExisting content.\n");
		const { exitCode } = await run(["onboard"], tmpDir);
		expect(exitCode).toBe(0);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(content).toContain("# My Project");
		expect(content).toContain("Existing content.");
		expect(content).toContain("<!-- seeds:start -->");
		expect(content).toContain("Issue Tracking (Seeds)");
	});

	test("is idempotent — second onboard does not duplicate", async () => {
		await initSeeds(tmpDir);
		await run(["onboard"], tmpDir);
		const first = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		await run(["onboard"], tmpDir);
		const second = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(second).toBe(first);
	});

	test("--check reports missing when no file exists", async () => {
		await initSeeds(tmpDir);
		const { stdout, exitCode } = await run(["onboard", "--check"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("missing");
	});

	test("--check reports current after onboard", async () => {
		await initSeeds(tmpDir);
		await run(["onboard"], tmpDir);
		const { stdout, exitCode } = await run(["onboard", "--check"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("current");
	});

	test("--check with --json returns structured output", async () => {
		await initSeeds(tmpDir);
		await run(["onboard"], tmpDir);
		const { stdout, exitCode } = await run(["onboard", "--check", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { success: boolean; status: string };
		expect(result.success).toBe(true);
		expect(result.status).toBe("current");
	});

	test("--stdout prints snippet without writing", async () => {
		await initSeeds(tmpDir);
		const { stdout, exitCode } = await run(["onboard", "--stdout"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("<!-- seeds:start -->");
		expect(stdout).toContain("Issue Tracking (Seeds)");
		// Should not have created the file
		const exists = await Bun.file(join(tmpDir, "CLAUDE.md")).exists();
		expect(exists).toBe(false);
	});

	test("detects existing CLAUDE.md in .claude/ subdirectory", async () => {
		await initSeeds(tmpDir);
		const claudeDir = join(tmpDir, ".claude");
		await Bun.write(join(claudeDir, "CLAUDE.md"), "# Agent Instructions\n");
		const { exitCode } = await run(["onboard"], tmpDir);
		expect(exitCode).toBe(0);
		const content = await Bun.file(join(claudeDir, "CLAUDE.md")).text();
		expect(content).toContain("<!-- seeds:start -->");
		// Root CLAUDE.md should NOT have been created
		const rootExists = await Bun.file(join(tmpDir, "CLAUDE.md")).exists();
		expect(rootExists).toBe(false);
	});

	test("updates outdated section when version changes", async () => {
		await initSeeds(tmpDir);
		// Write a seeds section with an old version marker
		const oldContent =
			"# Project\n\n<!-- seeds:start -->\n## Old Seeds Section\n<!-- seeds-onboard-v:0 -->\nold content\n<!-- seeds:end -->\n";
		await Bun.write(join(tmpDir, "CLAUDE.md"), oldContent);
		const { exitCode } = await run(["onboard"], tmpDir);
		expect(exitCode).toBe(0);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(content).toContain("# Project");
		expect(content).toContain("seeds-onboard-v:1");
		expect(content).not.toContain("seeds-onboard-v:0");
		expect(content).not.toContain("Old Seeds Section");
	});

	test("--json output on create", async () => {
		await initSeeds(tmpDir);
		const { stdout, exitCode } = await run(["onboard", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { success: boolean; action: string };
		expect(result.success).toBe(true);
		expect(result.action).toBe("created");
	});

	test("includes version marker in output", async () => {
		await initSeeds(tmpDir);
		await run(["onboard"], tmpDir);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(content).toContain("seeds-onboard-v:1");
	});
});
