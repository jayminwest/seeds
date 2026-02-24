import chalk from "chalk";
import type { Issue } from "./types.ts";
import { PRIORITY_LABELS } from "./types.ts";

let _quiet = false;

export function setQuiet(v: boolean): void {
	_quiet = v;
}

export function outputJson(data: unknown): void {
	console.log(JSON.stringify(data, null, 2));
}

export function printSuccess(msg: string): void {
	if (_quiet) return;
	console.log(`${chalk.green("✔")} ${msg}`);
}

export function printError(msg: string): void {
	console.error(`${chalk.red("✗")} ${msg}`);
}

export function printWarning(msg: string): void {
	console.log(`${chalk.yellow("!")} ${msg}`);
}

export function printIssueOneLine(issue: Issue): void {
	if (_quiet) return;
	const statusIcon =
		issue.status === "closed"
			? muted("x")
			: issue.status === "in_progress"
				? chalk.cyan(">")
				: isBlocked
					? chalk.yellow("!")
					: brand("-");
	const priorityLabel = PRIORITY_LABELS[issue.priority] ?? String(issue.priority);
	const assignee = issue.assignee ? ` · ${muted(`@${issue.assignee}`)}` : "";
	const blocked = isBlocked ? ` ${chalk.yellow("[blocked]")}` : "";
	console.log(
		`${statusIcon} ${accent.bold(issue.id)} · ${issue.title}   ${muted(`[${priorityLabel} · ${issue.type}]`)}${assignee}${blocked}`,
	);
}

export function printIssueFull(issue: Issue): void {
	if (_quiet) return;
	const statusColor =
		issue.status === "closed" ? muted : issue.status === "in_progress" ? chalk.cyan : brand;
	const priorityLabel = PRIORITY_LABELS[issue.priority] ?? String(issue.priority);

	console.log(`${accent.bold(issue.id)}  ${statusColor(issue.status)}`);
	console.log(`Title:    ${issue.title}`);
	console.log(`Type:     ${muted(issue.type)}   Priority: ${muted(priorityLabel)}`);
	if (issue.assignee) console.log(`Assignee: ${issue.assignee}`);
	if (issue.description) console.log(`\n${issue.description}`);
	if (issue.blockedBy?.length)
		console.log(`Blocked by: ${issue.blockedBy.map((id) => accent(id)).join(", ")}`);
	if (issue.blocks?.length)
		console.log(`Blocks:     ${issue.blocks.map((id) => accent(id)).join(", ")}`);
	if (issue.convoy) console.log(`Convoy:   ${muted(issue.convoy)}`);
	if (issue.closeReason) console.log(`Reason:   ${issue.closeReason}`);
	console.log(`Created:  ${muted(issue.createdAt)}`);
	console.log(`Updated:  ${muted(issue.updatedAt)}`);
	if (issue.closedAt) console.log(`Closed:   ${muted(issue.closedAt)}`);
}
