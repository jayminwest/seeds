import type { Issue } from "./types.ts";
import { PRIORITY_LABELS } from "./types.ts";

const useColor = !process.env.NO_COLOR && process.stdout.isTTY;

export const c = {
	reset: useColor ? "\x1b[0m" : "",
	bold: useColor ? "\x1b[1m" : "",
	dim: useColor ? "\x1b[2m" : "",
	red: useColor ? "\x1b[31m" : "",
	green: useColor ? "\x1b[32m" : "",
	yellow: useColor ? "\x1b[33m" : "",
	blue: useColor ? "\x1b[34m" : "",
	cyan: useColor ? "\x1b[36m" : "",
	magenta: useColor ? "\x1b[35m" : "",
	gray: useColor ? "\x1b[90m" : "",
};

export function outputJson(data: unknown): void {
	console.log(JSON.stringify(data, null, 2));
}

export function printSuccess(msg: string): void {
	console.log(`${c.green}✓${c.reset} ${msg}`);
}

export function printError(msg: string): void {
	console.error(`${c.red}✗${c.reset} ${msg}`);
}

export function printIssueOneLine(issue: Issue): void {
	const statusIcon =
		issue.status === "closed"
			? `${c.gray}●${c.reset}`
			: issue.status === "in_progress"
				? `${c.cyan}◐${c.reset}`
				: `${c.green}○${c.reset}`;
	const priorityLabel = PRIORITY_LABELS[issue.priority] ?? String(issue.priority);
	const assignee = issue.assignee ? ` · ${c.dim}@${issue.assignee}${c.reset}` : "";
	const blocked = (issue.blockedBy?.length ?? 0) > 0 ? ` ${c.yellow}[blocked]${c.reset}` : "";
	console.log(
		`${statusIcon} ${c.bold}${issue.id}${c.reset} · ${issue.title}   ${c.gray}[${priorityLabel} · ${issue.type}]${c.reset}${assignee}${blocked}`,
	);
}

export function printIssueFull(issue: Issue): void {
	const statusColor =
		issue.status === "closed" ? c.gray : issue.status === "in_progress" ? c.cyan : c.green;
	const priorityLabel = PRIORITY_LABELS[issue.priority] ?? String(issue.priority);

	console.log(`${c.bold}${issue.id}${c.reset}  ${statusColor}${issue.status}${c.reset}`);
	console.log(`Title:    ${issue.title}`);
	console.log(`Type:     ${issue.type}   Priority: ${priorityLabel}`);
	if (issue.assignee) console.log(`Assignee: ${issue.assignee}`);
	if (issue.description) console.log(`\n${issue.description}`);
	if (issue.blockedBy?.length) console.log(`Blocked by: ${issue.blockedBy.join(", ")}`);
	if (issue.blocks?.length) console.log(`Blocks:     ${issue.blocks.join(", ")}`);
	if (issue.convoy) console.log(`Convoy:   ${issue.convoy}`);
	if (issue.closeReason) console.log(`Reason:   ${issue.closeReason}`);
	console.log(`Created:  ${issue.createdAt}`);
	console.log(`Updated:  ${issue.updatedAt}`);
	if (issue.closedAt) console.log(`Closed:   ${issue.closedAt}`);
}
