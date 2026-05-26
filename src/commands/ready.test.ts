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

async function readyIds(cwd: string, extra: string[] = []): Promise<string[]> {
	const { stdout } = await run(["ready", "--json", ...extra], cwd);
	const parsed = JSON.parse(stdout) as { issues: Array<{ id: string }> };
	return parsed.issues.map((i) => i.id);
}

async function setExtensions(seedId: string, ext: Record<string, unknown>): Promise<void> {
	const issuesPath = join(tmpDir, ".seeds", "issues.jsonl");
	const text = await Bun.file(issuesPath).text();
	const lines = text.split("\n").filter((l) => l.trim());
	const updated = lines.map((l) => {
		const obj = JSON.parse(l) as Record<string, unknown> & { id: string };
		if (obj.id === seedId) obj.extensions = ext;
		return JSON.stringify(obj);
	});
	await Bun.write(issuesPath, `${updated.join("\n")}\n`);
}

async function setRequiresPlan(seedId: string): Promise<void> {
	const issuesPath = join(tmpDir, ".seeds", "issues.jsonl");
	const text = await Bun.file(issuesPath).text();
	const lines = text.split("\n").filter((l) => l.trim());
	const updated = lines.map((l) => {
		const obj = JSON.parse(l) as Record<string, unknown> & { id: string };
		if (obj.id === seedId) obj.requires_plan = true;
		return JSON.stringify(obj);
	});
	await Bun.write(issuesPath, `${updated.join("\n")}\n`);
}

async function injectSubPlan(
	seedId: string,
	status: "draft" | "approved" | "active" | "done",
	planId = "pl-sub01",
): Promise<void> {
	const now = new Date().toISOString();
	const planRow = {
		id: planId,
		seed: seedId,
		template: "feature",
		status,
		revision: 1,
		sections: {},
		children: [],
		createdAt: now,
		updatedAt: now,
	};
	const planPath = join(tmpDir, ".seeds", "plans.jsonl");
	const existing = (await Bun.file(planPath).exists()) ? await Bun.file(planPath).text() : "";
	await Bun.write(
		planPath,
		`${existing.trim() ? `${existing.trimEnd()}\n` : ""}${JSON.stringify(planRow)}\n`,
	);
}

async function createSeed(title: string, cwd: string, type = "task"): Promise<string> {
	const { stdout } = await run(["create", "--title", title, "--type", type, "--json"], cwd);
	return (JSON.parse(stdout) as { id: string }).id;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-ready-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd ready: requires_plan exclusion (PLAN_SPEC.md:342)", () => {
	test("seed with requires_plan and no plan is hidden from ready", async () => {
		const seedId = await createSeed("Needs sub-plan", tmpDir, "epic");
		await setRequiresPlan(seedId);
		const ids = await readyIds(tmpDir);
		expect(ids).not.toContain(seedId);
	});

	test("seed with requires_plan and a draft sub-plan is still hidden", async () => {
		const seedId = await createSeed("Drafted child", tmpDir, "epic");
		await setRequiresPlan(seedId);
		await injectSubPlan(seedId, "draft");
		const ids = await readyIds(tmpDir);
		expect(ids).not.toContain(seedId);
	});

	test("seed with requires_plan becomes ready once its sub-plan is approved", async () => {
		const seedId = await createSeed("Approved child", tmpDir, "epic");
		await setRequiresPlan(seedId);
		await injectSubPlan(seedId, "approved");
		const ids = await readyIds(tmpDir);
		expect(ids).toContain(seedId);
	});

	test("approved sub-plan + open child blocker keeps the seed hidden", async () => {
		const blocker = await createSeed("Blocker", tmpDir);
		const seedId = await createSeed("Blocked epic", tmpDir, "epic");
		await setRequiresPlan(seedId);
		await injectSubPlan(seedId, "approved");
		await run(["dep", "add", seedId, blocker], tmpDir);

		const ids = await readyIds(tmpDir);
		expect(ids).not.toContain(seedId);
		expect(ids).toContain(blocker);

		// Closing the blocker un-hides the seed.
		await run(["close", blocker, "--reason", "done"], tmpDir);
		const after = await readyIds(tmpDir);
		expect(after).toContain(seedId);
	});

	test("--json output includes requires_plan when present", async () => {
		const seedId = await createSeed("Surfaced once approved", tmpDir, "epic");
		await setRequiresPlan(seedId);
		await injectSubPlan(seedId, "approved");

		const { stdout } = await run(["ready", "--json"], tmpDir);
		const parsed = JSON.parse(stdout) as {
			issues: Array<{ id: string; requires_plan?: boolean }>;
		};
		const found = parsed.issues.find((i) => i.id === seedId);
		expect(found?.requires_plan).toBe(true);
	});

	test("seeds without requires_plan behave exactly as before (regression)", async () => {
		const a = await createSeed("Plain a", tmpDir);
		const b = await createSeed("Plain b", tmpDir);
		const ids = await readyIds(tmpDir);
		expect(ids).toContain(a);
		expect(ids).toContain(b);
	});
});

describe("sd ready --respect-schedule (pl-c195 step 4)", () => {
	test("default sd ready ignores extensions.queued and extensions.scheduledFor", async () => {
		const queued = await createSeed("Queued", tmpDir);
		const future = await createSeed("Future", tmpDir);
		await setExtensions(queued, { queued: true });
		await setExtensions(future, {
			scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
		});
		const ids = await readyIds(tmpDir);
		expect(ids).toContain(queued);
		expect(ids).toContain(future);
	});

	test("--respect-schedule excludes extensions.queued === true", async () => {
		const queued = await createSeed("Queued", tmpDir);
		const plain = await createSeed("Plain", tmpDir);
		await setExtensions(queued, { queued: true });
		const ids = await readyIds(tmpDir, ["--respect-schedule"]);
		expect(ids).not.toContain(queued);
		expect(ids).toContain(plain);
	});

	test("--respect-schedule excludes future extensions.scheduledFor", async () => {
		const future = await createSeed("Future", tmpDir);
		const past = await createSeed("Past", tmpDir);
		const plain = await createSeed("Plain", tmpDir);
		await setExtensions(future, {
			scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
		});
		await setExtensions(past, {
			scheduledFor: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
		});
		const ids = await readyIds(tmpDir, ["--respect-schedule"]);
		expect(ids).not.toContain(future);
		expect(ids).toContain(past);
		expect(ids).toContain(plain);
	});

	test("--respect-schedule treats truthy non-true queued as not parked", async () => {
		// extensions.queued must be strictly true to park; "yes"/1/{} pass through.
		const truthy = await createSeed("Truthy", tmpDir);
		await setExtensions(truthy, { queued: "yes" });
		const ids = await readyIds(tmpDir, ["--respect-schedule"]);
		expect(ids).toContain(truthy);
	});

	test("--respect-schedule tolerates malformed scheduledFor", async () => {
		const bad = await createSeed("Bad timestamp", tmpDir);
		await setExtensions(bad, { scheduledFor: "not-a-date" });
		const ids = await readyIds(tmpDir, ["--respect-schedule"]);
		expect(ids).toContain(bad);
	});

	test("queued + future scheduledFor are both excluded together", async () => {
		const both = await createSeed("Both", tmpDir);
		await setExtensions(both, {
			queued: true,
			scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
		});
		const ids = await readyIds(tmpDir, ["--respect-schedule"]);
		expect(ids).not.toContain(both);
	});
});
