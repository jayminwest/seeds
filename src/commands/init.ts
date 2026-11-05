import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Command } from "commander";
import { ensureMergeStrategy } from "../merge-strategy.ts";
import { outputJson, printSuccess } from "../output.ts";
import {
	CONFIG_FILE,
	DEFAULT_MAX_PLAN_DEPTH,
	ISSUES_FILE,
	PLANS_FILE,
	SEEDS_DIR_NAME,
	TEMPLATES_FILE,
} from "../types.ts";

export async function run(args: string[]): Promise<void> {
	const jsonMode = args.includes("--json");
	const cwd = process.cwd();
	const seedsDir = join(cwd, SEEDS_DIR_NAME);

	if (existsSync(join(seedsDir, CONFIG_FILE))) {
		// Re-run still repairs the per-store merge strategy (migrates legacy
		// merge=union lines, registers the driver in a fresh clone).
		ensureMergeStrategy(cwd);
		if (jsonMode) {
			await outputJson({ success: true, command: "init", dir: seedsDir });
		} else {
			printSuccess(`Already initialized: ${seedsDir}`);
		}
		return;
	}

	mkdirSync(seedsDir, { recursive: true });

	// config.yaml — derive project name from directory
	const projectName = basename(cwd);
	writeFileSync(
		join(seedsDir, CONFIG_FILE),
		`project: "${projectName}"\nversion: "1"\nmax_plan_depth: ${DEFAULT_MAX_PLAN_DEPTH}\n`,
	);

	// empty JSONL files
	writeFileSync(join(seedsDir, ISSUES_FILE), "");
	writeFileSync(join(seedsDir, TEMPLATES_FILE), "");
	writeFileSync(join(seedsDir, PLANS_FILE), "");

	// .gitignore inside .seeds/: lock files plus crash leftovers from store.ts
	// (atomic-write temp files and stale-lock sidecars), so `sd sync` never
	// commits them.
	writeFileSync(join(seedsDir, ".gitignore"), "*.lock\n*.tmp.*\n*.lock.stale.*\n");

	ensureMergeStrategy(cwd);

	if (jsonMode) {
		await outputJson({ success: true, command: "init", dir: seedsDir });
	} else {
		printSuccess(`Initialized .seeds/ in ${cwd}`);
	}
}

export function register(program: Command): void {
	program
		.command("init")
		.description("Initialize .seeds/ in current directory")
		.option("--json", "Output as JSON")
		.action(async (opts: { json?: boolean }) => {
			await run(opts.json ? ["--json"] : []);
		});
}
