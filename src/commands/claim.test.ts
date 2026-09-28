import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";
import type { Issue } from "../types.ts";

const CLI = join(import.meta.dir, "../index.ts");

let tmpDir: string;

async function runJson<T = unknown>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await runCli([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

async function create(title: string, cwd: string): Promise<string> {
	return (await runJson<{ id: string }>(["create", "--title", title], cwd)).id;
}

async function show(id: string, cwd: string): Promise<Issue> {
	return (await runJson<{ issue: Issue }>(["show", id], cwd)).issue;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-claim-test-"));
	await runCli(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd update --claim", () => {
	test("claims an open unassigned issue: in_progress + assignee", async () => {
		const id = await create("claim-1", tmpDir);
		const { exitCode } = await runCli(["update", id, "--claim", "--as", "agent-a"], tmpDir);
		expect(exitCode).toBe(0);
		const issue = await show(id, tmpDir);
		expect(issue.status).toBe("in_progress");
		expect(issue.assignee).toBe("agent-a");
	});

	test("fails when the issue is already in_progress", async () => {
		const id = await create("claim-2", tmpDir);
		await runCli(["update", id, "--claim", "--as", "agent-a"], tmpDir);
		const res = await runCli(["update", id, "--claim", "--as", "agent-b"], tmpDir);
		expect(res.exitCode).not.toBe(0);
		expect(res.stderr).toContain(`Cannot claim ${id}: status is in_progress by agent-a`);
		expect((await show(id, tmpDir)).assignee).toBe("agent-a");
	});

	test("fails on a closed issue", async () => {
		const id = await create("claim-3", tmpDir);
		await runCli(["close", id], tmpDir);
		const res = await runCli(["update", id, "--claim", "--as", "agent-a"], tmpDir);
		expect(res.exitCode).not.toBe(0);
		expect(res.stderr).toContain("status is closed");
	});

	test("fails when open but assigned to someone else", async () => {
		const id = await create("claim-4", tmpDir);
		await runCli(["update", id, "--assignee", "agent-a"], tmpDir);
		const res = await runCli(["update", id, "--claim", "--as", "agent-b"], tmpDir);
		expect(res.exitCode).not.toBe(0);
		expect(res.stderr).toContain("already assigned to agent-a");
		expect((await show(id, tmpDir)).status).toBe("open");
	});

	test("succeeds when open and already assigned to the caller", async () => {
		const id = await create("claim-5", tmpDir);
		await runCli(["update", id, "--assignee", "agent-a"], tmpDir);
		const res = await runCli(["update", id, "--claim", "--as", "agent-a"], tmpDir);
		expect(res.exitCode).toBe(0);
		expect((await show(id, tmpDir)).status).toBe("in_progress");
	});

	test("defaults identity to $USER when --as is omitted", async () => {
		const id = await create("claim-6", tmpDir);
		const prev = process.env.USER;
		process.env.USER = "env-user";
		try {
			expect((await runCli(["update", id, "--claim"], tmpDir)).exitCode).toBe(0);
		} finally {
			process.env.USER = prev;
		}
		expect((await show(id, tmpDir)).assignee).toBe("env-user");
	});

	test("errors without an identity", async () => {
		const id = await create("claim-7", tmpDir);
		const prev = process.env.USER;
		process.env.USER = "";
		try {
			const res = await runCli(["update", id, "--claim"], tmpDir);
			expect(res.exitCode).not.toBe(0);
			expect(res.stderr).toContain("--claim needs an identity");
		} finally {
			process.env.USER = prev;
		}
	});

	test("rejects --claim with --status or --assignee", async () => {
		const id = await create("claim-8", tmpDir);
		for (const extra of [
			["--status", "open"],
			["--assignee", "x"],
		]) {
			const res = await runCli(["update", id, "--claim", "--as", "a", ...extra], tmpDir);
			expect(res.exitCode).not.toBe(0);
			expect(res.stderr).toContain("--claim cannot be combined");
		}
		expect((await show(id, tmpDir)).status).toBe("open");
	});

	test("concurrent claims from separate processes: exactly one wins", async () => {
		const id = await create("claim-race", tmpDir);
		const agents = ["a1", "a2", "a3", "a4", "a5", "a6"];
		const results = await Promise.all(
			agents.map(async (agent) => {
				const proc = Bun.spawn(["bun", "run", CLI, "update", id, "--claim", "--as", agent], {
					cwd: tmpDir,
					stdout: "pipe",
					stderr: "pipe",
					env: { ...process.env, NO_COLOR: "1" },
				});
				return { agent, exitCode: await proc.exited };
			}),
		);
		const winners = results.filter((r) => r.exitCode === 0);
		expect(winners).toHaveLength(1);
		const issue = await show(id, tmpDir);
		expect(issue.status).toBe("in_progress");
		expect(issue.assignee).toBe(winners[0]?.agent);
	}, 30_000);
});
