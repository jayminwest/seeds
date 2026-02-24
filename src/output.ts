import chalk from "chalk";
import type { Issue } from "./types.ts";
import { PRIORITY_LABELS } from "./types.ts";

export function outputJson(data: unknown): void {
	console.log(JSON.stringify(data, null, 2));
}

export function printSuccess(msg: string): void {
	console.log(`${chalk.green("✔")} ${msg}`);
}

export function printError(msg: string): void {
	console.error(`${chalk.red("Error:")} ${msg}`);
}

export function printIssueOneLine(issue: Issue): void {
	const statusIcon =
		issue.status === "closed"
			? chalk.gray("●")
			: issue.status === "in_progress"
				? chalk.cyan("◐")
				: chalk.green("○");
	const priorityLabel = PRIORITY_LABELS[issue.priority] ?? String(issue.priority);
	const assignee = issue.assignee ? ` · ${chalk.dim(`@${issue.assignee}`)}` : "";
	const blocked = (issue.blockedBy?.length ?? 0) > 0 ? ` ${chalk.yellow("[blocked]")}` : "";
	console.log(
		`${statusIcon} ${chalk.bold(issue.id)} · ${issue.title}   ${chalk.gray(`[${priorityLabel} · ${issue.type}]`)}${assignee}${blocked}`,
	);
}

export function printIssueFull(issue: Issue): void {
	const statusColor =
		issue.status === "closed"
			? chalk.gray
			: issue.status === "in_progress"
				? chalk.cyan
				: chalk.green;
	const priorityLabel = PRIORITY_LABELS[issue.priority] ?? String(issue.priority);

	console.log(`${chalk.bold(issue.id)}  ${statusColor(issue.status)}`);
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
