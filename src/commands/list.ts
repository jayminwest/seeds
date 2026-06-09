import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { applyIssueFilters, filterOptionsFromFlags, parseLimitFlag } from "../filter.ts";
import { resolveFormat, stripAnsi, VALID_FORMATS } from "../format.ts";
import {
	formatIssueOneLine,
	formatIssueOneLineCompact,
	outputJson,
	printIssueOneLine,
} from "../output.ts";
import {
	issueJsonWithPlan,
	loadPlanContext,
	planForIssue,
	planLineSuffix,
} from "../plan-context.ts";
import { isSortMode, sortIssues, VALID_SORT_MODES } from "../sort.ts";
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
	const fmt = resolveFormat(args);
	const jsonMode = fmt.mode === "json";
	if (fmt.error) {
		if (jsonMode) {
			await outputJson({ success: false, command: "list", error: fmt.error });
		} else {
			console.error(fmt.error);
		}
		process.exitCode = 1;
		return;
	}
	const flags = parseArgs(args);

	const statusFilter = typeof flags.status === "string" ? flags.status : undefined;
	const showAll = flags.all === true;
	let limit: number;
	try {
		limit = parseLimitFlag(flags.limit);
	} catch (e) {
		const msg = (e as Error).message;
		if (jsonMode) {
			await outputJson({ success: false, command: "list", error: msg });
		} else {
			console.error(msg);
		}
		process.exitCode = 1;
		return;
	}

	const dir = seedsDir ?? (await findSeedsDir());
	const allIssues = await readIssues(dir);
	const closedBlockerIds = new Set(
		allIssues.filter((i: Issue) => i.status === "closed").map((i) => i.id),
	);
	let issues = allIssues;
	const planCtx = await loadPlanContext(dir);

	if (statusFilter) {
		issues = issues.filter((i: Issue) => i.status === statusFilter);
	} else if (!showAll) {
		issues = issues.filter((i: Issue) => i.status !== "closed");
	}
	issues = applyIssueFilters(issues, filterOptionsFromFlags(flags));

	const sortFlag = typeof flags.sort === "string" ? flags.sort : "priority";
	if (!isSortMode(sortFlag)) {
		const msg = `Invalid --sort value: ${sortFlag}. Valid: ${VALID_SORT_MODES.join("|")}`;
		if (jsonMode) {
			await outputJson({ success: false, command: "list", error: msg });
		} else {
			console.error(msg);
		}
		process.exitCode = 1;
		return;
	}
	issues = sortIssues(issues, sortFlag);

	issues = issues.slice(0, limit);

	switch (fmt.mode) {
		case "json": {
			const issuesWithPlan = issues.map((i) => issueJsonWithPlan(i, planForIssue(planCtx, i)));
			await outputJson({
				success: true,
				command: "list",
				issues: issuesWithPlan,
				count: issues.length,
			});
			return;
		}
		case "ids":
			for (const issue of issues) console.log(issue.id);
			return;
		case "compact":
			for (const issue of issues) console.log(formatIssueOneLineCompact(issue, closedBlockerIds));
			return;
		case "plain":
			if (issues.length === 0) {
				console.log("No issues found.");
				return;
			}
			for (const issue of issues) {
				const plan = planForIssue(planCtx, issue);
				console.log(stripAnsi(formatIssueOneLine(issue, closedBlockerIds) + planLineSuffix(plan)));
			}
			console.log(`\n${issues.length} issue(s)`);
			return;
		default:
			if (issues.length === 0) {
				console.log("No issues found.");
				return;
			}
			for (const issue of issues) {
				const plan = planForIssue(planCtx, issue);
				const suffix = planLineSuffix(plan);
				printIssueOneLine(issue, closedBlockerIds, suffix);
			}
			console.log(`\n${issues.length} issue(s)`);
			return;
	}
}

export function register(program: Command): void {
	program
		.command("list")
		.description("List issues with filters")
		.option("--status <status>", "Filter by status (open|in_progress|closed)")
		.option("--type <type>", "Filter by type (task|bug|feature|epic)")
		.option("--assignee <name>", "Filter by assignee")
		.option("--all", "Include closed issues (default: only open/in_progress)")
		.option("--label <labels>", "Filter: must have ALL labels (comma-separated, AND)")
		.option("--label-any <labels>", "Filter: must have any label (comma-separated, OR)")
		.option("--unlabeled", "Filter: issues with no labels")
		.option("--priority <levels>", "Filter by priority (comma-separated, e.g. 0,1 or P0,P1)")
		.option("--priority-max <n>", "Filter to priority <= n (e.g. --priority-max 1 = P0+P1)")
		.option("--limit <n>", "Max issues to show", "50")
		.option("--sort <mode>", "Sort order (priority|created|updated|id)", "priority")
		.option("--format <mode>", `Output format (${VALID_FORMATS.join("|")})`)
		.option("--json", "Output as JSON (alias for --format json)")
		.action(
			async (opts: {
				status?: string;
				type?: string;
				assignee?: string;
				label?: string;
				labelAny?: string;
				unlabeled?: boolean;
				priority?: string;
				priorityMax?: string;
				all?: boolean;
				limit?: string;
				sort?: string;
				format?: string;
				json?: boolean;
			}) => {
				const args: string[] = [];
				if (opts.status) args.push("--status", opts.status);
				if (opts.type) args.push("--type", opts.type);
				if (opts.assignee) args.push("--assignee", opts.assignee);
				if (opts.label) args.push("--label", opts.label);
				if (opts.labelAny) args.push("--label-any", opts.labelAny);
				if (opts.unlabeled) args.push("--unlabeled");
				if (opts.priority) args.push("--priority", opts.priority);
				if (opts.priorityMax) args.push("--priority-max", opts.priorityMax);
				if (opts.all) args.push("--all");
				if (opts.limit) args.push("--limit", opts.limit);
				if (opts.sort) args.push("--sort", opts.sort);
				if (opts.format) args.push("--format", opts.format);
				if (opts.json) args.push("--json");
				await run(args);
			},
		);
}
