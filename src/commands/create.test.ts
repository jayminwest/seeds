import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;

const CLI = join(import.meta.dir, "../../src/index.ts");

async function run(
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(["bun", "run", CLI, ...args], {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
	});
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	return { stdout, stderr, exitCode };
}

async function runJson<T = unknown>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-create-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd create", () => {
	test("creates an issue with required title", async () => {
		const result = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "My first issue"],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.id).toMatch(/^.+-[0-9a-f]{4}$/);
	});

	test("requires --title flag", async () => {
		const { exitCode } = await run(["create"], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("defaults to type=task", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Task issue"],
			tmpDir,
		);
		const show = await runJson<{ success: boolean; issue: { type: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.type).toBe("task");
	});

	test("defaults to priority=2 (medium)", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Medium priority issue"],
			tmpDir,
		);
		const show = await runJson<{ success: boolean; issue: { priority: number } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.priority).toBe(2);
	});

	test("accepts --type flag", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Bug issue", "--type", "bug"],
			tmpDir,
		);
		const show = await runJson<{ success: boolean; issue: { type: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.type).toBe("bug");
	});

	test("accepts --type feature", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Feature issue", "--type", "feature"],
			tmpDir,
		);
		const show = await runJson<{ success: boolean; issue: { type: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.type).toBe("feature");
	});

	test("accepts --type epic", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Epic issue", "--type", "epic"],
			tmpDir,
		);
		const show = await runJson<{ success: boolean; issue: { type: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.type).toBe("epic");
	});

	test("accepts --priority as number", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "High priority", "--priority", "1"],
			tmpDir,
		);
		const show = await runJson<{ success: boolean; issue: { priority: number } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.priority).toBe(1);
	});

	test("accepts --priority as P-notation (P1 = 1)", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "P1 issue", "--priority", "P1"],
			tmpDir,
		);
		const show = await runJson<{ success: boolean; issue: { priority: number } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.priority).toBe(1);
	});

	test("accepts --description", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "With description", "--description", "Some details"],
			tmpDir,
		);
		const show = await runJson<{ success: boolean; issue: { description?: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.description).toBe("Some details");
	});

	test("accepts --assignee", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Assigned issue", "--assignee", "builder-1"],
			tmpDir,
		);
		const show = await runJson<{ success: boolean; issue: { assignee?: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.assignee).toBe("builder-1");
	});

	test("new issue has status=open", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Open issue"],
			tmpDir,
		);
		const show = await runJson<{ success: boolean; issue: { status: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.status).toBe("open");
	});

	test("new issue has createdAt and updatedAt timestamps", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Timestamped issue"],
			tmpDir,
		);
		const show = await runJson<{
			success: boolean;
			issue: { createdAt: string; updatedAt: string };
		}>(["show", create.id], tmpDir);
		expect(show.issue.createdAt).toBeTruthy();
		expect(show.issue.updatedAt).toBeTruthy();
		// Should be valid ISO 8601
		expect(new Date(show.issue.createdAt).toISOString()).toBe(show.issue.createdAt);
	});
});

describe("sd show", () => {
	test("returns issue by id", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Show test"],
			tmpDir,
		);
		const show = await runJson<{ success: boolean; issue: { id: string; title: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.success).toBe(true);
		expect(show.issue.id).toBe(create.id);
		expect(show.issue.title).toBe("Show test");
	});

	test("fails for unknown id", async () => {
		const result = await runJson<{ success: boolean; error: string }>(
			["show", "proj-ffff"],
			tmpDir,
		);
		expect(result.success).toBe(false);
		expect(result.error).toBeTruthy();
	});
});

describe("sd list", () => {
	test("lists all issues by default", async () => {
		await run(["create", "--title", "Issue 1"], tmpDir);
		await run(["create", "--title", "Issue 2"], tmpDir);
		const result = await runJson<{ success: boolean; issues: unknown[]; count: number }>(
			["list"],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.count).toBe(2);
		expect(result.issues).toHaveLength(2);
	});

	test("filters by --status", async () => {
		const c1 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Open issue"],
			tmpDir,
		);
		const c2 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "In progress issue"],
			tmpDir,
		);
		await run(["update", c2.id, "--status", "in_progress"], tmpDir);

		const result = await runJson<{
			success: boolean;
			issues: Array<{ id: string }>;
			count: number;
		}>(["list", "--status", "open"], tmpDir);
		expect(result.count).toBe(1);
		expect(result.issues[0]?.id).toBe(c1.id);
	});

	test("filters by --type", async () => {
		await run(["create", "--title", "Task 1", "--type", "task"], tmpDir);
		await run(["create", "--title", "Bug 1", "--type", "bug"], tmpDir);

		const result = await runJson<{ success: boolean; issues: unknown[]; count: number }>(
			["list", "--type", "bug"],
			tmpDir,
		);
		expect(result.count).toBe(1);
	});

	test("filters by --assignee", async () => {
		await run(["create", "--title", "Assigned", "--assignee", "alice"], tmpDir);
		await run(["create", "--title", "Unassigned"], tmpDir);

		const result = await runJson<{ success: boolean; issues: unknown[]; count: number }>(
			["list", "--assignee", "alice"],
			tmpDir,
		);
		expect(result.count).toBe(1);
	});

	test("respects --limit", async () => {
		for (let i = 0; i < 5; i++) {
			await run(["create", "--title", `Issue ${i}`], tmpDir);
		}
		const result = await runJson<{ success: boolean; issues: unknown[]; count: number }>(
			["list", "--limit", "3"],
			tmpDir,
		);
		expect(result.issues).toHaveLength(3);
	});
});

describe("sd update", () => {
	test("updates status to in_progress", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Issue to update"],
			tmpDir,
		);
		await run(["update", create.id, "--status", "in_progress"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { status: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.status).toBe("in_progress");
	});

	test("updates title", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Old title"],
			tmpDir,
		);
		await run(["update", create.id, "--title", "New title"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { title: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.title).toBe("New title");
	});

	test("updates priority", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Issue"],
			tmpDir,
		);
		await run(["update", create.id, "--priority", "0"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { priority: number } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.priority).toBe(0);
	});

	test("updates updatedAt timestamp", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Issue"],
			tmpDir,
		);
		const before = await runJson<{ success: boolean; issue: { updatedAt: string } }>(
			["show", create.id],
			tmpDir,
		);
		// Small delay to ensure timestamp differs
		await new Promise((r) => setTimeout(r, 10));
		await run(["update", create.id, "--title", "Updated"], tmpDir);
		const after = await runJson<{ success: boolean; issue: { updatedAt: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(after.issue.updatedAt >= before.issue.updatedAt).toBe(true);
	});

	test("fails for unknown id", async () => {
		const { exitCode } = await run(["update", "proj-ffff", "--title", "Nope"], tmpDir);
		expect(exitCode).not.toBe(0);
	});
});

describe("sd close", () => {
	test("closes an issue", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Issue to close"],
			tmpDir,
		);
		await run(["close", create.id], tmpDir);
		const show = await runJson<{ success: boolean; issue: { status: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.status).toBe("closed");
	});

	test("sets closedAt timestamp", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Issue to close"],
			tmpDir,
		);
		await run(["close", create.id], tmpDir);
		const show = await runJson<{ success: boolean; issue: { closedAt?: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.closedAt).toBeTruthy();
	});

	test("accepts --reason", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Done issue"],
			tmpDir,
		);
		await run(["close", create.id, "--reason", "Completed in PR #42"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { closeReason?: string } }>(
			["show", create.id],
			tmpDir,
		);
		expect(show.issue.closeReason).toBe("Completed in PR #42");
	});

	test("closes multiple issues at once", async () => {
		const c1 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Issue 1"],
			tmpDir,
		);
		const c2 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Issue 2"],
			tmpDir,
		);
		await run(["close", c1.id, c2.id], tmpDir);

		const s1 = await runJson<{ success: boolean; issue: { status: string } }>(
			["show", c1.id],
			tmpDir,
		);
		const s2 = await runJson<{ success: boolean; issue: { status: string } }>(
			["show", c2.id],
			tmpDir,
		);
		expect(s1.issue.status).toBe("closed");
		expect(s2.issue.status).toBe("closed");
	});
});

describe("sd ready", () => {
	test("returns open issues with no blockers", async () => {
		await run(["create", "--title", "Ready issue"], tmpDir);
		const result = await runJson<{ success: boolean; issues: unknown[] }>(["ready"], tmpDir);
		expect(result.success).toBe(true);
		expect(result.issues.length).toBeGreaterThan(0);
	});

	test("excludes blocked issues", async () => {
		const c1 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Blocker"],
			tmpDir,
		);
		const c2 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Blocked"],
			tmpDir,
		);
		await run(["dep", "add", c2.id, c1.id], tmpDir);

		const result = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["ready"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).not.toContain(c2.id);
		expect(ids).toContain(c1.id);
	});

	test("excludes closed and in_progress issues", async () => {
		const c1 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Closed"],
			tmpDir,
		);
		const c2 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "In progress"],
			tmpDir,
		);
		await run(["close", c1.id], tmpDir);
		await run(["update", c2.id, "--status", "in_progress"], tmpDir);
		await run(["create", "--title", "Open"], tmpDir);

		const result = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["ready"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).not.toContain(c1.id);
		expect(ids).not.toContain(c2.id);
	});
});

describe("sd blocked", () => {
	test("shows blocked issues", async () => {
		const c1 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Blocker"],
			tmpDir,
		);
		const c2 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Blocked"],
			tmpDir,
		);
		await run(["dep", "add", c2.id, c1.id], tmpDir);

		const result = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["blocked"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(c2.id);
	});

	test("returns empty list when no blocked issues", async () => {
		await run(["create", "--title", "Free issue"], tmpDir);
		const result = await runJson<{ success: boolean; issues: unknown[] }>(["blocked"], tmpDir);
		expect(result.issues).toHaveLength(0);
	});
});

describe("sd stats", () => {
	test("returns project statistics", async () => {
		await run(["create", "--title", "Open 1"], tmpDir);
		const c2 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Closed 1"],
			tmpDir,
		);
		await run(["close", c2.id], tmpDir);

		const result = await runJson<{
			success: boolean;
			stats: { open: number; closed: number; total: number };
		}>(["stats"], tmpDir);
		expect(result.success).toBe(true);
		expect(result.stats.open).toBe(1);
		expect(result.stats.closed).toBe(1);
		expect(result.stats.total).toBe(2);
	});
});
