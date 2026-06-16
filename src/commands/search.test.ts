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

async function runJson<T = unknown>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

interface CreateOpts {
	priority?: number;
	type?: string;
	assignee?: string;
	description?: string;
}

async function create(title: string, opts: CreateOpts, cwd: string): Promise<string> {
	const args = ["create", "--title", title];
	if (opts.priority !== undefined) args.push("--priority", String(opts.priority));
	if (opts.type) args.push("--type", opts.type);
	if (opts.assignee) args.push("--assignee", opts.assignee);
	if (opts.description) args.push("--description", opts.description);
	const out = await runJson<{ id: string }>(args, cwd);
	return out.id;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-search-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd search", () => {
	test("matches substring in title", async () => {
		const retry = await create("Add retry logic to fetcher", {}, tmpDir);
		await create("Refactor logger", {}, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }>; count: number }>(
			["search", "retry"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([retry]);
		expect(result.count).toBe(1);
	});

	test("matches substring in description", async () => {
		const desc = await create(
			"Investigate flaky tests",
			{ description: "Likely caused by exponential backoff in retry path" },
			tmpDir,
		);
		await create("Update docs", { description: "Add quickstart section" }, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(["search", "backoff"], tmpDir);
		expect(result.issues.map((i) => i.id)).toEqual([desc]);
	});

	test("is case-insensitive", async () => {
		const a = await create("Add Retry Logic", {}, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(["search", "RETRY"], tmpDir);
		expect(result.issues.map((i) => i.id)).toEqual([a]);
	});

	test("includes closed issues by default", async () => {
		const a = await create("retry handler", {}, tmpDir);
		await run(["close", a], tmpDir);
		const result = await runJson<{ issues: Array<{ id: string; status: string }> }>(
			["search", "retry"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([a]);
		expect(result.issues[0]?.status).toBe("closed");
	});

	test("--status filters results", async () => {
		const open = await create("retry handler open", {}, tmpDir);
		const closed = await create("retry handler closed", {}, tmpDir);
		await run(["close", closed], tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["search", "retry", "--status", "open"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([open]);
	});

	test("--type filters results", async () => {
		const bug = await create("retry bug", { type: "bug" }, tmpDir);
		await create("retry task", { type: "task" }, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["search", "retry", "--type", "bug"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([bug]);
	});

	test("--assignee filters results", async () => {
		const mine = await create("retry mine", { assignee: "alice" }, tmpDir);
		await create("retry theirs", { assignee: "bob" }, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["search", "retry", "--assignee", "alice"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([mine]);
	});

	test("--label filters results", async () => {
		const a = await create("retry one", {}, tmpDir);
		const b = await create("retry two", {}, tmpDir);
		await run(["label", "add", a, "infra"], tmpDir);
		await run(["label", "add", b, "ui"], tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["search", "retry", "--label", "infra"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([a]);
	});

	test("--priority filters results", async () => {
		const crit = await create("retry crit", { priority: 0 }, tmpDir);
		await create("retry low", { priority: 3 }, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["search", "retry", "--priority", "0"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([crit]);
	});

	test("respects --limit", async () => {
		await create("retry a", {}, tmpDir);
		await create("retry b", {}, tmpDir);
		await create("retry c", {}, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }>; count: number }>(
			["search", "retry", "--limit", "2"],
			tmpDir,
		);
		expect(result.issues).toHaveLength(2);
		expect(result.count).toBe(2);
	});

	test("returns empty when nothing matches", async () => {
		await create("Add caching layer", {}, tmpDir);
		const result = await runJson<{ issues: unknown[]; count: number; query: string }>(
			["search", "nonexistentterm"],
			tmpDir,
		);
		expect(result.issues).toEqual([]);
		expect(result.count).toBe(0);
		expect(result.query).toBe("nonexistentterm");
	});

	test("ids format outputs only ids", async () => {
		const a = await create("retry handler", {}, tmpDir);
		const { stdout, exitCode } = await run(["search", "retry", "--format", "ids"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout.trim()).toBe(a);
	});

	test("missing query exits non-zero", async () => {
		const { exitCode, stderr } = await run(["search"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr.toLowerCase()).toMatch(/missing required argument|usage: sd search/);
	});

	test("plain output prints match count", async () => {
		await create("retry one", {}, tmpDir);
		const { stdout, exitCode } = await run(["search", "retry", "--format", "plain"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("retry one");
		expect(stdout).toContain("1 match(es)");
	});

	test("plain output reports no matches", async () => {
		await create("Add caching layer", {}, tmpDir);
		const { stdout, exitCode } = await run(["search", "retry", "--format", "plain"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('No issues match "retry"');
	});
});

describe("sd search plan annotation parity (seeds-350d)", () => {
	async function attachPlan(seedId: string, status = "approved"): Promise<void> {
		const now = new Date().toISOString();
		const planRow = {
			id: "pl-test01",
			seed: seedId,
			template: "feature",
			status,
			revision: 1,
			sections: {},
			children: [seedId],
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
		const text = await Bun.file(issuesPath).text();
		const lines = text.split("\n").filter((l) => l.trim());
		const updated = lines.map((l) => {
			const obj = JSON.parse(l) as Record<string, unknown> & { id: string };
			if (obj.id === seedId) obj.plan_id = "pl-test01";
			return JSON.stringify(obj);
		});
		await Bun.write(issuesPath, `${updated.join("\n")}\n`);
	}

	test("plain format renders plan suffix for planned seeds", async () => {
		const id = await create("planned retry", {}, tmpDir);
		await attachPlan(id);
		const { stdout, exitCode } = await run(["search", "retry", "--format", "plain"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(id);
		expect(stdout).toContain("[plan approved]");
	});

	test("default format renders plan suffix for planned seeds", async () => {
		const id = await create("planned retry", {}, tmpDir);
		await attachPlan(id);
		const { stdout, exitCode } = await run(["search", "retry"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(id);
		expect(stdout).toContain("[plan approved]");
	});

	test("no plan suffix when seed has no plan", async () => {
		await create("plain retry", {}, tmpDir);
		const { stdout } = await run(["search", "retry", "--format", "plain"], tmpDir);
		expect(stdout).not.toContain("[plan");
	});
});

describe("sd search --status / --type validation", () => {
	test("rejects invalid --status value (human)", async () => {
		const { exitCode, stderr } = await run(["search", "foo", "--status", "bogus"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --status value: bogus");
		expect(stderr).toContain("open|in_progress|closed");
	});

	test("rejects invalid --status value (--json)", async () => {
		const { exitCode, stdout } = await run(
			["search", "foo", "--status", "bogus", "--json"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		const payload = JSON.parse(stdout) as { success: boolean; command: string; error: string };
		expect(payload.success).toBe(false);
		expect(payload.command).toBe("search");
		expect(payload.error).toContain("Invalid --status value: bogus");
	});

	test("rejects invalid --type value (human)", async () => {
		const { exitCode, stderr } = await run(["search", "foo", "--type", "bogus"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --type value: bogus");
		expect(stderr).toContain("task|bug|feature|epic");
	});

	test("rejects invalid --type value (--json)", async () => {
		const { exitCode, stdout } = await run(["search", "foo", "--type", "bogus", "--json"], tmpDir);
		expect(exitCode).not.toBe(0);
		const payload = JSON.parse(stdout) as { success: boolean; command: string; error: string };
		expect(payload.success).toBe(false);
		expect(payload.command).toBe("search");
		expect(payload.error).toContain("Invalid --type value: bogus");
	});

	test("accepts valid --status and --type values", async () => {
		await create("hello world", { priority: 2 }, tmpDir);
		const { exitCode } = await run(
			["search", "hello", "--status", "open", "--type", "task"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
	});
});
