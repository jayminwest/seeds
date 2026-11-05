import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-listlimit-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("--limit validation", () => {
	test("sd list --limit 0 means no limit", async () => {
		await create("a", 2, tmpDir);
		await create("b", 2, tmpDir);
		const result = await runJson<{ issues: unknown[]; count: number }>(
			["list", "--limit", "0"],
			tmpDir,
		);
		expect(result.issues).toHaveLength(2);
		expect(result.count).toBe(2);
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

	test("sd ready --limit 0 means no limit", async () => {
		await create("a", 2, tmpDir);
		const result = await runJson<{ issues: unknown[] }>(["ready", "--limit", "0"], tmpDir);
		expect(result.issues).toHaveLength(1);
	});

	test("sd ready rejects negative --limit", async () => {
		await create("a", 2, tmpDir);
		const { exitCode, stderr } = await run(["ready", "--limit", "-1"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --limit");
	});

	test("sd search --limit 0 means no limit", async () => {
		await create("alpha", 2, tmpDir);
		await create("alphabet", 2, tmpDir);
		const result = await runJson<{ issues: unknown[] }>(
			["search", "alpha", "--limit", "0"],
			tmpDir,
		);
		expect(result.issues).toHaveLength(2);
	});

	test("sd search rejects negative --limit", async () => {
		await create("alpha", 2, tmpDir);
		const { exitCode, stderr } = await run(["search", "alpha", "--limit", "-1"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --limit");
	});
});

describe("sd list truncation is never silent (seeds-dd20)", () => {
	// Seed the store directly: creating 60 issues through the CLI is slow.
	async function seedIssues(n: number): Promise<void> {
		const lines: string[] = [];
		for (let i = 0; i < n; i++) {
			lines.push(
				JSON.stringify({
					id: `seeds-${i.toString(16).padStart(4, "0")}`,
					title: `issue ${i}`,
					status: "open",
					type: "task",
					priority: 2,
					createdAt: "2026-06-16T00:00:00.000Z",
					updatedAt: "2026-06-16T00:00:00.000Z",
				}),
			);
		}
		await writeFile(join(tmpDir, ".seeds", "issues.jsonl"), `${lines.join("\n")}\n`);
	}

	test("--json is uncapped by default and reports total/truncated", async () => {
		await seedIssues(60);
		const result = await runJson<{ count: number; total: number; truncated: boolean }>(
			["list"],
			tmpDir,
		);
		expect(result.count).toBe(60);
		expect(result.total).toBe(60);
		expect(result.truncated).toBe(false);
	});

	test("--json with an explicit --limit flags truncation", async () => {
		await seedIssues(5);
		const result = await runJson<{
			issues: unknown[];
			count: number;
			total: number;
			truncated: boolean;
		}>(["list", "--limit", "2"], tmpDir);
		expect(result.issues).toHaveLength(2);
		expect(result.count).toBe(2);
		expect(result.total).toBe(5);
		expect(result.truncated).toBe(true);
	});

	test("--format ids is uncapped by default", async () => {
		await seedIssues(60);
		const { stdout } = await run(["list", "--format", "ids"], tmpDir);
		expect(stdout.trim().split("\n")).toHaveLength(60);
	});

	test("human output caps at 50 and names the total in the footer", async () => {
		await seedIssues(60);
		const { stdout } = await run(["list", "--format", "plain"], tmpDir);
		expect(stdout).toContain("50 of 60 issue(s) shown (use --limit 0 for all)");
		expect(stdout.match(/seeds-[0-9a-f]{4}/g)).toHaveLength(50);
	});

	test("human output with --limit 0 shows every issue", async () => {
		await seedIssues(60);
		const { stdout } = await run(["list", "--limit", "0"], tmpDir);
		expect(stdout).toContain("60 issue(s)");
		expect(stdout).not.toContain(" of ");
	});

	test("compact output reports truncation on stderr", async () => {
		await seedIssues(3);
		const { stdout, stderr } = await run(["list", "--format", "compact", "--limit", "1"], tmpDir);
		expect(stdout.trim().split("\n")).toHaveLength(1);
		expect(stderr).toContain("1 of 3 issue(s) shown");
	});
});
