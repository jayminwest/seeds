export interface Issue {
	id: string;
	title: string;
	status: "open" | "in_progress" | "closed";
	type: "task" | "bug" | "feature" | "epic";
	priority: number;
	assignee?: string;
	description?: string;
	closeReason?: string;
	blocks?: string[];
	blockedBy?: string[];
	labels?: string[];
	convoy?: string;
	plan_id?: string;
	plan_step_index?: number;
	requires_plan?: boolean;
	extensions?: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
	closedAt?: string;
}

export type PlanStatus = "draft" | "approved" | "active" | "done";
type PlanOutcome = "success" | "partial" | "failure";

export interface Plan {
	id: string;
	seed: string;
	template: string;
	name?: string;
	status: PlanStatus;
	revision: number;
	sections: Record<string, unknown>;
	children: string[];
	// Subset of `children` that were attached via adoption (existing_seed at
	// submit time, or `sd plan adopt` post-submit) rather than fresh-spawned by
	// the plan. Drives the "(adopted)" tag in `sd plan show` human output and
	// is preserved across overwrites for children that survive the rewrite.
	adoptedChildren?: string[];
	outcome?: PlanOutcome;
	outcomeNote?: string;
	reviewedBy?: string;
	createdAt: string;
	updatedAt: string;
}

export interface TemplateStep {
	title: string;
	type?: string;
	priority?: number;
	plan_template?: string;
}

export interface Template {
	id: string;
	name: string;
	steps: TemplateStep[];
}

export interface Config {
	project: string;
	version: string;
	max_plan_depth?: number;
}

// PLAN_SPEC.md:430 — display-only depth limit for `sd plan show` recursion.
export const DEFAULT_MAX_PLAN_DEPTH = 3;

// Plan template config — what `plan_templates:` in config.yaml resolves to.
// Compiled into AJV schema by src/plan-schema.ts (Phase 2 task seeds-6bd8).
export type SectionKindLiteral = "text" | "list" | "steps";

export interface SectionSpec {
	required: boolean;
	kind: SectionKindLiteral | Record<string, SectionSpec>;
	prompt: string;
	min_length?: number;
	min?: number;
	item?: "text" | Record<string, SectionSpec>;
	mulch_source?: string;
}

export interface PlanTemplate {
	name: string;
	description?: string;
	sections: Record<string, SectionSpec>;
}

export const SECTION_KINDS: readonly SectionKindLiteral[] = ["text", "list", "steps"] as const;

export const SEEDS_DIR_NAME = ".seeds";
export const ISSUES_FILE = "issues.jsonl";
export const TEMPLATES_FILE = "templates.jsonl";
export const PLANS_FILE = "plans.jsonl";
export const CONFIG_FILE = "config.yaml";
export const LOCK_STALE_MS = 30_000;
export const LOCK_RETRY_MS = 100;
export const LOCK_TIMEOUT_MS = 30_000;

export const VALID_TYPES = ["task", "bug", "feature", "epic"] as const;
export const VALID_STATUSES = ["open", "in_progress", "closed"] as const;

export const PRIORITY_LABELS: Record<number, string> = {
	0: "Critical",
	1: "High",
	2: "Medium",
	3: "Low",
	4: "Backlog",
};
