// Shared plan-awareness helpers for ready/show/list integration
// (PLAN_SPEC.md:154-156). Each consumer reads plans + issues once and uses
// these helpers to look up plan state and render hints/summaries.

import { accent, muted } from "./output.ts";
import { readPlans } from "./store.ts";
import type { Issue, Plan } from "./types.ts";

export interface PlanContext {
	plansById: Map<string, Plan>;
	plansBySeed: Map<string, Plan>;
}

export async function loadPlanContext(seedsDir: string): Promise<PlanContext> {
	const plans = await readPlans(seedsDir);
	const plansById = new Map(plans.map((p) => [p.id, p]));
	const plansBySeed = new Map<string, Plan>();
	for (const p of plans) {
		// If multiple plans exist for the same seed (would only happen via prior
		// drafts), prefer the most-recently-updated one for surfacing.
		const existing = plansBySeed.get(p.seed);
		if (!existing || existing.updatedAt < p.updatedAt) plansBySeed.set(p.seed, p);
	}
	return { plansById, plansBySeed };
}

export function planForIssue(ctx: PlanContext, issue: Issue): Plan | undefined {
	if (!issue.plan_id) return undefined;
	return ctx.plansById.get(issue.plan_id);
}

// Human-readable suffix appended to one-line issue formatting in list/ready.
export function planLineSuffix(plan: Plan | undefined): string {
	if (!plan) return "";
	if (plan.status === "draft") {
		return ` ${accent("[plan in draft — run sd plan submit]")}`;
	}
	return ` ${muted(`[plan ${plan.status}]`)}`;
}

// Returns true if `sd ready` should surface this seed regardless of normal
// blocker checks. Planning takes precedence over implementation when a seed
// has a draft plan attached.
export function isPlanDraftBlocking(plan: Plan | undefined): boolean {
	return plan?.status === "draft";
}

export interface ChildSummary {
	id: string;
	title: string;
	status: string;
	adopted: boolean;
}

// Shared --json shape used by list/ready/search/blocked when surfacing an
// issue that has a plan attached. Returns the issue unchanged when there is
// no plan, so the JSON payload remains a strict superset (no key churn for
// plan-less issues).
export function issueJsonWithPlan(
	issue: Issue,
	plan: Plan | undefined,
): Issue & {
	plan_status?: string;
	plan_children?: string[];
} {
	if (!plan) return issue;
	return { ...issue, plan_status: plan.status, plan_children: plan.children };
}

export function summarisePlanChildren(plan: Plan, issues: Issue[]): ChildSummary[] {
	const adoptedSet = new Set(plan.adoptedChildren ?? []);
	return plan.children.map((id) => {
		const issue = issues.find((i) => i.id === id);
		return {
			id,
			title: issue?.title ?? "(missing)",
			status: issue?.status ?? "missing",
			adopted: adoptedSet.has(id),
		};
	});
}
