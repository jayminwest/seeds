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

async function create(title: string, cwd: string): Promise<string> {
	const out = await runJson<{ id: string }>(["create", "--title", title], cwd);
	return out.id;
}

async function showExtensions(
	id: string,
	cwd: string,
): Promise<Record<string, unknown> | undefined> {
	const out = await runJson<{ issue: { extensions?: Record<string, unknown> } }>(["show", id], cwd);
	return out.issue.extensions;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-update-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd update --extensions", () => {
	test("sets extensions on an issue with no prior extensions", async () => {
		const id = await create("ext-1", tmpDir);
		const { exitCode } = await run(
			["update", id, "--extensions", '{"role":"refactor-bot","queued":true}'],
			tmpDir,
		);
		expect(exitCode).toBe(0);
		expect(await showExtensions(id, tmpDir)).toEqual({ role: "refactor-bot", queued: true });
	});

	test("shallow-merges new keys while preserving existing keys", async () => {
		const id = await create("ext-2", tmpDir);
		await run(["update", id, "--extensions", '{"role":"refactor-bot","attempts":1}'], tmpDir);
		await run(
			["update", id, "--extensions", '{"queued":true,"scheduledFor":"2026-05-12T03:00:00Z"}'],
			tmpDir,
		);
		expect(await showExtensions(id, tmpDir)).toEqual({
			role: "refactor-bot",
			attempts: 1,
			queued: true,
			scheduledFor: "2026-05-12T03:00:00Z",
		});
	});

	test("overwrites top-level keys without deep-merging nested values", async () => {
		const id = await create("ext-3", tmpDir);
		await run(["update", id, "--extensions", '{"lastRun":{"id":"run-a","ok":true}}'], tmpDir);
		await run(["update", id, "--extensions", '{"lastRun":{"id":"run-b"}}'], tmpDir);
		// Shallow merge: lastRun is overwritten wholesale, not deep-merged.
		expect(await showExtensions(id, tmpDir)).toEqual({ lastRun: { id: "run-b" } });
	});

	test("--clear-extensions removes the extensions field", async () => {
		const id = await create("ext-4", tmpDir);
		await run(["update", id, "--extensions", '{"role":"x"}'], tmpDir);
		expect(await showExtensions(id, tmpDir)).toEqual({ role: "x" });

		const { exitCode } = await run(["update", id, "--clear-extensions"], tmpDir);
		expect(exitCode).toBe(0);
		expect(await showExtensions(id, tmpDir)).toBeUndefined();
	});

	test("rejects malformed JSON with a clear error", async () => {
		const id = await create("ext-5", tmpDir);
		const { exitCode, stderr } = await run(["update", id, "--extensions", "{not json}"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("--extensions must be valid JSON");
	});

	test("rejects JSON arrays", async () => {
		const id = await create("ext-6", tmpDir);
		const { exitCode, stderr } = await run(["update", id, "--extensions", '["a","b"]'], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("must be a JSON object");
	});

	test("rejects JSON null", async () => {
		const id = await create("ext-7", tmpDir);
		const { exitCode, stderr } = await run(["update", id, "--extensions", "null"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("must be a JSON object");
	});

	test("rejects JSON scalar (string)", async () => {
		const id = await create("ext-8", tmpDir);
		const { exitCode, stderr } = await run(["update", id, "--extensions", '"hello"'], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("must be a JSON object");
	});

	test("rejects --extensions and --clear-extensions together", async () => {
		const id = await create("ext-9", tmpDir);
		const { exitCode, stderr } = await run(
			["update", id, "--extensions", "{}", "--clear-extensions"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("mutually exclusive");
	});

	test("--extensions does not touch other fields", async () => {
		const id = await create("ext-10", tmpDir);
		await run(["update", id, "--title", "renamed", "--assignee", "alice"], tmpDir);
		await run(["update", id, "--extensions", '{"role":"r"}'], tmpDir);
		const out = await runJson<{
			issue: { title: string; assignee?: string; extensions?: Record<string, unknown> };
		}>(["show", id], tmpDir);
		expect(out.issue.title).toBe("renamed");
		expect(out.issue.assignee).toBe("alice");
		expect(out.issue.extensions).toEqual({ role: "r" });
	});

	test("merging an empty object on undefined extensions leaves field absent", async () => {
		const id = await create("ext-11", tmpDir);
		await run(["update", id, "--extensions", "{}"], tmpDir);
		expect(await showExtensions(id, tmpDir)).toBeUndefined();
	});
});

describe("sd update --status reopen", () => {
	type ShowResult = {
		issue: { status: string; closedAt?: string; closeReason?: string };
	};

	test("reopening a closed issue clears closedAt and closeReason", async () => {
		const id = await create("reopen-1", tmpDir);
		await run(["close", id, "--reason", "wontfix"], tmpDir);

		const closed = await runJson<ShowResult>(["show", id], tmpDir);
		expect(closed.issue.status).toBe("closed");
		expect(closed.issue.closedAt).toBeDefined();
		expect(closed.issue.closeReason).toBe("wontfix");

		await run(["update", id, "--status", "open"], tmpDir);

		const reopened = await runJson<ShowResult>(["show", id], tmpDir);
		expect(reopened.issue.status).toBe("open");
		expect(reopened.issue.closedAt).toBeUndefined();
		expect(reopened.issue.closeReason).toBeUndefined();
	});

	test("moving from closed to in_progress also clears close metadata", async () => {
		const id = await create("reopen-2", tmpDir);
		await run(["close", id, "--reason", "stale"], tmpDir);
		await run(["update", id, "--status", "in_progress"], tmpDir);

		const after = await runJson<ShowResult>(["show", id], tmpDir);
		expect(after.issue.status).toBe("in_progress");
		expect(after.issue.closedAt).toBeUndefined();
		expect(after.issue.closeReason).toBeUndefined();
	});

	test("re-closing keeps close metadata (no clear on status=closed)", async () => {
		const id = await create("reopen-3", tmpDir);
		await run(["close", id, "--reason", "first close"], tmpDir);
		// Patch back to closed via update; closedAt + closeReason must persist.
		await run(["update", id, "--status", "closed"], tmpDir);

		const after = await runJson<ShowResult>(["show", id], tmpDir);
		expect(after.issue.status).toBe("closed");
		expect(after.issue.closedAt).toBeDefined();
		expect(after.issue.closeReason).toBe("first close");
	});

	test("rejects empty --title", async () => {
		const id = await create("keep-title", tmpDir);
		const { exitCode, stderr } = await run(["update", id, "--title", ""], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("--title must not be empty");
		const after = await runJson<{ issue: { title: string } }>(["show", id], tmpDir);
		expect(after.issue.title).toBe("keep-title");
	});

	test("rejects whitespace-only --title", async () => {
		const id = await create("keep-title-ws", tmpDir);
		const { exitCode, stderr } = await run(["update", id, "--title", "   "], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("--title must not be empty");
		const after = await runJson<{ issue: { title: string } }>(["show", id], tmpDir);
		expect(after.issue.title).toBe("keep-title-ws");
	});

	test("trims surrounding whitespace from --title before storing", async () => {
		const id = await create("untrimmed", tmpDir);
		const { exitCode } = await run(["update", id, "--title", "  hello  "], tmpDir);
		expect(exitCode).toBe(0);
		const after = await runJson<{ issue: { title: string } }>(["show", id], tmpDir);
		expect(after.issue.title).toBe("hello");
	});

	test("update without --status leaves close metadata untouched on closed issues", async () => {
		const id = await create("reopen-4", tmpDir);
		await run(["close", id, "--reason", "done"], tmpDir);
		await run(["update", id, "--title", "renamed"], tmpDir);

		const after = await runJson<ShowResult>(["show", id], tmpDir);
		expect(after.issue.status).toBe("closed");
		expect(after.issue.closedAt).toBeDefined();
		expect(after.issue.closeReason).toBe("done");
	});
});
