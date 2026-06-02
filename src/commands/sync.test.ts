import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stripAnsi } from "../format";
import { run } from "./sync";

function git(args: string[], cwd: string): void {
	const result = Bun.spawnSync(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" });
	if ((result.exitCode ?? 0) !== 0) {
		const stderr = new TextDecoder().decode(result.stderr);
		throw new Error(`git ${args.join(" ")} failed: ${stderr}`);
	}
}

function initSeedsDir(root: string): void {
	const seedsDir = join(root, ".seeds");
	mkdirSync(seedsDir, { recursive: true });
	writeFileSync(join(seedsDir, "config.yaml"), 'project: "test"\nversion: "1"\n');
	writeFileSync(join(seedsDir, "issues.jsonl"), "");
	writeFileSync(join(seedsDir, ".gitignore"), "*.lock\n");
}

let tmpDir: string;

beforeEach(async () => {
	tmpDir = realpathSync(await mkdtemp(join(tmpdir(), "seeds-sync-test-")));
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sync — worktree guard", () => {
	test("warns and no-ops inside a worktree", async () => {
		const mainRepo = join(tmpDir, "main");
		mkdirSync(mainRepo);
		git(["init"], mainRepo);
		git(["config", "user.email", "test@test.com"], mainRepo);
		git(["config", "user.name", "Test"], mainRepo);
		initSeedsDir(mainRepo);
		git(["add", "."], mainRepo);
		git(["commit", "-m", "init"], mainRepo);

		const wtDir = join(tmpDir, "wt");
		git(["worktree", "add", wtDir, "-b", "wt-branch"], mainRepo);

		// Capture console output. printWarning routes to stderr, so capture
		// both streams and assert the warning lands on stderr.
		const logs: string[] = [];
		const errs: string[] = [];
		const origLog = console.log;
		const origErr = console.error;
		console.log = (...args: unknown[]) => {
			logs.push(args.map(String).join(" "));
		};
		console.error = (...args: unknown[]) => {
			errs.push(args.map(String).join(" "));
		};

		const origCwd = process.cwd();
		process.chdir(wtDir);
		try {
			await run([]);
		} finally {
			process.chdir(origCwd);
			console.log = origLog;
			console.error = origErr;
		}

		expect(errs.some((l) => l.includes("worktree"))).toBe(true);
		expect(logs.some((l) => l.includes("worktree"))).toBe(false);
	});

	test("sd sync --json returns worktree: true inside a worktree", async () => {
		const mainRepo = join(tmpDir, "main");
		mkdirSync(mainRepo);
		git(["init"], mainRepo);
		git(["config", "user.email", "test@test.com"], mainRepo);
		git(["config", "user.name", "Test"], mainRepo);
		initSeedsDir(mainRepo);
		git(["add", "."], mainRepo);
		git(["commit", "-m", "init"], mainRepo);

		const wtDir = join(tmpDir, "wt");
		git(["worktree", "add", wtDir, "-b", "wt-branch"], mainRepo);

		// Worktree-guard branch only fires when sync is invoked as the top-
		// level CLI (no explicit seedsDir arg). The in-process harness passes
		// a resolved seedsDir which bypasses the guard, so this test stays
		// subprocess-based to exercise the real CLI codepath.
		const result = Bun.spawnSync(
			["bun", "run", join(import.meta.dir, "..", "index.ts"), "sync", "--json"],
			{
				cwd: wtDir,
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const output = JSON.parse(new TextDecoder().decode(result.stdout));
		expect(output.worktree).toBe(true);
		expect(output.committed).toBe(false);
		expect(output.success).toBe(true);
	});

	test("sd sync commits normally from main repo", async () => {
		const mainRepo = join(tmpDir, "main");
		mkdirSync(mainRepo);
		git(["init"], mainRepo);
		git(["config", "user.email", "test@test.com"], mainRepo);
		git(["config", "user.name", "Test"], mainRepo);
		initSeedsDir(mainRepo);
		git(["add", "."], mainRepo);
		git(["commit", "-m", "init"], mainRepo);

		// Create a new issue to have uncommitted changes
		const issuesPath = join(mainRepo, ".seeds", "issues.jsonl");
		writeFileSync(
			issuesPath,
			'{"id":"test-0001","title":"Test","status":"open","type":"task","priority":2,"createdAt":"2026-01-01T00:00:00Z","updatedAt":"2026-01-01T00:00:00Z"}\n',
		);

		const logs: string[] = [];
		const origLog = console.log;
		console.log = (...args: unknown[]) => {
			logs.push(args.map(String).join(" "));
		};

		const origCwd = process.cwd();
		process.chdir(mainRepo);
		try {
			await run([]);
		} finally {
			process.chdir(origCwd);
			console.log = origLog;
		}

		expect(logs.some((l) => l.includes("Committed"))).toBe(true);
	});
});

describe("sync — printSuccess + outputJson routing", () => {
	function initRepo(): string {
		const mainRepo = join(tmpDir, "main");
		mkdirSync(mainRepo);
		git(["init"], mainRepo);
		git(["config", "user.email", "test@test.com"], mainRepo);
		git(["config", "user.name", "Test"], mainRepo);
		initSeedsDir(mainRepo);
		git(["add", "."], mainRepo);
		git(["commit", "-m", "init"], mainRepo);
		return mainRepo;
	}

	function capture(): {
		logs: string[];
		errs: string[];
		restore: () => void;
	} {
		const logs: string[] = [];
		const errs: string[] = [];
		const origLog = console.log;
		const origErr = console.error;
		console.log = (...args: unknown[]) => {
			logs.push(args.map(String).join(" "));
		};
		console.error = (...args: unknown[]) => {
			errs.push(args.map(String).join(" "));
		};
		return {
			logs,
			errs,
			restore: () => {
				console.log = origLog;
				console.error = origErr;
			},
		};
	}

	test("success commit emits brand ✓ line on stdout", async () => {
		const repo = initRepo();
		writeFileSync(
			join(repo, ".seeds", "issues.jsonl"),
			'{"id":"t-0001","title":"T","status":"open","type":"task","priority":2,"createdAt":"2026-01-01T00:00:00Z","updatedAt":"2026-01-01T00:00:00Z"}\n',
		);

		const cap = capture();
		try {
			await run([], join(repo, ".seeds"));
		} finally {
			cap.restore();
		}

		const plain = cap.logs.map(stripAnsi);
		expect(plain.some((l) => l.startsWith("✓ ") && l.includes("Committed:"))).toBe(true);
	});

	test("no-op emits brand ✓ line on stdout", async () => {
		const repo = initRepo();
		const cap = capture();
		try {
			await run([], join(repo, ".seeds"));
		} finally {
			cap.restore();
		}

		const plain = cap.logs.map(stripAnsi);
		expect(plain.some((l) => l === "✓ No changes to commit.")).toBe(true);
	});

	test("--json success emits canonical {success,command,...} payload", async () => {
		const repo = initRepo();
		writeFileSync(
			join(repo, ".seeds", "issues.jsonl"),
			'{"id":"t-0002","title":"T","status":"open","type":"task","priority":2,"createdAt":"2026-01-01T00:00:00Z","updatedAt":"2026-01-01T00:00:00Z"}\n',
		);

		const out: string[] = [];
		const origWrite = Bun.write;
		// @ts-expect-error: stubbing for test capture
		Bun.write = async (_dst: unknown, data: string) => {
			out.push(data);
			return data.length;
		};
		try {
			await run(["--json"], join(repo, ".seeds"));
		} finally {
			Bun.write = origWrite;
		}

		const payload = JSON.parse(out.join(""));
		expect(payload.success).toBe(true);
		expect(payload.command).toBe("sync");
		expect(payload.committed).toBe(true);
		expect(typeof payload.message).toBe("string");
	});

	test("--json no-op emits canonical payload with committed:false", async () => {
		const repo = initRepo();
		const out: string[] = [];
		const origWrite = Bun.write;
		// @ts-expect-error: stubbing for test capture
		Bun.write = async (_dst: unknown, data: string) => {
			out.push(data);
			return data.length;
		};
		try {
			await run(["--json"], join(repo, ".seeds"));
		} finally {
			Bun.write = origWrite;
		}

		const payload = JSON.parse(out.join(""));
		expect(payload).toEqual({
			success: true,
			command: "sync",
			committed: false,
			message: "Nothing to commit",
		});
	});

	function initBrokenRepo(name: string): string {
		// git init with no user.email/user.name configured + force-disable any
		// inherited git config so `git commit` fails when invoked. Forcing the
		// commit identity to empty via env is unreliable; instead we make
		// `git commit` fail by configuring an empty identity at the repo level
		// and unsetting via core.askPass. Simpler trick: clobber GIT_AUTHOR_NAME
		// in-process is fragile across the subprocess boundary, so we instead
		// stage the .seeds dir under .gitignore'd config so the commit picks up
		// nothing — but that hits the no-op branch. Reliable trigger: init the
		// repo, write changes, then make .git read-only so git commit fails.
		const repo = join(tmpDir, name);
		mkdirSync(repo);
		git(["init"], repo);
		initSeedsDir(repo);
		// No user.email/user.name set anywhere -> `git commit` will refuse with
		// 'Please tell me who you are', returning a non-zero exit code. Override
		// any inherited identity by pointing HOME at an empty dir.
		writeFileSync(
			join(repo, ".seeds", "issues.jsonl"),
			'{"id":"t-0003","title":"T","status":"open","type":"task","priority":2,"createdAt":"2026-01-01T00:00:00Z","updatedAt":"2026-01-01T00:00:00Z"}\n',
		);
		return repo;
	}

	test("git-failure throws so the top-level handler emits the canonical error payload", async () => {
		const repo = initBrokenRepo("brokenrepo");
		// Force the spawned git to find no user identity by clearing env vars
		// and pointing HOME at an empty dir. We do this by monkey-patching
		// Bun.spawnSync for the duration of the call. Simpler: set GIT_* env
		// vars directly on this process — Bun.spawnSync inherits env.
		const saved = {
			name: process.env.GIT_AUTHOR_NAME,
			email: process.env.GIT_AUTHOR_EMAIL,
			cname: process.env.GIT_COMMITTER_NAME,
			cemail: process.env.GIT_COMMITTER_EMAIL,
			home: process.env.HOME,
			xdg: process.env.XDG_CONFIG_HOME,
			config: process.env.GIT_CONFIG_GLOBAL,
		};
		process.env.GIT_AUTHOR_NAME = "";
		process.env.GIT_AUTHOR_EMAIL = "";
		process.env.GIT_COMMITTER_NAME = "";
		process.env.GIT_COMMITTER_EMAIL = "";
		process.env.HOME = tmpDir;
		process.env.XDG_CONFIG_HOME = tmpDir;
		process.env.GIT_CONFIG_GLOBAL = "/dev/null";
		try {
			await expect(run([], join(repo, ".seeds"))).rejects.toThrow(/git commit failed/);
		} finally {
			process.env.GIT_AUTHOR_NAME = saved.name;
			process.env.GIT_AUTHOR_EMAIL = saved.email;
			process.env.GIT_COMMITTER_NAME = saved.cname;
			process.env.GIT_COMMITTER_EMAIL = saved.cemail;
			process.env.HOME = saved.home;
			process.env.XDG_CONFIG_HOME = saved.xdg;
			process.env.GIT_CONFIG_GLOBAL = saved.config;
		}
	});

	test("sd sync --json git-failure (subprocess) emits {success:false,command:'sync',error}", async () => {
		const repo = initBrokenRepo("brokenrepo2");

		const result = Bun.spawnSync(
			["bun", "run", join(import.meta.dir, "..", "index.ts"), "sync", "--json"],
			{
				cwd: repo,
				stdout: "pipe",
				stderr: "pipe",
				env: {
					...process.env,
					GIT_AUTHOR_NAME: "",
					GIT_AUTHOR_EMAIL: "",
					GIT_COMMITTER_NAME: "",
					GIT_COMMITTER_EMAIL: "",
					HOME: tmpDir,
					XDG_CONFIG_HOME: tmpDir,
					GIT_CONFIG_GLOBAL: "/dev/null",
				},
			},
		);

		const stdout = new TextDecoder().decode(result.stdout);
		const payload = JSON.parse(stdout);
		expect(payload.success).toBe(false);
		expect(payload.command).toBe("sync");
		expect(typeof payload.error).toBe("string");
		expect(result.exitCode).not.toBe(0);
	});
});
