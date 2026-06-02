import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";

const CLI = join(import.meta.dir, "../../src/index.ts");

async function run(
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return runCli(args, cwd);
}

let tmpDir: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-plan-test-"));
	// Initialize a seeds project so plan commands have a target
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd plan (parent)", () => {
	test("--help lists subcommands", async () => {
		const { stdout, exitCode } = await run(["plan", "--help"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("templates");
	});

	test("no subcommand prints help and exits non-zero", async () => {
		const { exitCode } = await run(["plan"], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("submit --help documents the plan file shape", async () => {
		const { stdout, exitCode } = await run(["plan", "submit", "--help"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Plan file shape");
		expect(stdout).toContain('"template"');
		expect(stdout).toContain('"sections"');
		expect(stdout).toContain("plan_request wrapper");
	});

	test("prompt instructions explain the submit shape", async () => {
		const seedId = await createSeed(tmpDir, "Demo seed");
		const { stdout, exitCode } = await run(["plan", "prompt", seedId, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { plan_request: { instructions: string } };
		expect(parsed.plan_request.instructions).toContain("plan_request wrapper");
		expect(parsed.plan_request.instructions).toContain("keyed by name");
	});
});

async function createSeed(cwd: string, title: string, type = "task"): Promise<string> {
	const { stdout } = await run(["create", "--title", title, "--type", type, "--json"], cwd);
	const parsed = JSON.parse(stdout) as { id: string };
	if (!parsed.id) throw new Error(`Could not parse created seed id from: ${stdout}`);
	return parsed.id;
}

const VALID_CONTEXT =
	"This work matters because we need to enable structured planning for AI agents using seeds.";

function validPlanFor(): {
	template: string;
	sections: Record<string, unknown>;
} {
	return {
		template: "feature",
		sections: {
			context: VALID_CONTEXT,
			approach: "Hardcoded TS template + AJV schema, mirroring mulch's custom_types.",
			alternatives: [],
			steps: [
				// Forward semantics: step i with blocks: [j] means step i blocks step j.
				// Indices are 1-based (seeds-185f) — step 1 is the first step.
				{ title: "Step A", type: "task", priority: 2, blocks: [2] }, // A blocks B
				{ title: "Step B", type: "task", priority: 2, blocks: [] },
				{ title: "Step C", type: "task", priority: 2, blocks: [4] }, // C blocks D
				{ title: "Step D", type: "task", priority: 2, blocks: [] },
			],
			risks: [],
			acceptance: ["End-to-end works"],
		},
	};
}

async function writePlanFile(cwd: string, plan: unknown): Promise<string> {
	const path = join(cwd, "plan.json");
	await Bun.write(path, JSON.stringify(plan));
	return path;
}

async function readJsonl<T>(path: string): Promise<T[]> {
	const text = await Bun.file(path).text();
	return text
		.split("\n")
		.filter((l) => l.trim())
		.map((l) => JSON.parse(l) as T);
}

describe("sd plan templates", () => {
	test("human output lists feature template", async () => {
		const { stdout, exitCode } = await run(["plan", "templates"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("feature");
	});

	test("--json emits structured output", async () => {
		const { stdout, exitCode } = await run(["plan", "templates", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as {
			success: boolean;
			templates: Array<{ name: string; description: string }>;
			count: number;
		};
		expect(parsed.success).toBe(true);
		expect(parsed.count).toBe(3);
		const names = parsed.templates.map((t) => t.name);
		expect(names).toEqual(["bug", "feature", "refactor"]);
		for (const t of parsed.templates) expect(t.description.length).toBeGreaterThan(0);
	});
});

describe("sd plan prompt", () => {
	test("--json emits the documented plan_request shape", async () => {
		const seedId = await createSeed(tmpDir, "Add OAuth login");
		const { stdout, exitCode } = await run(["plan", "prompt", seedId, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as {
			success: boolean;
			command: string;
			plan_request: {
				seed: string;
				template: string;
				instructions: string;
				sections: Array<{
					name: string;
					required: boolean;
					kind: string;
					prompt: string;
					prior_art: unknown[];
					min_length?: number;
					min?: number;
				}>;
				validation: { all_required_present: boolean; min_steps: number; min_acceptance: number };
			};
		};
		expect(parsed.success).toBe(true);
		expect(parsed.command).toBe("plan prompt");
		const req = parsed.plan_request;
		expect(req.seed).toBe(seedId);
		expect(req.template).toBe("feature");
		expect(req.sections.length).toBe(6);
		const names = req.sections.map((s) => s.name);
		expect(names).toEqual(["context", "approach", "alternatives", "steps", "risks", "acceptance"]);
		const context = req.sections.find((s) => s.name === "context");
		expect(context?.required).toBe(true);
		expect(context?.min_length).toBe(50);
		expect(context?.prior_art).toEqual([]);
		expect(req.validation.min_steps).toBe(2);
		expect(req.validation.min_acceptance).toBe(1);
		expect(req.validation.all_required_present).toBe(true);
	});

	test("infers template feature from task type by default", async () => {
		const seedId = await createSeed(tmpDir, "A task", "task");
		const { stdout } = await run(["plan", "prompt", seedId, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as { plan_request: { template: string } };
		expect(parsed.plan_request.template).toBe("feature");
	});

	test("infers template feature from epic type by default", async () => {
		const seedId = await createSeed(tmpDir, "An epic", "epic");
		const { stdout } = await run(["plan", "prompt", seedId, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as { plan_request: { template: string } };
		expect(parsed.plan_request.template).toBe("feature");
	});

	test("--template feature is accepted explicitly", async () => {
		const seedId = await createSeed(tmpDir, "Feature with override");
		const { stdout, exitCode } = await run(
			["plan", "prompt", seedId, "--template", "feature", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { plan_request: { template: string } };
		expect(parsed.plan_request.template).toBe("feature");
	});

	test("--template <unknown> errors with available templates listed", async () => {
		const seedId = await createSeed(tmpDir, "x");
		const { stderr, exitCode } = await run(
			["plan", "prompt", seedId, "--template", "missing"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("missing");
		expect(stderr).toContain("feature");
	});

	test("unknown seed id errors cleanly", async () => {
		const { stderr, exitCode } = await run(["plan", "prompt", "nope-9999"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr.toLowerCase()).toContain("not found");
	});

	test("human output renders readably", async () => {
		const seedId = await createSeed(tmpDir, "Readable plan");
		const { stdout, exitCode } = await run(["plan", "prompt", seedId], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("context");
		expect(stdout).toContain("steps");
		expect(stdout).toContain("acceptance");
	});
});

describe("sd plan submit", () => {
	test("golden path: spawns children with correct blockedBy id remap", async () => {
		const seedId = await createSeed(tmpDir, "Parent for plan");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { stdout, exitCode } = await run(
			["plan", "submit", seedId, "--plan", planPath, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as {
			success: boolean;
			plan_id: string;
			children: string[];
			parent_seed: string;
		};
		expect(result.success).toBe(true);
		expect(result.children.length).toBe(4);
		expect(result.parent_seed).toBe(seedId);
		expect(result.plan_id.startsWith("pl-")).toBe(true);

		const issues = await readJsonl<{
			id: string;
			plan_id?: string;
			plan_step_index?: number;
			blockedBy?: string[];
			blocks?: string[];
		}>(join(tmpDir, ".seeds", "issues.jsonl"));

		const [aa01, aa02, aa03, aa04] = result.children;
		const child = (id?: string) => issues.find((i) => i.id === id);

		expect(child(aa01)?.plan_id).toBe(result.plan_id);
		expect(child(aa01)?.plan_step_index).toBe(0);
		expect(child(aa01)?.blockedBy ?? []).toEqual([]);
		// Forward semantics: A's blocks=[1] → A.blocks contains B (and the parent seed).
		expect(child(aa01)?.blocks).toEqual([aa02 ?? "", seedId]);

		expect(child(aa02)?.plan_step_index).toBe(1);
		expect(child(aa02)?.blockedBy).toEqual([aa01 ?? ""]);
		expect(child(aa02)?.blocks).toEqual([seedId]);

		expect(child(aa03)?.plan_step_index).toBe(2);
		expect(child(aa03)?.blockedBy ?? []).toEqual([]);
		expect(child(aa03)?.blocks).toEqual([aa04 ?? "", seedId]);

		expect(child(aa04)?.plan_step_index).toBe(3);
		expect(child(aa04)?.blockedBy).toEqual([aa03 ?? ""]);
		expect(child(aa04)?.blocks).toEqual([seedId]);

		// Parent: plan_id back-pointer + blockedBy includes all children
		const parent = child(seedId);
		expect(parent?.plan_id).toBe(result.plan_id);
		expect(parent?.blockedBy).toEqual(result.children);

		// plans.jsonl row written
		const plans = await readJsonl<{
			id: string;
			seed: string;
			template: string;
			status: string;
			revision: number;
			children: string[];
		}>(join(tmpDir, ".seeds", "plans.jsonl"));
		expect(plans.length).toBe(1);
		expect(plans[0]?.id).toBe(result.plan_id);
		expect(plans[0]?.seed).toBe(seedId);
		expect(plans[0]?.template).toBe("feature");
		expect(plans[0]?.status).toBe("approved");
		expect(plans[0]?.revision).toBe(1);
		expect(plans[0]?.children).toEqual(result.children);
	});

	test("validation failure emits partial-state diff to stderr; no writes", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const bad = validPlanFor();
		const { context: _omit, ...restSections } = bad.sections;
		const stripped = { ...bad, sections: restSections };
		const planPath = await writePlanFile(tmpDir, stripped);

		const issuesBefore = await readJsonl<unknown>(join(tmpDir, ".seeds", "issues.jsonl"));
		const plansBefore = await readJsonl<unknown>(join(tmpDir, ".seeds", "plans.jsonl"));

		const { stderr, stdout, exitCode } = await run(
			["plan", "submit", seedId, "--plan", planPath],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		const diff = JSON.parse(stderr) as {
			errors: Array<{ path: string; code: string; fix: string }>;
			current: unknown;
		};
		expect(diff.errors.some((e) => e.path.endsWith("context") && e.code === "required")).toBe(true);
		expect(diff.current).toEqual(stripped);

		// No writes
		const issuesAfter = await readJsonl<unknown>(join(tmpDir, ".seeds", "issues.jsonl"));
		const plansAfter = await readJsonl<unknown>(join(tmpDir, ".seeds", "plans.jsonl"));
		expect(issuesAfter.length).toBe(issuesBefore.length);
		expect(plansAfter.length).toBe(plansBefore.length);
	});

	test("resubmit without --overwrite is rejected", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { exitCode: first } = await run(["plan", "submit", seedId, "--plan", planPath], tmpDir);
		expect(first).toBe(0);
		const { stderr, exitCode: second } = await run(
			["plan", "submit", seedId, "--plan", planPath],
			tmpDir,
		);
		expect(second).not.toBe(0);
		expect(stderr.toLowerCase()).toContain("already exists");
	});

	test("--plan - reads from stdin", async () => {
		const seedId = await createSeed(tmpDir, "Stdin parent");
		const proc = Bun.spawn(["bun", "run", CLI, "plan", "submit", seedId, "--plan", "-", "--json"], {
			cwd: tmpDir,
			stdin: "pipe",
			stdout: "pipe",
			stderr: "pipe",
		});
		proc.stdin.write(JSON.stringify(validPlanFor()));
		await proc.stdin.end();
		const stdout = await new Response(proc.stdout).text();
		const exitCode = await proc.exited;
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { success: boolean; children: string[] };
		expect(result.success).toBe(true);
		expect(result.children.length).toBe(4);
	});

	test("unknown seed errors cleanly", async () => {
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { stderr, exitCode } = await run(
			["plan", "submit", "nope-9999", "--plan", planPath],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr.toLowerCase()).toContain("not found");
	});

	test("success path emits Next-block hints to stderr (not stdout)", async () => {
		const seedId = await createSeed(tmpDir, "Next-block parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { stdout, stderr, exitCode } = await run(
			["plan", "submit", seedId, "--plan", planPath],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		// stderr carries the hint block; the plan id and the three suggested
		// commands are all present.
		const planIdMatch = stdout.match(/plan (pl-[a-f0-9]+) created/);
		expect(planIdMatch).not.toBeNull();
		const planId = planIdMatch?.[1] ?? "";
		expect(stderr).toContain("Next:");
		expect(stderr).toContain(`sd plan show ${planId}`);
		expect(stderr).toContain("sd ready");
		expect(stderr).toContain(`sd plan review ${planId} --by`);
		// stdout must not contain the hints — those are stderr-only.
		expect(stdout).not.toContain("Next:");
		expect(stdout).not.toContain("sd ready");
	});

	test("--json submit leaves stdout JSON intact and still emits Next on stderr", async () => {
		const seedId = await createSeed(tmpDir, "JSON parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { stdout, stderr, exitCode } = await run(
			["plan", "submit", seedId, "--plan", planPath, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		// stdout is parseable JSON and unchanged by the Next-hint rollout.
		const parsed = JSON.parse(stdout) as { success: boolean; plan_id: string };
		expect(parsed.success).toBe(true);
		expect(stdout).not.toContain("Next:");
		// stderr stays clean for --json mode (no Next block, no mulch line) so
		// pipelines don't pick up surprise content. The Next block is a
		// human-output affordance, not a JSON one.
		expect(stderr).not.toContain("Next:");
	});
});

describe("sd plan submit: existing_seed adoption (seeds-24c6 / pl-43ff)", () => {
	type IssueRow = {
		id: string;
		title: string;
		status: string;
		type: string;
		priority: number;
		assignee?: string;
		description?: string;
		plan_id?: string;
		plan_step_index?: number;
		blocks?: string[];
		blockedBy?: string[];
		createdAt: string;
		updatedAt: string;
	};

	async function readIssues(): Promise<IssueRow[]> {
		return readJsonl<IssueRow>(join(tmpDir, ".seeds/issues.jsonl"));
	}

	function planWithAdoption(
		adoptId: string,
		adoptedTitle = "Step A",
	): ReturnType<typeof validPlanFor> {
		const plan = validPlanFor();
		plan.sections.steps = [
			// Step 1 adopts the named seed; blocks step 2.
			{ title: adoptedTitle, type: "task", priority: 2, blocks: [2], existing_seed: adoptId },
			{ title: "Fresh step", type: "task", priority: 2, blocks: [] },
		];
		return plan;
	}

	test("happy path: adopts an open seed instead of spawning a fresh child", async () => {
		const parent = await createSeed(tmpDir, "Parent for adoption");
		const adoptee = await createSeed(tmpDir, "Step A");

		const planPath = await writePlanFile(tmpDir, planWithAdoption(adoptee, "Step A"));
		const { stdout, exitCode } = await run(
			["plan", "submit", parent, "--plan", planPath, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as {
			success: boolean;
			plan_id: string;
			children: string[];
		};
		expect(result.success).toBe(true);
		expect(result.children.length).toBe(2);
		// Adopted seed reuses its own id at the step's position.
		expect(result.children[0]).toBe(adoptee);

		const issues = await readIssues();
		const find = (id: string) => issues.find((i) => i.id === id);
		const adopt = find(adoptee);
		const fresh = find(result.children[1] ?? "");
		const par = find(parent);

		// Adopted seed: linked into the plan, kept open with its own metadata.
		expect(adopt?.plan_id).toBe(result.plan_id);
		expect(adopt?.plan_step_index).toBe(0);
		expect(adopt?.status).toBe("open");
		expect(adopt?.title).toBe("Step A");
		// Forward edges: step 1 blocks step 2 (fresh) and the parent seed.
		expect(adopt?.blocks).toEqual([result.children[1] ?? "", parent]);
		// Description carries the backref block.
		expect(adopt?.description ?? "").toContain("seeds:plan-backref:start");
		expect(adopt?.description ?? "").toContain(`Step 1 of plan ${result.plan_id}`);

		// Fresh sibling: blockedBy includes the adopted seed (cross-edge wiring).
		expect(fresh?.blockedBy).toEqual([adoptee]);

		// Parent: blockedBy includes both children (adopted + fresh).
		expect(par?.plan_id).toBe(result.plan_id);
		expect(par?.blockedBy).toEqual(result.children);

		// Plan row references the adopted id in children.
		const plans = await readJsonl<{ id: string; children: string[] }>(
			join(tmpDir, ".seeds/plans.jsonl"),
		);
		expect(plans.find((p) => p.id === result.plan_id)?.children).toEqual(result.children);
	});

	test("adoption preserves existing seed fields and prepends backref to description", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		// Pre-populate the adoptee with description, assignee, priority, status.
		const { stdout: createOut } = await run(
			[
				"create",
				"--title",
				"Pre-existing work",
				"--type",
				"bug",
				"--priority",
				"1",
				"--assignee",
				"alice",
				"--description",
				"original notes the author wrote",
				"--json",
			],
			tmpDir,
		);
		const adoptee = (JSON.parse(createOut) as { id: string }).id;
		await run(["update", adoptee, "--status", "in_progress"], tmpDir);

		const plan = validPlanFor();
		plan.sections.steps = [
			{ title: "Pre-existing work", type: "task", priority: 2, blocks: [], existing_seed: adoptee },
			{ title: "Fresh", type: "task", priority: 2, blocks: [] },
		];
		const planPath = await writePlanFile(tmpDir, plan);
		const { exitCode } = await run(
			["plan", "submit", parent, "--plan", planPath, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);

		const issues = await readIssues();
		const adopt = issues.find((i) => i.id === adoptee);
		// Link-only adoption: status, type, priority, assignee, title untouched.
		expect(adopt?.status).toBe("in_progress");
		expect(adopt?.type).toBe("bug");
		expect(adopt?.priority).toBe(1);
		expect(adopt?.assignee).toBe("alice");
		expect(adopt?.title).toBe("Pre-existing work");
		// Description: backref block first, then the author's original notes.
		const desc = adopt?.description ?? "";
		expect(desc.indexOf("seeds:plan-backref:start")).toBeLessThan(
			desc.indexOf("original notes the author wrote"),
		);
		expect(desc).toContain("original notes the author wrote");
	});

	test("rejects existing_seed pointing at the parent seed", async () => {
		const parent = await createSeed(tmpDir, "Self-adopt parent");
		const plan = planWithAdoption(parent, "Self");
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", parent, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("cannot adopt the parent seed");
	});

	test("rejects existing_seed that doesn't exist", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		const plan = planWithAdoption("nope-9999");
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", parent, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("not found");
	});

	test("rejects adoption of a closed seed", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		const adoptee = await createSeed(tmpDir, "Step A");
		await run(["close", adoptee], tmpDir);

		const planPath = await writePlanFile(tmpDir, planWithAdoption(adoptee));
		const { stderr, exitCode } = await run(["plan", "submit", parent, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("is closed");
	});

	test("rejects adoption of a seed already attached to another plan", async () => {
		const parentA = await createSeed(tmpDir, "Parent A");
		const planAPath = await writePlanFile(tmpDir, validPlanFor());
		const firstSubmit = await run(
			["plan", "submit", parentA, "--plan", planAPath, "--json"],
			tmpDir,
		);
		expect(firstSubmit.exitCode).toBe(0);
		const planAChildren = (JSON.parse(firstSubmit.stdout) as { children: string[] }).children;
		const attachedId = planAChildren[0];
		expect(attachedId).toBeDefined();
		if (!attachedId) return;

		const parentB = await createSeed(tmpDir, "Parent B");
		const planBPath = await writePlanFile(tmpDir, planWithAdoption(attachedId));
		const { stderr, exitCode } = await run(
			["plan", "submit", parentB, "--plan", planBPath],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("already attached to plan");
	});

	test("rejects two steps adopting the same seed", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		const adoptee = await createSeed(tmpDir, "Shared");

		const plan = validPlanFor();
		plan.sections.steps = [
			{ title: "First", type: "task", priority: 2, blocks: [], existing_seed: adoptee },
			{ title: "Second", type: "task", priority: 2, blocks: [], existing_seed: adoptee },
		];
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", parent, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("already adopted by an earlier step");
	});

	test("rejects existing_seed combined with plan_template", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		const adoptee = await createSeed(tmpDir, "Step");

		const plan = validPlanFor();
		plan.sections.steps = [
			{
				title: "Step",
				type: "task",
				priority: 2,
				blocks: [],
				existing_seed: adoptee,
				plan_template: "feature",
			},
			{ title: "Fresh", type: "task", priority: 2, blocks: [] },
		];
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", parent, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("mutually exclusive");
	});

	test("warns on title mismatch but still adopts", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		const adoptee = await createSeed(tmpDir, "Real seed title");

		const plan = validPlanFor();
		plan.sections.steps = [
			{
				title: "Plan-author title",
				type: "task",
				priority: 2,
				blocks: [],
				existing_seed: adoptee,
			},
			{ title: "Fresh", type: "task", priority: 2, blocks: [] },
		];
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(
			["plan", "submit", parent, "--plan", planPath, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		expect(stderr).toContain("differs from step.title");
		expect(stderr).toContain("seed title is preserved");

		const issues = await readIssues();
		expect(issues.find((i) => i.id === adoptee)?.title).toBe("Real seed title");
	});

	test("validation failure (non-existent adoptee) leaves issues + plans untouched", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		const before = await readIssues();
		const plansBefore = await readJsonl<unknown>(join(tmpDir, ".seeds/plans.jsonl"));

		const planPath = await writePlanFile(tmpDir, planWithAdoption("nope-1234"));
		const { exitCode } = await run(["plan", "submit", parent, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);

		const after = await readIssues();
		const plansAfter = await readJsonl<unknown>(join(tmpDir, ".seeds/plans.jsonl"));
		expect(after.length).toBe(before.length);
		expect(plansAfter.length).toBe(plansBefore.length);
	});

	// seeds-5583 / warren §11.Q — synthesis: mint a parent seed + plan whose
	// children are entirely existing seeds, with no titles on the steps.
	test("synthesis: steps may omit title when existing_seed is set", async () => {
		const parent = await createSeed(tmpDir, "Synthesis parent");
		const a = await createSeed(tmpDir, "Adoptee A");
		const b = await createSeed(tmpDir, "Adoptee B");
		const c = await createSeed(tmpDir, "Adoptee C");

		const plan = validPlanFor();
		plan.sections.steps = [{ existing_seed: a }, { existing_seed: b }, { existing_seed: c }];
		const planPath = await writePlanFile(tmpDir, plan);
		const { stdout, stderr, exitCode } = await run(
			["plan", "submit", parent, "--plan", planPath, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		// No title-mismatch warnings — titles weren't supplied.
		expect(stderr).not.toContain("differs from step.title");

		const result = JSON.parse(stdout) as { children: string[]; plan_id: string };
		// children projection is byte-compatible: just the adopted ids in order.
		expect(result.children).toEqual([a, b, c]);

		const issues = await readIssues();
		const find = (id: string) => issues.find((i) => i.id === id);
		// Each adoptee keeps its original title.
		expect(find(a)?.title).toBe("Adoptee A");
		expect(find(b)?.title).toBe("Adoptee B");
		expect(find(c)?.title).toBe("Adoptee C");
		// Plan link set on every adopted child.
		expect(find(a)?.plan_id).toBe(result.plan_id);
		expect(find(b)?.plan_id).toBe(result.plan_id);
		expect(find(c)?.plan_id).toBe(result.plan_id);
		// Plan row's adoptedChildren matches the children list (all adopted).
		const plans = await readJsonl<{ id: string; adoptedChildren?: string[] }>(
			join(tmpDir, ".seeds/plans.jsonl"),
		);
		expect(plans.find((p) => p.id === result.plan_id)?.adoptedChildren).toEqual([a, b, c]);
	});

	test("schema rejects a step missing both title and existing_seed", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		const plan = validPlanFor();
		// Step lacks title AND existing_seed — should be caught pre-write.
		plan.sections.steps = [
			{ type: "task", priority: 2, blocks: [] },
			{ title: "Other", type: "task", priority: 2, blocks: [] },
		];
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", parent, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("title");
		expect(stderr).toContain("existing_seed");
	});

	test("error label falls back to seed id when title is omitted", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		// Adopt a non-existent id, with no title supplied. The error should
		// reference the adopted id rather than `undefined`.
		const plan = validPlanFor();
		plan.sections.steps = [
			{ existing_seed: "nope-9999" },
			{ title: "Fresh", type: "task", priority: 2, blocks: [] },
		];
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", parent, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("adopt nope-9999");
		expect(stderr).not.toContain("(undefined)");
	});
});

describe("sd plan adopt (seeds-2b93 / pl-43ff)", () => {
	type IssueRow = {
		id: string;
		title: string;
		status: string;
		description?: string;
		plan_id?: string;
		plan_step_index?: number;
		blocks?: string[];
		blockedBy?: string[];
		assignee?: string;
		labels?: string[];
		priority: number;
		type: string;
		updatedAt: string;
	};
	type PlanRow = {
		id: string;
		seed: string;
		revision: number;
		children: string[];
		updatedAt: string;
	};

	async function readIssuesRows(): Promise<IssueRow[]> {
		return readJsonl<IssueRow>(join(tmpDir, ".seeds/issues.jsonl"));
	}
	async function readPlansRows(): Promise<PlanRow[]> {
		return readJsonl<PlanRow>(join(tmpDir, ".seeds/plans.jsonl"));
	}

	async function submitFreshPlan(): Promise<{
		planId: string;
		parent: string;
		children: string[];
	}> {
		const parent = await createSeed(tmpDir, "Parent plan");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { stdout, exitCode } = await run(
			["plan", "submit", parent, "--plan", planPath, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { plan_id: string; children: string[] };
		return { planId: result.plan_id, parent, children: result.children };
	}

	test("happy path: adopts an open seed, wires edges, bumps revision", async () => {
		const { planId, parent } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "Extra work to fold in");

		const { stdout, stderr, exitCode } = await run(
			["plan", "adopt", planId, adoptee, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as {
			success: boolean;
			plan_id: string;
			adopted: string[];
			revision: number;
		};
		expect(result.success).toBe(true);
		expect(result.plan_id).toBe(planId);
		expect(result.adopted).toEqual([adoptee]);
		expect(result.revision).toBe(2);
		expect(stderr).toBe("");

		const issues = await readIssuesRows();
		const adopt = issues.find((i) => i.id === adoptee);
		const par = issues.find((i) => i.id === parent);
		expect(adopt?.plan_id).toBe(planId);
		// No --step provided: plan_step_index is left undefined.
		expect(adopt?.plan_step_index).toBeUndefined();
		expect(adopt?.status).toBe("open");
		expect(adopt?.blocks).toEqual([parent]);
		// Description carries the loose-adoption backref variant.
		expect(adopt?.description ?? "").toContain("seeds:plan-backref:start");
		expect(adopt?.description ?? "").toContain(`Adopted into plan ${planId}.`);
		expect(adopt?.description ?? "").toContain(`Parent seed: ${parent}`);

		// Parent: blockedBy gains adopted child (alongside the original spawn-children).
		expect(par?.blockedBy ?? []).toContain(adoptee);

		const plans = await readPlansRows();
		const plan = plans.find((p) => p.id === planId);
		expect(plan?.children).toContain(adoptee);
		expect(plan?.revision).toBe(2);
	});

	test("--step sets plan_step_index (1-based input, 0-based stored) and the step backref", async () => {
		const { planId, parent } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "Sibling for step 2");

		const { exitCode } = await run(
			["plan", "adopt", planId, adoptee, "--step", "2", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);

		const adopt = (await readIssuesRows()).find((i) => i.id === adoptee);
		expect(adopt?.plan_step_index).toBe(1);
		expect(adopt?.description ?? "").toContain(`Step 2 of plan ${planId}.`);
		expect(adopt?.description ?? "").not.toContain("Adopted into plan");
		expect(adopt?.blocks).toEqual([parent]);
	});

	test("adopts multiple seeds in one call; revision bumps once", async () => {
		const { planId } = await submitFreshPlan();
		const a = await createSeed(tmpDir, "Adoptee A");
		const b = await createSeed(tmpDir, "Adoptee B");

		const { stdout, exitCode } = await run(["plan", "adopt", planId, a, b, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { adopted: string[]; revision: number };
		expect(result.adopted).toEqual([a, b]);
		expect(result.revision).toBe(2);

		const plans = await readPlansRows();
		const plan = plans.find((p) => p.id === planId);
		expect(plan?.children).toContain(a);
		expect(plan?.children).toContain(b);
	});

	test("accepts the parent seed id in place of the plan id", async () => {
		const { planId, parent } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "Late-arriving work");

		const { stdout, exitCode } = await run(["plan", "adopt", parent, adoptee, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { plan_id: string };
		expect(result.plan_id).toBe(planId);
	});

	test("preserves the adoptee's status, priority, type, assignee, and labels (link-only)", async () => {
		const { planId } = await submitFreshPlan();
		const { stdout: createOut } = await run(
			[
				"create",
				"--title",
				"Pre-existing",
				"--type",
				"bug",
				"--priority",
				"1",
				"--assignee",
				"alice",
				"--description",
				"original author notes",
				"--json",
			],
			tmpDir,
		);
		const adoptee = (JSON.parse(createOut) as { id: string }).id;
		await run(["update", adoptee, "--status", "in_progress"], tmpDir);
		await run(["label", "add", adoptee, "needs-design"], tmpDir);

		const { exitCode } = await run(["plan", "adopt", planId, adoptee], tmpDir);
		expect(exitCode).toBe(0);

		const adopt = (await readIssuesRows()).find((i) => i.id === adoptee);
		expect(adopt?.status).toBe("in_progress");
		expect(adopt?.type).toBe("bug");
		expect(adopt?.priority).toBe(1);
		expect(adopt?.assignee).toBe("alice");
		expect(adopt?.labels).toEqual(["needs-design"]);
		// Backref prepended; author's notes preserved underneath.
		const desc = adopt?.description ?? "";
		expect(desc.indexOf("seeds:plan-backref:start")).toBeLessThan(
			desc.indexOf("original author notes"),
		);
		expect(desc).toContain("original author notes");
	});

	test("rejects adoption of a closed seed", async () => {
		const { planId } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "Closed before adoption");
		await run(["close", adoptee], tmpDir);

		const { stderr, exitCode } = await run(["plan", "adopt", planId, adoptee], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("is closed");
	});

	test("rejects adoption of a seed already attached to another plan", async () => {
		const { planId, children } = await submitFreshPlan();
		const attached = children[0];
		expect(attached).toBeDefined();
		if (!attached) return;

		// Spin up a second plan; try to steal one of its children into the first.
		const otherParent = await createSeed(tmpDir, "Other parent");
		const otherPath = await writePlanFile(tmpDir, validPlanFor());
		const second = await run(
			["plan", "submit", otherParent, "--plan", otherPath, "--json"],
			tmpDir,
		);
		expect(second.exitCode).toBe(0);
		const secondChildren = (JSON.parse(second.stdout) as { children: string[] }).children;
		const stolen = secondChildren[0];
		expect(stolen).toBeDefined();
		if (!stolen) return;

		const { stderr, exitCode } = await run(["plan", "adopt", planId, stolen], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("already attached to plan");
	});

	test("rejects adoption of the plan's own parent seed", async () => {
		const { planId, parent } = await submitFreshPlan();
		const { stderr, exitCode } = await run(["plan", "adopt", planId, parent], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("cannot adopt the parent seed");
	});

	test("rejects a seed id that doesn't exist", async () => {
		const { planId } = await submitFreshPlan();
		const { stderr, exitCode } = await run(["plan", "adopt", planId, "nope-9999"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("not found");
	});

	test("rejects duplicate seed ids in args", async () => {
		const { planId } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "Once");
		const { stderr, exitCode } = await run(["plan", "adopt", planId, adoptee, adoptee], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Duplicate seed id");
	});

	test("rejects --step out of range", async () => {
		const { planId } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "Adoptee");
		// validPlanFor has 4 steps; --step 5 is out of range.
		const { stderr, exitCode } = await run(
			["plan", "adopt", planId, adoptee, "--step", "5"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("out of range");
	});

	test("rejects non-positive --step values", async () => {
		const { planId } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "Adoptee");
		const { stderr, exitCode } = await run(
			["plan", "adopt", planId, adoptee, "--step", "0"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("positive integer");
	});

	test("rejects unknown plan id", async () => {
		const adoptee = await createSeed(tmpDir, "Adoptee");
		const { stderr, exitCode } = await run(["plan", "adopt", "pl-zzzz", adoptee], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Plan not found");
	});

	test("validation failure leaves issues + plans untouched (atomic batch)", async () => {
		const { planId } = await submitFreshPlan();
		const good = await createSeed(tmpDir, "Would-be adopted");
		const closed = await createSeed(tmpDir, "Closed sibling");
		await run(["close", closed], tmpDir);

		const issuesBefore = await readIssuesRows();
		const plansBefore = await readPlansRows();

		// Mix valid + invalid: the closed one trips validation, so neither should land.
		const { exitCode } = await run(["plan", "adopt", planId, good, closed], tmpDir);
		expect(exitCode).not.toBe(0);

		const issuesAfter = await readIssuesRows();
		const plansAfter = await readPlansRows();
		// good's plan_id stays undefined (validation aborted before any writes).
		expect(issuesAfter.find((i) => i.id === good)?.plan_id).toBeUndefined();
		// Plan revision unchanged.
		expect(plansAfter.find((p) => p.id === planId)?.revision).toBe(
			plansBefore.find((p) => p.id === planId)?.revision,
		);
		expect(issuesAfter.length).toBe(issuesBefore.length);
		expect(plansAfter.length).toBe(plansBefore.length);
	});

	test("human output reports the adoption and the new revision", async () => {
		const { planId } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "Adoptee");
		const { stdout, exitCode } = await run(["plan", "adopt", planId, adoptee], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(adoptee);
		expect(stdout).toContain("adopted into plan");
		expect(stdout).toContain("revision bumped to 2");
	});
});

describe("sd plan release (seeds-2b8a / pl-43ff)", () => {
	type IssueRow = {
		id: string;
		title: string;
		status: string;
		description?: string;
		plan_id?: string;
		plan_step_index?: number;
		blocks?: string[];
		blockedBy?: string[];
		assignee?: string;
		labels?: string[];
		priority: number;
		type: string;
		updatedAt: string;
	};
	type PlanRow = {
		id: string;
		seed: string;
		revision: number;
		children: string[];
		updatedAt: string;
	};

	async function readIssuesRows(): Promise<IssueRow[]> {
		return readJsonl<IssueRow>(join(tmpDir, ".seeds/issues.jsonl"));
	}
	async function readPlansRows(): Promise<PlanRow[]> {
		return readJsonl<PlanRow>(join(tmpDir, ".seeds/plans.jsonl"));
	}

	async function submitFreshPlan(): Promise<{
		planId: string;
		parent: string;
		children: string[];
	}> {
		const parent = await createSeed(tmpDir, "Parent plan");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { stdout, exitCode } = await run(
			["plan", "submit", parent, "--plan", planPath, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { plan_id: string; children: string[] };
		return { planId: result.plan_id, parent, children: result.children };
	}

	test("happy path: releases an adopted seed, strips backref, unwires edges, bumps revision", async () => {
		const { planId, parent } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "To be adopted then released");
		await run(["plan", "adopt", planId, adoptee, "--step", "2"], tmpDir);

		const { stdout, stderr, exitCode } = await run(
			["plan", "release", planId, adoptee, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as {
			success: boolean;
			plan_id: string;
			released: string[];
			revision: number;
		};
		expect(result.success).toBe(true);
		expect(result.plan_id).toBe(planId);
		expect(result.released).toEqual([adoptee]);
		// adopt bumped revision to 2; release bumps it to 3.
		expect(result.revision).toBe(3);
		expect(stderr).toBe("");

		const issues = await readIssuesRows();
		const rel = issues.find((i) => i.id === adoptee);
		const par = issues.find((i) => i.id === parent);
		expect(rel?.plan_id).toBeUndefined();
		expect(rel?.plan_step_index).toBeUndefined();
		// Seed remains open — release is link-only.
		expect(rel?.status).toBe("open");
		// Parent edge was the only entry in seed.blocks; it should be gone.
		expect(rel?.blocks ?? []).not.toContain(parent);
		// Backref block stripped.
		const desc = rel?.description ?? "";
		expect(desc).not.toContain("seeds:plan-backref:start");
		expect(desc).not.toContain("seeds:plan-backref:end");

		// Parent loses the adoptee from blockedBy (the original spawn children remain).
		expect(par?.blockedBy ?? []).not.toContain(adoptee);

		const plans = await readPlansRows();
		const plan = plans.find((p) => p.id === planId);
		expect(plan?.children ?? []).not.toContain(adoptee);
		expect(plan?.revision).toBe(3);
	});

	test("preserves manual notes underneath the backref block when stripping", async () => {
		const { planId } = await submitFreshPlan();
		const { stdout: createOut } = await run(
			[
				"create",
				"--title",
				"Carries manual notes",
				"--description",
				"original author notes",
				"--json",
			],
			tmpDir,
		);
		const adoptee = (JSON.parse(createOut) as { id: string }).id;
		await run(["plan", "adopt", planId, adoptee], tmpDir);

		const { exitCode } = await run(["plan", "release", planId, adoptee], tmpDir);
		expect(exitCode).toBe(0);

		const rel = (await readIssuesRows()).find((i) => i.id === adoptee);
		expect(rel?.description).toBe("original author notes");
	});

	test("releases multiple seeds in one call; revision bumps once", async () => {
		const { planId } = await submitFreshPlan();
		const a = await createSeed(tmpDir, "A");
		const b = await createSeed(tmpDir, "B");
		await run(["plan", "adopt", planId, a, b], tmpDir);

		const planBefore = (await readPlansRows()).find((p) => p.id === planId);
		const revBefore = planBefore?.revision ?? 0;

		const { stdout, exitCode } = await run(["plan", "release", planId, a, b, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { released: string[]; revision: number };
		expect(result.released).toEqual([a, b]);
		expect(result.revision).toBe(revBefore + 1);

		const plan = (await readPlansRows()).find((p) => p.id === planId);
		expect(plan?.children ?? []).not.toContain(a);
		expect(plan?.children ?? []).not.toContain(b);
	});

	test("accepts the parent seed id in place of the plan id", async () => {
		const { planId, parent } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "Resolved-by-parent");
		await run(["plan", "adopt", planId, adoptee], tmpDir);

		const { stdout, exitCode } = await run(["plan", "release", parent, adoptee, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { plan_id: string };
		expect(result.plan_id).toBe(planId);
	});

	test("releases a spawn-submitted child (not just adoptees)", async () => {
		// Spawn children land in plan.children with plan_id set; release detaches
		// them the same way as adoptees. Status stays open afterward.
		const { planId, parent, children } = await submitFreshPlan();
		const target = children[0];
		expect(target).toBeDefined();
		if (!target) return;

		const { exitCode } = await run(["plan", "release", planId, target], tmpDir);
		expect(exitCode).toBe(0);

		const rel = (await readIssuesRows()).find((i) => i.id === target);
		expect(rel?.plan_id).toBeUndefined();
		expect(rel?.plan_step_index).toBeUndefined();
		expect(rel?.status).toBe("open");
		expect(rel?.blocks ?? []).not.toContain(parent);

		const plan = (await readPlansRows()).find((p) => p.id === planId);
		expect(plan?.children ?? []).not.toContain(target);
	});

	test("rejects a seed not attached to any plan", async () => {
		const { planId } = await submitFreshPlan();
		const loose = await createSeed(tmpDir, "Loose seed");

		const { stderr, exitCode } = await run(["plan", "release", planId, loose], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("not attached to plan");
	});

	test("rejects a seed attached to a different plan", async () => {
		const { planId } = await submitFreshPlan();
		const otherParent = await createSeed(tmpDir, "Other parent");
		const otherPath = await writePlanFile(tmpDir, validPlanFor());
		const other = await run(["plan", "submit", otherParent, "--plan", otherPath, "--json"], tmpDir);
		expect(other.exitCode).toBe(0);
		const otherChildren = (JSON.parse(other.stdout) as { children: string[] }).children;
		const foreign = otherChildren[0];
		expect(foreign).toBeDefined();
		if (!foreign) return;

		const { stderr, exitCode } = await run(["plan", "release", planId, foreign], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("is attached to plan");
	});

	test("rejects releasing the plan's own parent seed", async () => {
		const { planId, parent } = await submitFreshPlan();
		const { stderr, exitCode } = await run(["plan", "release", planId, parent], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("cannot release the parent seed");
	});

	test("rejects a seed id that doesn't exist", async () => {
		const { planId } = await submitFreshPlan();
		const { stderr, exitCode } = await run(["plan", "release", planId, "nope-9999"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("not found");
	});

	test("rejects duplicate seed ids in args", async () => {
		const { planId } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "Once");
		await run(["plan", "adopt", planId, adoptee], tmpDir);
		const { stderr, exitCode } = await run(["plan", "release", planId, adoptee, adoptee], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Duplicate seed id");
	});

	test("rejects unknown plan id", async () => {
		const { stderr, exitCode } = await run(["plan", "release", "pl-zzzz", "seeds-1234"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Plan not found");
	});

	test("validation failure leaves issues + plans untouched (atomic batch)", async () => {
		const { planId } = await submitFreshPlan();
		const adopted = await createSeed(tmpDir, "Adopted");
		await run(["plan", "adopt", planId, adopted], tmpDir);
		// 'loose' is not attached to any plan: trips validation.
		const loose = await createSeed(tmpDir, "Loose");

		const issuesBefore = await readIssuesRows();
		const plansBefore = await readPlansRows();

		const { exitCode } = await run(["plan", "release", planId, adopted, loose], tmpDir);
		expect(exitCode).not.toBe(0);

		const issuesAfter = await readIssuesRows();
		const plansAfter = await readPlansRows();
		// adopted is still attached to the plan (validation aborted before any writes).
		expect(issuesAfter.find((i) => i.id === adopted)?.plan_id).toBe(planId);
		expect(plansAfter.find((p) => p.id === planId)?.revision).toBe(
			plansBefore.find((p) => p.id === planId)?.revision,
		);
		expect(issuesAfter.length).toBe(issuesBefore.length);
		expect(plansAfter.length).toBe(plansBefore.length);
	});

	test("human output reports the release and the new revision", async () => {
		const { planId } = await submitFreshPlan();
		const adoptee = await createSeed(tmpDir, "Adoptee");
		await run(["plan", "adopt", planId, adoptee], tmpDir);

		const { stdout, exitCode } = await run(["plan", "release", planId, adoptee], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(adoptee);
		expect(stdout).toContain("released from plan");
		expect(stdout).toContain("revision bumped to 3");
	});
});

describe("sd plan submit --overwrite", () => {
	async function readIssue(id: string): Promise<{
		id: string;
		title: string;
		status: string;
		blockedBy?: string[];
	}> {
		const issues = await readJsonl<{
			id: string;
			title: string;
			status: string;
			blockedBy?: string[];
		}>(join(tmpDir, ".seeds/issues.jsonl"));
		const found = issues.find((i) => i.id === id);
		if (!found) throw new Error(`issue not found: ${id}`);
		return found;
	}

	async function readPlanRow(planId: string): Promise<{
		id: string;
		revision: number;
		children: string[];
		sections: Record<string, unknown>;
	}> {
		const plans = await readJsonl<{
			id: string;
			revision: number;
			children: string[];
			sections: Record<string, unknown>;
		}>(join(tmpDir, ".seeds/plans.jsonl"));
		const found = plans.find((p) => p.id === planId);
		if (!found) throw new Error(`plan not found: ${planId}`);
		return found;
	}

	test("rejects re-submit without --overwrite (exit 1, expected stderr format)", async () => {
		const seedId = await createSeed(tmpDir, "Re-plan target");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);

		const second = await run(["plan", "submit", seedId, "--plan", planPath], tmpDir);
		expect(second.exitCode).not.toBe(0);
		expect(second.stderr).toMatch(/already exists for /);
		expect(second.stderr).toMatch(/Use --overwrite to replace it/);
	});

	test("--overwrite rewrites the plan row in place and bumps revision", async () => {
		const seedId = await createSeed(tmpDir, "Re-plan target");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstParsed = JSON.parse(first.stdout) as { plan_id: string; children: string[] };
		const planId = firstParsed.plan_id;

		const v2 = validPlanFor();
		const planPath2 = await writePlanFile(tmpDir, v2);
		const overwriteResult = await run(
			["plan", "submit", seedId, "--plan", planPath2, "--overwrite", "--json"],
			tmpDir,
		);
		expect(overwriteResult.exitCode).toBe(0);
		const parsed = JSON.parse(overwriteResult.stdout) as {
			plan_id: string;
			revision: number;
			overwritten: boolean;
			children: string[];
			obsolete: string[];
		};
		expect(parsed.plan_id).toBe(planId);
		expect(parsed.revision).toBe(2);
		expect(parsed.overwritten).toBe(true);

		// One row in plans.jsonl, revision=2.
		const plans = await readJsonl<{ id: string; revision: number }>(
			join(tmpDir, ".seeds/plans.jsonl"),
		);
		expect(plans.filter((p) => p.id === planId).length).toBe(1);
		expect(plans.find((p) => p.id === planId)?.revision).toBe(2);
	});

	test("revision increments on each overwrite (1 → 2 → 3)", async () => {
		const seedId = await createSeed(tmpDir, "Multi-rev");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(first.stdout) as { plan_id: string }).plan_id;

		await run(["plan", "submit", seedId, "--plan", planPath, "--overwrite", "--json"], tmpDir);
		await run(["plan", "submit", seedId, "--plan", planPath, "--overwrite", "--json"], tmpDir);

		const row = await readPlanRow(planId);
		expect(row.revision).toBe(3);
	});

	test("matched steps keep the same child IDs across overwrites", async () => {
		const seedId = await createSeed(tmpDir, "Stable IDs");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstChildren = (JSON.parse(first.stdout) as { children: string[] }).children;

		const overwriteResult = await run(
			["plan", "submit", seedId, "--plan", planPath, "--overwrite", "--json"],
			tmpDir,
		);
		const secondChildren = (JSON.parse(overwriteResult.stdout) as { children: string[] }).children;
		expect(secondChildren).toEqual(firstChildren);
	});

	test("obsolete children are listed on stderr and not auto-closed", async () => {
		const seedId = await createSeed(tmpDir, "With obsolete");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstResult = JSON.parse(first.stdout) as {
			plan_id: string;
			children: string[];
		};

		// Drop the last two steps in the new plan
		const v2 = validPlanFor();
		v2.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [2] }, // A blocks B
			{ title: "Step B", type: "task", priority: 2, blocks: [] },
		];
		const planPath2 = await writePlanFile(tmpDir, v2);
		const overwriteResult = await run(
			["plan", "submit", seedId, "--plan", planPath2, "--overwrite", "--json"],
			tmpDir,
		);
		expect(overwriteResult.exitCode).toBe(0);
		const parsed = JSON.parse(overwriteResult.stdout) as {
			plan_id: string;
			children: string[];
			obsolete: string[];
		};

		const obsoleteIds = firstResult.children.slice(2);
		expect(parsed.obsolete.sort()).toEqual([...obsoleteIds].sort());

		// Stderr suggestion lines
		for (const id of obsoleteIds) {
			expect(overwriteResult.stderr).toContain(
				`sd close ${id} --reason "obsoleted by plan ${firstResult.plan_id} revision 2"`,
			);
		}

		// Obsolete children stay open
		for (const id of obsoleteIds) {
			const issue = await readIssue(id);
			expect(issue.status).toBe("open");
		}
	});

	test("new steps spawn fresh children with proper blockedBy and plan_id", async () => {
		const seedId = await createSeed(tmpDir, "Spawn new");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstResult = JSON.parse(first.stdout) as { plan_id: string; children: string[] };

		const v2 = validPlanFor();
		v2.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [2] }, // A blocks B
			{ title: "Step B", type: "task", priority: 2, blocks: [3] }, // B blocks BNS
			{ title: "Brand New Step", type: "task", priority: 2, blocks: [] },
		];
		const planPath2 = await writePlanFile(tmpDir, v2);
		const overwriteResult = await run(
			["plan", "submit", seedId, "--plan", planPath2, "--overwrite", "--json"],
			tmpDir,
		);
		const parsed = JSON.parse(overwriteResult.stdout) as {
			plan_id: string;
			children: string[];
		};

		// First two children preserved, third is newly spawned
		expect(parsed.children[0]).toBe(firstResult.children[0]);
		expect(parsed.children[1]).toBe(firstResult.children[1]);
		const newChildId = parsed.children[2];
		expect(newChildId).toBeDefined();
		if (!newChildId) return;
		expect(firstResult.children).not.toContain(newChildId);

		const newIssue = await readJsonl<{
			id: string;
			title: string;
			plan_id?: string;
			blockedBy?: string[];
			blocks?: string[];
		}>(join(tmpDir, ".seeds/issues.jsonl"));
		const spawned = newIssue.find((i) => i.id === newChildId);
		expect(spawned?.title).toBe("Brand New Step");
		expect(spawned?.plan_id).toBe(firstResult.plan_id);
		// Forward semantics: B blocks BNS → BNS.blockedBy contains B's id.
		expect(spawned?.blockedBy).toEqual([firstResult.children[1] ?? ""]);
		// Matched B should also have its .blocks updated to include BNS.
		const matchedB = newIssue.find((i) => i.id === firstResult.children[1]);
		expect(matchedB?.blocks ?? []).toContain(newChildId);
	});

	test("parent.blockedBy drops obsolete children and reflects the new plan", async () => {
		const seedId = await createSeed(tmpDir, "Parent blockers");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstChildren = (JSON.parse(first.stdout) as { children: string[] }).children;

		// New plan keeps Step A & Step B (matched by title), drops C and D.
		const v2 = validPlanFor();
		v2.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [2] }, // A blocks B
			{ title: "Step B", type: "task", priority: 2, blocks: [] },
		];
		const planPath2 = await writePlanFile(tmpDir, v2);
		const overwriteResult = await run(
			["plan", "submit", seedId, "--plan", planPath2, "--overwrite", "--json"],
			tmpDir,
		);
		const parsed = JSON.parse(overwriteResult.stdout) as { children: string[] };

		const parent = await readIssue(seedId);
		expect(parent.blockedBy).toEqual(parsed.children);
		// Confirm we actually dropped the old C and D.
		expect(parent.blockedBy).not.toContain(firstChildren[2] ?? "");
		expect(parent.blockedBy).not.toContain(firstChildren[3] ?? "");
	});

	test("validation failure on overwrite leaves the prior plan untouched", async () => {
		const seedId = await createSeed(tmpDir, "No clobber");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(first.stdout) as { plan_id: string }).plan_id;
		const beforeRow = await readPlanRow(planId);

		const v2 = validPlanFor();
		// Force validation failure: only 1 step (min 2)
		v2.sections.steps = [{ title: "only one", type: "task", priority: 2, blocks: [] }];
		const badPath = await writePlanFile(tmpDir, v2);
		const overwriteResult = await run(
			["plan", "submit", seedId, "--plan", badPath, "--overwrite"],
			tmpDir,
		);
		expect(overwriteResult.exitCode).not.toBe(0);

		const afterRow = await readPlanRow(planId);
		expect(afterRow.revision).toBe(beforeRow.revision);
		expect(afterRow.children).toEqual(beforeRow.children);
	});
});

describe("sd plan submit --overwrite: existing_seed matching (seeds-99ae / pl-43ff)", () => {
	type IssueRow = {
		id: string;
		title: string;
		status: string;
		plan_id?: string;
		plan_step_index?: number;
		blocks?: string[];
		blockedBy?: string[];
		description?: string;
		assignee?: string;
		priority?: number;
		type?: string;
	};
	async function readIssues(): Promise<IssueRow[]> {
		return readJsonl<IssueRow>(join(tmpDir, ".seeds/issues.jsonl"));
	}

	test("existing_seed id matches a current plan-child by id (renamed step keeps the id)", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstChildren = (JSON.parse(first.stdout) as { children: string[] }).children;
		const stepAId = firstChildren[0];
		expect(stepAId).toBeDefined();
		if (!stepAId) return;

		// Step 1 changes title but pins to the same child by id.
		const v2 = validPlanFor();
		v2.sections.steps = [
			{ title: "Step A renamed", type: "task", priority: 2, blocks: [2], existing_seed: stepAId },
			{ title: "Step B", type: "task", priority: 2, blocks: [] },
		];
		const v2Path = await writePlanFile(tmpDir, v2);
		const { stdout, stderr, exitCode } = await run(
			["plan", "submit", seedId, "--plan", v2Path, "--overwrite", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { children: string[]; obsolete: string[] };
		expect(parsed.children[0]).toBe(stepAId);
		// Title divergence still warns (seed.title wins over step.title).
		expect(stderr).toContain("differs from step.title");

		const issues = await readIssues();
		const stepA = issues.find((i) => i.id === stepAId);
		// Original seed title preserved; no clobber of fields.
		expect(stepA?.title).toBe("Step A");
		// Backref refreshed to the new step index (still index 0).
		expect(stepA?.description ?? "").toContain("Step 1 of plan");
	});

	test("existing_seed precedence beats step.title when both could match", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstChildren = (JSON.parse(first.stdout) as { children: string[] }).children;
		const stepAId = firstChildren[0];
		const stepBId = firstChildren[1];
		expect(stepAId).toBeDefined();
		expect(stepBId).toBeDefined();
		if (!stepAId || !stepBId) return;

		// Step 1 has title "Step A" but pins existing_seed to Step B's id.
		// Step 2 has title "Step A" too with no existing_seed — without id
		// precedence, both steps would race for Step A by title.
		const v2 = validPlanFor();
		v2.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [], existing_seed: stepBId },
			{ title: "Step A", type: "task", priority: 2, blocks: [] },
		];
		const v2Path = await writePlanFile(tmpDir, v2);
		const { stdout, exitCode } = await run(
			["plan", "submit", seedId, "--plan", v2Path, "--overwrite", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { children: string[] };
		// Step 1 → existing_seed wins (Step B's id).
		expect(parsed.children[0]).toBe(stepBId);
		// Step 2 → title match against the still-unmatched original Step A.
		expect(parsed.children[1]).toBe(stepAId);
	});

	test("title fallback still works when no step uses existing_seed", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstChildren = (JSON.parse(first.stdout) as { children: string[] }).children;

		const overwriteResult = await run(
			["plan", "submit", seedId, "--plan", planPath, "--overwrite", "--json"],
			tmpDir,
		);
		const secondChildren = (JSON.parse(overwriteResult.stdout) as { children: string[] }).children;
		expect(secondChildren).toEqual(firstChildren);
	});

	test("external adoption via overwrite links a fresh seed into the plan", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstChildren = (JSON.parse(first.stdout) as { children: string[] }).children;
		const planId = (JSON.parse(first.stdout) as { plan_id: string }).plan_id;

		const externalSeed = await createSeed(tmpDir, "External work");

		const v2 = validPlanFor();
		v2.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [2] },
			{
				title: "External work",
				type: "task",
				priority: 2,
				blocks: [],
				existing_seed: externalSeed,
			},
		];
		const v2Path = await writePlanFile(tmpDir, v2);
		const { stdout, exitCode } = await run(
			["plan", "submit", seedId, "--plan", v2Path, "--overwrite", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { children: string[]; obsolete: string[] };
		// children[0] reused via title, children[1] reused via id (the external).
		expect(parsed.children[0]).toBe(firstChildren[0]);
		expect(parsed.children[1]).toBe(externalSeed);

		const issues = await readIssues();
		const ext = issues.find((i) => i.id === externalSeed);
		expect(ext?.plan_id).toBe(planId);
		expect(ext?.plan_step_index).toBe(1);
		// Backref applied.
		expect(ext?.description ?? "").toContain("seeds:plan-backref:start");
		// Parent-blocks edge added.
		expect(ext?.blocks ?? []).toContain(seedId);

		// Parent.blockedBy reflects the new plan; no duplicates of the
		// newly-adopted external seed even if it had been an external blocker.
		const parent = issues.find((i) => i.id === seedId);
		expect(parent?.blockedBy).toEqual(parsed.children);
	});

	test("external adoption: rejects seed already attached to another plan", async () => {
		const parentA = await createSeed(tmpDir, "Parent A");
		const planAPath = await writePlanFile(tmpDir, validPlanFor());
		const submitA = await run(["plan", "submit", parentA, "--plan", planAPath, "--json"], tmpDir);
		const planAChildren = (JSON.parse(submitA.stdout) as { children: string[] }).children;
		const attachedId = planAChildren[0];
		expect(attachedId).toBeDefined();
		if (!attachedId) return;

		const parentB = await createSeed(tmpDir, "Parent B");
		const planBPath = await writePlanFile(tmpDir, validPlanFor());
		await run(["plan", "submit", parentB, "--plan", planBPath, "--json"], tmpDir);

		const v2 = validPlanFor();
		v2.sections.steps = [
			{
				title: "Step A",
				type: "task",
				priority: 2,
				blocks: [],
				existing_seed: attachedId,
			},
			{ title: "Step B", type: "task", priority: 2, blocks: [] },
		];
		const v2Path = await writePlanFile(tmpDir, v2);
		const { stderr, exitCode } = await run(
			["plan", "submit", parentB, "--plan", v2Path, "--overwrite"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("already attached to plan");
	});

	test("external adoption: rejects closed seed", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);

		const closedSeed = await createSeed(tmpDir, "Closed work");
		await run(["close", closedSeed], tmpDir);

		const v2 = validPlanFor();
		v2.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [] },
			{
				title: "Closed work",
				type: "task",
				priority: 2,
				blocks: [],
				existing_seed: closedSeed,
			},
		];
		const v2Path = await writePlanFile(tmpDir, v2);
		const { stderr, exitCode } = await run(
			["plan", "submit", seedId, "--plan", v2Path, "--overwrite"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("is closed");
	});

	test("existing_seed validation failure on overwrite leaves prior plan untouched", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(first.stdout) as { plan_id: string }).plan_id;
		const firstChildren = (JSON.parse(first.stdout) as { children: string[] }).children;

		const v2 = validPlanFor();
		v2.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [] },
			{
				title: "Step B",
				type: "task",
				priority: 2,
				blocks: [],
				existing_seed: "nope-9999",
			},
		];
		const v2Path = await writePlanFile(tmpDir, v2);
		const { exitCode } = await run(
			["plan", "submit", seedId, "--plan", v2Path, "--overwrite"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);

		const plans = await readJsonl<{ id: string; revision: number; children: string[] }>(
			join(tmpDir, ".seeds/plans.jsonl"),
		);
		const row = plans.find((p) => p.id === planId);
		expect(row?.revision).toBe(1);
		expect(row?.children).toEqual(firstChildren);
	});
});

describe("sd plan show", () => {
	test("--json emits plan + child summaries", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const submitResult = JSON.parse(submit.stdout) as { plan_id: string; children: string[] };

		const { stdout, exitCode } = await run(
			["plan", "show", submitResult.plan_id, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as {
			plan: {
				id: string;
				status: string;
				revision: number;
				children: string[];
				reviewedBy?: string;
			};
			children: Array<{ id: string; title: string; status: string }>;
		};
		expect(result.plan.id).toBe(submitResult.plan_id);
		expect(result.plan.status).toBe("approved");
		expect(result.plan.revision).toBe(1);
		expect(result.children.length).toBe(4);
		expect(result.children[0]?.title).toBe("Step A");
		expect(result.children[0]?.status).toBe("open");
	});

	test("human output renders with review hint", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;
		const { stdout, exitCode } = await run(["plan", "show", planId], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(planId);
		expect(stdout).toContain("approved");
		expect(stdout).toContain("Review suggested");
		expect(stdout).toContain("Step A");
	});

	test("unknown plan id errors cleanly", async () => {
		const { stderr, exitCode } = await run(["plan", "show", "pl-9999"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr.toLowerCase()).toContain("not found");
	});
});

describe("sd plan show: (adopted) marker (seeds-a3ab / pl-43ff)", () => {
	test("tags submit-time adopted children and leaves fresh-spawned untagged", async () => {
		const parent = await createSeed(tmpDir, "Parent for adoption");
		const adoptee = await createSeed(tmpDir, "Step A");
		const plan = validPlanFor();
		plan.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [], existing_seed: adoptee },
			{ title: "Fresh step", type: "task", priority: 2, blocks: [] },
		];
		const planPath = await writePlanFile(tmpDir, plan);
		const submit = await run(["plan", "submit", parent, "--plan", planPath, "--json"], tmpDir);
		expect(submit.exitCode).toBe(0);
		const submitResult = JSON.parse(submit.stdout) as { plan_id: string; children: string[] };

		// Human output: adopted line carries the marker; fresh line does not.
		const human = await run(["plan", "show", submitResult.plan_id], tmpDir);
		expect(human.exitCode).toBe(0);
		const adoptedLine = human.stdout.split("\n").find((l) => l.includes(adoptee));
		const freshId = submitResult.children[1] ?? "";
		const freshLine = human.stdout.split("\n").find((l) => l.includes(freshId));
		expect(adoptedLine).toContain("(adopted)");
		expect(freshLine).toBeDefined();
		expect(freshLine).not.toContain("(adopted)");

		// --json surfaces the same signal on each child and on the plan row.
		const json = await run(["plan", "show", submitResult.plan_id, "--json"], tmpDir);
		const parsed = JSON.parse(json.stdout) as {
			plan: { adoptedChildren?: string[] };
			children: Array<{ id: string; adopted: boolean }>;
		};
		expect(parsed.plan.adoptedChildren).toEqual([adoptee]);
		expect(parsed.children.find((c) => c.id === adoptee)?.adopted).toBe(true);
		expect(parsed.children.find((c) => c.id === freshId)?.adopted).toBe(false);
	});

	test("post-submit sd plan adopt tags the seed; release strips the tag", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(["plan", "submit", parent, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;

		const adoptee = await createSeed(tmpDir, "Late arrival");
		await run(["plan", "adopt", planId, adoptee], tmpDir);

		const after = await run(["plan", "show", planId], tmpDir);
		const line = after.stdout.split("\n").find((l) => l.includes(adoptee));
		expect(line).toContain("(adopted)");

		const afterJson = await run(["plan", "show", planId, "--json"], tmpDir);
		const parsed = JSON.parse(afterJson.stdout) as {
			plan: { adoptedChildren?: string[] };
		};
		expect(parsed.plan.adoptedChildren).toEqual([adoptee]);

		// Release drops the tag (and the field, since no other adoptions remain).
		await run(["plan", "release", planId, adoptee], tmpDir);
		const released = await run(["plan", "show", planId, "--json"], tmpDir);
		const parsedReleased = JSON.parse(released.stdout) as {
			plan: { adoptedChildren?: string[] };
		};
		expect(parsedReleased.plan.adoptedChildren).toBeUndefined();
	});

	test("--overwrite preserves the (adopted) tag for surviving adopted children", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		const adoptee = await createSeed(tmpDir, "Step A");
		const plan = validPlanFor();
		plan.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [], existing_seed: adoptee },
			{ title: "Fresh", type: "task", priority: 2, blocks: [] },
		];
		const planPath = await writePlanFile(tmpDir, plan);
		const submit = await run(["plan", "submit", parent, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;

		// Overwrite: keep the adopted step (matched by existing_seed id), drop the
		// fresh sibling, add a new fresh step.
		const next = validPlanFor();
		next.sections.steps = [
			{ title: "Step A renamed", type: "task", priority: 2, blocks: [], existing_seed: adoptee },
			{ title: "Brand new fresh", type: "task", priority: 2, blocks: [] },
		];
		const nextPath = join(tmpDir, "next.json");
		await Bun.write(nextPath, JSON.stringify(next));
		const overwrite = await run(
			["plan", "submit", parent, "--plan", nextPath, "--overwrite", "--json"],
			tmpDir,
		);
		expect(overwrite.exitCode).toBe(0);

		const json = await run(["plan", "show", planId, "--json"], tmpDir);
		const parsed = JSON.parse(json.stdout) as {
			plan: { adoptedChildren?: string[] };
			children: Array<{ id: string; adopted: boolean }>;
		};
		expect(parsed.plan.adoptedChildren).toEqual([adoptee]);
		expect(parsed.children.find((c) => c.id === adoptee)?.adopted).toBe(true);
	});

	test("sd show <seed> plan block also surfaces the (adopted) tag", async () => {
		const parent = await createSeed(tmpDir, "Parent");
		const adoptee = await createSeed(tmpDir, "Step A");
		const plan = validPlanFor();
		plan.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [], existing_seed: adoptee },
			{ title: "Fresh step", type: "task", priority: 2, blocks: [] },
		];
		const planPath = await writePlanFile(tmpDir, plan);
		await run(["plan", "submit", parent, "--plan", planPath, "--json"], tmpDir);

		const { stdout, exitCode } = await run(["show", parent, "--format", "plain"], tmpDir);
		expect(exitCode).toBe(0);
		// formatIssueFull also renders a "Blocked by: ..." line that names the
		// adoptee, so scope the search to the "Plan steps" block where each
		// child gets its own line.
		const planStepsIdx = stdout.indexOf("Plan steps");
		expect(planStepsIdx).toBeGreaterThan(-1);
		const planBlock = stdout.slice(planStepsIdx);
		const line = planBlock.split("\n").find((l) => l.includes(adoptee));
		expect(line).toContain("(adopted)");
	});
});

describe("sd show <pl-id> routes to plan show (seeds-66de)", () => {
	test("human output mirrors sd plan show", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;

		const showOut = await run(["show", planId], tmpDir);
		const planShowOut = await run(["plan", "show", planId], tmpDir);
		expect(showOut.exitCode).toBe(0);
		expect(showOut.stdout).toBe(planShowOut.stdout);
		expect(showOut.stdout).toContain(planId);
		expect(showOut.stdout).toContain("Step A");
	});

	test("--json emits the plan show payload", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;

		const { stdout, exitCode } = await run(["show", planId, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as {
			success: boolean;
			command: string;
			plan: { id: string };
			children: Array<{ id: string }>;
		};
		expect(parsed.success).toBe(true);
		expect(parsed.command).toBe("plan show");
		expect(parsed.plan.id).toBe(planId);
		expect(parsed.children.length).toBe(4);
	});

	test("unknown plan id errors cleanly (no 'Issue not found')", async () => {
		const { stderr, exitCode } = await run(["show", "pl-9999"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).not.toContain("Issue not found");
		expect(stderr.toLowerCase()).toContain("plan not found");
	});

	test("unsupported --format on pl- id errors with hint", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;

		const { stderr, exitCode } = await run(["show", planId, "--format", "compact"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("not supported for plan ids");
		expect(stderr).toContain(`sd plan show ${planId}`);
	});
});

describe("sd plan show: structured list rendering (seeds-7d17)", () => {
	async function submitPlan(plan: unknown): Promise<string> {
		const seedId = await createSeed(tmpDir, "Renderer parent", "feature");
		const planPath = await writePlanFile(tmpDir, plan);
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		return (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;
	}

	test("steps render titles directly with annotated sub-lines", async () => {
		const plan = {
			template: "feature",
			sections: {
				context: VALID_CONTEXT,
				approach: "Render structured steps in a human-readable way.",
				alternatives: [],
				steps: [
					{ title: "Blocking step", type: "task", priority: 2, blocks: [2] },
					{ title: "Plain step", type: "task", priority: 2, blocks: [] },
					{
						title: "Pre-planned step",
						type: "task",
						priority: 2,
						blocks: [],
						requires_plan: true,
						plan_template: "feature",
					},
				],
				risks: [],
				acceptance: ["End-to-end works"],
			},
		};
		const planId = await submitPlan(plan);
		const { stdout, exitCode } = await run(["plan", "show", planId], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("1. Blocking step");
		expect(stdout).toContain("2. Plain step");
		expect(stdout).toContain("blocks: 2");
		expect(stdout).toContain("3. Pre-planned step");
		expect(stdout).toContain("requires_plan: true");
		expect(stdout).toContain("plan_template: feature");
		expect(stdout).not.toContain('{"title":"Blocking step"');
		expect(stdout).not.toContain('"requires_plan":true');
	});

	test("alternatives render named fields per item", async () => {
		const plan = {
			template: "feature",
			sections: {
				context: VALID_CONTEXT,
				approach: "Render list-with-item-schema sections.",
				alternatives: [
					{ name: "Personal access tokens", rejected_because: "Plaintext storage" },
					{ name: "Basic auth", rejected_because: "No revocation" },
				],
				steps: [
					{ title: "Step one", type: "task", priority: 2, blocks: [] },
					{ title: "Step two", type: "task", priority: 2, blocks: [] },
				],
				risks: [],
				acceptance: ["Works"],
			},
		};
		const planId = await submitPlan(plan);
		const { stdout, exitCode } = await run(["plan", "show", planId], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("1. name: Personal access tokens");
		expect(stdout).toContain("rejected_because: Plaintext storage");
		expect(stdout).toContain("2. name: Basic auth");
		expect(stdout).toContain("rejected_because: No revocation");
		expect(stdout).not.toContain('{"name":"Personal access tokens"');
	});

	test("custom templates with declared item schemas render through the same path", async () => {
		const cfgPath = join(tmpDir, ".seeds", "config.yaml");
		const existing = await Bun.file(cfgPath).text();
		const customBlock = [
			"plan_templates:",
			"  custom:",
			"    sections:",
			"      context:",
			"        required: true",
			"        kind: text",
			"        prompt: why",
			"      decisions:",
			"        required: true",
			"        kind: list",
			"        prompt: choices",
			"        item:",
			"          choice:",
			"            required: true",
			"            kind: text",
			"            prompt: ''",
			"          rationale:",
			"            required: true",
			"            kind: text",
			"            prompt: ''",
			"      steps:",
			"        required: true",
			"        kind: steps",
			"        min: 1",
			"        prompt: do work",
			"      acceptance:",
			"        required: true",
			"        kind: list",
			"        item: text",
			"        min: 1",
			"        prompt: done",
			"",
		].join("\n");
		await Bun.write(cfgPath, `${existing.trimEnd()}\n${customBlock}`);

		const plan = {
			template: "custom",
			sections: {
				context: "Custom-template context line that meets the prompt.",
				decisions: [{ choice: "Build it", rationale: "Cheaper than buying" }],
				steps: [{ title: "Lone step", type: "task", priority: 2, blocks: [] }],
				acceptance: ["Done"],
			},
		};
		const planId = await submitPlan(plan);
		const { stdout, exitCode } = await run(["plan", "show", planId], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("1. choice: Build it");
		expect(stdout).toContain("rationale: Cheaper than buying");
		expect(stdout).toContain("1. Lone step");
		expect(stdout).not.toContain('{"choice":"Build it"');
	});

	test("plans whose template is no longer registered fall back to JSON dump", async () => {
		const plan = {
			template: "feature",
			sections: {
				context: VALID_CONTEXT,
				approach: "Verify graceful fallback.",
				alternatives: [{ name: "Some alt", rejected_because: "Not picked" }],
				steps: [
					{ title: "Only step", type: "task", priority: 2, blocks: [] },
					{ title: "Second step", type: "task", priority: 2, blocks: [] },
				],
				risks: [],
				acceptance: ["Works"],
			},
		};
		const planId = await submitPlan(plan);

		const plansPath = join(tmpDir, ".seeds", "plans.jsonl");
		const text = await Bun.file(plansPath).text();
		const rewritten = text
			.split("\n")
			.filter((l) => l.trim())
			.map((l) => {
				const row = JSON.parse(l) as { id: string; template: string };
				if (row.id === planId) row.template = "no-such-template";
				return JSON.stringify(row);
			})
			.join("\n");
		await Bun.write(plansPath, `${rewritten}\n`);

		const { stdout, exitCode } = await run(["plan", "show", planId], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('{"name":"Some alt"');
		expect(stdout).toContain('{"title":"Only step"');
	});
});

describe("sd plan show: recursive nesting (Phase 4 / PLAN_SPEC.md:340, 425, 430)", () => {
	async function setMaxDepth(n: number): Promise<void> {
		const cfgPath = join(tmpDir, ".seeds", "config.yaml");
		const text = await Bun.file(cfgPath).text();
		const lines = text.split("\n").filter((l) => !l.startsWith("max_plan_depth:"));
		await Bun.write(cfgPath, `${lines.join("\n").trimEnd()}\nmax_plan_depth: ${n}\n`);
	}

	function planWithSubPlanStep(): { template: string; sections: Record<string, unknown> } {
		const base = validPlanFor();
		base.sections.steps = [
			// Forward semantics: epic blocks the plain task (epic must finish first).
			{
				title: "Sub-plan epic",
				type: "epic",
				priority: 1,
				plan_template: "feature",
				blocks: [2],
			},
			{ title: "Plain task", type: "task", priority: 2, blocks: [] },
		];
		return base;
	}

	test("depth-1 plan with no nested children renders unchanged (regression)", async () => {
		const seedId = await createSeed(tmpDir, "Solo");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;

		const { stdout, exitCode } = await run(["plan", "show", planId, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as {
			plan: { id: string };
			children: Array<{ id: string }>;
			children_plans: unknown[];
		};
		expect(parsed.plan.id).toBe(planId);
		expect(parsed.children.length).toBe(4);
		expect(parsed.children_plans).toEqual([]);
	});

	test("depth-2: nested plan appears in children_plans (JSON) and indented in human", async () => {
		const seedId = await createSeed(tmpDir, "Root parent");
		const rootPath = await writePlanFile(tmpDir, planWithSubPlanStep());
		const rootSubmit = await run(["plan", "submit", seedId, "--plan", rootPath, "--json"], tmpDir);
		const rootResult = JSON.parse(rootSubmit.stdout) as { plan_id: string; children: string[] };
		const childWithSubPlan = rootResult.children[0];
		expect(childWithSubPlan).toBeDefined();
		if (!childWithSubPlan) return;

		// Submit a sub-plan for the requires_plan child.
		const subPath = await writePlanFile(tmpDir, validPlanFor());
		const subSubmit = await run(
			["plan", "submit", childWithSubPlan, "--plan", subPath, "--json"],
			tmpDir,
		);
		const subPlanId = (JSON.parse(subSubmit.stdout) as { plan_id: string }).plan_id;

		// JSON form: nested plan appears under children_plans.
		const { stdout } = await run(["plan", "show", rootResult.plan_id, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as {
			plan: { id: string };
			children_plans: Array<{ plan?: { id: string }; truncated?: boolean }>;
		};
		expect(parsed.children_plans.length).toBe(1);
		const nested = parsed.children_plans[0];
		expect(nested?.truncated).toBeFalsy();
		expect(nested?.plan?.id).toBe(subPlanId);

		// Human form: nested plan id appears with indentation.
		const human = await run(["plan", "show", rootResult.plan_id], tmpDir);
		expect(human.exitCode).toBe(0);
		expect(human.stdout).toContain(subPlanId);
		expect(human.stdout).toContain("Sub-plan:");
	});

	test("max_plan_depth: 1 truncates immediately with the documented hint", async () => {
		await setMaxDepth(1);
		const seedId = await createSeed(tmpDir, "Truncation root");
		const rootPath = await writePlanFile(tmpDir, planWithSubPlanStep());
		const rootSubmit = await run(["plan", "submit", seedId, "--plan", rootPath, "--json"], tmpDir);
		const rootResult = JSON.parse(rootSubmit.stdout) as { plan_id: string; children: string[] };
		const childWithSubPlan = rootResult.children[0];
		if (!childWithSubPlan) throw new Error("missing first child");

		const subPath = await writePlanFile(tmpDir, validPlanFor());
		const subSubmit = await run(
			["plan", "submit", childWithSubPlan, "--plan", subPath, "--json"],
			tmpDir,
		);
		const subPlanId = (JSON.parse(subSubmit.stdout) as { plan_id: string }).plan_id;

		// JSON: at depth 1 the nested entry is truncated.
		const { stdout } = await run(["plan", "show", rootResult.plan_id, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as {
			children_plans: Array<{ plan_id?: string; truncated?: boolean; hint?: string }>;
		};
		expect(parsed.children_plans.length).toBe(1);
		const truncated = parsed.children_plans[0];
		expect(truncated?.truncated).toBe(true);
		expect(truncated?.plan_id).toBe(subPlanId);
		expect(truncated?.hint).toBe(
			`depth limit reached — use \`sd plan show ${subPlanId}\` to drill in`,
		);

		// Human: hint string appears once.
		const human = await run(["plan", "show", rootResult.plan_id], tmpDir);
		const occurrences = human.stdout.split(`sd plan show ${subPlanId}`).length - 1;
		expect(occurrences).toBe(1);
		expect(human.stdout).toContain("depth limit reached");
	});

	test("max_plan_depth: 2 with depth-3 nesting truncates only the third level", async () => {
		await setMaxDepth(2);
		// Build A → B → C nesting using plan_template at each level.
		const rootSeed = await createSeed(tmpDir, "Level 1 seed");
		const rootPath = await writePlanFile(tmpDir, planWithSubPlanStep());
		const rootSubmit = await run(
			["plan", "submit", rootSeed, "--plan", rootPath, "--json"],
			tmpDir,
		);
		const rootResult = JSON.parse(rootSubmit.stdout) as { plan_id: string; children: string[] };
		const level2Seed = rootResult.children[0];
		if (!level2Seed) throw new Error("level2 seed missing");

		const level2Path = await writePlanFile(tmpDir, planWithSubPlanStep());
		const level2Submit = await run(
			["plan", "submit", level2Seed, "--plan", level2Path, "--json"],
			tmpDir,
		);
		const level2Result = JSON.parse(level2Submit.stdout) as {
			plan_id: string;
			children: string[];
		};
		const level3Seed = level2Result.children[0];
		if (!level3Seed) throw new Error("level3 seed missing");

		const level3Path = await writePlanFile(tmpDir, validPlanFor());
		const level3Submit = await run(
			["plan", "submit", level3Seed, "--plan", level3Path, "--json"],
			tmpDir,
		);
		const level3PlanId = (JSON.parse(level3Submit.stdout) as { plan_id: string }).plan_id;

		const { stdout } = await run(["plan", "show", rootResult.plan_id, "--json"], tmpDir);
		type Entry = {
			plan?: { id: string };
			children_plans?: Entry[];
			truncated?: boolean;
			hint?: string;
			plan_id?: string;
		};
		const parsed = JSON.parse(stdout) as { children_plans: Entry[] };

		// Level 2 fully rendered; level 3 truncated.
		expect(parsed.children_plans.length).toBe(1);
		const lvl2 = parsed.children_plans[0];
		expect(lvl2?.truncated).toBeFalsy();
		expect(lvl2?.plan?.id).toBe(level2Result.plan_id);
		expect(lvl2?.children_plans?.length).toBe(1);
		const lvl3 = lvl2?.children_plans?.[0];
		expect(lvl3?.truncated).toBe(true);
		expect(lvl3?.plan_id).toBe(level3PlanId);
		expect(lvl3?.hint).toContain(level3PlanId);
		expect(lvl3?.hint).toContain("depth limit reached");
	});
});

describe("sd plan list", () => {
	async function submitPlan(seedTitle: string): Promise<{ planId: string; seedId: string }> {
		const seedId = await createSeed(tmpDir, seedTitle);
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { stdout } = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(stdout) as { plan_id: string }).plan_id;
		return { planId, seedId };
	}

	test("--json on empty store returns empty array", async () => {
		const { stdout, exitCode } = await run(["plan", "list", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { plans: unknown[]; count: number };
		expect(result.plans).toEqual([]);
		expect(result.count).toBe(0);
	});

	test("--json lists submitted plans", async () => {
		await submitPlan("First");
		await submitPlan("Second");
		const { stdout } = await run(["plan", "list", "--json"], tmpDir);
		const result = JSON.parse(stdout) as { count: number };
		expect(result.count).toBe(2);
	});

	test("--seed filters to that parent's plans", async () => {
		const a = await submitPlan("Plan A");
		await submitPlan("Plan B");
		const { stdout } = await run(["plan", "list", "--seed", a.seedId, "--json"], tmpDir);
		const result = JSON.parse(stdout) as { plans: Array<{ id: string; seed: string }> };
		expect(result.plans.length).toBe(1);
		expect(result.plans[0]?.seed).toBe(a.seedId);
	});

	test("--status approved matches submitted plans", async () => {
		await submitPlan("Plan X");
		const { stdout } = await run(["plan", "list", "--status", "approved", "--json"], tmpDir);
		const result = JSON.parse(stdout) as { plans: Array<{ status: string }> };
		expect(result.plans.length).toBeGreaterThan(0);
		expect(result.plans.every((p) => p.status === "approved")).toBe(true);
	});

	test("--status draft returns empty when only approved plans exist", async () => {
		await submitPlan("Plan Y");
		const { stdout } = await run(["plan", "list", "--status", "draft", "--json"], tmpDir);
		const result = JSON.parse(stdout) as { plans: unknown[] };
		expect(result.plans).toEqual([]);
	});

	test("--template feature matches", async () => {
		await submitPlan("T1");
		const { stdout } = await run(["plan", "list", "--template", "feature", "--json"], tmpDir);
		const result = JSON.parse(stdout) as { count: number };
		expect(result.count).toBeGreaterThan(0);
	});

	test("--outcome success returns empty when no outcome was set", async () => {
		await submitPlan("Z");
		const { stdout } = await run(["plan", "list", "--outcome", "success", "--json"], tmpDir);
		const result = JSON.parse(stdout) as { plans: unknown[] };
		expect(result.plans).toEqual([]);
	});

	test("combined filters: --seed + --status", async () => {
		const a = await submitPlan("Combo A");
		await submitPlan("Combo B");
		const { stdout } = await run(
			["plan", "list", "--seed", a.seedId, "--status", "approved", "--json"],
			tmpDir,
		);
		const result = JSON.parse(stdout) as { plans: Array<{ id: string }> };
		expect(result.plans.length).toBe(1);
		expect(result.plans[0]?.id).toBe(a.planId);
	});

	test("invalid --status errors cleanly", async () => {
		const { stderr, exitCode } = await run(["plan", "list", "--status", "bogus"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("--status");
	});

	test("human output shows the plan id", async () => {
		const { planId } = await submitPlan("Human");
		const { stdout, exitCode } = await run(["plan", "list"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(planId);
	});
});

describe("sd plan submit: step.plan_template (Phase 4 / PLAN_SPEC.md:329-342)", () => {
	function planWithSubPlanStep(): { template: string; sections: Record<string, unknown> } {
		const base = validPlanFor();
		base.sections.steps = [
			// Forward semantics: OAuth integration epic blocks Wire UI.
			{
				title: "OAuth integration",
				type: "epic",
				priority: 1,
				plan_template: "feature",
				blocks: [2],
			},
			{ title: "Wire UI", type: "task", priority: 2, blocks: [] },
		];
		return base;
	}

	test("step with plan_template spawns child with requires_plan and no plan_id", async () => {
		const seedId = await createSeed(tmpDir, "Parent with sub-plan step");
		const planPath = await writePlanFile(tmpDir, planWithSubPlanStep());
		const { stdout, exitCode } = await run(
			["plan", "submit", seedId, "--plan", planPath, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { plan_id: string; children: string[] };

		const issues = await readJsonl<{
			id: string;
			plan_id?: string;
			plan_step_index?: number;
			requires_plan?: boolean;
		}>(join(tmpDir, ".seeds", "issues.jsonl"));

		const subPlanChild = issues.find((i) => i.id === result.children[0]);
		const plainChild = issues.find((i) => i.id === result.children[1]);

		expect(subPlanChild?.requires_plan).toBe(true);
		expect(subPlanChild?.plan_id).toBeUndefined();
		expect(subPlanChild?.plan_step_index).toBe(0);

		// Sibling without plan_template is unchanged: plan_id back-link, no flag.
		expect(plainChild?.requires_plan).toBeUndefined();
		expect(plainChild?.plan_id).toBe(result.plan_id);
	});

	test("requires_plan child is hidden from sd ready (composes with Task 1)", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, planWithSubPlanStep());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const childIds = (JSON.parse(submit.stdout) as { children: string[] }).children;
		const subPlanChild = childIds[0];

		const { stdout: readyJson } = await run(["ready", "--json"], tmpDir);
		const ready = JSON.parse(readyJson) as { issues: Array<{ id: string }> };
		expect(ready.issues.some((i) => i.id === subPlanChild)).toBe(false);
	});

	test("sd plan prompt on the spawned child inherits plan_template from parent step", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, planWithSubPlanStep());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const childId = (JSON.parse(submit.stdout) as { children: string[] }).children[0];
		expect(childId).toBeDefined();
		if (!childId) return;

		const { stdout, exitCode } = await run(["plan", "prompt", childId, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { plan_request: { template: string; seed: string } };
		expect(parsed.plan_request.seed).toBe(childId);
		expect(parsed.plan_request.template).toBe("feature");
	});

	test("unknown plan_template name fails submit with a clear stderr message", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const bad = validPlanFor();
		bad.sections.steps = [
			{ title: "First step", type: "task", priority: 2 },
			{
				title: "Bad sub-plan ref",
				type: "epic",
				priority: 1,
				plan_template: "nonexistent",
			},
		];
		const planPath = await writePlanFile(tmpDir, bad);
		const { stderr, stdout, exitCode } = await run(
			["plan", "submit", seedId, "--plan", planPath],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr).toContain("nonexistent");
		expect(stderr).toContain("plan_templates");
		expect(stderr).toContain("Bad sub-plan ref");

		// No writes — plans.jsonl stays empty.
		const planRows = await readJsonl<unknown>(join(tmpDir, ".seeds/plans.jsonl"));
		expect(planRows.length).toBe(0);
	});
});

describe("sd plan validate", () => {
	async function submitOne(): Promise<string> {
		const seedId = await createSeed(tmpDir, "Parent for validate");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { stdout } = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		return (JSON.parse(stdout) as { plan_id: string }).plan_id;
	}

	test("valid plan passes (--json)", async () => {
		const planId = await submitOne();
		const { stdout, exitCode } = await run(["plan", "validate", planId, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { valid: boolean; plan_id: string };
		expect(result.valid).toBe(true);
		expect(result.plan_id).toBe(planId);
	});

	test("valid plan passes (human)", async () => {
		const planId = await submitOne();
		const { stdout, exitCode } = await run(["plan", "validate", planId], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(planId);
		expect(stdout.toLowerCase()).toContain("valid");
	});

	test("tampered plan emits partial-state diff to stderr", async () => {
		const planId = await submitOne();
		// Tamper: rewrite plans.jsonl removing acceptance from the only plan
		const path = join(tmpDir, ".seeds", "plans.jsonl");
		const text = await Bun.file(path).text();
		const lines = text.split("\n").filter((l) => l.trim());
		const planRow = JSON.parse(lines[0] ?? "{}");
		const { acceptance: _omit, ...restSections } = planRow.sections;
		const tampered = { ...planRow, sections: restSections };
		await Bun.write(path, `${JSON.stringify(tampered)}\n`);

		const { stderr, stdout, exitCode } = await run(["plan", "validate", planId], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		const diff = JSON.parse(stderr) as {
			errors: Array<{ path: string; code: string; fix: string }>;
			current: unknown;
		};
		expect(diff.errors.length).toBeGreaterThan(0);
		expect(diff.errors.some((e) => e.path.endsWith("acceptance") && e.code === "required")).toBe(
			true,
		);
	});

	test("unknown plan id errors cleanly", async () => {
		const { stderr, exitCode } = await run(["plan", "validate", "pl-9999"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr.toLowerCase()).toContain("not found");
	});
});

describe("plan-awareness integration: ready / show / list", () => {
	async function injectDraftPlan(seedId: string, planId = "pl-d001"): Promise<void> {
		// Phase 1's submit always writes `approved`. To exercise the draft-plan
		// surface area in ready/show/list we hand-write a draft row, which is
		// what Phase 2's prompt+approval workflow will produce naturally.
		const now = new Date().toISOString();
		const planRow = {
			id: planId,
			seed: seedId,
			template: "feature",
			status: "draft",
			revision: 1,
			sections: {},
			children: [],
			createdAt: now,
			updatedAt: now,
		};
		const planPath = join(tmpDir, ".seeds", "plans.jsonl");
		const existing = await Bun.file(planPath).text();
		await Bun.write(
			planPath,
			`${existing.trim() ? `${existing.trimEnd()}\n` : ""}${JSON.stringify(planRow)}\n`,
		);

		// Set plan_id on the seed so plan-context lookup matches.
		const issuesPath = join(tmpDir, ".seeds", "issues.jsonl");
		const issuesText = await Bun.file(issuesPath).text();
		const lines = issuesText.split("\n").filter((l) => l.trim());
		const updated = lines.map((l) => {
			const obj = JSON.parse(l) as { id: string; [k: string]: unknown };
			if (obj.id === seedId) obj.plan_id = planId;
			return JSON.stringify(obj);
		});
		await Bun.write(issuesPath, `${updated.join("\n")}\n`);
	}

	test("sd ready surfaces a seed with a draft plan and shows the hint", async () => {
		const seedId = await createSeed(tmpDir, "Needs planning");
		await injectDraftPlan(seedId);
		const { stdout: human, exitCode } = await run(["ready"], tmpDir);
		expect(exitCode).toBe(0);
		expect(human).toContain(seedId);
		expect(human).toContain("plan in draft");

		const { stdout: jsonOut } = await run(["ready", "--json"], tmpDir);
		const result = JSON.parse(jsonOut) as {
			issues: Array<{ id: string; plan_status?: string }>;
		};
		const found = result.issues.find((i) => i.id === seedId);
		expect(found?.plan_status).toBe("draft");
	});

	test("sd ready surfaces draft-plan seed even when blocked", async () => {
		const blocker = await createSeed(tmpDir, "Blocker");
		const seedId = await createSeed(tmpDir, "Blocked but planning");
		await run(["dep", "add", seedId, blocker], tmpDir);
		await injectDraftPlan(seedId);
		const { stdout: jsonOut } = await run(["ready", "--json"], tmpDir);
		const result = JSON.parse(jsonOut) as { issues: Array<{ id: string }> };
		expect(result.issues.some((i) => i.id === seedId)).toBe(true);
	});

	test("sd show displays children inline for an approved plan", async () => {
		const seedId = await createSeed(tmpDir, "Parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const submitResult = JSON.parse(submit.stdout) as { plan_id: string; children: string[] };

		const { stdout: human, exitCode } = await run(["show", seedId], tmpDir);
		expect(exitCode).toBe(0);
		expect(human).toContain(submitResult.plan_id);
		expect(human).toContain("approved");
		// At least the first child id should appear inline
		expect(human).toContain(submitResult.children[0] ?? "");

		const { stdout: jsonOut } = await run(["show", seedId, "--json"], tmpDir);
		const result = JSON.parse(jsonOut) as {
			issue: { id: string };
			plan?: { id: string; status: string; children: string[] };
			plan_children?: Array<{ id: string; title: string; status: string }>;
		};
		expect(result.plan?.id).toBe(submitResult.plan_id);
		expect(result.plan?.status).toBe("approved");
		expect(result.plan_children?.length).toBe(4);
	});

	test("sd show displays draft hint when plan is in draft", async () => {
		const seedId = await createSeed(tmpDir, "Drafter");
		await injectDraftPlan(seedId);
		const { stdout, exitCode } = await run(["show", seedId], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("plan in draft");
	});

	test("sd list shows a plan status indicator for seeds with plans", async () => {
		const planSeed = await createSeed(tmpDir, "Has plan");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		await run(["plan", "submit", planSeed, "--plan", planPath, "--json"], tmpDir);

		const { stdout: human } = await run(["list"], tmpDir);
		expect(human).toContain("[plan approved]");

		const { stdout: jsonOut } = await run(["list", "--json"], tmpDir);
		const result = JSON.parse(jsonOut) as {
			issues: Array<{ id: string; plan_status?: string; plan_children?: string[] }>;
		};
		const parent = result.issues.find((i) => i.id === planSeed);
		expect(parent?.plan_status).toBe("approved");
		expect(parent?.plan_children?.length).toBe(4);
	});

	test("sd search --json annotates seeds that have plans", async () => {
		const planSeed = await createSeed(tmpDir, "Searchable plan parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		await run(["plan", "submit", planSeed, "--plan", planPath, "--json"], tmpDir);

		const { stdout: jsonOut } = await run(["search", "Searchable", "--json"], tmpDir);
		const result = JSON.parse(jsonOut) as {
			issues: Array<{ id: string; plan_status?: string; plan_children?: string[] }>;
		};
		const parent = result.issues.find((i) => i.id === planSeed);
		expect(parent?.plan_status).toBe("approved");
		expect(parent?.plan_children?.length).toBe(4);

		const plain = await createSeed(tmpDir, "Searchable plain seed");
		const { stdout: jsonOut2 } = await run(["search", "plain", "--json"], tmpDir);
		const result2 = JSON.parse(jsonOut2) as {
			issues: Array<{ id: string; plan_status?: string }>;
		};
		const plainEntry = result2.issues.find((i) => i.id === plain);
		expect(plainEntry?.plan_status).toBeUndefined();
	});

	test("sd blocked --json annotates seeds that have plans", async () => {
		const blocker = await createSeed(tmpDir, "Blocker for plan parent");
		const planSeed = await createSeed(tmpDir, "Blocked plan parent");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		await run(["plan", "submit", planSeed, "--plan", planPath, "--json"], tmpDir);
		await run(["dep", "add", planSeed, blocker], tmpDir);

		const { stdout: jsonOut } = await run(["blocked", "--json"], tmpDir);
		const result = JSON.parse(jsonOut) as {
			issues: Array<{ id: string; plan_status?: string; plan_children?: string[] }>;
		};
		const parent = result.issues.find((i) => i.id === planSeed);
		expect(parent?.plan_status).toBe("approved");
		expect(parent?.plan_children?.length).toBe(4);

		const plainBlocker = await createSeed(tmpDir, "Plain blocker");
		const plain = await createSeed(tmpDir, "Plain blocked");
		await run(["dep", "add", plain, plainBlocker], tmpDir);
		const { stdout: jsonOut2 } = await run(["blocked", "--json"], tmpDir);
		const result2 = JSON.parse(jsonOut2) as {
			issues: Array<{ id: string; plan_status?: string }>;
		};
		const plainEntry = result2.issues.find((i) => i.id === plain);
		expect(plainEntry?.plan_status).toBeUndefined();
	});

	test("seeds without plans render exactly as before (regression)", async () => {
		const seedId = await createSeed(tmpDir, "Plain seed");
		const { stdout: human } = await run(["list"], tmpDir);
		expect(human).toContain(seedId);
		expect(human).not.toContain("[plan ");
		expect(human).not.toContain("plan in draft");

		const { stdout: jsonOut } = await run(["list", "--json"], tmpDir);
		const result = JSON.parse(jsonOut) as {
			issues: Array<{ id: string; plan_status?: string }>;
		};
		const seed = result.issues.find((i) => i.id === seedId);
		expect(seed?.plan_status).toBeUndefined();
	});
});

async function submitPlanFor(seedId: string): Promise<string> {
	const planPath = await writePlanFile(tmpDir, validPlanFor());
	const { stdout } = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
	return (JSON.parse(stdout) as { plan_id: string }).plan_id;
}

async function readPlansFromDisk(): Promise<
	Array<{ id: string; outcome?: string; outcomeNote?: string; reviewedBy?: string }>
> {
	const path = join(tmpDir, ".seeds", "plans.jsonl");
	const text = await Bun.file(path).text();
	return text
		.split("\n")
		.filter((l) => l.trim())
		.map((l) => JSON.parse(l));
}

describe("sd plan outcome (Phase 5 / PLAN_SPEC.md:393-402)", () => {
	test("--result success persists outcome on the plan row", async () => {
		const seed = await createSeed(tmpDir, "Outcome target");
		const planId = await submitPlanFor(seed);
		const { stdout, exitCode } = await run(
			["plan", "outcome", planId, "--result", "success", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { outcome: string; plan_id: string };
		expect(result.outcome).toBe("success");
		expect(result.plan_id).toBe(planId);
		const plans = await readPlansFromDisk();
		const stored = plans.find((p) => p.id === planId);
		expect(stored?.outcome).toBe("success");
		expect(stored?.outcomeNote).toBeUndefined();
	});

	test("--result partial --note persists both fields", async () => {
		const seed = await createSeed(tmpDir, "With note");
		const planId = await submitPlanFor(seed);
		const { exitCode } = await run(
			[
				"plan",
				"outcome",
				planId,
				"--result",
				"partial",
				"--note",
				"auth provider deprecated",
				"--json",
			],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const stored = (await readPlansFromDisk()).find((p) => p.id === planId);
		expect(stored?.outcome).toBe("partial");
		expect(stored?.outcomeNote).toBe("auth provider deprecated");
	});

	test("rejects an invalid --result value with non-zero exit", async () => {
		const seed = await createSeed(tmpDir, "Bad result");
		const planId = await submitPlanFor(seed);
		const { stderr, exitCode } = await run(["plan", "outcome", planId, "--result", "wat"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --result value");
		expect(stderr).toContain("Valid: success|partial|failure");
	});

	test("warns (does not fail) when children are still open", async () => {
		const seed = await createSeed(tmpDir, "Has open children");
		const planId = await submitPlanFor(seed);
		const { stderr, exitCode } = await run(
			["plan", "outcome", planId, "--result", "failure", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		expect(stderr).toMatch(/open child/);
	});

	test("unknown plan id errors cleanly", async () => {
		const { stderr, exitCode } = await run(
			["plan", "outcome", "pl-9999", "--result", "success"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr.toLowerCase()).toContain("not found");
	});

	test("--json includes outcome on success", async () => {
		const seed = await createSeed(tmpDir, "Plain JSON");
		const planId = await submitPlanFor(seed);
		const { stdout } = await run(
			["plan", "outcome", planId, "--result", "success", "--json"],
			tmpDir,
		);
		const parsed = JSON.parse(stdout) as { success: boolean; outcome: string };
		expect(parsed.success).toBe(true);
		expect(parsed.outcome).toBe("success");
	});
});

describe("sd plan review (Phase 5 / PLAN_SPEC.md:404-413)", () => {
	test("--by sets reviewedBy and is informational only", async () => {
		const seed = await createSeed(tmpDir, "Reviewed");
		const planId = await submitPlanFor(seed);
		const { stdout, exitCode } = await run(
			["plan", "review", planId, "--by", "alice", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { reviewedBy: string };
		expect(parsed.reviewedBy).toBe("alice");
		const stored = (await readPlansFromDisk()).find((p) => p.id === planId);
		expect(stored?.reviewedBy).toBe("alice");
	});

	test("show hint appears on approved plan with no reviewer", async () => {
		const seed = await createSeed(tmpDir, "Approved no review");
		const planId = await submitPlanFor(seed);
		const { stdout, exitCode } = await run(["plan", "show", planId], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Review suggested");
	});

	test("show hint disappears once reviewedBy is set", async () => {
		const seed = await createSeed(tmpDir, "Approved + reviewer");
		const planId = await submitPlanFor(seed);
		await run(["plan", "review", planId, "--by", "bob"], tmpDir);
		const { stdout } = await run(["plan", "show", planId], tmpDir);
		expect(stdout).not.toContain("Review suggested");
		expect(stdout).toContain("Reviewed: bob");
	});

	test("show hint absent for draft plans", async () => {
		const seed = await createSeed(tmpDir, "Drafty");
		// Inject a draft plan directly so we cover the status=draft branch.
		const now = new Date().toISOString();
		const planRow = {
			id: "pl-d100",
			seed,
			template: "feature",
			status: "draft",
			revision: 1,
			sections: {},
			children: [],
			createdAt: now,
			updatedAt: now,
		};
		const planPath = join(tmpDir, ".seeds", "plans.jsonl");
		const existing = await Bun.file(planPath).text();
		await Bun.write(
			planPath,
			`${existing.trim() ? `${existing.trimEnd()}\n` : ""}${JSON.stringify(planRow)}\n`,
		);
		const { stdout, exitCode } = await run(["plan", "show", "pl-d100"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).not.toContain("Review suggested");
	});

	test("show hint absent for active plans once reviewer set, present without reviewer", async () => {
		// Submit + close one child to flip approved → active.
		const seed = await createSeed(tmpDir, "Active path");
		const planId = await submitPlanFor(seed);
		const showJson = await run(["plan", "show", planId, "--json"], tmpDir);
		const childIds = (
			JSON.parse(showJson.stdout) as { children: Array<{ id: string }> }
		).children.map((c) => c.id);
		const firstChild = childIds[0];
		if (!firstChild) throw new Error("no children");
		await run(["update", firstChild, "--status", "in_progress"], tmpDir);

		const { stdout: humanOutput } = await run(["plan", "show", planId], tmpDir);
		expect(humanOutput).toContain("active");
		expect(humanOutput).toContain("Review suggested");

		await run(["plan", "review", planId, "--by", "carol"], tmpDir);
		const { stdout: afterReview } = await run(["plan", "show", planId], tmpDir);
		expect(afterReview).toContain("Reviewed: carol");
		expect(afterReview).not.toContain("Review suggested");
	});

	test("--json show includes reviewedBy without the cosmetic hint", async () => {
		const seed = await createSeed(tmpDir, "JSON review");
		const planId = await submitPlanFor(seed);
		await run(["plan", "review", planId, "--by", "dora"], tmpDir);
		const { stdout } = await run(["plan", "show", planId, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as { plan: { reviewedBy?: string } };
		expect(parsed.plan.reviewedBy).toBe("dora");
		expect(stdout).not.toContain("Review suggested");
	});

	test("unknown plan id errors cleanly", async () => {
		const { stderr, exitCode } = await run(["plan", "review", "pl-9999", "--by", "ghost"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr.toLowerCase()).toContain("not found");
	});
});

const VALID_REPRO =
	"On master, run `bun test src/foo.test.ts`; the third assertion fails on Linux but passes on macOS.";
const VALID_ROOT_CAUSE =
	"Path comparison in src/foo.ts assumes case-insensitive matching; Linux is case-sensitive.";

function validBugPlan(): { template: string; sections: Record<string, unknown> } {
	return {
		template: "bug",
		sections: {
			context: "Affects CI on Linux runners.",
			reproduction: VALID_REPRO,
			root_cause: VALID_ROOT_CAUSE,
			approach: "Normalize both sides to lowercase before comparing.",
			steps: [
				{ title: "Add lowercasing helper", type: "task", priority: 2, blocks: [2] },
				{ title: "Wire through caller", type: "task", priority: 2, blocks: [] },
			],
			acceptance: ["Regression test passes on Linux"],
		},
	};
}

const VALID_INVARIANT =
	"Public API of src/foo.ts (exported function names + signatures) and observable behavior (return values, errors) MUST match before and after.";

function validRefactorPlan(): { template: string; sections: Record<string, unknown> } {
	return {
		template: "refactor",
		sections: {
			context: "Module has grown unwieldy and obscures intent.",
			behavior_invariant: VALID_INVARIANT,
			approach: "Split into pure helpers + thin orchestrator.",
			steps: [{ title: "Extract helpers", type: "task", priority: 2, blocks: [] }],
			acceptance: ["All existing tests pass unchanged"],
		},
	};
}

describe("sd plan: built-in bug template (Phase 5 / PLAN_SPEC.md:268)", () => {
	test("sd plan templates lists bug", async () => {
		const { stdout } = await run(["plan", "templates"], tmpDir);
		expect(stdout).toContain("bug");
	});

	test("inference: bug-typed seed picks the bug template", async () => {
		const seed = await createSeed(tmpDir, "Bug seed", "bug");
		const { stdout } = await run(["plan", "prompt", seed, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as { plan_request: { template: string } };
		expect(parsed.plan_request.template).toBe("bug");
	});

	test("inference: task-typed seed still picks feature (regression)", async () => {
		const seed = await createSeed(tmpDir, "Plain task", "task");
		const { stdout } = await run(["plan", "prompt", seed, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as { plan_request: { template: string } };
		expect(parsed.plan_request.template).toBe("feature");
	});

	test("submit golden path: full bug plan validates and spawns children", async () => {
		const seed = await createSeed(tmpDir, "Repro this", "bug");
		const planPath = await writePlanFile(tmpDir, validBugPlan());
		const { stdout, exitCode } = await run(
			["plan", "submit", seed, "--plan", planPath, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { plan_id: string; children: string[] };
		expect(parsed.children.length).toBe(2);
		const plans = await readPlansFromDisk();
		expect(plans.find((p) => p.id === parsed.plan_id)).toBeDefined();
	});

	test("validation: missing reproduction → diff lists it", async () => {
		const seed = await createSeed(tmpDir, "Bad bug", "bug");
		const plan = validBugPlan();
		const sections = plan.sections as Record<string, unknown>;
		delete sections.reproduction;
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", seed, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("reproduction");
	});

	test("validation: short reproduction → min_length error", async () => {
		const seed = await createSeed(tmpDir, "Short repro", "bug");
		const plan = validBugPlan();
		(plan.sections as Record<string, unknown>).reproduction = "too short";
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", seed, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("reproduction");
	});

	test("validation: short root_cause → min_length error", async () => {
		const seed = await createSeed(tmpDir, "Short cause", "bug");
		const plan = validBugPlan();
		(plan.sections as Record<string, unknown>).root_cause = "obvious";
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", seed, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("root_cause");
	});

	test("validation: empty steps and empty acceptance both rejected", async () => {
		const seed = await createSeed(tmpDir, "Empty arrays", "bug");
		const plan = validBugPlan();
		(plan.sections as Record<string, unknown>).steps = [];
		(plan.sections as Record<string, unknown>).acceptance = [];
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", seed, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("steps");
		expect(stderr).toContain("acceptance");
	});

	test("override: project config wins over built-in bug template", async () => {
		const cfgPath = join(tmpDir, ".seeds", "config.yaml");
		const text = await Bun.file(cfgPath).text();
		await Bun.write(
			cfgPath,
			`${text.trimEnd()}\nplan_templates:\n  bug:\n    sections:\n      summary:\n        required: true\n        kind: text\n        prompt: "Tiny bug summary"\n      steps:\n        required: true\n        kind: steps\n        min: 1\n        prompt: "Steps"\n`,
		);
		const seed = await createSeed(tmpDir, "Override bug", "bug");
		const { stdout } = await run(["plan", "prompt", seed, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as {
			plan_request: { template: string; sections: Array<{ name: string }> };
		};
		const names = parsed.plan_request.sections.map((s) => s.name);
		expect(names).toContain("summary");
		expect(names).not.toContain("reproduction");
	});
});

describe("sd plan: built-in refactor template (Phase 5 / PLAN_SPEC.md:269)", () => {
	test("sd plan templates lists refactor", async () => {
		const { stdout } = await run(["plan", "templates"], tmpDir);
		expect(stdout).toContain("refactor");
	});

	test("--template refactor accepts a task-typed seed", async () => {
		const seed = await createSeed(tmpDir, "Refactor candidate", "task");
		const { stdout, exitCode } = await run(
			["plan", "prompt", seed, "--template", "refactor", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as {
			plan_request: { template: string; sections: Array<{ name: string }> };
		};
		expect(parsed.plan_request.template).toBe("refactor");
		expect(parsed.plan_request.sections.map((s) => s.name)).toContain("behavior_invariant");
	});

	test("inference: task-typed seed without --template picks feature, NOT refactor", async () => {
		const seed = await createSeed(tmpDir, "No refactor inference", "task");
		const { stdout } = await run(["plan", "prompt", seed, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as { plan_request: { template: string } };
		expect(parsed.plan_request.template).toBe("feature");
		expect(parsed.plan_request.template).not.toBe("refactor");
	});

	test("submit golden path: full refactor plan validates", async () => {
		const seed = await createSeed(tmpDir, "Refactor plan", "task");
		const planPath = await writePlanFile(tmpDir, validRefactorPlan());
		const { exitCode } = await run(["plan", "submit", seed, "--plan", planPath, "--json"], tmpDir);
		expect(exitCode).toBe(0);
	});

	test("validation: missing behavior_invariant → diff lists it", async () => {
		const seed = await createSeed(tmpDir, "No invariant", "task");
		const plan = validRefactorPlan();
		delete (plan.sections as Record<string, unknown>).behavior_invariant;
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", seed, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("behavior_invariant");
	});

	test("validation: short behavior_invariant → min_length error", async () => {
		const seed = await createSeed(tmpDir, "Short invariant", "task");
		const plan = validRefactorPlan();
		(plan.sections as Record<string, unknown>).behavior_invariant = "stays the same";
		const planPath = await writePlanFile(tmpDir, plan);
		const { stderr, exitCode } = await run(["plan", "submit", seed, "--plan", planPath], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("behavior_invariant");
	});

	test("default refactor template has no risks section", async () => {
		const seed = await createSeed(tmpDir, "Refactor sections", "task");
		const { stdout } = await run(
			["plan", "prompt", seed, "--template", "refactor", "--json"],
			tmpDir,
		);
		const parsed = JSON.parse(stdout) as {
			plan_request: { sections: Array<{ name: string }> };
		};
		const names = parsed.plan_request.sections.map((s) => s.name);
		expect(names).not.toContain("risks");
	});

	test("override: project config wins over built-in refactor template", async () => {
		const cfgPath = join(tmpDir, ".seeds", "config.yaml");
		const text = await Bun.file(cfgPath).text();
		await Bun.write(
			cfgPath,
			`${text.trimEnd()}\nplan_templates:\n  refactor:\n    sections:\n      goal:\n        required: true\n        kind: text\n        prompt: "Goal"\n      steps:\n        required: true\n        kind: steps\n        min: 1\n        prompt: "Steps"\n`,
		);
		const seed = await createSeed(tmpDir, "Override refactor", "task");
		const { stdout } = await run(
			["plan", "prompt", seed, "--template", "refactor", "--json"],
			tmpDir,
		);
		const parsed = JSON.parse(stdout) as {
			plan_request: { sections: Array<{ name: string }> };
		};
		const names = parsed.plan_request.sections.map((s) => s.name);
		expect(names).toContain("goal");
		expect(names).not.toContain("behavior_invariant");
	});
});

describe("sd plan submit: child backref block (seeds-76af)", () => {
	type IssueRow = {
		id: string;
		title: string;
		description?: string;
		assignee?: string;
		labels?: string[];
		updatedAt: string;
	};

	async function readIssueRow(id: string): Promise<IssueRow> {
		const issues = await readJsonl<IssueRow>(join(tmpDir, ".seeds/issues.jsonl"));
		const found = issues.find((i) => i.id === id);
		if (!found) throw new Error(`issue not found: ${id}`);
		return found;
	}

	test("fresh submit populates each child description with backref fields", async () => {
		const seedId = await createSeed(tmpDir, "Add OAuth2 device-flow authentication");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const result = JSON.parse(submit.stdout) as { plan_id: string; children: string[] };

		const childB = await readIssueRow(result.children[1] ?? "");
		expect(childB.description).toBeDefined();
		const desc = childB.description ?? "";
		expect(desc).toContain("seeds:plan-backref:start");
		expect(desc).toContain(`Step 2 of plan ${result.plan_id}.`);
		expect(desc).toContain(`Parent seed: ${seedId} — Add OAuth2 device-flow authentication`);
		expect(desc).toContain("Plan template: feature");
		expect(desc).toContain("Plan approach: Hardcoded TS template + AJV schema");
		expect(desc).toContain(`Run \`sd plan show ${result.plan_id}\``);
	});

	test("plan_template children also receive a backref", async () => {
		const seedId = await createSeed(tmpDir, "Parent seed", "feature");
		const plan = validPlanFor();
		plan.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [] },
			{
				title: "Pre-planned step",
				type: "task",
				priority: 2,
				blocks: [],
				plan_template: "feature",
			},
		];
		const planPath = await writePlanFile(tmpDir, plan);
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const result = JSON.parse(submit.stdout) as { plan_id: string; children: string[] };
		const subChild = await readIssueRow(result.children[1] ?? "");
		expect(subChild.description ?? "").toContain(`Step 2 of plan ${result.plan_id}.`);
	});

	test("--overwrite refreshes the backref on retained children when approach changes", async () => {
		const seedId = await createSeed(tmpDir, "Stable IDs");
		const v1 = validPlanFor();
		v1.sections.approach = "Original approach for revision 1.";
		const planPath = await writePlanFile(tmpDir, v1);
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstResult = JSON.parse(first.stdout) as { plan_id: string; children: string[] };
		const childId = firstResult.children[0] ?? "";
		const before = await readIssueRow(childId);
		expect(before.description ?? "").toContain("Plan approach: Original approach for revision 1.");

		const v2 = validPlanFor();
		v2.sections.approach = "Revised approach for revision 2.";
		const planPath2 = await writePlanFile(tmpDir, v2);
		await run(["plan", "submit", seedId, "--plan", planPath2, "--overwrite", "--json"], tmpDir);

		const after = await readIssueRow(childId);
		expect(after.description ?? "").toContain("Plan approach: Revised approach for revision 2.");
		expect(after.description ?? "").not.toContain("Original approach for revision 1.");
	});

	test("--overwrite preserves assignee and labels on retained children", async () => {
		const seedId = await createSeed(tmpDir, "Preserve fields");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstResult = JSON.parse(first.stdout) as { plan_id: string; children: string[] };
		const childId = firstResult.children[0] ?? "";

		await run(["update", childId, "--assignee", "alice"], tmpDir);
		await run(["label", "add", childId, "needs-design"], tmpDir);

		const beforeOverwrite = await readIssueRow(childId);
		expect(beforeOverwrite.assignee).toBe("alice");
		expect(beforeOverwrite.labels).toEqual(["needs-design"]);

		const v2 = validPlanFor();
		v2.sections.approach = "Revised approach for retention test.";
		const planPath2 = await writePlanFile(tmpDir, v2);
		const overwrite = await run(
			["plan", "submit", seedId, "--plan", planPath2, "--overwrite", "--json"],
			tmpDir,
		);
		expect(overwrite.exitCode).toBe(0);

		const after = await readIssueRow(childId);
		expect(after.assignee).toBe("alice");
		expect(after.labels).toEqual(["needs-design"]);
		expect(after.description ?? "").toContain(
			"Plan approach: Revised approach for retention test.",
		);
	});

	test("newly spawned children during overwrite get a fresh backref", async () => {
		const seedId = await createSeed(tmpDir, "Spawn fresh on overwrite");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const firstResult = JSON.parse(first.stdout) as { plan_id: string; children: string[] };

		const v2 = validPlanFor();
		v2.sections.steps = [
			{ title: "Step A", type: "task", priority: 2, blocks: [2] }, // A blocks B
			{ title: "Step B", type: "task", priority: 2, blocks: [3] }, // B blocks BNS
			{ title: "Brand New Step", type: "task", priority: 2, blocks: [] },
		];
		const planPath2 = await writePlanFile(tmpDir, v2);
		const overwrite = await run(
			["plan", "submit", seedId, "--plan", planPath2, "--overwrite", "--json"],
			tmpDir,
		);
		const result = JSON.parse(overwrite.stdout) as { children: string[] };
		const newChildId = result.children[2] ?? "";
		expect(firstResult.children).not.toContain(newChildId);

		const spawned = await readIssueRow(newChildId);
		expect(spawned.description ?? "").toContain(`Step 3 of plan ${firstResult.plan_id}.`);
		expect(spawned.description ?? "").toContain("Parent seed:");
	});
});

describe("sd show on plan-spawned seeds", () => {
	test("labels the plan's step list as 'Plan steps', not 'Children'", async () => {
		const seedId = await createSeed(tmpDir, "Parent for show heading");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		expect(submit.exitCode).toBe(0);
		const { children } = JSON.parse(submit.stdout) as { children: string[] };
		const childId = children[0];
		expect(childId).toBeDefined();

		const { stdout, exitCode } = await run(["show", childId ?? "", "--format", "plain"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(`Plan steps (${children.length}):`);
		expect(stdout).not.toContain("Children (");
	});

	test("sd plan show keeps 'Children' framing", async () => {
		const seedId = await createSeed(tmpDir, "Parent for plan-show heading");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		expect(submit.exitCode).toBe(0);
		const { plan_id, children } = JSON.parse(submit.stdout) as {
			plan_id: string;
			children: string[];
		};

		const { stdout, exitCode } = await run(["plan", "show", plan_id], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(`Children (${children.length}):`);
	});
});

describe("sd plan {show,validate,outcome,review}: accept seed id (seeds-51bc)", () => {
	async function setup(): Promise<{
		seedWithPlan: string;
		planId: string;
		seedNoPlan: string;
	}> {
		const seedWithPlan = await createSeed(tmpDir, "Has plan");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const submit = await run(
			["plan", "submit", seedWithPlan, "--plan", planPath, "--json"],
			tmpDir,
		);
		const planId = (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;
		const seedNoPlan = await createSeed(tmpDir, "No plan");
		return { seedWithPlan, planId, seedNoPlan };
	}

	test("show: pl-id works (regression)", async () => {
		const { planId } = await setup();
		const { stdout, exitCode } = await run(["plan", "show", planId, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { plan: { id: string } };
		expect(parsed.plan.id).toBe(planId);
	});

	test("show: seed-id resolves through seed.plan_id", async () => {
		const { seedWithPlan, planId } = await setup();
		const { stdout, exitCode } = await run(["plan", "show", seedWithPlan, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { plan: { id: string; seed: string } };
		expect(parsed.plan.id).toBe(planId);
		expect(parsed.plan.seed).toBe(seedWithPlan);
	});

	test("show: seed without a plan errors with submit hint", async () => {
		const { seedNoPlan } = await setup();
		const { stderr, exitCode } = await run(["plan", "show", seedNoPlan], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain(`Seed ${seedNoPlan} has no plan`);
		expect(stderr).toContain(`sd plan submit ${seedNoPlan}`);
	});

	test("show: unknown id errors cleanly", async () => {
		const { stderr, exitCode } = await run(["plan", "show", "nope-9999"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr.toLowerCase()).toContain("not found");
	});

	test("validate: pl-id works (regression)", async () => {
		const { planId } = await setup();
		const { stdout, exitCode } = await run(["plan", "validate", planId, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { valid: boolean; plan_id: string };
		expect(parsed.valid).toBe(true);
		expect(parsed.plan_id).toBe(planId);
	});

	test("validate: seed-id resolves through seed.plan_id", async () => {
		const { seedWithPlan, planId } = await setup();
		const { stdout, exitCode } = await run(["plan", "validate", seedWithPlan, "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { valid: boolean; plan_id: string };
		expect(parsed.valid).toBe(true);
		expect(parsed.plan_id).toBe(planId);
	});

	test("validate: seed without a plan errors with submit hint", async () => {
		const { seedNoPlan } = await setup();
		const { stderr, exitCode } = await run(["plan", "validate", seedNoPlan], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain(`Seed ${seedNoPlan} has no plan`);
		expect(stderr).toContain(`sd plan submit ${seedNoPlan}`);
	});

	test("validate: unknown id errors cleanly", async () => {
		const { stderr, exitCode } = await run(["plan", "validate", "nope-9999"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr.toLowerCase()).toContain("not found");
	});

	test("outcome: pl-id works (regression)", async () => {
		const { planId } = await setup();
		const { stdout, exitCode } = await run(
			["plan", "outcome", planId, "--result", "success", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { plan_id: string; outcome: string };
		expect(parsed.plan_id).toBe(planId);
		expect(parsed.outcome).toBe("success");
	});

	test("outcome: seed-id resolves through seed.plan_id", async () => {
		const { seedWithPlan, planId } = await setup();
		const { stdout, exitCode } = await run(
			["plan", "outcome", seedWithPlan, "--result", "success", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { plan_id: string; outcome: string };
		expect(parsed.plan_id).toBe(planId);
		expect(parsed.outcome).toBe("success");
	});

	test("outcome: seed without a plan errors with submit hint", async () => {
		const { seedNoPlan } = await setup();
		const { stderr, exitCode } = await run(
			["plan", "outcome", seedNoPlan, "--result", "success"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain(`Seed ${seedNoPlan} has no plan`);
		expect(stderr).toContain(`sd plan submit ${seedNoPlan}`);
	});

	test("outcome: unknown id errors cleanly", async () => {
		const { stderr, exitCode } = await run(
			["plan", "outcome", "nope-9999", "--result", "success"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr.toLowerCase()).toContain("not found");
	});

	test("review: pl-id works (regression)", async () => {
		const { planId } = await setup();
		const { stdout, exitCode } = await run(
			["plan", "review", planId, "--by", "alice", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { plan_id: string; reviewedBy: string };
		expect(parsed.plan_id).toBe(planId);
		expect(parsed.reviewedBy).toBe("alice");
	});

	test("review: seed-id resolves through seed.plan_id", async () => {
		const { seedWithPlan, planId } = await setup();
		const { stdout, exitCode } = await run(
			["plan", "review", seedWithPlan, "--by", "alice", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { plan_id: string; reviewedBy: string };
		expect(parsed.plan_id).toBe(planId);
		expect(parsed.reviewedBy).toBe("alice");
	});

	test("review: seed without a plan errors with submit hint", async () => {
		const { seedNoPlan } = await setup();
		const { stderr, exitCode } = await run(["plan", "review", seedNoPlan, "--by", "alice"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain(`Seed ${seedNoPlan} has no plan`);
		expect(stderr).toContain(`sd plan submit ${seedNoPlan}`);
	});

	test("review: unknown id errors cleanly", async () => {
		const { stderr, exitCode } = await run(
			["plan", "review", "nope-9999", "--by", "alice"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr.toLowerCase()).toContain("not found");
	});
});

describe("sd plan: name field (seeds-5640)", () => {
	async function submitWithArgs(
		seedTitle: string,
		extraArgs: string[] = [],
		plan: unknown = validPlanFor(),
	): Promise<{ seedId: string; planId: string }> {
		const seedId = await createSeed(tmpDir, seedTitle);
		const planPath = await writePlanFile(tmpDir, plan);
		const { stdout, exitCode, stderr } = await run(
			["plan", "submit", seedId, "--plan", planPath, "--json", ...extraArgs],
			tmpDir,
		);
		if (exitCode !== 0) throw new Error(`submit failed: ${stderr}`);
		const planId = (JSON.parse(stdout) as { plan_id: string }).plan_id;
		return { seedId, planId };
	}

	async function readPlan(planId: string): Promise<{ id: string; name?: string }> {
		const plans = await readJsonl<{ id: string; name?: string }>(
			join(tmpDir, ".seeds/plans.jsonl"),
		);
		const found = plans.find((p) => p.id === planId);
		if (!found) throw new Error(`plan not found: ${planId}`);
		return found;
	}

	test("submit defaults plan.name to the parent seed's title", async () => {
		const { planId } = await submitWithArgs("Schema-driven config editor");
		const plan = await readPlan(planId);
		expect(plan.name).toBe("Schema-driven config editor");
	});

	test("--name overrides the seed-title default", async () => {
		const { planId } = await submitWithArgs("Plain seed", ["--name", "OAuth provider wiring"]);
		const plan = await readPlan(planId);
		expect(plan.name).toBe("OAuth provider wiring");
	});

	test("plan JSON top-level name is read when --name is absent", async () => {
		const planWithName = { ...validPlanFor(), name: "Token refresh race fix" };
		const { planId } = await submitWithArgs("Some seed title", [], planWithName);
		const plan = await readPlan(planId);
		expect(plan.name).toBe("Token refresh race fix");
	});

	test("--name beats the plan JSON name", async () => {
		const planWithName = { ...validPlanFor(), name: "JSON-supplied name" };
		const { planId } = await submitWithArgs(
			"Seed title",
			["--name", "Flag-supplied name"],
			planWithName,
		);
		const plan = await readPlan(planId);
		expect(plan.name).toBe("Flag-supplied name");
	});

	test("empty / whitespace name in plan JSON falls back to seed title", async () => {
		const planWithBlankName = { ...validPlanFor(), name: "   " };
		const { planId } = await submitWithArgs("Fallback title", [], planWithBlankName);
		const plan = await readPlan(planId);
		expect(plan.name).toBe("Fallback title");
	});

	test("--overwrite preserves existing name when neither flag nor JSON supplies one", async () => {
		const seedId = await createSeed(tmpDir, "Original seed title");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(
			["plan", "submit", seedId, "--plan", planPath, "--name", "Locked-in name", "--json"],
			tmpDir,
		);
		const planId = (JSON.parse(first.stdout) as { plan_id: string }).plan_id;

		const planPath2 = await writePlanFile(tmpDir, validPlanFor());
		await run(["plan", "submit", seedId, "--plan", planPath2, "--overwrite", "--json"], tmpDir);
		const plan = await readPlan(planId);
		expect(plan.name).toBe("Locked-in name");
	});

	test("--overwrite with --name updates the name", async () => {
		const seedId = await createSeed(tmpDir, "First name");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
		const planId = (JSON.parse(first.stdout) as { plan_id: string }).plan_id;

		const planPath2 = await writePlanFile(tmpDir, validPlanFor());
		await run(
			[
				"plan",
				"submit",
				seedId,
				"--plan",
				planPath2,
				"--overwrite",
				"--name",
				"Renamed plan",
				"--json",
			],
			tmpDir,
		);
		const plan = await readPlan(planId);
		expect(plan.name).toBe("Renamed plan");
	});

	test("plan show surfaces the name in human output and --json payload", async () => {
		const { planId } = await submitWithArgs("Human-readable plan name");

		const { stdout: human } = await run(["plan", "show", planId], tmpDir);
		expect(human).toContain("Name:");
		expect(human).toContain("Human-readable plan name");

		const { stdout: jsonOut } = await run(["plan", "show", planId, "--json"], tmpDir);
		const parsed = JSON.parse(jsonOut) as { plan: { name?: string } };
		expect(parsed.plan.name).toBe("Human-readable plan name");
	});

	test("plan list surfaces the name in human output", async () => {
		await submitWithArgs("Wire greenhouse → overstory handoff");
		const { stdout, exitCode } = await run(["plan", "list"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Wire greenhouse");
	});

	test("plan list --json includes the name field", async () => {
		const { planId } = await submitWithArgs("Plan with JSON name");
		const { stdout } = await run(["plan", "list", "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as { plans: Array<{ id: string; name?: string }> };
		const row = parsed.plans.find((p) => p.id === planId);
		expect(row?.name).toBe("Plan with JSON name");
	});
});

describe("sd plan edit (seeds-9b12 / pl-dee8 step 1): --name", () => {
	async function submit(
		seedTitle = "Editable seed",
	): Promise<{ seedId: string; planId: string; revision: number }> {
		const seedId = await createSeed(tmpDir, seedTitle);
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { stdout, exitCode, stderr } = await run(
			["plan", "submit", seedId, "--plan", planPath, "--json"],
			tmpDir,
		);
		if (exitCode !== 0) throw new Error(`submit failed: ${stderr}`);
		const parsed = JSON.parse(stdout) as { plan_id: string; revision: number };
		return { seedId, planId: parsed.plan_id, revision: parsed.revision };
	}

	async function readPlanRow(
		planId: string,
	): Promise<{ id: string; name?: string; revision: number; updatedAt: string }> {
		const plans = await readJsonl<{
			id: string;
			name?: string;
			revision: number;
			updatedAt: string;
		}>(join(tmpDir, ".seeds/plans.jsonl"));
		const found = plans.find((p) => p.id === planId);
		if (!found) throw new Error(`plan not found: ${planId}`);
		return found;
	}

	test("--name updates plan.name, bumps revision, persists", async () => {
		const { planId, revision } = await submit("Old name");
		const before = await readPlanRow(planId);
		const { stdout, exitCode } = await run(
			["plan", "edit", planId, "--name", "New shiny name", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const payload = JSON.parse(stdout) as {
			success: boolean;
			command: string;
			plan_id: string;
			revision: number;
			edited: string[];
			name?: string;
		};
		expect(payload.success).toBe(true);
		expect(payload.command).toBe("plan edit");
		expect(payload.plan_id).toBe(planId);
		expect(payload.edited).toEqual(["name"]);
		expect(payload.name).toBe("New shiny name");
		expect(payload.revision).toBe(revision + 1);

		const after = await readPlanRow(planId);
		expect(after.name).toBe("New shiny name");
		expect(after.revision).toBe(revision + 1);
		expect(after.updatedAt >= before.updatedAt).toBe(true);
	});

	test("--name trims whitespace before persisting", async () => {
		const { planId } = await submit();
		await run(["plan", "edit", planId, "--name", "  Padded label  ", "--json"], tmpDir);
		const row = await readPlanRow(planId);
		expect(row.name).toBe("Padded label");
	});

	test("--name accepts a seed id (resolvePlanIdArg)", async () => {
		const { seedId, planId } = await submit();
		const { stdout, exitCode } = await run(
			["plan", "edit", seedId, "--name", "Via seed id", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const payload = JSON.parse(stdout) as { plan_id: string };
		expect(payload.plan_id).toBe(planId);
		const row = await readPlanRow(planId);
		expect(row.name).toBe("Via seed id");
	});

	test("empty --name exits non-zero with a clear error", async () => {
		const { planId } = await submit();
		const before = await readPlanRow(planId);
		const { stderr, exitCode } = await run(["plan", "edit", planId, "--name", "   "], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("--name");
		const after = await readPlanRow(planId);
		expect(after.revision).toBe(before.revision);
	});

	test("no edit flags exits non-zero without mutating the plan", async () => {
		const { planId } = await submit();
		const before = await readPlanRow(planId);
		const { stderr, exitCode } = await run(["plan", "edit", planId], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("No fields to edit");
		const after = await readPlanRow(planId);
		expect(after.revision).toBe(before.revision);
		expect(after.updatedAt).toBe(before.updatedAt);
	});

	test("unknown plan id exits non-zero", async () => {
		const { stderr, exitCode } = await run(["plan", "edit", "pl-9999", "--name", "x"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Plan not found");
	});

	test("plan show surfaces the edited name", async () => {
		const { planId } = await submit("Initial seed name");
		await run(["plan", "edit", planId, "--name", "Reflected in show"], tmpDir);
		const { stdout } = await run(["plan", "show", planId, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as { plan: { name?: string; revision: number } };
		expect(parsed.plan.name).toBe("Reflected in show");
	});

	test("human output reports the edit and new revision", async () => {
		const { planId, revision } = await submit();
		const { stdout, exitCode } = await run(
			["plan", "edit", planId, "--name", "Pretty label"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(planId);
		expect(stdout).toContain(`revision ${revision + 1}`);
		expect(stdout).toContain("name");
	});
});

describe("sd plan edit (seeds-21f2 / pl-dee8 step 2): --section", () => {
	async function submit(): Promise<{ seedId: string; planId: string; revision: number }> {
		const seedId = await createSeed(tmpDir, "Section editable seed");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { stdout, exitCode, stderr } = await run(
			["plan", "submit", seedId, "--plan", planPath, "--json"],
			tmpDir,
		);
		if (exitCode !== 0) throw new Error(`submit failed: ${stderr}`);
		const parsed = JSON.parse(stdout) as { plan_id: string; revision: number };
		return { seedId, planId: parsed.plan_id, revision: parsed.revision };
	}

	async function readPlanRow(planId: string): Promise<{
		id: string;
		revision: number;
		updatedAt: string;
		sections: Record<string, unknown>;
		children: string[];
	}> {
		const plans = await readJsonl<{
			id: string;
			revision: number;
			updatedAt: string;
			sections: Record<string, unknown>;
			children: string[];
		}>(join(tmpDir, ".seeds/plans.jsonl"));
		const found = plans.find((p) => p.id === planId);
		if (!found) throw new Error(`plan not found: ${planId}`);
		return found;
	}

	async function readIssueRow(id: string): Promise<{
		id: string;
		description?: string;
		updatedAt: string;
	}> {
		const issues = await readJsonl<{
			id: string;
			description?: string;
			updatedAt: string;
		}>(join(tmpDir, ".seeds/issues.jsonl"));
		// Last-write-wins (dedup-on-read): scan from the end to mirror live behavior.
		for (let i = issues.length - 1; i >= 0; i--) {
			const row = issues[i];
			if (row && row.id === id) return row;
		}
		throw new Error(`issue not found: ${id}`);
	}

	test("--section context updates text without touching children", async () => {
		const { planId, revision } = await submit();
		const before = await readPlanRow(planId);
		const firstChild = before.children[0];
		if (!firstChild) throw new Error("expected children");
		const childBefore = await readIssueRow(firstChild);
		const newContext = `${VALID_CONTEXT} Also: edited via sd plan edit.`;
		const { stdout, exitCode } = await run(
			["plan", "edit", planId, "--section", "context", newContext, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const payload = JSON.parse(stdout) as {
			edited: string[];
			revision: number;
			backrefs_refreshed: number;
		};
		expect(payload.edited).toEqual(["section:context"]);
		expect(payload.revision).toBe(revision + 1);
		expect(payload.backrefs_refreshed).toBe(0);

		const after = await readPlanRow(planId);
		expect(after.sections.context).toBe(newContext);
		expect(after.revision).toBe(revision + 1);

		const childAfter = await readIssueRow(firstChild);
		expect(childAfter.updatedAt).toBe(childBefore.updatedAt);
		expect(childAfter.description).toBe(childBefore.description);
	});

	test("--section approach updates text AND refreshes backrefs on all children", async () => {
		const { planId, revision } = await submit();
		const before = await readPlanRow(planId);
		const children = before.children;
		expect(children.length).toBeGreaterThan(0);
		const newApproach = "Edited approach: now we do it the new way for clarity.";

		const { stdout, exitCode } = await run(
			["plan", "edit", planId, "--section", "approach", newApproach, "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const payload = JSON.parse(stdout) as {
			edited: string[];
			revision: number;
			backrefs_refreshed: number;
		};
		expect(payload.edited).toEqual(["section:approach"]);
		expect(payload.revision).toBe(revision + 1);
		expect(payload.backrefs_refreshed).toBe(children.length);

		const after = await readPlanRow(planId);
		expect(after.sections.approach).toBe(newApproach);

		for (const childId of children) {
			const child = await readIssueRow(childId);
			expect(child.description ?? "").toContain("seeds:plan-backref:start");
			expect(child.description ?? "").toContain("Edited approach");
		}
	});

	test("--name and --section combine atomically", async () => {
		const { planId, revision } = await submit();
		const { stdout, exitCode } = await run(
			[
				"plan",
				"edit",
				planId,
				"--name",
				"Combined",
				"--section",
				"context",
				`${VALID_CONTEXT} extra.`,
				"--json",
			],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const payload = JSON.parse(stdout) as {
			edited: string[];
			name?: string;
			revision: number;
		};
		expect(payload.edited).toEqual(["name", "section:context"]);
		expect(payload.name).toBe("Combined");
		expect(payload.revision).toBe(revision + 1);
	});

	test("unknown section name exits non-zero without mutation", async () => {
		const { planId } = await submit();
		const before = await readPlanRow(planId);
		const { stderr, exitCode } = await run(
			["plan", "edit", planId, "--section", "nonexistent", "some text"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Unknown section");
		const after = await readPlanRow(planId);
		expect(after.revision).toBe(before.revision);
	});

	test("--section on a non-text section (alternatives) is rejected", async () => {
		const { planId } = await submit();
		const before = await readPlanRow(planId);
		const { stderr, exitCode } = await run(
			["plan", "edit", planId, "--section", "alternatives", "some text"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("kind=text only");
		const after = await readPlanRow(planId);
		expect(after.revision).toBe(before.revision);
	});

	test("--section context with too-short text is rejected (min_length)", async () => {
		const { planId } = await submit();
		const before = await readPlanRow(planId);
		const { stderr, exitCode } = await run(
			["plan", "edit", planId, "--section", "context", "short"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("at least");
		const after = await readPlanRow(planId);
		expect(after.revision).toBe(before.revision);
	});

	test("--section without text exits non-zero", async () => {
		const { planId } = await submit();
		const { stderr, exitCode } = await run(
			["plan", "edit", planId, "--section", "approach"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("--section");
	});

	test("plan show surfaces the edited section text", async () => {
		const { planId } = await submit();
		const newApproach = "Refined approach surfaced by sd plan show after edit.";
		await run(["plan", "edit", planId, "--section", "approach", newApproach], tmpDir);
		const { stdout } = await run(["plan", "show", planId, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as {
			plan: { sections: { approach?: string } };
		};
		expect(parsed.plan.sections.approach).toBe(newApproach);
	});
});

describe("sd plan edit (seeds-64cf / pl-dee8 step 3): --step metadata", () => {
	async function submit(): Promise<{
		seedId: string;
		planId: string;
		revision: number;
		children: string[];
	}> {
		const seedId = await createSeed(tmpDir, "Step-editable seed");
		const planPath = await writePlanFile(tmpDir, validPlanFor());
		const { stdout, exitCode, stderr } = await run(
			["plan", "submit", seedId, "--plan", planPath, "--json"],
			tmpDir,
		);
		if (exitCode !== 0) throw new Error(`submit failed: ${stderr}`);
		const parsed = JSON.parse(stdout) as {
			plan_id: string;
			revision: number;
			children: string[];
		};
		return {
			seedId,
			planId: parsed.plan_id,
			revision: parsed.revision,
			children: parsed.children,
		};
	}

	async function readPlanRow(planId: string): Promise<{
		id: string;
		revision: number;
		updatedAt: string;
		sections: { steps?: unknown[] } & Record<string, unknown>;
		children: string[];
	}> {
		const plans = await readJsonl<{
			id: string;
			revision: number;
			updatedAt: string;
			sections: { steps?: unknown[] } & Record<string, unknown>;
			children: string[];
		}>(join(tmpDir, ".seeds/plans.jsonl"));
		const found = plans.find((p) => p.id === planId);
		if (!found) throw new Error(`plan not found: ${planId}`);
		return found;
	}

	async function readIssueRow(id: string): Promise<{
		id: string;
		title: string;
		type: string;
		priority: number;
		updatedAt: string;
	}> {
		const issues = await readJsonl<{
			id: string;
			title: string;
			type: string;
			priority: number;
			updatedAt: string;
		}>(join(tmpDir, ".seeds/issues.jsonl"));
		for (let i = issues.length - 1; i >= 0; i--) {
			const row = issues[i];
			if (row && row.id === id) return row;
		}
		throw new Error(`issue not found: ${id}`);
	}

	test("--step --title renames the step and propagates to the child seed", async () => {
		const { planId, revision, children } = await submit();
		const child2 = children[1];
		if (!child2) throw new Error("expected step-2 child");
		const before = await readIssueRow(child2);
		expect(before.title).toBe("Step B");

		const { stdout, exitCode } = await run(
			["plan", "edit", planId, "--step", "2", "--title", "Renamed step B", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const payload = JSON.parse(stdout) as {
			edited: string[];
			revision: number;
			propagated_children: string[];
		};
		expect(payload.edited).toEqual(["step:2:title"]);
		expect(payload.revision).toBe(revision + 1);
		expect(payload.propagated_children).toEqual([child2]);

		const planRow = await readPlanRow(planId);
		const steps = planRow.sections.steps;
		if (!Array.isArray(steps)) throw new Error("steps missing");
		expect((steps[1] as { title: string }).title).toBe("Renamed step B");

		const after = await readIssueRow(child2);
		expect(after.title).toBe("Renamed step B");
	});

	test("--step --priority propagates to the child seed", async () => {
		const { planId, children } = await submit();
		const child3 = children[2];
		if (!child3) throw new Error("expected step-3 child");
		const before = await readIssueRow(child3);
		expect(before.priority).toBe(2);

		const { stdout, exitCode } = await run(
			["plan", "edit", planId, "--step", "3", "--priority", "P0", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const payload = JSON.parse(stdout) as { edited: string[]; propagated_children: string[] };
		expect(payload.edited).toEqual(["step:3:priority"]);
		expect(payload.propagated_children).toEqual([child3]);

		const planRow = await readPlanRow(planId);
		const steps = planRow.sections.steps as unknown[];
		expect((steps[2] as { priority: number }).priority).toBe(0);
		const after = await readIssueRow(child3);
		expect(after.priority).toBe(0);
	});

	test("--step --type propagates to the child seed", async () => {
		const { planId, children } = await submit();
		const child1 = children[0];
		if (!child1) throw new Error("expected step-1 child");
		const { stdout, exitCode } = await run(
			["plan", "edit", planId, "--step", "1", "--type", "bug", "--json"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const payload = JSON.parse(stdout) as { edited: string[]; propagated_children: string[] };
		expect(payload.edited).toEqual(["step:1:type"]);
		expect(payload.propagated_children).toEqual([child1]);

		const planRow = await readPlanRow(planId);
		const steps = planRow.sections.steps as unknown[];
		expect((steps[0] as { type: string }).type).toBe("bug");
		const after = await readIssueRow(child1);
		expect(after.type).toBe("bug");
	});

	test("multiple --step flags apply atomically in one invocation", async () => {
		const { planId, revision, children } = await submit();
		const child4 = children[3];
		if (!child4) throw new Error("expected step-4 child");
		const { stdout, exitCode } = await run(
			[
				"plan",
				"edit",
				planId,
				"--step",
				"4",
				"--title",
				"D-prime",
				"--priority",
				"1",
				"--type",
				"feature",
				"--json",
			],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const payload = JSON.parse(stdout) as {
			edited: string[];
			revision: number;
			propagated_children: string[];
		};
		expect(payload.edited).toEqual(["step:4:title", "step:4:priority", "step:4:type"]);
		expect(payload.revision).toBe(revision + 1);
		expect(payload.propagated_children).toEqual([child4]);

		const after = await readIssueRow(child4);
		expect(after.title).toBe("D-prime");
		expect(after.priority).toBe(1);
		expect(after.type).toBe("feature");
	});

	test("--name combines with --step in a single revision bump", async () => {
		const { planId, revision, children } = await submit();
		const child2 = children[1];
		if (!child2) throw new Error("expected step-2 child");
		const { stdout, exitCode } = await run(
			[
				"plan",
				"edit",
				planId,
				"--name",
				"Combined name+step",
				"--step",
				"2",
				"--title",
				"B via combo",
				"--json",
			],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const payload = JSON.parse(stdout) as {
			edited: string[];
			name?: string;
			revision: number;
			propagated_children: string[];
		};
		expect(payload.edited).toEqual(["name", "step:2:title"]);
		expect(payload.name).toBe("Combined name+step");
		expect(payload.revision).toBe(revision + 1);
		expect(payload.propagated_children).toEqual([child2]);

		const after = await readIssueRow(child2);
		expect(after.title).toBe("B via combo");
	});

	test("out-of-range --step exits non-zero without mutation", async () => {
		const { planId, children } = await submit();
		const before = await readPlanRow(planId);
		const child1 = children[0];
		if (!child1) throw new Error("expected child");
		const childBefore = await readIssueRow(child1);
		const { stderr, exitCode } = await run(
			["plan", "edit", planId, "--step", "99", "--title", "nope"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("out of range");
		const after = await readPlanRow(planId);
		expect(after.revision).toBe(before.revision);
		const childAfter = await readIssueRow(child1);
		expect(childAfter.updatedAt).toBe(childBefore.updatedAt);
	});

	test("--step 0 (non-positive) is rejected", async () => {
		const { planId } = await submit();
		const { stderr, exitCode } = await run(
			["plan", "edit", planId, "--step", "0", "--title", "x"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("--step");
	});

	test("--step without --title/--priority/--type is rejected", async () => {
		const { planId } = await submit();
		const { stderr, exitCode } = await run(["plan", "edit", planId, "--step", "1"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("--title");
	});

	test("--title without --step is rejected", async () => {
		const { planId } = await submit();
		const { stderr, exitCode } = await run(
			["plan", "edit", planId, "--title", "orphan title"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("--step");
	});

	test("--priority with invalid value is rejected", async () => {
		const { planId } = await submit();
		const { stderr, exitCode } = await run(
			["plan", "edit", planId, "--step", "1", "--priority", "9"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("--priority");
	});

	test("--type with invalid value is rejected", async () => {
		const { planId } = await submit();
		const { stderr, exitCode } = await run(
			["plan", "edit", planId, "--step", "1", "--type", "saga"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("--type");
	});

	test("--step does NOT refresh backrefs on non-matching children", async () => {
		const { planId, children } = await submit();
		const child1 = children[0];
		const child3 = children[2];
		if (!child1 || !child3) throw new Error("expected children");
		const beforeOther = await readIssueRow(child3);
		await run(["plan", "edit", planId, "--step", "1", "--title", "renamed A", "--json"], tmpDir);
		const afterOther = await readIssueRow(child3);
		// Step 3's child should not be touched (different plan_step_index).
		expect(afterOther.updatedAt).toBe(beforeOther.updatedAt);
	});

	test("plan show surfaces edited step title", async () => {
		const { planId } = await submit();
		await run(["plan", "edit", planId, "--step", "2", "--title", "B in show", "--json"], tmpDir);
		const { stdout } = await run(["plan", "show", planId, "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as {
			plan: { sections: { steps?: { title: string }[] } };
		};
		const steps = parsed.plan.sections.steps ?? [];
		expect(steps[1]?.title).toBe("B in show");
	});
});

describe("sd plan: step.labels (seeds-9f86 / pl-e5a8 step 4)", () => {
	type IssueRow = {
		id: string;
		title: string;
		status: string;
		labels?: string[];
		plan_id?: string;
		plan_step_index?: number;
		description?: string;
	};

	async function readIssueRows(): Promise<IssueRow[]> {
		return readJsonl<IssueRow>(join(tmpDir, ".seeds/issues.jsonl"));
	}

	async function findIssue(id: string): Promise<IssueRow | undefined> {
		return (await readIssueRows()).find((i) => i.id === id);
	}

	describe("STEP_SCHEMA validation", () => {
		test("rejects an empty-string label", async () => {
			const seedId = await createSeed(tmpDir, "Parent");
			const plan = validPlanFor();
			plan.sections.steps = [
				{ title: "Step A", type: "task", priority: 2, blocks: [], labels: [""] },
				{ title: "Step B", type: "task", priority: 2, blocks: [] },
			];
			const planPath = await writePlanFile(tmpDir, plan);
			const { stderr, exitCode } = await run(
				["plan", "submit", seedId, "--plan", planPath],
				tmpDir,
			);
			expect(exitCode).not.toBe(0);
			expect(stderr.toLowerCase()).toContain("labels");
		});

		test("rejects a whitespace-only label (pattern requires non-whitespace)", async () => {
			const seedId = await createSeed(tmpDir, "Parent");
			const plan = validPlanFor();
			plan.sections.steps = [
				{ title: "Step A", type: "task", priority: 2, blocks: [], labels: ["   "] },
				{ title: "Step B", type: "task", priority: 2, blocks: [] },
			];
			const planPath = await writePlanFile(tmpDir, plan);
			const { stderr, exitCode } = await run(
				["plan", "submit", seedId, "--plan", planPath],
				tmpDir,
			);
			expect(exitCode).not.toBe(0);
			expect(stderr.toLowerCase()).toContain("labels");
		});

		test("rejects labels that is not an array", async () => {
			const seedId = await createSeed(tmpDir, "Parent");
			const plan = validPlanFor();
			plan.sections.steps = [
				// biome-ignore lint/suspicious/noExplicitAny: intentionally invalid shape
				{ title: "Step A", type: "task", priority: 2, blocks: [], labels: "nope" as any },
				{ title: "Step B", type: "task", priority: 2, blocks: [] },
			];
			const planPath = await writePlanFile(tmpDir, plan);
			const { exitCode } = await run(["plan", "submit", seedId, "--plan", planPath], tmpDir);
			expect(exitCode).not.toBe(0);
		});

		test("accepts an empty labels array (treated as no labels)", async () => {
			const seedId = await createSeed(tmpDir, "Parent");
			const plan = validPlanFor();
			plan.sections.steps = [
				{ title: "Step A", type: "task", priority: 2, blocks: [], labels: [] },
				{ title: "Step B", type: "task", priority: 2, blocks: [] },
			];
			const planPath = await writePlanFile(tmpDir, plan);
			const { stdout, exitCode } = await run(
				["plan", "submit", seedId, "--plan", planPath, "--json"],
				tmpDir,
			);
			expect(exitCode).toBe(0);
			const { children } = JSON.parse(stdout) as { children: string[] };
			const child = await findIssue(children[0] ?? "");
			expect(child?.labels).toBeUndefined();
		});
	});

	describe("fresh-spawn path", () => {
		test("applies step.labels to the spawned child seed", async () => {
			const seedId = await createSeed(tmpDir, "Parent");
			const plan = validPlanFor();
			plan.sections.steps = [
				{
					title: "Step A",
					type: "task",
					priority: 2,
					blocks: [],
					labels: ["nightwatch", "debt"],
				},
				{ title: "Step B", type: "task", priority: 2, blocks: [] },
			];
			const planPath = await writePlanFile(tmpDir, plan);
			const { stdout, exitCode } = await run(
				["plan", "submit", seedId, "--plan", planPath, "--json"],
				tmpDir,
			);
			expect(exitCode).toBe(0);
			const { children } = JSON.parse(stdout) as { children: string[] };
			const childA = await findIssue(children[0] ?? "");
			const childB = await findIssue(children[1] ?? "");
			expect(childA?.labels).toEqual(["nightwatch", "debt"]);
			// Sibling without step.labels has no labels field.
			expect(childB?.labels).toBeUndefined();
		});

		test("normalizes (lowercase + trim) and dedups step.labels", async () => {
			const seedId = await createSeed(tmpDir, "Parent");
			const plan = validPlanFor();
			plan.sections.steps = [
				{
					title: "Step A",
					type: "task",
					priority: 2,
					blocks: [],
					labels: ["Foo", "  FOO  ", "BAR", "bar"],
				},
				{ title: "Step B", type: "task", priority: 2, blocks: [] },
			];
			const planPath = await writePlanFile(tmpDir, plan);
			const { stdout, exitCode } = await run(
				["plan", "submit", seedId, "--plan", planPath, "--json"],
				tmpDir,
			);
			expect(exitCode).toBe(0);
			const { children } = JSON.parse(stdout) as { children: string[] };
			const child = await findIssue(children[0] ?? "");
			expect(child?.labels).toEqual(["foo", "bar"]);
		});

		test("omits labels field entirely when step.labels is missing", async () => {
			const seedId = await createSeed(tmpDir, "Parent");
			const planPath = await writePlanFile(tmpDir, validPlanFor());
			const { stdout, exitCode } = await run(
				["plan", "submit", seedId, "--plan", planPath, "--json"],
				tmpDir,
			);
			expect(exitCode).toBe(0);
			const { children } = JSON.parse(stdout) as { children: string[] };
			for (const id of children) {
				const child = await findIssue(id);
				expect(child?.labels).toBeUndefined();
			}
		});
	});

	describe("submit-time adoption (existing_seed)", () => {
		test("merges step.labels additively into adopted seed; manual labels survive", async () => {
			const parent = await createSeed(tmpDir, "Parent");
			const adoptee = await createSeed(tmpDir, "Pre-existing");
			await run(["label", "add", adoptee, "manual"], tmpDir);

			const plan = validPlanFor();
			plan.sections.steps = [
				{
					title: "Pre-existing",
					type: "task",
					priority: 2,
					blocks: [2],
					existing_seed: adoptee,
					labels: ["nightwatch"],
				},
				{ title: "Fresh", type: "task", priority: 2, blocks: [] },
			];
			const planPath = await writePlanFile(tmpDir, plan);
			const { exitCode } = await run(
				["plan", "submit", parent, "--plan", planPath, "--json"],
				tmpDir,
			);
			expect(exitCode).toBe(0);
			const adopt = await findIssue(adoptee);
			// Additive: manual label preserved, step label appended (deduped).
			expect(adopt?.labels).toEqual(["manual", "nightwatch"]);
		});

		test("adoption without step.labels leaves existing labels untouched", async () => {
			const parent = await createSeed(tmpDir, "Parent");
			const adoptee = await createSeed(tmpDir, "Pre-existing");
			await run(["label", "add", adoptee, "manual"], tmpDir);

			const plan = validPlanFor();
			plan.sections.steps = [
				{
					title: "Pre-existing",
					type: "task",
					priority: 2,
					blocks: [2],
					existing_seed: adoptee,
				},
				{ title: "Fresh", type: "task", priority: 2, blocks: [] },
			];
			const planPath = await writePlanFile(tmpDir, plan);
			await run(["plan", "submit", parent, "--plan", planPath, "--json"], tmpDir);
			const adopt = await findIssue(adoptee);
			expect(adopt?.labels).toEqual(["manual"]);
		});

		test("adoption with already-present step.label does not duplicate", async () => {
			const parent = await createSeed(tmpDir, "Parent");
			const adoptee = await createSeed(tmpDir, "Pre-existing");
			await run(["label", "add", adoptee, "nightwatch"], tmpDir);

			const plan = validPlanFor();
			plan.sections.steps = [
				{
					title: "Pre-existing",
					type: "task",
					priority: 2,
					blocks: [2],
					existing_seed: adoptee,
					labels: ["NIGHTWATCH"],
				},
				{ title: "Fresh", type: "task", priority: 2, blocks: [] },
			];
			const planPath = await writePlanFile(tmpDir, plan);
			await run(["plan", "submit", parent, "--plan", planPath, "--json"], tmpDir);
			const adopt = await findIssue(adoptee);
			expect(adopt?.labels).toEqual(["nightwatch"]);
		});
	});

	describe("--overwrite path", () => {
		test("merges step.labels into matched child additively; preserves manual labels", async () => {
			const seedId = await createSeed(tmpDir, "Parent");
			const planPath = await writePlanFile(tmpDir, validPlanFor());
			const first = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
			const firstChildren = (JSON.parse(first.stdout) as { children: string[] }).children;
			const childId = firstChildren[0] ?? "";
			await run(["label", "add", childId, "manual"], tmpDir);

			const v2 = validPlanFor();
			v2.sections.steps = [
				{
					title: "Step A",
					type: "task",
					priority: 2,
					blocks: [2],
					labels: ["nightwatch"],
				},
				{ title: "Step B", type: "task", priority: 2, blocks: [] },
				{ title: "Step C", type: "task", priority: 2, blocks: [4] },
				{ title: "Step D", type: "task", priority: 2, blocks: [] },
			];
			const v2Path = await writePlanFile(tmpDir, v2);
			const { exitCode } = await run(
				["plan", "submit", seedId, "--plan", v2Path, "--overwrite", "--json"],
				tmpDir,
			);
			expect(exitCode).toBe(0);
			const child = await findIssue(childId);
			expect(child?.labels).toEqual(["manual", "nightwatch"]);
		});

		test("applies step.labels to newly spawned children on overwrite", async () => {
			const seedId = await createSeed(tmpDir, "Parent");
			const planPath = await writePlanFile(tmpDir, validPlanFor());
			await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);

			const v2 = validPlanFor();
			v2.sections.steps = [
				{ title: "Step A", type: "task", priority: 2, blocks: [2] },
				{ title: "Step B", type: "task", priority: 2, blocks: [3] },
				{
					title: "Brand New",
					type: "task",
					priority: 2,
					blocks: [],
					labels: ["bugwatch"],
				},
			];
			const v2Path = await writePlanFile(tmpDir, v2);
			const overwrite = await run(
				["plan", "submit", seedId, "--plan", v2Path, "--overwrite", "--json"],
				tmpDir,
			);
			const result = JSON.parse(overwrite.stdout) as { children: string[] };
			const freshId = result.children[2] ?? "";
			const fresh = await findIssue(freshId);
			expect(fresh?.labels).toEqual(["bugwatch"]);
		});

		test("external adoption via overwrite merges step.labels additively", async () => {
			const seedId = await createSeed(tmpDir, "Parent");
			const planPath = await writePlanFile(tmpDir, validPlanFor());
			await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);

			const external = await createSeed(tmpDir, "External");
			await run(["label", "add", external, "manual"], tmpDir);

			const v2 = validPlanFor();
			v2.sections.steps = [
				{ title: "Step A", type: "task", priority: 2, blocks: [2] },
				{
					title: "External",
					type: "task",
					priority: 2,
					blocks: [],
					existing_seed: external,
					labels: ["bugwatch"],
				},
			];
			const v2Path = await writePlanFile(tmpDir, v2);
			const { exitCode } = await run(
				["plan", "submit", seedId, "--plan", v2Path, "--overwrite", "--json"],
				tmpDir,
			);
			expect(exitCode).toBe(0);
			const adopt = await findIssue(external);
			expect(adopt?.labels).toEqual(["manual", "bugwatch"]);
		});

		test("overwrite without step.labels does not strip existing labels", async () => {
			const seedId = await createSeed(tmpDir, "Parent");
			const plan = validPlanFor();
			if (Array.isArray(plan.sections.steps)) {
				const first = plan.sections.steps[0] as Record<string, unknown>;
				first.labels = ["nightwatch"];
			}
			const planPath = await writePlanFile(tmpDir, plan);
			const submit = await run(["plan", "submit", seedId, "--plan", planPath, "--json"], tmpDir);
			const childId = (JSON.parse(submit.stdout) as { children: string[] }).children[0] ?? "";
			expect((await findIssue(childId))?.labels).toEqual(["nightwatch"]);

			// v2 drops the labels field; matched child must keep nightwatch.
			const v2 = validPlanFor();
			const v2Path = await writePlanFile(tmpDir, v2);
			await run(["plan", "submit", seedId, "--plan", v2Path, "--overwrite", "--json"], tmpDir);
			expect((await findIssue(childId))?.labels).toEqual(["nightwatch"]);
		});
	});

	describe("runAdopt (post-submit `sd plan adopt`)", () => {
		test("--step <i> pulls step.labels from the blueprint and merges additively", async () => {
			const parent = await createSeed(tmpDir, "Parent");
			const plan = validPlanFor();
			if (Array.isArray(plan.sections.steps)) {
				const second = plan.sections.steps[1] as Record<string, unknown>;
				second.labels = ["nightwatch"];
			}
			const planPath = await writePlanFile(tmpDir, plan);
			const submit = await run(["plan", "submit", parent, "--plan", planPath, "--json"], tmpDir);
			const planId = (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;

			const adoptee = await createSeed(tmpDir, "Late adoptee");
			await run(["label", "add", adoptee, "manual"], tmpDir);

			const { exitCode } = await run(
				["plan", "adopt", planId, adoptee, "--step", "2", "--json"],
				tmpDir,
			);
			expect(exitCode).toBe(0);
			const adopt = await findIssue(adoptee);
			expect(adopt?.labels).toEqual(["manual", "nightwatch"]);
		});

		test("--step <i> with a blueprint step that has no labels leaves existing labels untouched", async () => {
			const parent = await createSeed(tmpDir, "Parent");
			const planPath = await writePlanFile(tmpDir, validPlanFor());
			const submit = await run(["plan", "submit", parent, "--plan", planPath, "--json"], tmpDir);
			const planId = (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;

			const adoptee = await createSeed(tmpDir, "Late adoptee");
			await run(["label", "add", adoptee, "manual"], tmpDir);

			await run(["plan", "adopt", planId, adoptee, "--step", "1", "--json"], tmpDir);
			const adopt = await findIssue(adoptee);
			expect(adopt?.labels).toEqual(["manual"]);
		});

		test("adopt without --step does not pull labels from any blueprint step", async () => {
			const parent = await createSeed(tmpDir, "Parent");
			const plan = validPlanFor();
			if (Array.isArray(plan.sections.steps)) {
				const first = plan.sections.steps[0] as Record<string, unknown>;
				first.labels = ["nightwatch"];
			}
			const planPath = await writePlanFile(tmpDir, plan);
			const submit = await run(["plan", "submit", parent, "--plan", planPath, "--json"], tmpDir);
			const planId = (JSON.parse(submit.stdout) as { plan_id: string }).plan_id;

			const adoptee = await createSeed(tmpDir, "Late");
			await run(["label", "add", adoptee, "manual"], tmpDir);

			await run(["plan", "adopt", planId, adoptee, "--json"], tmpDir);
			const adopt = await findIssue(adoptee);
			expect(adopt?.labels).toEqual(["manual"]);
		});
	});
});
