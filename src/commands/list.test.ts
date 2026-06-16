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

async function create(title: string, priority: number, cwd: string): Promise<string> {
	const out = await runJson<{ id: string }>(
		["create", "--title", title, "--priority", String(priority)],
		cwd,
	);
	return out.id;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-listsort-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd list sort", () => {
	test("defaults to priority asc, P0 first", async () => {
		await create("low", 3, tmpDir);
		await create("crit", 0, tmpDir);
		await create("med", 2, tmpDir);
		const result = await runJson<{ issues: Array<{ priority: number }> }>(["list"], tmpDir);
		expect(result.issues.map((i) => i.priority)).toEqual([0, 2, 3]);
	});

	test("--sort created sorts newest first", async () => {
		const a = await create("a", 2, tmpDir);
		await new Promise((r) => setTimeout(r, 5));
		const b = await create("b", 2, tmpDir);
		await new Promise((r) => setTimeout(r, 5));
		const c = await create("c", 2, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["list", "--sort", "created"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([c, b, a]);
	});

	test("--sort id sorts ascending by id", async () => {
		await create("a", 0, tmpDir);
		await create("b", 3, tmpDir);
		await create("c", 1, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["list", "--sort", "id"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect([...ids].sort()).toEqual(ids);
	});

	test("rejects invalid --sort value", async () => {
		await create("a", 2, tmpDir);
		const { exitCode, stderr } = await run(["list", "--sort", "bogus"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --sort value");
	});
});

describe("sd ready sort", () => {
	test("defaults to priority asc, P0 first", async () => {
		await create("low", 3, tmpDir);
		await create("crit", 0, tmpDir);
		await create("med", 2, tmpDir);
		const result = await runJson<{ issues: Array<{ priority: number }> }>(["ready"], tmpDir);
		expect(result.issues.map((i) => i.priority)).toEqual([0, 2, 3]);
	});

	test("--sort updated honored", async () => {
		const a = await create("a", 2, tmpDir);
		const b = await create("b", 2, tmpDir);
		await new Promise((r) => setTimeout(r, 10));
		await run(["update", a, "--title", "a-prime"], tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["ready", "--sort", "updated"],
			tmpDir,
		);
		expect(result.issues[0]?.id).toBe(a);
		expect(result.issues[1]?.id).toBe(b);
	});

	test("rejects invalid --sort value", async () => {
		await create("a", 2, tmpDir);
		const { exitCode, stderr } = await run(["ready", "--sort", "bogus"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --sort value");
	});
});

describe("sd ready filters", () => {
	async function createTyped(
		title: string,
		type: string,
		cwd: string,
		extra: string[] = [],
	): Promise<string> {
		const out = await runJson<{ id: string }>(
			["create", "--title", title, "--type", type, ...extra],
			cwd,
		);
		return out.id;
	}

	test("--type filters ready issues", async () => {
		const bug = await createTyped("a bug", "bug", tmpDir);
		await createTyped("a task", "task", tmpDir);
		const result = await runJson<{ issues: Array<{ id: string; type: string }> }>(
			["ready", "--type", "bug"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([bug]);
	});

	test("--assignee filters ready issues", async () => {
		const mine = await createTyped("mine", "task", tmpDir, ["--assignee", "alice"]);
		await createTyped("theirs", "task", tmpDir, ["--assignee", "bob"]);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["ready", "--assignee", "alice"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([mine]);
	});

	test("--label AND filter on ready issues", async () => {
		const a = await create("a", 2, tmpDir);
		const b = await create("b", 2, tmpDir);
		await run(["label", "add", a, "bug", "ui"], tmpDir);
		await run(["label", "add", b, "bug"], tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["ready", "--label", "bug,ui"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(a);
		expect(ids).not.toContain(b);
	});

	test("--label-any OR filter on ready issues", async () => {
		const a = await create("a", 2, tmpDir);
		const b = await create("b", 2, tmpDir);
		const c = await create("c", 2, tmpDir);
		await run(["label", "add", a, "ui"], tmpDir);
		await run(["label", "add", b, "backend"], tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["ready", "--label-any", "ui,backend"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(a);
		expect(ids).toContain(b);
		expect(ids).not.toContain(c);
	});

	test("--unlabeled returns only ready issues with no labels", async () => {
		const bare = await create("bare", 2, tmpDir);
		const tagged = await create("tagged", 2, tmpDir);
		await run(["label", "add", tagged, "bug"], tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["ready", "--unlabeled"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(bare);
		expect(ids).not.toContain(tagged);
	});

	test("--limit caps the number of ready issues", async () => {
		await create("a", 2, tmpDir);
		await create("b", 2, tmpDir);
		await create("c", 2, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }>; count: number }>(
			["ready", "--limit", "2"],
			tmpDir,
		);
		expect(result.issues).toHaveLength(2);
		expect(result.count).toBe(2);
	});

	test("filters compose with sort", async () => {
		const lowBug = await createTyped("low bug", "bug", tmpDir, ["--priority", "3"]);
		const critBug = await createTyped("crit bug", "bug", tmpDir, ["--priority", "0"]);
		await createTyped("a task", "task", tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["ready", "--type", "bug"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([critBug, lowBug]);
	});
});

describe("sd list/ready priority filters", () => {
	test("--priority numeric exact match (single)", async () => {
		const crit = await create("crit", 0, tmpDir);
		await create("med", 2, tmpDir);
		await create("low", 3, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["list", "--priority", "0"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([crit]);
	});

	test("--priority comma-separated set", async () => {
		const crit = await create("crit", 0, tmpDir);
		const high = await create("high", 1, tmpDir);
		await create("med", 2, tmpDir);
		await create("low", 3, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string; priority: number }> }>(
			["list", "--priority", "0,1"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(crit);
		expect(ids).toContain(high);
		expect(ids).toHaveLength(2);
	});

	test("--priority accepts P-prefixed forms", async () => {
		const crit = await create("crit", 0, tmpDir);
		const high = await create("high", 1, tmpDir);
		await create("med", 2, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["list", "--priority", "P0,P1"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(crit);
		expect(ids).toContain(high);
		expect(ids).toHaveLength(2);
	});

	test("--priority-max acts as ceiling (numeric)", async () => {
		const crit = await create("crit", 0, tmpDir);
		const high = await create("high", 1, tmpDir);
		await create("med", 2, tmpDir);
		await create("low", 3, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["list", "--priority-max", "1"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(crit);
		expect(ids).toContain(high);
		expect(ids).toHaveLength(2);
	});

	test("--priority-max accepts P-prefixed form", async () => {
		await create("crit", 0, tmpDir);
		await create("high", 1, tmpDir);
		const med = await create("med", 2, tmpDir);
		const low = await create("low", 3, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["list", "--priority-max", "P3", "--priority", "2,3"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(med);
		expect(ids).toContain(low);
		expect(ids).toHaveLength(2);
	});

	test("sd ready honors --priority", async () => {
		const crit = await create("crit", 0, tmpDir);
		await create("low", 3, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["ready", "--priority", "0"],
			tmpDir,
		);
		expect(result.issues.map((i) => i.id)).toEqual([crit]);
	});

	test("sd ready honors --priority-max", async () => {
		const crit = await create("crit", 0, tmpDir);
		const high = await create("high", 1, tmpDir);
		await create("med", 2, tmpDir);
		const result = await runJson<{ issues: Array<{ id: string }> }>(
			["ready", "--priority-max", "1"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toEqual([crit, high]);
	});

	test("rejects invalid --priority value", async () => {
		await create("a", 2, tmpDir);
		const { exitCode, stderr } = await run(["list", "--priority", "9"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid priority");
	});

	test("rejects invalid --priority-max value", async () => {
		await create("a", 2, tmpDir);
		const { exitCode, stderr } = await run(["list", "--priority-max", "Pfoo"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid priority");
	});
});

describe("--limit validation", () => {
	test("sd list --limit 0 returns zero issues (not the default 50)", async () => {
		await create("a", 2, tmpDir);
		await create("b", 2, tmpDir);
		const result = await runJson<{ issues: unknown[]; count: number }>(
			["list", "--limit", "0"],
			tmpDir,
		);
		expect(result.issues).toHaveLength(0);
		expect(result.count).toBe(0);
	});

	test("sd list rejects negative --limit", async () => {
		await create("a", 2, tmpDir);
		const { exitCode, stderr } = await run(["list", "--limit", "-1"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --limit");
	});

	test("sd list rejects non-numeric --limit", async () => {
		await create("a", 2, tmpDir);
		const { exitCode, stderr } = await run(["list", "--limit", "abc"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --limit");
	});

	test("sd list --limit invalid surfaces error in JSON mode", async () => {
		await create("a", 2, tmpDir);
		const { stdout, exitCode } = await run(["list", "--limit", "-1", "--json"], tmpDir);
		expect(exitCode).not.toBe(0);
		const parsed = JSON.parse(stdout) as { success: boolean; error: string };
		expect(parsed.success).toBe(false);
		expect(parsed.error).toContain("Invalid --limit");
	});

	test("sd ready --limit 0 returns zero issues", async () => {
		await create("a", 2, tmpDir);
		const result = await runJson<{ issues: unknown[] }>(["ready", "--limit", "0"], tmpDir);
		expect(result.issues).toHaveLength(0);
	});

	test("sd ready rejects negative --limit", async () => {
		await create("a", 2, tmpDir);
		const { exitCode, stderr } = await run(["ready", "--limit", "-1"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --limit");
	});

	test("sd search --limit 0 returns zero issues", async () => {
		await create("alpha", 2, tmpDir);
		await create("alphabet", 2, tmpDir);
		const result = await runJson<{ issues: unknown[] }>(
			["search", "alpha", "--limit", "0"],
			tmpDir,
		);
		expect(result.issues).toHaveLength(0);
	});

	test("sd search rejects negative --limit", async () => {
		await create("alpha", 2, tmpDir);
		const { exitCode, stderr } = await run(["search", "alpha", "--limit", "-1"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --limit");
	});
});

describe("sd list -q gates plan suffix branch (seeds-6848)", () => {
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

	test("sd list -q suppresses the issue line for seeds carrying plan suffixes", async () => {
		const id = await create("planned", 2, tmpDir);
		await attachPlan(id);
		const { stdout } = await run(["list", "-q"], tmpDir);
		expect(stdout).not.toContain(id);
		expect(stdout).not.toContain("[plan approved]");
	});

	test("sd ready -q suppresses the issue line for seeds carrying plan suffixes", async () => {
		const id = await create("planned", 2, tmpDir);
		await attachPlan(id);
		const { stdout } = await run(["ready", "-q"], tmpDir);
		expect(stdout).not.toContain(id);
		expect(stdout).not.toContain("[plan approved]");
	});

	test("sd list without -q still emits plan suffix", async () => {
		const id = await create("planned", 2, tmpDir);
		await attachPlan(id);
		const { stdout } = await run(["list"], tmpDir);
		expect(stdout).toContain(id);
		expect(stdout).toContain("[plan approved]");
	});
});

describe("sd list --status / --type validation", () => {
	test("rejects invalid --status value (human)", async () => {
		const { exitCode, stderr } = await run(["list", "--status", "bogus"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --status value: bogus");
		expect(stderr).toContain("open|in_progress|closed");
	});

	test("rejects invalid --status value (--json)", async () => {
		const { exitCode, stdout } = await run(["list", "--status", "bogus", "--json"], tmpDir);
		expect(exitCode).not.toBe(0);
		const payload = JSON.parse(stdout) as { success: boolean; command: string; error: string };
		expect(payload.success).toBe(false);
		expect(payload.command).toBe("list");
		expect(payload.error).toContain("Invalid --status value: bogus");
	});

	test("rejects invalid --type value (human)", async () => {
		const { exitCode, stderr } = await run(["list", "--type", "bogus"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --type value: bogus");
		expect(stderr).toContain("task|bug|feature|epic");
	});

	test("rejects invalid --type value (--json)", async () => {
		const { exitCode, stdout } = await run(["list", "--type", "bogus", "--json"], tmpDir);
		expect(exitCode).not.toBe(0);
		const payload = JSON.parse(stdout) as { success: boolean; command: string; error: string };
		expect(payload.success).toBe(false);
		expect(payload.command).toBe("list");
		expect(payload.error).toContain("Invalid --type value: bogus");
	});

	test("accepts valid --status and --type values", async () => {
		await create("a", 2, tmpDir);
		const { exitCode } = await run(["list", "--status", "open", "--type", "task"], tmpDir);
		expect(exitCode).toBe(0);
	});
});
