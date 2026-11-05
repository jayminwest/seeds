import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import {
	applyIssueFilters,
	type FilterFlags,
	filterOptionsFromFlags,
	parseLimitFlag,
} from "../filter.ts";
import { type FormatOptions, formatFromOptions, stripAnsi, VALID_FORMATS } from "../format.ts";
import {
	formatIssueOneLine,
	formatIssueOneLineCompact,
	outputJson,
	printError,
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
import { VALID_STATUSES, VALID_TYPES } from "../types.ts";

/** Row cap for human-readable formats when --limit is absent. */
const DEFAULT_HUMAN_LIMIT = 50;

/**
 * Footer for human formats. Names the total when rows were cut so truncation
 * is never silent.
 */
function countFooter(shown: number, total: number): string {
	if (shown === total) return `${total} issue(s)`;
	return `${shown} of ${total} issue(s) shown (use --limit 0 for all)`;
}

interface ListOptions extends FilterFlags, FormatOptions {
	status?: string;
	all?: boolean;
	limit?: string;
	sort?: string;
}

async function runList(opts: ListOptions, seedsDir?: string): Promise<void> {
	const fmt = formatFromOptions(opts);
	const jsonMode = fmt.mode === "json";
	if (fmt.error) {
		if (jsonMode) {
			await outputJson({ success: false, command: "list", error: fmt.error });
		} else {
			printError(fmt.error);
		}
		process.exitCode = 1;
		return;
	}

	const statusFilter = opts.status;
	if (statusFilter && !(VALID_STATUSES as readonly string[]).includes(statusFilter)) {
		const msg = `Invalid --status value: ${statusFilter}. Valid: ${VALID_STATUSES.join("|")}`;
		if (jsonMode) {
			await outputJson({ success: false, command: "list", error: msg });
		} else {
			printError(msg);
		}
		process.exitCode = 1;
		return;
	}
	const typeFilter = opts.type;
	if (typeFilter && !(VALID_TYPES as readonly string[]).includes(typeFilter)) {
		const msg = `Invalid --type value: ${typeFilter}. Valid: ${VALID_TYPES.join("|")}`;
		if (jsonMode) {
			await outputJson({ success: false, command: "list", error: msg });
		} else {
			printError(msg);
		}
		process.exitCode = 1;
		return;
	}
	const showAll = opts.all === true;
	let limit: number;
	try {
		// Machine formats (json, ids) are consumed as the complete set, so they are
		// uncapped by default; human formats keep a screenful and say so in the footer.
		const machine = fmt.mode === "json" || fmt.mode === "ids";
		limit = parseLimitFlag(opts.limit, machine ? Number.POSITIVE_INFINITY : DEFAULT_HUMAN_LIMIT);
	} catch (e) {
		const msg = (e as Error).message;
		if (jsonMode) {
			await outputJson({ success: false, command: "list", error: msg });
		} else {
			printError(msg);
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
	issues = applyIssueFilters(issues, filterOptionsFromFlags(opts));

	const sortFlag = opts.sort ?? "priority";
	if (!isSortMode(sortFlag)) {
		const msg = `Invalid --sort value: ${sortFlag}. Valid: ${VALID_SORT_MODES.join("|")}`;
		if (jsonMode) {
			await outputJson({ success: false, command: "list", error: msg });
		} else {
			printError(msg);
		}
		process.exitCode = 1;
		return;
	}
	issues = sortIssues(issues, sortFlag);

	const total = issues.length;
	issues = issues.slice(0, limit);
	const truncated = issues.length < total;

	switch (fmt.mode) {
		case "json": {
			const issuesWithPlan = issues.map((i) => issueJsonWithPlan(i, planForIssue(planCtx, i)));
			await outputJson({
				success: true,
				command: "list",
				issues: issuesWithPlan,
				count: issues.length,
				total,
				truncated,
			});
			return;
		}
		case "ids":
			for (const issue of issues) console.log(issue.id);
			return;
		case "compact":
			for (const issue of issues) console.log(formatIssueOneLineCompact(issue, closedBlockerIds));
			if (truncated) process.stderr.write(`${countFooter(issues.length, total)}\n`);
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
			console.log(`\n${countFooter(issues.length, total)}`);
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
			console.log(`\n${countFooter(issues.length, total)}`);
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
		.option(
			"--limit <n>",
			`Max issues to show; 0 = no limit (default: ${DEFAULT_HUMAN_LIMIT}; json/ids: no limit)`,
		)
		.option("--sort <mode>", "Sort order (priority|created|updated|id)", "priority")
		.option("--format <mode>", `Output format (${VALID_FORMATS.join("|")})`)
		.option("--json", "Output as JSON (alias for --format json)")
		.action(async (opts: ListOptions) => {
			await runList(opts);
		});
}
