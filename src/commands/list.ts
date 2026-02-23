import { findSeedsDir } from "../config.ts";
import { outputJson, printIssueOneLine } from "../output.ts";
import { readIssues } from "../store.ts";
import type { Issue } from "../types.ts";

function parseArgs(args: string[]) {
	const flags: Record<string, string | boolean> = {};
	let i = 0;
	while (i < args.length) {
		const arg = args[i];
		if (!arg) {
			i++;
			continue;
		}
		if (arg.startsWith("--")) {
			const key = arg.slice(2);
			const eqIdx = key.indexOf("=");
			if (eqIdx !== -1) {
				flags[key.slice(0, eqIdx)] = key.slice(eqIdx + 1);
				i++;
			} else {
				const next = args[i + 1];
				if (next !== undefined && !next.startsWith("--")) {
					flags[key] = next;
					i += 2;
				} else {
					flags[key] = true;
					i++;
				}
			}
		} else {
			i++;
		}
	}
	return flags;
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const flags = parseArgs(args);

	const statusFilter = typeof flags.status === "string" ? flags.status : undefined;
	const typeFilter = typeof flags.type === "string" ? flags.type : undefined;
	const assigneeFilter = typeof flags.assignee === "string" ? flags.assignee : undefined;
	const limitStr = typeof flags.limit === "string" ? flags.limit : "50";
	const limit = Number.parseInt(limitStr, 10) || 50;

	const dir = seedsDir ?? (await findSeedsDir());
	let issues = await readIssues(dir);

	if (statusFilter) issues = issues.filter((i: Issue) => i.status === statusFilter);
	if (typeFilter) issues = issues.filter((i: Issue) => i.type === typeFilter);
	if (assigneeFilter) issues = issues.filter((i: Issue) => i.assignee === assigneeFilter);

	issues = issues.slice(0, limit);

	if (jsonMode) {
		outputJson({ success: true, command: "list", issues, count: issues.length });
	} else {
		if (issues.length === 0) {
			console.log("No issues found.");
			return;
		}
		for (const issue of issues) {
			printIssueOneLine(issue);
		}
		console.log(`\n${issues.length} issue(s)`);
	}
}
