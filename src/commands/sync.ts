import type { Command } from "commander";
import { findSeedsDir, isInsideWorktree, projectRootFromSeedsDir } from "../config.ts";
import { outputJson, printWarning } from "../output.ts";
import { SEEDS_DIR_NAME } from "../types.ts";

function spawnSync(
	cmd: string[],
	cwd: string,
): { stdout: string; stderr: string; exitCode: number } {
	const result = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
	const stdout = new TextDecoder().decode(result.stdout);
	const stderr = new TextDecoder().decode(result.stderr);
	return { stdout, stderr, exitCode: result.exitCode ?? 0 };
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const statusOnly = args.includes("--status");
	const dryRun = args.includes("--dry-run");

	const dir = seedsDir ?? (await findSeedsDir());
	const projectRoot = projectRootFromSeedsDir(dir);

	// Worktree guard: skip commit when running from a worktree
	if (!seedsDir && isInsideWorktree(process.cwd())) {
		const msg = "Inside a git worktree — skipping commit. Issues are stored in the main repo.";
		if (jsonMode) {
			outputJson({
				success: true,
				command: "sync",
				committed: false,
				worktree: true,
				message: msg,
			});
		} else {
			printWarning(msg);
		}
		return;
	}

	const statusResult = spawnSync(
		["git", "-C", projectRoot, "status", "--porcelain", `${SEEDS_DIR_NAME}/`],
		projectRoot,
	);

	const changed = statusResult.stdout.trim();

	if (statusOnly) {
		if (jsonMode) {
			outputJson({ success: true, command: "sync", hasChanges: !!changed, changes: changed });
		} else {
			if (changed) {
				console.log("Uncommitted .seeds/ changes:");
				console.log(changed);
			} else {
				console.log("No uncommitted .seeds/ changes.");
			}
		}
		return;
	}

	if (!changed) {
		if (jsonMode) {
			outputJson({
				success: true,
				command: "sync",
				committed: false,
				message: "Nothing to commit",
			});
		} else {
			console.log("No changes to commit.");
		}
		return;
	}

	if (dryRun) {
		const date = new Date().toISOString().slice(0, 10);
		const msg = `seeds: sync ${date}`;
		if (jsonMode) {
			outputJson({
				success: true,
				command: "sync",
				dryRun: true,
				wouldCommit: true,
				message: msg,
				changes: changed,
			});
		} else {
			console.log("Dry run — would commit:");
			console.log(changed);
			console.log(`Commit message: ${msg}`);
		}
		return;
	}

	// Stage
	const addResult = spawnSync(["git", "-C", projectRoot, "add", `${SEEDS_DIR_NAME}/`], projectRoot);
	if (addResult.exitCode !== 0) {
		throw new Error(`git add failed: ${addResult.stderr}`);
	}

	// Commit
	const date = new Date().toISOString().slice(0, 10);
	const msg = `seeds: sync ${date}`;
	const commitResult = spawnSync(["git", "-C", projectRoot, "commit", "-m", msg], projectRoot);
	if (commitResult.exitCode !== 0) {
		throw new Error(`git commit failed: ${commitResult.stderr}`);
	}

	if (jsonMode) {
		outputJson({ success: true, command: "sync", committed: true, message: msg });
	} else {
		console.log(`Committed: ${msg}`);
	}
}

export function register(program: Command): void {
	program
		.command("sync")
		.description("Stage and commit .seeds/ changes")
		.option("--status", "Check status without committing")
		.option("--dry-run", "Show what would be committed without committing")
		.option("--json", "Output as JSON")
		.action(async (opts: { status?: boolean; dryRun?: boolean; json?: boolean }) => {
			const args: string[] = [];
			if (opts.status) args.push("--status");
			if (opts.dryRun) args.push("--dry-run");
			if (opts.json) args.push("--json");
			await run(args);
		});
}
