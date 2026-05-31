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

const VALID_CONTEXT =
	"This work matters because we need to enable structured planning for AI agents using seeds.";

function validPlan() {
	return {
		template: "feature",
		sections: {
			context: VALID_CONTEXT,
			approach: "Minimal plan used by plan-show.test.ts.",
			alternatives: [],
			steps: [
				{ title: "Step one", type: "task", priority: 2, blocks: [2] },
				{ title: "Step two", type: "task", priority: 2, blocks: [] },
			],
			risks: [],
			acceptance: ["Done"],
		},
	};
}

async function createSeed(title: string, cwd: string): Promise<string> {
	const out = await runJson<{ id: string }>(["create", "--title", title, "--type", "feature"], cwd);
	return out.id;
}

async function submitPlan(cwd: string, seedId: string): Promise<string> {
	const planPath = join(cwd, "plan.json");
	await Bun.write(planPath, JSON.stringify(validPlan()));
	const out = await runJson<{ plan_id: string }>(
		["plan", "submit", seedId, "--plan", planPath],
		cwd,
	);
	return out.plan_id;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-plan-show-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd plan show", () => {
	test("--json returns success envelope with plan + children for a pl-id", async () => {
		const seedId = await createSeed("Plan parent", tmpDir);
		const planId = await submitPlan(tmpDir, seedId);

		const out = await runJson<{
			success: boolean;
			command: string;
			plan: { id: string; seed: string; status: string };
			children: Array<{ id: string; title: string; status: string }>;
			children_plans: unknown[];
		}>(["plan", "show", planId], tmpDir);
		expect(out.success).toBe(true);
		expect(out.command).toBe("plan show");
		expect(out.plan.id).toBe(planId);
		expect(out.plan.seed).toBe(seedId);
		expect(Array.isArray(out.children)).toBe(true);
		expect(out.children.length).toBeGreaterThan(0);
	});

	test("resolves a seed id to its plan", async () => {
		const seedId = await createSeed("Plan parent", tmpDir);
		const planId = await submitPlan(tmpDir, seedId);

		const out = await runJson<{ plan: { id: string } }>(["plan", "show", seedId], tmpDir);
		expect(out.plan.id).toBe(planId);
	});

	test("human output renders header, sections, and children", async () => {
		const seedId = await createSeed("Plan parent", tmpDir);
		const planId = await submitPlan(tmpDir, seedId);
		const { stdout, exitCode } = await run(["plan", "show", planId], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(planId);
		expect(stdout).toContain("Sections:");
		expect(stdout).toContain("Step one");
		expect(stdout).toContain("Step two");
		expect(stdout).toMatch(/Children \(\d+\)/);
	});

	test("unknown pl- id errors with the 'plan list' hint", async () => {
		const { stderr, exitCode } = await run(["plan", "show", "pl-9999"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Plan not found: pl-9999");
		expect(stderr).toContain("sd plan list");
	});

	test("seed with no plan_id errors with a submit hint", async () => {
		const seedId = await createSeed("Lonely seed", tmpDir);
		const { stderr, exitCode } = await run(["plan", "show", seedId], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("has no plan");
		expect(stderr).toContain(`sd plan submit ${seedId}`);
	});
});
