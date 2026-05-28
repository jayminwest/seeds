import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Command } from "commander";
import { outputJson, printSuccess } from "../output.ts";
import {
	CONFIG_FILE,
	DEFAULT_MAX_PLAN_DEPTH,
	ISSUES_FILE,
	PLANS_FILE,
	SEEDS_DIR_NAME,
	TEMPLATES_FILE,
} from "../types.ts";

const MERGE_UNION_LINES = [
	".seeds/issues.jsonl merge=union",
	".seeds/templates.jsonl merge=union",
	".seeds/plans.jsonl merge=union",
];

function ensureGitattributes(cwd: string): void {
	const gitattrsPath = join(cwd, ".gitattributes");
	if (existsSync(gitattrsPath)) {
		const existing = readFileSync(gitattrsPath, "utf8");
		const missing = MERGE_UNION_LINES.filter((line) => !existing.includes(line));
		if (missing.length === 0) return;
		const sep = existing.length === 0 || existing.endsWith("\n") ? "" : "\n";
		writeFileSync(gitattrsPath, `${existing}${sep}${missing.join("\n")}\n`);
	} else {
		writeFileSync(gitattrsPath, `${MERGE_UNION_LINES.join("\n")}\n`);
	}
}

export async function run(args: string[]): Promise<void> {
	const jsonMode = args.includes("--json");
	const cwd = process.cwd();
	const seedsDir = join(cwd, SEEDS_DIR_NAME);

	if (existsSync(join(seedsDir, CONFIG_FILE))) {
		// Re-run still backfills any missing merge=union lines per-file.
		ensureGitattributes(cwd);
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

	// .gitignore inside .seeds/
	writeFileSync(join(seedsDir, ".gitignore"), "*.lock\n");

	ensureGitattributes(cwd);

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
