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

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-show-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd show single id (preserved)", () => {
	test("renders one issue in human format", async () => {
		const id = await create("Alpha", tmpDir);
		const { stdout, exitCode } = await run(["show", id], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(id);
		expect(stdout).toContain("Alpha");
	});

	test("--json keeps single-issue shape", async () => {
		const id = await create("Alpha", tmpDir);
		const out = await runJson<{
			success: boolean;
			command: string;
			issue: { id: string; title: string };
			issues?: unknown;
		}>(["show", id], tmpDir);
		expect(out.success).toBe(true);
		expect(out.command).toBe("show");
		expect(out.issue.id).toBe(id);
		expect(out.issue.title).toBe("Alpha");
		expect(out.issues).toBeUndefined();
	});

	test("unknown id throws (single-id behavior unchanged)", async () => {
		const { exitCode, stderr } = await run(["show", "seeds-9999"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Issue not found: seeds-9999");
	});
});

describe("sd show multiple ids", () => {
	test("human output renders all issues separated by a divider", async () => {
		const a = await create("First", tmpDir);
		const b = await create("Second", tmpDir);
		const c = await create("Third", tmpDir);
		const { stdout, exitCode } = await run(["show", a, b, c], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain(a);
		expect(stdout).toContain(b);
		expect(stdout).toContain(c);
		expect(stdout).toContain("First");
		expect(stdout).toContain("Second");
		expect(stdout).toContain("Third");
		expect(stdout).toContain("─".repeat(60));
	});

	test("--json returns an issues array", async () => {
		const a = await create("First", tmpDir);
		const b = await create("Second", tmpDir);
		const out = await runJson<{
			success: boolean;
			command: string;
			issues: Array<{ id: string; title: string }>;
		}>(["show", a, b], tmpDir);
		expect(out.success).toBe(true);
		expect(out.command).toBe("show");
		expect(Array.isArray(out.issues)).toBe(true);
		expect(out.issues.map((i) => i.id)).toEqual([a, b]);
		expect(out.issues.map((i) => i.title)).toEqual(["First", "Second"]);
	});

	test("--json mixes valid + invalid into issues + errors, exits non-zero", async () => {
		const a = await create("First", tmpDir);
		const { stdout, exitCode } = await run(["show", a, "seeds-9999", "--json"], tmpDir);
		const out = JSON.parse(stdout) as {
			success: boolean;
			command: string;
			issues: Array<{ id: string }>;
			errors: Array<{ id: string; error: string }>;
		};
		expect(exitCode).not.toBe(0);
		expect(out.success).toBe(false);
		expect(out.command).toBe("show");
		expect(out.issues.map((i) => i.id)).toEqual([a]);
		expect(out.errors).toHaveLength(1);
		expect(out.errors[0]?.id).toBe("seeds-9999");
		expect(out.errors[0]?.error).toContain("not found");
	});

	test("--format compact prints one issue per line", async () => {
		const a = await create("First", tmpDir);
		const b = await create("Second", tmpDir);
		const { stdout, exitCode } = await run(["show", a, b, "--format", "compact"], tmpDir);
		expect(exitCode).toBe(0);
		const lines = stdout.trim().split("\n");
		expect(lines).toHaveLength(2);
		expect(lines[0]).toContain(a);
		expect(lines[1]).toContain(b);
	});

	test("--format ids prints one id per line", async () => {
		const a = await create("First", tmpDir);
		const b = await create("Second", tmpDir);
		const { stdout, exitCode } = await run(["show", a, b, "--format", "ids"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout.trim().split("\n")).toEqual([a, b]);
	});

	test("--format plain separates issues with blank lines and strips ANSI", async () => {
		const a = await create("First", tmpDir);
		const b = await create("Second", tmpDir);
		const { stdout, exitCode } = await run(["show", a, b, "--format", "plain"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).not.toContain(String.fromCharCode(27));
		expect(stdout).toContain(a);
		expect(stdout).toContain(b);
		// blank line between blocks
		expect(stdout).toMatch(/First[\s\S]*\n\n[\s\S]*Second/);
	});

	test("plan id in multi-id mode is reported as a per-id error, others still render", async () => {
		const a = await create("First", tmpDir);
		const { stdout, exitCode } = await run(["show", a, "pl-deadbeef", "--json"], tmpDir);
		const out = JSON.parse(stdout) as {
			success: boolean;
			issues: Array<{ id: string }>;
			errors: Array<{ id: string; error: string }>;
		};
		expect(exitCode).not.toBe(0);
		expect(out.success).toBe(false);
		expect(out.issues.map((i) => i.id)).toEqual([a]);
		expect(out.errors[0]?.id).toBe("pl-deadbeef");
		expect(out.errors[0]?.error).toContain("sd plan show");
	});

	test("ids mode prints found ids and errors to stderr", async () => {
		const a = await create("First", tmpDir);
		const { stdout, stderr, exitCode } = await run(
			["show", a, "seeds-9999", "--format", "ids"],
			tmpDir,
		);
		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe(a);
		expect(stderr).toContain("seeds-9999");
	});
});
