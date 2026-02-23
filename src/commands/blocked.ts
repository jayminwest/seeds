import { findSeedsDir } from "../config.ts";
import { outputJson, printIssueOneLine } from "../output.ts";
import { readIssues } from "../store.ts";
import type { Issue } from "../types.ts";

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const dir = seedsDir ?? (await findSeedsDir());
	const issues = await readIssues(dir);

	const closedIds = new Set(issues.filter((i: Issue) => i.status === "closed").map((i) => i.id));

	const blocked = issues.filter((i: Issue) => {
		if (i.status === "closed") return false;
		const blockers = i.blockedBy ?? [];
		return blockers.some((bid) => !closedIds.has(bid));
	});

	if (jsonMode) {
		outputJson({ success: true, command: "blocked", issues: blocked, count: blocked.length });
	} else {
		if (blocked.length === 0) {
			console.log("No blocked issues.");
			return;
		}
		for (const issue of blocked) {
			printIssueOneLine(issue);
		}
		console.log(`\n${blocked.length} blocked issue(s)`);
	}
}
