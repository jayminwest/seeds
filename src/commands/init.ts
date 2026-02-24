import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Command } from "commander";
import { outputJson, printSuccess } from "../output.ts";
import { CONFIG_FILE, ISSUES_FILE, SEEDS_DIR_NAME, TEMPLATES_FILE } from "../types.ts";

export async function run(args: string[]): Promise<void> {
	const jsonMode = args.includes("--json");
	const cwd = process.cwd();
	const seedsDir = join(cwd, SEEDS_DIR_NAME);

	if (existsSync(join(seedsDir, CONFIG_FILE))) {
		if (jsonMode) {
			outputJson({ success: true, command: "init", dir: seedsDir });
		} else {
			printSuccess(`Already initialized: ${seedsDir}`);
		}
		return;
	}

	mkdirSync(seedsDir, { recursive: true });

	// config.yaml — derive project name from directory
	const projectName = basename(cwd);
	writeFileSync(join(seedsDir, CONFIG_FILE), `project: "${projectName}"\nversion: "1"\n`);

	// empty JSONL files
	writeFileSync(join(seedsDir, ISSUES_FILE), "");
	writeFileSync(join(seedsDir, TEMPLATES_FILE), "");

	// .gitignore inside .seeds/
	writeFileSync(join(seedsDir, ".gitignore"), "*.lock\n");

	// Append .gitattributes to project root
	const gitattrsPath = join(cwd, ".gitattributes");
	const entry = ".seeds/issues.jsonl merge=union\n.seeds/templates.jsonl merge=union\n";
	if (existsSync(gitattrsPath)) {
		const existing = readFileSync(gitattrsPath, "utf8");
		if (!existing.includes(".seeds/issues.jsonl")) {
			writeFileSync(gitattrsPath, `${existing}\n${entry}`);
		}
	} else {
		writeFileSync(gitattrsPath, entry);
	}

	if (jsonMode) {
		outputJson({ success: true, command: "init", dir: seedsDir });
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
