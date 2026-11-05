import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { computeNextPlanStatus, openParentsOfDonePlans } from "../plan-lifecycle.ts";
import { readIssues, readPlans, writeIssues, writePlans } from "../store.ts";
import { runCli } from "../test-harness.ts";
import type { Issue, Plan } from "../types.ts";
import { run as closeRun } from "./close.ts";
import { run as updateRun } from "./update.ts";

let dir: string;
let seedsDir: string;

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), "seeds-lifecycle-"));
	seedsDir = join(dir, ".seeds");
	mkdirSync(seedsDir, { recursive: true });
	writeFileSync(join(seedsDir, "config.yaml"), 'project: "test"\nversion: "1"\n');
	writeFileSync(join(seedsDir, "issues.jsonl"), "");
	writeFileSync(join(seedsDir, "plans.jsonl"), "");
});

afterEach(async () => {
	await rm(dir, { recursive: true, force: true });
});

function makeIssue(id: string, status: Issue["status"], extras: Partial<Issue> = {}): Issue {
	return {
		id,
		title: id,
		status,
		type: "task",
		priority: 2,
		createdAt: "2026-05-06T00:00:00Z",
		updatedAt: "2026-05-06T00:00:00Z",
		...extras,
	};
}

function makePlan(id: string, status: Plan["status"], children: string[]): Plan {
	return {
		id,
		seed: `seed-${id}`,
		template: "feature",
		status,
		revision: 1,
		sections: { steps: children.map((t) => ({ title: t })) },
		children,
		createdAt: "2026-05-06T00:00:00Z",
		updatedAt: "2026-05-06T00:00:00Z",
	};
}

async function seed(plans: Plan[], issues: Issue[]): Promise<void> {
	await writeIssues(seedsDir, issues);
	await writePlans(seedsDir, plans);
}

describe("computeNextPlanStatus — pure rules", () => {
	test("draft stays draft", () => {
		const plan = makePlan("p1", "draft", ["c1"]);
		const children = [makeIssue("c1", "in_progress")];
		expect(computeNextPlanStatus(plan, children)).toBe("draft");
	});

	test("approved → active when any child in_progress", () => {
		const plan = makePlan("p1", "approved", ["c1", "c2"]);
		const children = [makeIssue("c1", "in_progress"), makeIssue("c2", "open")];
		expect(computeNextPlanStatus(plan, children)).toBe("active");
	});

	test("approved stays approved when no child in_progress", () => {
		const plan = makePlan("p1", "approved", ["c1", "c2"]);
		const children = [makeIssue("c1", "open"), makeIssue("c2", "open")];
		expect(computeNextPlanStatus(plan, children)).toBe("approved");
	});

	test("active → done when all children closed", () => {
		const plan = makePlan("p1", "active", ["c1", "c2"]);
		const children = [makeIssue("c1", "closed"), makeIssue("c2", "closed")];
		expect(computeNextPlanStatus(plan, children)).toBe("done");
	});

	test("active stays active even when no child is in_progress", () => {
		const plan = makePlan("p1", "active", ["c1", "c2"]);
		const children = [makeIssue("c1", "open"), makeIssue("c2", "closed")];
		expect(computeNextPlanStatus(plan, children)).toBe("active");
	});

	test("done → active when a closed child reopens", () => {
		const plan = makePlan("p1", "done", ["c1", "c2"]);
		const children = [makeIssue("c1", "open"), makeIssue("c2", "closed")];
		expect(computeNextPlanStatus(plan, children)).toBe("active");
	});

	test("done stays done while all children closed", () => {
		const plan = makePlan("p1", "done", ["c1", "c2"]);
		const children = [makeIssue("c1", "closed"), makeIssue("c2", "closed")];
		expect(computeNextPlanStatus(plan, children)).toBe("done");
	});
});

describe("openParentsOfDonePlans", () => {
	test("lists done plans whose parent seed is open, honoring the plan filter", () => {
		const plans = [
			makePlan("pl-1", "done", ["c1"]),
			makePlan("pl-2", "done", ["c2"]),
			makePlan("pl-3", "active", ["c3"]),
		];
		const issues = [
			makeIssue("seed-pl-1", "open"),
			makeIssue("seed-pl-2", "closed"),
			makeIssue("seed-pl-3", "open"),
		];
		expect(openParentsOfDonePlans(plans, issues)).toEqual([{ plan: "pl-1", seed: "seed-pl-1" }]);
		expect(openParentsOfDonePlans(plans, issues, ["pl-2", "pl-3"])).toEqual([]);
	});

	test("update --status closed on the last child reports the open parent in JSON", async () => {
		await seed(
			[makePlan("pl-1", "active", ["c1"])],
			[makeIssue("seed-pl-1", "open"), makeIssue("c1", "in_progress", { plan_id: "pl-1" })],
		);
		const { stdout } = await runCli(["update", "c1", "--status", "closed", "--json"], dir);
		const out = JSON.parse(stdout) as { openPlanParents?: unknown };
		expect(out.openPlanParents).toEqual([{ plan: "pl-1", seed: "seed-pl-1" }]);
	});
});

describe("update --status hook — flips plan status", () => {
	test("approved → active when child moves to in_progress", async () => {
		await seed(
			[makePlan("pl-1", "approved", ["c1", "c2"])],
			[makeIssue("c1", "open", { plan_id: "pl-1" }), makeIssue("c2", "open", { plan_id: "pl-1" })],
		);
		await updateRun(["c1", "--status", "in_progress"], seedsDir);
		const plans = await readPlans(seedsDir);
		expect(plans[0]?.status).toBe("active");
	});

	test("idempotent — no-op when child already in_progress", async () => {
		const plan = makePlan("pl-1", "active", ["c1"]);
		const before = plan.updatedAt;
		await seed([plan], [makeIssue("c1", "in_progress", { plan_id: "pl-1" })]);
		await updateRun(["c1", "--status", "in_progress"], seedsDir);
		const plans = await readPlans(seedsDir);
		expect(plans[0]?.status).toBe("active");
		expect(plans[0]?.updatedAt).toBe(before); // not bumped — no change
	});

	test("done → active when a closed child reopens", async () => {
		await seed(
			[makePlan("pl-1", "done", ["c1", "c2"])],
			[
				makeIssue("c1", "closed", { plan_id: "pl-1" }),
				makeIssue("c2", "closed", { plan_id: "pl-1" }),
			],
		);
		await updateRun(["c1", "--status", "open"], seedsDir);
		const plans = await readPlans(seedsDir);
		expect(plans[0]?.status).toBe("active");
	});

	test("draft plan is never auto-promoted", async () => {
		await seed([makePlan("pl-1", "draft", ["c1"])], [makeIssue("c1", "open", { plan_id: "pl-1" })]);
		await updateRun(["c1", "--status", "in_progress"], seedsDir);
		const plans = await readPlans(seedsDir);
		expect(plans[0]?.status).toBe("draft");
	});

	test("non-status updates do NOT affect plan status (or its updatedAt)", async () => {
		const plan = makePlan("pl-1", "approved", ["c1"]);
		await seed([plan], [makeIssue("c1", "open", { plan_id: "pl-1" })]);
		await updateRun(["c1", "--title", "new title"], seedsDir);
		const plans = await readPlans(seedsDir);
		expect(plans[0]?.status).toBe("approved");
		expect(plans[0]?.updatedAt).toBe(plan.updatedAt);
	});
});

describe("close hook — flips plan to done when last child closes", () => {
	test("active → done when all children closed", async () => {
		await seed(
			[makePlan("pl-1", "active", ["c1", "c2"])],
			[
				makeIssue("c1", "closed", { plan_id: "pl-1" }),
				makeIssue("c2", "in_progress", { plan_id: "pl-1" }),
			],
		);
		await closeRun(["c2"], seedsDir);
		const plans = await readPlans(seedsDir);
		expect(plans[0]?.status).toBe("done");
	});

	test("active stays active while one child remains open", async () => {
		await seed(
			[makePlan("pl-1", "active", ["c1", "c2"])],
			[
				makeIssue("c1", "in_progress", { plan_id: "pl-1" }),
				makeIssue("c2", "open", { plan_id: "pl-1" }),
			],
		);
		await closeRun(["c1"], seedsDir);
		const plans = await readPlans(seedsDir);
		expect(plans[0]?.status).toBe("active");
	});

	test("approved → done when all children closed in one batch", async () => {
		await seed(
			[makePlan("pl-1", "approved", ["c1", "c2"])],
			[makeIssue("c1", "open", { plan_id: "pl-1" }), makeIssue("c2", "open", { plan_id: "pl-1" })],
		);
		await closeRun(["c1", "c2"], seedsDir);
		const plans = await readPlans(seedsDir);
		expect(plans[0]?.status).toBe("done");
	});

	test("issues without a plan_id leave plans untouched", async () => {
		await seed([], [makeIssue("orphan", "open")]);
		await closeRun(["orphan"], seedsDir);
		const issues = await readIssues(seedsDir);
		expect(issues.find((i) => i.id === "orphan")?.status).toBe("closed");
	});
});

describe("full lifecycle walk-through", () => {
	test("draft → approved (manual via plan submit, simulated) → active → done → active → done", async () => {
		// Start from approved (post-submit) since plan submit is exercised in plan.test.ts.
		await seed(
			[makePlan("pl-1", "approved", ["c1", "c2"])],
			[makeIssue("c1", "open", { plan_id: "pl-1" }), makeIssue("c2", "open", { plan_id: "pl-1" })],
		);

		// approved → active
		await updateRun(["c1", "--status", "in_progress"], seedsDir);
		expect((await readPlans(seedsDir))[0]?.status).toBe("active");

		// active → done
		await closeRun(["c1", "c2"], seedsDir);
		expect((await readPlans(seedsDir))[0]?.status).toBe("done");

		// done → active (reopen one)
		await updateRun(["c1", "--status", "open"], seedsDir);
		expect((await readPlans(seedsDir))[0]?.status).toBe("active");

		// active → done (close again)
		await closeRun(["c1"], seedsDir);
		expect((await readPlans(seedsDir))[0]?.status).toBe("done");
	});
});
