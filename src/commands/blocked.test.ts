import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";

let tmpDir: string;

async function attachPlan(
	seedId: string,
	childIds: string[],
	status: "draft" | "approved" | "active" | "done" = "approved",
	planId = "pl-blk01",
): Promise<void> {
	const now = new Date().toISOString();
	const planRow = {
		id: planId,
		seed: seedId,
		template: "feature",
		status,
		revision: 1,
		sections: {},
		children: childIds,
		createdAt: now,
		updatedAt: now,
	};
	const planPath = join(tmpDir, ".seeds", "plans.jsonl");
	const existing = (await Bun.file(planPath).exists()) ? await Bun.file(planPath).text() : "";
	await Bun.write(
		planPath,
		`${existing.trim() ? `${existing.trimEnd()}\n` : ""}${JSON.stringify(planRow)}\n`,
	);
	const issuesPath = join(tmpDir, ".seeds", "issues.jsonl");
	const lines = (await Bun.file(issuesPath).text()).trim().split("\n");
	const updated = lines.map((line) => {
		const obj = JSON.parse(line) as { id: string; plan_id?: string };
		if (childIds.includes(obj.id)) obj.plan_id = planId;
		return JSON.stringify(obj);
	});
	await Bun.write(issuesPath, `${updated.join("\n")}\n`);
}

async function run(args: string[], cwd: string) {
	return runCli(args, cwd);
}

async function runJson<T>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

async function createSeed(title: string, cwd: string): Promise<string> {
	const out = await runJson<{ id: string }>(["create", "--title", title], cwd);
	return out.id;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-blocked-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd blocked", () => {
	test("--json lists issues with unresolved blockers and skips closed-blocker case", async () => {
		const a = await createSeed("A", tmpDir);
		const b = await createSeed("B", tmpDir);
		const c = await createSeed("C", tmpDir);
		const d = await createSeed("D", tmpDir);

		// b blocked by open a → counted; c blocked by closed d → not counted.
		await run(["dep", "add", b, "--blocked-by", a], tmpDir);
		await run(["dep", "add", c, "--blocked-by", d], tmpDir);
		await run(["close", d], tmpDir);

		const out = await runJson<{
			success: boolean;
			command: string;
			issues: Array<{ id: string }>;
			count: number;
		}>(["blocked"], tmpDir);
		expect(out.success).toBe(true);
		expect(out.command).toBe("blocked");
		expect(out.count).toBe(1);
		expect(out.issues.map((i) => i.id)).toEqual([b]);
	});

	test("empty store prints 'No blocked issues.' in human mode", async () => {
		const { stdout, exitCode } = await run(["blocked"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("No blocked issues.");
	});

	test("plain output includes plan suffix for plan-attached blocked issues", async () => {
		const parent = await createSeed("Parent epic", tmpDir);
		const blocker = await createSeed("Blocker", tmpDir);
		const child = await createSeed("Blocked child", tmpDir);
		await run(["dep", "add", child, "--blocked-by", blocker], tmpDir);
		await attachPlan(parent, [child], "approved");

		const { stdout, exitCode } = await run(["blocked", "--format", "plain"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(child);
		expect(stdout).toContain("[plan approved]");
	});

	test("default output includes plan suffix for plan-attached blocked issues", async () => {
		const parent = await createSeed("Parent epic", tmpDir);
		const blocker = await createSeed("Blocker", tmpDir);
		const child = await createSeed("Blocked child", tmpDir);
		await run(["dep", "add", child, "--blocked-by", blocker], tmpDir);
		await attachPlan(parent, [child], "approved");

		const { stdout, exitCode } = await run(["blocked"], tmpDir);
		expect(exitCode).toBe(0);
		// Default output is chalk-colored; strip ANSI to assert on content.
		// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI stripping
		const plain = stdout.replace(/\u001b\[[0-9;]*m/g, "");
		expect(plain).toContain(child);
		expect(plain).toContain("[plan approved]");
	});

	test("--json output includes plan_status/plan_children when plan attached", async () => {
		const parent = await createSeed("Parent epic", tmpDir);
		const blocker = await createSeed("Blocker", tmpDir);
		const child = await createSeed("Blocked child", tmpDir);
		await run(["dep", "add", child, "--blocked-by", blocker], tmpDir);
		await attachPlan(parent, [child], "approved");

		const out = await runJson<{
			success: boolean;
			command: string;
			issues: Array<{ id: string; plan_status?: string; plan_children?: string[] }>;
			count: number;
		}>(["blocked"], tmpDir);
		expect(out.count).toBe(1);
		expect(out.issues[0]?.id).toBe(child);
		expect(out.issues[0]?.plan_status).toBe("approved");
		expect(out.issues[0]?.plan_children).toEqual([child]);
	});

	test("invalid --format errors out with non-zero exit", async () => {
		const { exitCode, stderr } = await run(["blocked", "--format", "bogus"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr.length).toBeGreaterThan(0);
	});
});
