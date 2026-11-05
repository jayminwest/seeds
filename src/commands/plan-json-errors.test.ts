// --json failure envelopes for sd plan's non-throwing failure paths
// (seeds-cb18): validation diffs, refused resubmits, and refused creates must
// land on stdout as {success:false, command, error, ...} instead of plain
// stderr text, so agents parsing stdout never see an empty stream.

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";

interface Failure {
	success: boolean;
	command: string;
	error: string;
	plan_id?: string;
	valid?: boolean;
	errors?: Array<{ path: string; code: string }>;
	current?: unknown;
}

let tmpDir: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-plan-json-errors-"));
	await runCli(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

async function createSeed(title: string): Promise<string> {
	const { stdout } = await runCli(["create", "--title", title, "--json"], tmpDir);
	return (JSON.parse(stdout) as { id: string }).id;
}

function validPlan(): { template: string; sections: Record<string, unknown> } {
	return {
		template: "feature",
		sections: {
			context: "This work matters because agents parse --json stdout and need failures there.",
			approach: "Wrap non-throwing failure paths in the standard envelope.",
			alternatives: [],
			steps: [
				{ title: "Step A", type: "task", priority: 2, blocks: [] },
				{ title: "Step B", type: "task", priority: 2, blocks: [] },
			],
			risks: [],
			acceptance: ["Envelope on stdout"],
		},
	};
}

async function writePlanFile(plan: unknown): Promise<string> {
	const path = join(tmpDir, "plan.json");
	await Bun.write(path, JSON.stringify(plan));
	return path;
}

async function failure(args: string[]): Promise<Failure> {
	const { stdout, exitCode } = await runCli([...args, "--json"], tmpDir);
	expect(exitCode).toBe(1);
	const parsed = JSON.parse(stdout) as Failure;
	expect(parsed.success).toBe(false);
	return parsed;
}

describe("sd plan --json failure envelopes", () => {
	test("submit validation failure wraps the partial-state diff", async () => {
		const seedId = await createSeed("Parent");
		const { context: _omit, ...rest } = validPlan().sections;
		const stripped = { template: "feature", sections: rest };
		const out = await failure(["plan", "submit", seedId, "--plan", await writePlanFile(stripped)]);
		expect(out.command).toBe("plan submit");
		expect(out.error).toContain("failed validation");
		expect(out.errors?.some((e) => e.path.endsWith("context") && e.code === "required")).toBe(true);
		expect(out.current).toEqual(stripped);
	});

	test("submit validation failure keeps the bare diff on stderr without --json", async () => {
		const seedId = await createSeed("Parent");
		const { context: _omit, ...rest } = validPlan().sections;
		const planPath = await writePlanFile({ template: "feature", sections: rest });
		const { stdout, stderr, exitCode } = await runCli(
			["plan", "submit", seedId, "--plan", planPath],
			tmpDir,
		);
		expect(exitCode).toBe(1);
		expect(stdout).toBe("");
		expect(Object.keys(JSON.parse(stderr) as object)).toEqual(["errors", "current"]);
	});

	test("unknown step plan_template is reported in the envelope", async () => {
		const seedId = await createSeed("Parent");
		const plan = validPlan();
		plan.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, plan_template: "nope" },
			{ title: "Step B", type: "task", priority: 2 },
		];
		const out = await failure(["plan", "submit", seedId, "--plan", await writePlanFile(plan)]);
		expect(out.command).toBe("plan submit");
		expect(out.error).toContain("plan_template 'nope' is not defined");
	});

	test("resubmit without --overwrite", async () => {
		const seedId = await createSeed("Parent");
		const planPath = await writePlanFile(validPlan());
		const first = await runCli(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(first.stdout) as { plan_id: string }).plan_id;
		const out = await failure(["plan", "submit", seedId, "--plan", planPath]);
		expect(out.command).toBe("plan submit");
		expect(out.error).toContain("already exists");
		expect(out.error).toContain("--overwrite");
		expect(out.plan_id).toBe(planId);
	});

	test("plan create when a plan already exists", async () => {
		const seedId = await createSeed("Parent");
		await runCli(["plan", "create", seedId], tmpDir);
		const out = await failure(["plan", "create", seedId]);
		expect(out.command).toBe("plan create");
		expect(out.error).toContain("already exists");
		expect(out.plan_id?.startsWith("pl-")).toBe(true);
	});

	test("plan validate on a tampered plan", async () => {
		const seedId = await createSeed("Parent");
		const planPath = await writePlanFile(validPlan());
		const sub = await runCli(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(sub.stdout) as { plan_id: string }).plan_id;
		const path = join(tmpDir, ".seeds", "plans.jsonl");
		const row = JSON.parse((await Bun.file(path).text()).trim()) as {
			sections: Record<string, unknown>;
		};
		const { acceptance: _omit, ...rest } = row.sections;
		await Bun.write(path, `${JSON.stringify({ ...row, sections: rest })}\n`);

		const out = await failure(["plan", "validate", planId]);
		expect(out.command).toBe("plan validate");
		expect(out.valid).toBe(false);
		expect(out.plan_id).toBe(planId);
		expect(out.errors?.some((e) => e.path.endsWith("acceptance"))).toBe(true);
	});
});
