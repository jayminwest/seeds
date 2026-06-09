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
	isPlanDraftBlocking,
	issueJsonWithPlan,
	loadPlanContext,
	planForIssue,
	planLineSuffix,
} from "../plan-context.ts";
import { isSortMode, sortIssues, VALID_SORT_MODES } from "../sort.ts";
import { readIssues } from "../store.ts";
import type { Issue, Plan } from "../types.ts";

// pl-c195 step 4: opt-in schedule filter. Two well-known extension keys:
//   extensions.queued === true     → not ready yet (intentionally parked)
//   extensions.scheduledFor: ISO8601 in the future → not ready yet
// Malformed/past values fall through to ready as if the keys weren't set.
function isScheduledOut(issue: Issue, now: number): boolean {
	const ext = issue.extensions;
	if (!ext) return false;
	if (ext.queued === true) return true;
	const sched = ext.scheduledFor;
	if (typeof sched === "string") {
		const t = Date.parse(sched);
		if (!Number.isNaN(t) && t > now) return true;
	}
	return false;
}

function parseArgs(args: string[]): Record<string, string | boolean> {
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
			await outputJson({ success: false, command: "ready", error: fmt.error });
		} else {
			console.error(fmt.error);
		}
		process.exitCode = 1;
		return;
	}
	const flags = parseArgs(args);
	let limit: number;
	try {
		limit = parseLimitFlag(flags.limit);
	} catch (e) {
		const msg = (e as Error).message;
		if (jsonMode) {
			await outputJson({ success: false, command: "ready", error: msg });
		} else {
			console.error(msg);
		}
		process.exitCode = 1;
		return;
	}

	const dir = seedsDir ?? (await findSeedsDir());
	const issues = await readIssues(dir);
	const planCtx = await loadPlanContext(dir);

	const closedIds = new Set(issues.filter((i: Issue) => i.status === "closed").map((i) => i.id));

	let ready = issues.filter((i: Issue) => {
		if (i.status !== "open") return false;
		// PLAN_SPEC.md:342 — seeds with requires_plan are excluded until their
		// own sub-plan reaches `approved`. Lookup by seed-id since plan_id is
		// not set on the spawned child until its sub-plan submit succeeds.
		if (i.requires_plan === true) {
			const sub = planCtx.plansBySeed.get(i.id);
			if (!sub || sub.status === "draft") return false;
			// approved/active/done: fall through to standard blocker check.
		} else if (isPlanDraftBlocking(planForIssue(planCtx, i))) {
			// Planning is the highest-priority work: surface seeds with a draft
			// plan even if they would otherwise be blocked. (PLAN_SPEC.md:154)
			return true;
		}
		const blockers = i.blockedBy ?? [];
		return blockers.every((bid) => closedIds.has(bid));
	});

	ready = applyIssueFilters(ready, filterOptionsFromFlags(flags));

	if (flags["respect-schedule"] === true) {
		const nowMs = Date.now();
		ready = ready.filter((i) => !isScheduledOut(i, nowMs));
	}

	const sortFlag = typeof flags.sort === "string" ? flags.sort : "priority";
	if (!isSortMode(sortFlag)) {
		const msg = `Invalid --sort value: ${sortFlag}. Valid: ${VALID_SORT_MODES.join("|")}`;
		if (jsonMode) {
			await outputJson({ success: false, command: "ready", error: msg });
		} else {
			console.error(msg);
		}
		process.exitCode = 1;
		return;
	}
	ready = sortIssues(ready, sortFlag);

	ready = ready.slice(0, limit);

	const annotate = (issue: Issue): { issue: Issue; plan?: Plan } => ({
		issue,
		plan: planForIssue(planCtx, issue),
	});

	switch (fmt.mode) {
		case "json": {
			const issuesWithPlan = ready.map((i) => issueJsonWithPlan(i, planForIssue(planCtx, i)));
			await outputJson({
				success: true,
				command: "ready",
				issues: issuesWithPlan,
				count: ready.length,
			});
			return;
		}
		case "ids":
			for (const issue of ready) console.log(issue.id);
			return;
		case "compact":
			for (const issue of ready) console.log(formatIssueOneLineCompact(issue, closedIds));
			return;
		case "plain":
			if (ready.length === 0) {
				console.log("No ready issues.");
				return;
			}
			for (const issue of ready) {
				const { plan } = annotate(issue);
				console.log(stripAnsi(formatIssueOneLine(issue, closedIds) + planLineSuffix(plan)));
			}
			console.log(`\n${ready.length} ready issue(s)`);
			return;
		default:
			if (ready.length === 0) {
				console.log("No ready issues.");
				return;
			}
			for (const issue of ready) {
				const { plan } = annotate(issue);
				const suffix = planLineSuffix(plan);
				printIssueOneLine(issue, closedIds, suffix);
			}
			console.log(`\n${ready.length} ready issue(s)`);
			return;
	}
}

export function register(program: Command): void {
	program
		.command("ready")
		.description("Show open issues with no unresolved blockers")
		.option("--type <type>", "Filter by type (task|bug|feature|epic)")
		.option("--assignee <name>", "Filter by assignee")
		.option("--label <labels>", "Filter: must have ALL labels (comma-separated, AND)")
		.option("--label-any <labels>", "Filter: must have any label (comma-separated, OR)")
		.option("--unlabeled", "Filter: issues with no labels")
		.option("--priority <levels>", "Filter by priority (comma-separated, e.g. 0,1 or P0,P1)")
		.option("--priority-max <n>", "Filter to priority <= n (e.g. --priority-max 1 = P0+P1)")
		.option("--limit <n>", "Max issues to show", "50")
		.option("--sort <mode>", "Sort order (priority|created|updated|id)", "priority")
		.option("--format <mode>", `Output format (${VALID_FORMATS.join("|")})`)
		.option("--json", "Output as JSON (alias for --format json)")
		.option(
			"--respect-schedule",
			"Exclude issues with extensions.queued=true or future extensions.scheduledFor",
		)
		.action(
			async (opts: {
				type?: string;
				assignee?: string;
				label?: string;
				labelAny?: string;
				unlabeled?: boolean;
				priority?: string;
				priorityMax?: string;
				limit?: string;
				sort?: string;
				format?: string;
				json?: boolean;
				respectSchedule?: boolean;
			}) => {
				const args: string[] = [];
				if (opts.type) args.push("--type", opts.type);
				if (opts.assignee) args.push("--assignee", opts.assignee);
				if (opts.label) args.push("--label", opts.label);
				if (opts.labelAny) args.push("--label-any", opts.labelAny);
				if (opts.unlabeled) args.push("--unlabeled");
				if (opts.priority) args.push("--priority", opts.priority);
				if (opts.priorityMax) args.push("--priority-max", opts.priorityMax);
				if (opts.limit) args.push("--limit", opts.limit);
				if (opts.sort) args.push("--sort", opts.sort);
				if (opts.format) args.push("--format", opts.format);
				if (opts.json) args.push("--json");
				if (opts.respectSchedule) args.push("--respect-schedule");
				await run(args);
			},
		);
}
