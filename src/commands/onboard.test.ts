import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";
import { VERSION } from "../version.ts";

let tmpDir: string;

async function run(
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return runCli(args, cwd);
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

	test("upgrades legacy seeds-onboard-v:N marker to schema + version markers", async () => {
		await initSeeds(tmpDir);
		// Write a seeds section with the legacy version marker
		const oldContent =
			"# Project\n\n<!-- seeds:start -->\n## Old Seeds Section\n<!-- seeds-onboard-v:0 -->\nold content\n<!-- seeds:end -->\n";
		await Bun.write(join(tmpDir, "CLAUDE.md"), oldContent);
		const { exitCode } = await run(["onboard"], tmpDir);
		expect(exitCode).toBe(0);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(content).toContain("# Project");
		expect(content).toContain("seeds-onboard-schema:");
		expect(content).toContain(`seeds-onboard:v${VERSION}`);
		expect(content).not.toContain("seeds-onboard-v:0");
		expect(content).not.toContain("Old Seeds Section");
	});

	test("updates outdated section when schema version changes", async () => {
		await initSeeds(tmpDir);
		// Write a seeds section with a stale schema marker
		const oldContent =
			"# Project\n\n<!-- seeds:start -->\n## Old Seeds Section\n<!-- seeds-onboard-schema:1 -->\nold content\n<!-- seeds:end -->\n";
		await Bun.write(join(tmpDir, "CLAUDE.md"), oldContent);
		const { exitCode } = await run(["onboard"], tmpDir);
		expect(exitCode).toBe(0);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(content).toContain("# Project");
		expect(content).not.toContain("seeds-onboard-schema:1");
		expect(content).not.toContain("Old Seeds Section");
		expect(content).toContain("Issue Tracking (Seeds)");
	});

	test("--json output on create", async () => {
		await initSeeds(tmpDir);
		const { stdout, exitCode } = await run(["onboard", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { success: boolean; action: string };
		expect(result.success).toBe(true);
		expect(result.action).toBe("created");
	});

	test("includes schema marker in output", async () => {
		await initSeeds(tmpDir);
		await run(["onboard"], tmpDir);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(content).toContain("seeds-onboard-schema:");
	});

	test("includes package version in marker and body text", async () => {
		await initSeeds(tmpDir);
		await run(["onboard"], tmpDir);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(content).toContain(`<!-- seeds-onboard:v${VERSION} -->`);
		expect(content).toContain(`Seeds](https://github.com/jayminwest/seeds) v${VERSION}`);
	});

	test("includes Planning section with full sd plan surface", async () => {
		await initSeeds(tmpDir);
		await run(["onboard"], tmpDir);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(content).toContain("### Planning");
		expect(content).toContain("sd plan templates");
		expect(content).toContain("sd plan prompt");
		expect(content).toContain("sd plan submit");
		expect(content).toContain("sd plan show");
		expect(content).toContain("sd plan edit");
		expect(content).toContain("sd plan outcome");
		expect(content).toContain("sd plan review");
	});

	test("includes sd search and --format flag in quick reference", async () => {
		await initSeeds(tmpDir);
		await run(["onboard"], tmpDir);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(content).toContain("sd search");
		expect(content).toContain("--format");
	});

	test("re-running onboard does not duplicate the Planning section", async () => {
		await initSeeds(tmpDir);
		await run(["onboard"], tmpDir);
		await run(["onboard"], tmpDir);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		const matches = content.match(/### Planning/g) ?? [];
		expect(matches.length).toBe(1);
	});

	test("surfaces error when markers are out of order (replaceMarkerSection returns null)", async () => {
		await initSeeds(tmpDir);
		// Hand-edited broken state: END_MARKER appears before START_MARKER, plus a
		// legacy version marker so detectStatus returns "outdated" and we hit the
		// replaceMarkerSection branch.
		const broken =
			"# Project\n\n<!-- seeds:end -->\nbogus\n<!-- seeds:start -->\n<!-- seeds-onboard-v:0 -->\n";
		await Bun.write(join(tmpDir, "CLAUDE.md"), broken);
		const { exitCode, stderr } = await run(["onboard"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("could not replace");
		// File must remain untouched.
		const after = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(after).toBe(broken);
	});

	test("surfaces error via --json when markers are out of order", async () => {
		await initSeeds(tmpDir);
		const broken =
			"# Project\n\n<!-- seeds:end -->\nbogus\n<!-- seeds:start -->\n<!-- seeds-onboard-v:0 -->\n";
		await Bun.write(join(tmpDir, "CLAUDE.md"), broken);
		const { exitCode, stdout } = await run(["onboard", "--json"], tmpDir);
		expect(exitCode).toBe(1);
		const result = JSON.parse(stdout) as { success: boolean; action: string; error: string };
		expect(result.success).toBe(false);
		expect(result.action).toBe("failed");
		expect(result.error).toContain("could not replace");
	});

	test("schema marker is at version 7 (pi extension removed)", async () => {
		await initSeeds(tmpDir);
		await run(["onboard"], tmpDir);
		const content = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(content).toContain("<!-- seeds-onboard-schema:7 -->");
	});
});
