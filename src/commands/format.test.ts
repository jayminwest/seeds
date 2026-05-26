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

const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`);

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-format-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("--format on sd list", () => {
	test("ids mode prints only ids, one per line", async () => {
		const a = await create("alpha", 1, tmpDir);
		const b = await create("bravo", 0, tmpDir);
		const { stdout, exitCode } = await run(["list", "--format", "ids"], tmpDir);
		expect(exitCode).toBe(0);
		const lines = stdout.trim().split("\n").filter(Boolean);
		expect(new Set(lines)).toEqual(new Set([a, b]));
		// No "n issue(s)" footer in ids mode.
		expect(stdout).not.toContain("issue(s)");
	});

	test("compact mode prints one terse line per issue, no ANSI, no footer", async () => {
		const id = await create("hello world", 2, tmpDir);
		const { stdout, exitCode } = await run(["list", "--format", "compact"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).not.toMatch(ANSI_RE);
		expect(stdout).toContain(id);
		expect(stdout).toContain("hello world");
		expect(stdout).not.toContain("issue(s)");
	});

	test("plain mode strips ANSI but keeps footer count", async () => {
		await create("alpha", 1, tmpDir);
		await create("bravo", 0, tmpDir);
		const { stdout, exitCode } = await run(["list", "--format", "plain"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).not.toMatch(ANSI_RE);
		expect(stdout).toContain("2 issue(s)");
	});

	test("json mode produces same JSON as --json alias", async () => {
		await create("alpha", 1, tmpDir);
		const { stdout: viaFormat } = await run(["list", "--format", "json"], tmpDir);
		const { stdout: viaJson } = await run(["list", "--json"], tmpDir);
		expect(viaFormat).toBe(viaJson);
		expect(JSON.parse(viaFormat).success).toBe(true);
	});

	test("rejects invalid --format value", async () => {
		await create("a", 2, tmpDir);
		const { exitCode, stderr } = await run(["list", "--format", "bogus"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Invalid --format value");
	});

	test("ids mode pipes work with empty results without trailing message", async () => {
		// no issues created
		const { stdout, exitCode } = await run(["list", "--format", "ids"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toBe("");
	});
});

describe("--format on sd ready", () => {
	test("ids mode prints only ready ids", async () => {
		const a = await create("alpha", 1, tmpDir);
		const b = await create("bravo", 0, tmpDir);
		const { stdout, exitCode } = await run(["ready", "--format", "ids"], tmpDir);
		expect(exitCode).toBe(0);
		const lines = stdout.trim().split("\n").filter(Boolean);
		expect(new Set(lines)).toEqual(new Set([a, b]));
	});
});

describe("--format on sd show", () => {
	test("ids mode prints only the id", async () => {
		const id = await create("hello", 2, tmpDir);
		const { stdout, exitCode } = await run(["show", id, "--format", "ids"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout.trim()).toBe(id);
	});

	test("plain mode strips ANSI", async () => {
		const id = await create("hello", 2, tmpDir);
		const { stdout } = await run(["show", id, "--format", "plain"], tmpDir);
		expect(stdout).not.toMatch(ANSI_RE);
		expect(stdout).toContain("hello");
	});

	test("compact prints id and title on one line", async () => {
		const id = await create("hello", 2, tmpDir);
		const { stdout } = await run(["show", id, "--format", "compact"], tmpDir);
		const lines = stdout.trim().split("\n");
		expect(lines.length).toBe(1);
		expect(lines[0]).toContain(id);
		expect(lines[0]).toContain("hello");
	});

	test("default and plain modes render Extensions line when present", async () => {
		const id = await create("ext-host", 2, tmpDir);
		// Rewrite the issue with extensions; sd update --extensions lands in seeds-be14.
		const issuesPath = join(tmpDir, ".seeds", "issues.jsonl");
		const raw = await Bun.file(issuesPath).text();
		const lines = raw.split("\n").filter(Boolean);
		const issue = JSON.parse(lines[lines.length - 1] ?? "{}") as Record<string, unknown>;
		issue.extensions = {
			role: "refactor-bot",
			queued: true,
			scheduledFor: "2026-05-12T03:00:00.000Z",
			lastRun: { id: "run-9c4d", ok: false },
		};
		await Bun.write(issuesPath, `${JSON.stringify(issue)}\n`);

		const def = await run(["show", id], tmpDir);
		expect(def.exitCode).toBe(0);
		expect(def.stdout).toContain("Extensions:");
		expect(def.stdout).toContain("role=");
		expect(def.stdout).toContain('"refactor-bot"');
		expect(def.stdout).toContain("queued=true");

		const plain = await run(["show", id, "--format", "plain"], tmpDir);
		expect(plain.exitCode).toBe(0);
		expect(plain.stdout).not.toMatch(ANSI_RE);
		expect(plain.stdout).toContain('Extensions: role="refactor-bot"');
		expect(plain.stdout).toContain('scheduledFor="2026-05-12T03:00:00.000Z"');
		expect(plain.stdout).toContain('lastRun={"id":"run-9c4d","ok":false}');
	});

	test("default mode omits Extensions line when field is missing or empty", async () => {
		const id = await create("no-ext", 2, tmpDir);
		const missing = await run(["show", id], tmpDir);
		expect(missing.stdout).not.toContain("Extensions:");

		const issuesPath = join(tmpDir, ".seeds", "issues.jsonl");
		const raw = await Bun.file(issuesPath).text();
		const last = raw.split("\n").filter(Boolean).pop() ?? "{}";
		const issue = JSON.parse(last) as Record<string, unknown>;
		issue.extensions = {};
		await Bun.write(issuesPath, `${JSON.stringify(issue)}\n`);
		const empty = await run(["show", id], tmpDir);
		expect(empty.stdout).not.toContain("Extensions:");
	});

	test("json mode includes extensions on the issue payload", async () => {
		const id = await create("ext-json", 2, tmpDir);
		const issuesPath = join(tmpDir, ".seeds", "issues.jsonl");
		const raw = await Bun.file(issuesPath).text();
		const last = raw.split("\n").filter(Boolean).pop() ?? "{}";
		const issue = JSON.parse(last) as Record<string, unknown>;
		issue.extensions = { role: "refactor-bot", queued: true };
		await Bun.write(issuesPath, `${JSON.stringify(issue)}\n`);

		const out = await runJson<{ issue: { extensions?: Record<string, unknown> } }>(
			["show", id],
			tmpDir,
		);
		expect(out.issue.extensions).toEqual({ role: "refactor-bot", queued: true });
	});
});

describe("--format on sd blocked", () => {
	test("ids mode prints blocked issue ids", async () => {
		const a = await create("blocker", 0, tmpDir);
		const b = await create("blocked", 0, tmpDir);
		await run(["block", b, "--by", a], tmpDir);
		const { stdout, exitCode } = await run(["blocked", "--format", "ids"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout.trim()).toBe(b);
	});
});

describe("--format on sd stats", () => {
	test("plain mode strips ANSI", async () => {
		await create("a", 0, tmpDir);
		const { stdout } = await run(["stats", "--format", "plain"], tmpDir);
		expect(stdout).not.toMatch(ANSI_RE);
		expect(stdout).toContain("Project Statistics");
	});

	test("compact mode emits dense single-key=value summary line", async () => {
		await create("a", 0, tmpDir);
		const { stdout } = await run(["stats", "--format", "compact"], tmpDir);
		expect(stdout).toContain("total=1");
		expect(stdout).not.toMatch(ANSI_RE);
	});

	test("ids mode emits no output", async () => {
		await create("a", 0, tmpDir);
		const { stdout, exitCode } = await run(["stats", "--format", "ids"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toBe("");
	});
});

describe("ids mode is pipe-friendly", () => {
	test("output can be split on newline and consumed by xargs-like flow", async () => {
		const a = await create("a", 1, tmpDir);
		const b = await create("b", 1, tmpDir);
		const { stdout } = await run(["list", "--format", "ids"], tmpDir);
		const ids = stdout.split("\n").filter((l) => l.length > 0);
		expect(ids.length).toBe(2);
		expect(new Set(ids)).toEqual(new Set([a, b]));
		// All lines are syntactically valid IDs (project-4hex).
		for (const id of ids) {
			expect(id).toMatch(/-[0-9a-f]{4}$/);
		}
	});
});
