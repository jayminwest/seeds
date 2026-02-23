import { findSeedsDir } from "../config.ts";
import { c, outputJson } from "../output.ts";
import { readIssues } from "../store.ts";
import type { Issue } from "../types.ts";
import { PRIORITY_LABELS } from "../types.ts";

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const dir = seedsDir ?? (await findSeedsDir());
	const issues = await readIssues(dir);

	const total = issues.length;
	const open = issues.filter((i: Issue) => i.status === "open").length;
	const inProgress = issues.filter((i: Issue) => i.status === "in_progress").length;
	const closed = issues.filter((i: Issue) => i.status === "closed").length;

	const closedIds = new Set(issues.filter((i: Issue) => i.status === "closed").map((i) => i.id));
	const blocked = issues.filter((i: Issue) => {
		if (i.status === "closed") return false;
		return (i.blockedBy ?? []).some((bid) => !closedIds.has(bid));
	}).length;

	const byType: Record<string, number> = {};
	for (const issue of issues) {
		byType[issue.type] = (byType[issue.type] ?? 0) + 1;
	}

	const byPriority: Record<number, number> = {};
	for (const issue of issues) {
		byPriority[issue.priority] = (byPriority[issue.priority] ?? 0) + 1;
	}

	if (jsonMode) {
		outputJson({
			success: true,
			command: "stats",
			stats: { total, open, inProgress, closed, blocked, byType, byPriority },
		});
	} else {
		console.log(`${c.bold}Project Statistics${c.reset}`);
		console.log(`  Total:       ${total}`);
		console.log(`  Open:        ${open}`);
		console.log(`  In progress: ${inProgress}`);
		console.log(`  Closed:      ${closed}`);
		console.log(`  Blocked:     ${blocked}`);
		console.log(`\n${c.bold}By Type${c.reset}`);
		for (const [type, count] of Object.entries(byType)) {
			console.log(`  ${type.padEnd(10)} ${count}`);
		}
		if (Object.keys(byPriority).length > 0) {
			console.log(`\n${c.bold}By Priority${c.reset}`);
			for (const [p, count] of Object.entries(byPriority)) {
				const label = PRIORITY_LABELS[Number(p)] ?? String(p);
				console.log(`  P${p} ${label.padEnd(10)} ${count}`);
			}
		}
	}
}
