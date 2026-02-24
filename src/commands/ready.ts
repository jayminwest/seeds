import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { outputJson, printIssueOneLine } from "../output.ts";
import { readIssues } from "../store.ts";
import type { Issue } from "../types.ts";

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const dir = seedsDir ?? (await findSeedsDir());
	const issues = await readIssues(dir);

	const closedIds = new Set(issues.filter((i: Issue) => i.status === "closed").map((i) => i.id));

	const ready = issues.filter((i: Issue) => {
		if (i.status !== "open") return false;
		const blockers = i.blockedBy ?? [];
		return blockers.every((bid) => closedIds.has(bid));
	});

	if (jsonMode) {
		outputJson({ success: true, command: "ready", issues: ready, count: ready.length });
	} else {
		if (ready.length === 0) {
			console.log("No ready issues.");
			return;
		}
		for (const issue of ready) {
			printIssueOneLine(issue);
		}
		console.log(`\n${ready.length} ready issue(s)`);
	}
}

export function register(program: Command): void {
	program
		.command("ready")
		.description("Show open issues with no unresolved blockers")
		.option("--json", "Output as JSON")
		.action(async (opts: { json?: boolean }) => {
			await run(opts.json ? ["--json"] : []);
		});
}
