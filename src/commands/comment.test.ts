import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;
let issueId: string;

const CLI = join(import.meta.dir, "../../src/index.ts");

async function run(
	args: string[],
	cwd: string,
	env?: Record<string, string>,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(["bun", "run", CLI, ...args], {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
		env: { ...process.env, ...env },
	});
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	return { stdout, stderr, exitCode };
}

async function runJson<T = unknown>(
	args: string[],
	cwd: string,
	env?: Record<string, string>,
): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd, env);
	return JSON.parse(stdout) as T;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-comment-test-"));
	await run(["init"], tmpDir);

	const result = await runJson<{ success: boolean; id: string }>(
		["create", "--title", "Test issue for comments"],
		tmpDir,
	);
	issueId = result.id;
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd comment add", () => {
	test("adds a comment to an issue", async () => {
		const result = await runJson<{
			success: boolean;
			command: string;
			issueId: string;
			commentId: string;
		}>(["comment", "add", issueId, "Hello world", "--author", "tester"], tmpDir);
		expect(result.success).toBe(true);
		expect(result.command).toBe("comment add");
		expect(result.issueId).toBe(issueId);
		expect(result.commentId).toMatch(/^c-/);
	});

	test("uses SEEDS_AUTHOR env var when --author not provided", async () => {
		const result = await runJson<{ success: boolean; commentId: string }>(
			["comment", "add", issueId, "Env author test"],
			tmpDir,
			{ SEEDS_AUTHOR: "env-user" },
		);
		expect(result.success).toBe(true);
		expect(result.commentId).toMatch(/^c-/);
	});

	test("fails without author", async () => {
		const { exitCode } = await run(["comment", "add", issueId, "No author"], tmpDir, {
			SEEDS_AUTHOR: "",
		});
		expect(exitCode).not.toBe(0);
	});

	test("fails with empty body", async () => {
		const { exitCode } = await run(["comment", "add", issueId, "", "--author", "tester"], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("fails for nonexistent issue", async () => {
		const { exitCode } = await run(
			["comment", "add", "proj-ffff", "body", "--author", "tester"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
	});

	test("--json flag before body does not consume body as its value", async () => {
		// Regression: old parseArgs() treated --json as a value flag, so
		// `sd comment add PROJ --json "body"` would consume "body" as --json's value
		// and then fail because the body positional was missing.
		// Pass --json before the body to exercise this ordering.
		const { stdout, exitCode } = await run(
			["comment", "add", issueId, "--json", "my comment body", "--author", "tester"],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { success: boolean; commentId: string };
		expect(result.success).toBe(true);
		// Verify the comment was stored with the correct body (not consumed by --json)
		const list = await runJson<{
			success: boolean;
			comments: Array<{ id: string; body: string }>;
			count: number;
		}>(["comment", "list", issueId], tmpDir);
		expect(list.count).toBe(1);
		expect(list.comments[0]!.body).toBe("my comment body");
	});

	test("comment appears in issue show output", async () => {
		await run(["comment", "add", issueId, "Visible comment", "--author", "tester"], tmpDir);
		const show = await runJson<{
			success: boolean;
			issue: { comments?: Array<{ id: string; author: string; body: string }> };
		}>(["show", issueId], tmpDir);
		expect(show.issue.comments).toHaveLength(1);
		expect(show.issue.comments![0]!.author).toBe("tester");
		expect(show.issue.comments![0]!.body).toBe("Visible comment");
	});
});

describe("sd comment list", () => {
	test("lists comments on an issue", async () => {
		await run(["comment", "add", issueId, "First", "--author", "alice"], tmpDir);
		await run(["comment", "add", issueId, "Second", "--author", "bob"], tmpDir);

		const result = await runJson<{
			success: boolean;
			command: string;
			issueId: string;
			comments: Array<{ id: string; author: string; body: string }>;
			count: number;
		}>(["comment", "list", issueId], tmpDir);
		expect(result.success).toBe(true);
		expect(result.command).toBe("comment list");
		expect(result.count).toBe(2);
		expect(result.comments[0]!.author).toBe("alice");
		expect(result.comments[0]!.body).toBe("First");
		expect(result.comments[1]!.author).toBe("bob");
		expect(result.comments[1]!.body).toBe("Second");
	});

	test("returns empty list for issue with no comments", async () => {
		const result = await runJson<{ success: boolean; count: number; comments: unknown[] }>(
			["comment", "list", issueId],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.count).toBe(0);
		expect(result.comments).toHaveLength(0);
	});

	test("fails for nonexistent issue", async () => {
		const { exitCode } = await run(["comment", "list", "proj-ffff"], tmpDir);
		expect(exitCode).not.toBe(0);
	});
});

describe("sd comment delete", () => {
	let commentId: string;

	beforeEach(async () => {
		const result = await runJson<{ success: boolean; commentId: string }>(
			["comment", "add", issueId, "To be deleted", "--author", "tester"],
			tmpDir,
		);
		commentId = result.commentId;
	});

	test("deletes a comment", async () => {
		const result = await runJson<{
			success: boolean;
			command: string;
			issueId: string;
			commentId: string;
		}>(["comment", "delete", issueId, commentId], tmpDir);
		expect(result.success).toBe(true);
		expect(result.command).toBe("comment delete");
		expect(result.commentId).toBe(commentId);
	});

	test("comment no longer appears after deletion", async () => {
		await run(["comment", "delete", issueId, commentId], tmpDir);
		const list = await runJson<{ success: boolean; count: number }>(
			["comment", "list", issueId],
			tmpDir,
		);
		expect(list.count).toBe(0);
	});

	test("fails for nonexistent comment", async () => {
		const { exitCode } = await run(["comment", "delete", issueId, "c-ffff"], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("fails for nonexistent issue", async () => {
		const { exitCode } = await run(["comment", "delete", "proj-ffff", commentId], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("updates issue updatedAt timestamp", async () => {
		const before = await runJson<{ success: boolean; issue: { updatedAt: string } }>(
			["show", issueId],
			tmpDir,
		);
		// Small delay to ensure timestamp differs
		await new Promise((resolve) => setTimeout(resolve, 10));
		await run(["comment", "delete", issueId, commentId], tmpDir);
		const after = await runJson<{ success: boolean; issue: { updatedAt: string } }>(
			["show", issueId],
			tmpDir,
		);
		expect(after.issue.updatedAt).not.toBe(before.issue.updatedAt);
	});
});

describe("sd comment (multiple operations)", () => {
	test("add multiple then delete one leaves the other", async () => {
		const c1 = await runJson<{ success: boolean; commentId: string }>(
			["comment", "add", issueId, "Keep me", "--author", "alice"],
			tmpDir,
		);
		const c2 = await runJson<{ success: boolean; commentId: string }>(
			["comment", "add", issueId, "Delete me", "--author", "bob"],
			tmpDir,
		);

		await run(["comment", "delete", issueId, c2.commentId], tmpDir);

		const list = await runJson<{
			success: boolean;
			comments: Array<{ id: string; body: string }>;
			count: number;
		}>(["comment", "list", issueId], tmpDir);
		expect(list.count).toBe(1);
		expect(list.comments[0]!.id).toBe(c1.commentId);
		expect(list.comments[0]!.body).toBe("Keep me");
	});
});
