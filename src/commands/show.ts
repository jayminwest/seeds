import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { outputJson, printIssueFull } from "../output.ts";
import { readIssues } from "../store.ts";

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const id = args.find((a) => !a.startsWith("--"));
	if (!id) throw new Error("Usage: sd show <id>");

	const dir = seedsDir ?? (await findSeedsDir());
	const issues = await readIssues(dir);
	const issue = issues.find((i) => i.id === id);
	if (!issue) throw new Error(`Issue not found: ${id}`);

	if (jsonMode) {
		outputJson({ success: true, command: "show", issue });
	} else {
		printIssueFull(issue);
	}
}

export function register(program: Command): void {
	program
		.command("show <id>")
		.description("Show issue details")
		.option("--json", "Output as JSON")
		.action(async (id: string, opts: { json?: boolean }) => {
			const args: string[] = [id];
			if (opts.json) args.push("--json");
			await run(args);
		});
}
