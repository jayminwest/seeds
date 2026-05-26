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

	test("full content includes plan-aware workflow hints (Phase 5)", async () => {
		const { stdout } = await run(["prime"], tmpDir);
		expect(stdout).toContain("Planning");
		expect(stdout).toContain("sd plan prompt");
		expect(stdout).toContain("sd plan submit");
	});

	test("compact content mentions sd plan", async () => {
		const { stdout } = await run(["prime", "--compact"], tmpDir);
		expect(stdout).toContain("sd plan");
	});

	test("--json emits structured sections for full mode", async () => {
		const { stdout, exitCode } = await run(["prime", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as {
			success: boolean;
			command: string;
			content: string;
			sections: {
				mode: string;
				title: string;
				closeProtocol: { steps: string[]; warning: string; footer: string };
				rules: string[];
				commandGroups: Array<{
					name: string;
					commands: Array<{ command: string; description: string }>;
					notes?: string[];
				}>;
				workflows: Array<{ name: string; commands: string[] }>;
			};
		};
		expect(result.success).toBe(true);
		expect(result.sections.mode).toBe("full");
		expect(result.sections.title).toBe("Seeds Workflow Context");

		// Close protocol has 5 steps.
		expect(result.sections.closeProtocol.steps).toHaveLength(5);
		expect(result.sections.closeProtocol.steps[0]).toContain("sd close");

		// Rules are non-empty.
		expect(result.sections.rules.length).toBeGreaterThan(0);

		// Command groups mirror markdown headings.
		const groupNames = result.sections.commandGroups.map((g) => g.name);
		expect(groupNames).toContain("Finding Work");
		expect(groupNames).toContain("Creating & Updating");
		expect(groupNames).toContain("Dependencies & Blocking");
		expect(groupNames).toContain("Labels");
		expect(groupNames).toContain("Sync & Project Health");
		expect(groupNames).toContain("Planning");

		// Each command has a structured shape.
		const findingWork = result.sections.commandGroups.find((g) => g.name === "Finding Work");
		expect(findingWork).toBeDefined();
		const ready = findingWork?.commands.find((c) => c.command === "sd ready");
		expect(ready?.description).toBe("Show issues ready to work (no blockers)");

		// Planning group carries the explanatory note.
		const planning = result.sections.commandGroups.find((g) => g.name === "Planning");
		expect(planning?.notes?.[0]).toContain("sd plan");

		// Workflows expose name + shell commands.
		const wfNames = result.sections.workflows.map((w) => w.name);
		expect(wfNames).toContain("Starting work");
		expect(wfNames).toContain("Completing work");
		const starting = result.sections.workflows.find((w) => w.name === "Starting work");
		expect(starting?.commands[0]).toContain("sd ready");

		// Backward compat: content still present and matches markdown.
		expect(result.content).toContain("Seeds Workflow Context");
		expect(result.content).toContain("Finding Work");
	});

	test("--json --compact emits compact-mode sections", async () => {
		const { stdout, exitCode } = await run(["prime", "--json", "--compact"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as {
			sections: {
				mode: string;
				title: string;
				commands: Array<{ command: string; description: string }>;
				planningNote: string;
				closingNote: string;
			};
			content: string;
		};
		expect(result.sections.mode).toBe("compact");
		expect(result.sections.title).toBe("Seeds Quick Reference");
		expect(result.sections.commands.length).toBeGreaterThan(0);
		expect(result.sections.commands.some((c) => c.command === "sd ready")).toBe(true);
		expect(result.sections.planningNote).toContain("sd plan");
		expect(result.sections.closingNote).toContain("sd sync");
		expect(result.content).toContain("Seeds Quick Reference");
	});

	test("--json with custom PRIME.md sets sections to null", async () => {
		await initSeeds(tmpDir);
		await Bun.write(join(tmpDir, ".seeds", "PRIME.md"), "my custom agent context");
		const { stdout, exitCode } = await run(["prime", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as {
			success: boolean;
			content: string;
			sections: unknown;
		};
		expect(result.success).toBe(true);
		expect(result.sections).toBeNull();
		expect(result.content).toBe("my custom agent context");
	});

	test("--export --json emits structured sections regardless of custom PRIME.md", async () => {
		await initSeeds(tmpDir);
		await Bun.write(join(tmpDir, ".seeds", "PRIME.md"), "custom prime content");
		const { stdout, exitCode } = await run(["prime", "--export", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as {
			sections: { mode: string } | null;
			content: string;
		};
		expect(result.sections).not.toBeNull();
		expect(result.sections?.mode).toBe("full");
		expect(result.content).toContain("Seeds Workflow Context");
		expect(result.content).not.toContain("custom prime content");
	});
});
