import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli, runCliJson } from "./test-harness.ts";

let tmpDir: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-harness-test-"));
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("runCli basic capture", () => {
	test("init creates .seeds and reports success on stdout (human mode)", async () => {
		const r = await runCli(["init"], tmpDir);
		expect(r.exitCode).toBe(0);
		expect(r.stdout).toContain("Initialized");
		expect(r.stderr).toBe("");
		// Filesystem side-effect happened in tmpDir, not in the test's cwd.
		const cfg = await readFile(join(tmpDir, ".seeds", "config.yaml"), "utf8");
		expect(cfg).toContain("project:");
	});

	test("init --json emits a parseable JSON object", async () => {
		const result = await runCliJson<{ success: boolean; command: string; dir: string }>(
			["init"],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.command).toBe("init");
		expect(result.dir).toContain(".seeds");
	});

	test("create + list round-trip via runCliJson", async () => {
		await runCli(["init"], tmpDir);
		const created = await runCliJson<{ id: string; title: string }>(
			["create", "--title", "harness check", "--priority", "1"],
			tmpDir,
		);
		expect(created.id).toMatch(/-[0-9a-f]{4}$/);
		const listed = await runCliJson<{ issues: Array<{ id: string; title: string }> }>(
			["list"],
			tmpDir,
		);
		expect(listed.issues.length).toBe(1);
		expect(listed.issues[0]?.title).toBe("harness check");
	});
});

describe("runCli capture channels", () => {
	test("captures process.stdout.write (used by list human format)", async () => {
		await runCli(["init"], tmpDir);
		await runCliJson(["create", "--title", "alpha", "--priority", "2"], tmpDir);
		const { stdout, exitCode } = await runCli(["list"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("alpha");
	});

	test("captures Bun.write(Bun.stdout) (used by outputJson)", async () => {
		await runCli(["init"], tmpDir);
		// stats --json uses outputJson which routes through Bun.write(Bun.stdout)
		const { stdout, exitCode } = await runCli(["stats", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { success: boolean };
		expect(parsed.success).toBe(true);
	});

	test("captures console.error / stderr writes when a command throws", async () => {
		await runCli(["init"], tmpDir);
		const { stderr, exitCode } = await runCli(["show", "nonexistent-id"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr.length).toBeGreaterThan(0);
		expect(stderr).toMatch(/not found|nonexistent-id/i);
	});
});

describe("runCli error handling", () => {
	test("thrown errors translate to exitCode 1 with stderr message", async () => {
		await runCli(["init"], tmpDir);
		// dep with no subcommand throws.
		const r = await runCli(["dep"], tmpDir);
		expect(r.exitCode).toBe(1);
		expect(r.stderr).toContain("Usage: sd dep");
	});

	test("thrown errors with --json emit JSON envelope on stdout", async () => {
		await runCli(["init"], tmpDir);
		const r = await runCli(["dep", "--json"], tmpDir);
		expect(r.exitCode).toBe(1);
		const parsed = JSON.parse(r.stdout.trim().split("\n").pop() ?? "{}") as {
			success: boolean;
			command: string;
			error: string;
		};
		expect(parsed.success).toBe(false);
		expect(parsed.command).toBe("dep");
		expect(parsed.error).toContain("Usage:");
	});

	test("unknown command name rejects synchronously", () => {
		expect(runCli(["definitely-not-a-command"], tmpDir)).rejects.toThrow(/unknown command/);
	});

	test("empty args rejects", () => {
		expect(runCli([], tmpDir)).rejects.toThrow(/missing command/);
	});
});

describe("runCli isolation", () => {
	test("process.cwd() is restored after each call", async () => {
		const before = process.cwd();
		await runCli(["init"], tmpDir);
		expect(process.cwd()).toBe(before);
	});

	test("process.cwd() is restored even when the command throws", async () => {
		const before = process.cwd();
		await runCli(["dep"], tmpDir); // throws internally; harness still restores
		expect(process.cwd()).toBe(before);
	});

	test("process.exitCode is restored after a failing call", async () => {
		const before = process.exitCode;
		await runCli(["dep"], tmpDir);
		expect(process.exitCode).toBe(before);
	});

	test("console.log is restored after the call", async () => {
		const before = console.log;
		await runCli(["init"], tmpDir);
		expect(console.log).toBe(before);
	});

	test("Bun.write is restored after the call (writes to real files still work)", async () => {
		await runCli(["init"], tmpDir);
		const probe = join(tmpDir, "probe.txt");
		await Bun.write(probe, "hello");
		expect(await readFile(probe, "utf8")).toBe("hello");
	});

	test("two sequential calls in different tmpDirs do not leak state", async () => {
		const other = await mkdtemp(join(tmpdir(), "seeds-harness-iso-"));
		try {
			await runCli(["init"], tmpDir);
			await runCli(["init"], other);
			await runCliJson(["create", "--title", "in-first", "--priority", "2"], tmpDir);
			await runCliJson(["create", "--title", "in-second", "--priority", "2"], other);
			const a = await runCliJson<{ issues: Array<{ title: string }> }>(["list"], tmpDir);
			const b = await runCliJson<{ issues: Array<{ title: string }> }>(["list"], other);
			expect(a.issues.map((i) => i.title)).toEqual(["in-first"]);
			expect(b.issues.map((i) => i.title)).toEqual(["in-second"]);
		} finally {
			await rm(other, { recursive: true, force: true });
		}
	});
});

describe("runCli subcommands", () => {
	test("dep add routes args through to subcommand handler", async () => {
		await runCli(["init"], tmpDir);
		const a = await runCliJson<{ id: string }>(
			["create", "--title", "a", "--priority", "2"],
			tmpDir,
		);
		const b = await runCliJson<{ id: string }>(
			["create", "--title", "b", "--priority", "2"],
			tmpDir,
		);
		const r = await runCli(["dep", "add", a.id, b.id, "--json"], tmpDir);
		expect(r.exitCode).toBe(0);
		const parsed = JSON.parse(r.stdout) as { success: boolean };
		expect(parsed.success).toBe(true);
		const listed = await runCliJson<{ blockedBy: string[] }>(["dep", "list", a.id], tmpDir);
		expect(listed.blockedBy).toContain(b.id);
	});
});

describe("runCli ANSI handling", () => {
	test("output contains no ANSI escape sequences (chalk forced off)", async () => {
		await runCli(["init"], tmpDir);
		await runCliJson(["create", "--title", "ansi check", "--priority", "0"], tmpDir);
		const { stdout } = await runCli(["list"], tmpDir);
		// biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI ESC[
		expect(stdout).not.toMatch(/\x1b\[/);
	});
});

describe("runCli works for plan command (uses process.stdout.write heavily)", () => {
	test("plan templates lists built-ins", async () => {
		await runCli(["init"], tmpDir);
		const { stdout, exitCode } = await runCli(["plan", "templates", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as { templates: Array<{ name: string }> };
		const names = parsed.templates.map((t) => t.name);
		expect(names).toContain("feature");
		expect(names).toContain("bug");
		expect(names).toContain("refactor");
	});
});

describe("runCli respects writable files (no Bun.write interference)", () => {
	test("a command that writes JSONL via Bun.write to a file path still persists", async () => {
		await runCli(["init"], tmpDir);
		await runCliJson(["create", "--title", "persisted", "--priority", "3"], tmpDir);
		const jsonl = await readFile(join(tmpDir, ".seeds", "issues.jsonl"), "utf8");
		expect(jsonl).toContain("persisted");
	});

	test("Bun.write to an explicit FS path still works inside the harness", async () => {
		// Trigger the harness, then check that our (non-Bun.stdout) write path
		// during the run is unaffected — we can't easily inspect during run, but
		// a doctor --json call exercises file IO heavily.
		await runCli(["init"], tmpDir);
		const sideFile = join(tmpDir, "side.txt");
		await writeFile(sideFile, "before");
		const r = await runCli(["doctor", "--json"], tmpDir);
		expect(r.exitCode === 0 || r.exitCode === 1).toBe(true);
		// the side file is still intact (proving our Bun.write override only
		// intercepts Bun.stdout/Bun.stderr targets)
		expect(await readFile(sideFile, "utf8")).toBe("before");
	});
});
