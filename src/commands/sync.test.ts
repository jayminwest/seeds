import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

		// Capture console output
		const logs: string[] = [];
		const origLog = console.log;
		console.log = (...args: unknown[]) => {
			logs.push(args.map(String).join(" "));
		};

		const origCwd = process.cwd();
		process.chdir(wtDir);
		try {
			await run([]);
		} finally {
			process.chdir(origCwd);
			console.log = origLog;
		}

		expect(logs.some((l) => l.includes("worktree"))).toBe(true);
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

		const logs: string[] = [];
		const origLog = console.log;
		console.log = (...args: unknown[]) => {
			logs.push(args.map(String).join(" "));
		};

		const origCwd = process.cwd();
		process.chdir(wtDir);
		try {
			await run(["--json"]);
		} finally {
			process.chdir(origCwd);
			console.log = origLog;
		}

		const output = JSON.parse(logs.join(""));
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
