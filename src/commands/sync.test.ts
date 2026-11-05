import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
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
		const origWrite = process.stdout.write.bind(process.stdout);
		process.stdout.write = ((data: string) => {
			out.push(data);
			return true;
		}) as typeof process.stdout.write;
		try {
			await run(["--json"], join(repo, ".seeds"));
		} finally {
			process.stdout.write = origWrite;
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
		const origWrite = process.stdout.write.bind(process.stdout);
		process.stdout.write = ((data: string) => {
			out.push(data);
			return true;
		}) as typeof process.stdout.write;
		try {
			await run(["--json"], join(repo, ".seeds"));
		} finally {
			process.stdout.write = origWrite;
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
		// Make `git commit` fail deterministically regardless of host git
		// identity. Clearing GIT_AUTHOR_*/HOME is unreliable: Bun drops
		// empty-string env vars when inheriting process.env, and git still
		// auto-derives an identity from the OS (username@hostname via gecos)
		// unless invoked with `-c user.useConfigOnly=true` — which production
		// sync.ts never passes. Instead, install a pre-commit hook that always
		// fails and pin it via repo-local core.hooksPath so a global hooksPath
		// can't bypass it.
		const repo = join(tmpDir, name);
		mkdirSync(repo);
		git(["init"], repo);
		initSeedsDir(repo);
		const hooksDir = join(repo, ".git", "seeds-hooks");
		mkdirSync(hooksDir, { recursive: true });
		const hook = join(hooksDir, "pre-commit");
		writeFileSync(hook, "#!/bin/sh\nexit 1\n");
		chmodSync(hook, 0o755);
		git(["config", "core.hooksPath", hooksDir], repo);
		writeFileSync(
			join(repo, ".seeds", "issues.jsonl"),
			'{"id":"t-0003","title":"T","status":"open","type":"task","priority":2,"createdAt":"2026-01-01T00:00:00Z","updatedAt":"2026-01-01T00:00:00Z"}\n',
		);
		return repo;
	}

	test("git-failure throws so the top-level handler emits the canonical error payload", async () => {
		const repo = initBrokenRepo("brokenrepo");
		await expect(run([], join(repo, ".seeds"))).rejects.toThrow(/git commit failed/);
	});

	test("sd sync --json git-failure (subprocess) emits {success:false,command:'sync',error}", async () => {
		const repo = initBrokenRepo("brokenrepo2");

		const result = Bun.spawnSync(
			["bun", "run", join(import.meta.dir, "..", "index.ts"), "sync", "--json"],
			{
				cwd: repo,
				stdout: "pipe",
				stderr: "pipe",
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

describe("sync — .gitattributes and non-git dirs", () => {
	function silence(): () => void {
		const origLog = console.log;
		const origErr = console.error;
		console.log = () => {};
		console.error = () => {};
		return () => {
			console.log = origLog;
			console.error = origErr;
		};
	}

	function initRepo(): string {
		const repo = join(tmpDir, "repo");
		mkdirSync(repo);
		git(["init"], repo);
		git(["config", "user.email", "test@test.com"], repo);
		git(["config", "user.name", "Test"], repo);
		initSeedsDir(repo);
		return repo;
	}

	function porcelain(repo: string): string {
		const result = Bun.spawnSync(["git", "status", "--porcelain"], { cwd: repo, stdout: "pipe" });
		return new TextDecoder().decode(result.stdout).trim();
	}

	test("stages and commits an untracked .gitattributes carrying .seeds/ rules", async () => {
		const repo = initRepo();
		writeFileSync(join(repo, ".gitattributes"), ".seeds/issues.jsonl merge=union\n");

		const restore = silence();
		try {
			await run([], join(repo, ".seeds"));
		} finally {
			restore();
		}

		expect(porcelain(repo)).toBe("");
	});

	test("--status reports a modified .gitattributes carrying .seeds/ rules", async () => {
		const repo = initRepo();
		writeFileSync(join(repo, ".gitattributes"), ".seeds/issues.jsonl merge=union\n");
		git(["add", "."], repo);
		git(["commit", "-m", "init"], repo);
		writeFileSync(
			join(repo, ".gitattributes"),
			".seeds/issues.jsonl merge=union\n.seeds/plans.jsonl merge=union\n",
		);

		const out: string[] = [];
		const origWrite = process.stdout.write.bind(process.stdout);
		process.stdout.write = ((data: string) => {
			out.push(data);
			return true;
		}) as typeof process.stdout.write;
		try {
			await run(["--status", "--json"], join(repo, ".seeds"));
		} finally {
			process.stdout.write = origWrite;
		}

		const payload = JSON.parse(out.join(""));
		expect(payload.hasChanges).toBe(true);
		expect(payload.changes).toContain(".gitattributes");
	});

	test("leaves a .gitattributes without .seeds/ rules alone", async () => {
		const repo = initRepo();
		writeFileSync(join(repo, ".gitattributes"), "*.png binary\n");

		const restore = silence();
		try {
			await run([], join(repo, ".seeds"));
		} finally {
			restore();
		}

		expect(porcelain(repo)).toBe("?? .gitattributes");
	});

	test("throws 'Not a git repository' outside a git repo", async () => {
		const dir = join(tmpDir, "nogit");
		mkdirSync(dir);
		initSeedsDir(dir);
		// Pin discovery to tmpDir so a git repo above the OS tmpdir can't leak in.
		const origCeiling = process.env.GIT_CEILING_DIRECTORIES;
		process.env.GIT_CEILING_DIRECTORIES = tmpDir;
		try {
			await expect(run([], join(dir, ".seeds"))).rejects.toThrow(/Not a git repository/);
		} finally {
			if (origCeiling === undefined) delete process.env.GIT_CEILING_DIRECTORIES;
			else process.env.GIT_CEILING_DIRECTORIES = origCeiling;
		}
	});
});
