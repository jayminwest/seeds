import { findSeedsDir } from "../config.ts";
import { accent, muted, outputJson } from "../output.ts";
import { readPlans } from "../store.ts";
import type { Plan } from "../types.ts";

export interface ListFilters {
	seed?: string;
	status?: string;
	outcome?: string;
	template?: string;
}

const VALID_PLAN_STATUSES = new Set(["draft", "approved", "active", "done"]);
const VALID_PLAN_OUTCOMES = new Set(["success", "partial", "failure"]);

// Shared by `sd plan list` and `sd plan ready` (seeds-03f2 / pl-611d step 1).
// Validates the --status/--outcome enum flags so both commands reject the same
// bad input with identical messages.
function validateListFilters(filters: ListFilters): void {
	if (filters.status && !VALID_PLAN_STATUSES.has(filters.status)) {
		throw new Error(
			`Invalid --status value: ${filters.status}. Valid: ${[...VALID_PLAN_STATUSES].join("|")}`,
		);
	}
	if (filters.outcome && !VALID_PLAN_OUTCOMES.has(filters.outcome)) {
		throw new Error(
			`Invalid --outcome value: ${filters.outcome}. Valid: ${[...VALID_PLAN_OUTCOMES].join("|")}`,
		);
	}
}

// Apply the positive passthrough filters (--seed/--status/--outcome/--template)
// and sort newest-first. Callers may pre-narrow `plans` first (e.g. `sd plan
// ready` drops status==="done") so this stays a pure positive/exact filter.
function applyListFilters(plans: Plan[], filters: ListFilters): Plan[] {
	return plans
		.filter((p) => (filters.seed ? p.seed === filters.seed : true))
		.filter((p) => (filters.status ? p.status === filters.status : true))
		.filter((p) => (filters.outcome ? p.outcome === filters.outcome : true))
		.filter((p) => (filters.template ? p.template === filters.template : true))
		.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

function truncateName(value: string, width: number): string {
	if (value.length <= width) return value.padEnd(width);
	return `${value.slice(0, Math.max(0, width - 1))}…`;
}

// Render an already-filtered plan list. `command` is the value emitted in the
// JSON `command` field so `plan list` and `plan ready` keep distinct contracts
// while sharing byte-identical human + JSON formatting (seeds-03f2).
async function renderPlanList(filtered: Plan[], command: string, jsonMode: boolean): Promise<void> {
	if (jsonMode) {
		await outputJson({
			success: true,
			command,
			plans: filtered,
			count: filtered.length,
		});
		return;
	}

	if (filtered.length === 0) {
		console.log(muted("No plans match."));
		return;
	}
	const nameWidth = 40;
	for (const p of filtered) {
		const outcome = p.outcome ? muted(` (${p.outcome})`) : "";
		const namePart = p.name
			? `  ${truncateName(p.name, nameWidth)}`
			: `  ${muted("(unnamed)".padEnd(nameWidth))}`;
		console.log(
			`${accent.bold(p.id)}  ${muted(p.status)}  rev ${p.revision}${namePart}  ${muted(p.template)}  ${muted(`seed=${p.seed}`)}  ${muted(`children=${p.children.length}`)}${outcome}  ${muted(p.createdAt)}`,
		);
	}
}

// Shared loader for `sd plan list` and `sd plan ready` (seeds-25de). `notDone`
// pre-narrows status to draft|approved|active before applyListFilters so the
// shared helper stays a pure positive/exact filter; `command` keeps the two
// JSON contracts distinct.
export async function runPlanList(
	command: string,
	filters: ListFilters,
	jsonMode: boolean,
	notDone = false,
): Promise<void> {
	validateListFilters(filters);
	const dir = await findSeedsDir();
	const plans = await readPlans(dir);
	const scoped = notDone ? plans.filter((p) => p.status !== "done") : plans;
	await renderPlanList(applyListFilters(scoped, filters), command, jsonMode);
}
