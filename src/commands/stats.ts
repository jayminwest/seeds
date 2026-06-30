import chalk from "chalk";
import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { resolveFormat, stripAnsi, VALID_FORMATS } from "../format.ts";
import { muted, outputJson, printError } from "../output.ts";
import { readIssues } from "../store.ts";
import type { Issue } from "../types.ts";
import { PRIORITY_LABELS } from "../types.ts";

interface StatsData {
	total: number;
	open: number;
	inProgress: number;
	closed: number;
	blocked: number;
	byType: Record<string, number>;
	byPriority: Record<number, number>;
	byLabel: Record<string, number>;
}

function formatStatsMarkdown(s: StatsData): string {
	const lines: string[] = [];
	lines.push(`${chalk.bold("Project Statistics")}`);
	lines.push(`  ${muted("Total:")}       ${s.total}`);
	lines.push(`  ${muted("Open:")}        ${s.open}`);
	lines.push(`  ${muted("In progress:")} ${s.inProgress}`);
	lines.push(`  ${muted("Closed:")}      ${s.closed}`);
	lines.push(`  ${muted("Blocked:")}     ${s.blocked}`);
	lines.push(`\n${chalk.bold("By Type")}`);
	for (const [type, count] of Object.entries(s.byType)) {
		lines.push(`  ${muted(type.padEnd(10))} ${count}`);
	}
	if (Object.keys(s.byPriority).length > 0) {
		lines.push(`\n${chalk.bold("By Priority")}`);
		for (const [p, count] of Object.entries(s.byPriority)) {
			const label = PRIORITY_LABELS[Number(p)] ?? String(p);
			lines.push(`  ${muted(`P${p} ${label.padEnd(10)}`)} ${count}`);
		}
	}
	if (Object.keys(s.byLabel).length > 0) {
		lines.push(`\n${chalk.bold("By Label")}`);
		for (const [label, count] of Object.entries(s.byLabel).sort((a, b) => b[1] - a[1])) {
			lines.push(`  ${muted(label.padEnd(15))} ${count}`);
		}
	}
	return lines.join("\n");
}

function formatStatsCompact(s: StatsData): string {
	const lines: string[] = [];
	lines.push(
		`total=${s.total} open=${s.open} in_progress=${s.inProgress} closed=${s.closed} blocked=${s.blocked}`,
	);
	const types = Object.entries(s.byType)
		.map(([t, c]) => `${t}=${c}`)
		.join(" ");
	if (types) lines.push(`by_type: ${types}`);
	const prios = Object.entries(s.byPriority)
		.map(([p, c]) => `P${p}=${c}`)
		.join(" ");
	if (prios) lines.push(`by_priority: ${prios}`);
	const labels = Object.entries(s.byLabel)
		.sort((a, b) => b[1] - a[1])
		.map(([l, c]) => `${l}=${c}`)
		.join(" ");
	if (labels) lines.push(`by_label: ${labels}`);
	return lines.join("\n");
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const fmt = resolveFormat(args);
	const jsonMode = fmt.mode === "json";
	if (fmt.error) {
		if (jsonMode) {
			await outputJson({ success: false, command: "stats", error: fmt.error });
		} else {
			printError(fmt.error);
		}
		process.exitCode = 1;
		return;
	}
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

	const byLabel: Record<string, number> = {};
	for (const issue of issues) {
		for (const label of issue.labels ?? []) {
			byLabel[label] = (byLabel[label] ?? 0) + 1;
		}
	}

	const data: StatsData = { total, open, inProgress, closed, blocked, byType, byPriority, byLabel };

	switch (fmt.mode) {
		case "json":
			await outputJson({ success: true, command: "stats", stats: data });
			return;
		case "ids":
			// Stats has no IDs to emit.
			return;
		case "compact":
			console.log(formatStatsCompact(data));
			return;
		case "plain":
			console.log(stripAnsi(formatStatsMarkdown(data)));
			return;
		default:
			console.log(formatStatsMarkdown(data));
			return;
	}
}

export function register(program: Command): void {
	program
		.command("stats")
		.description("Project statistics")
		.option("--format <mode>", `Output format (${VALID_FORMATS.join("|")})`)
		.option("--json", "Output as JSON (alias for --format json)")
		.action(async (opts: { format?: string; json?: boolean }) => {
			const args: string[] = [];
			if (opts.format) args.push("--format", opts.format);
			if (opts.json) args.push("--json");
			await run(args);
		});
}
