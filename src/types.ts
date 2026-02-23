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
	convoy?: string;
	createdAt: string;
	updatedAt: string;
	closedAt?: string;
}

export interface TemplateStep {
	title: string;
	type?: string;
	priority?: number;
}

export interface Template {
	id: string;
	name: string;
	steps: TemplateStep[];
}

export interface Config {
	project: string;
	version: string;
}

export interface ConvoyStatus {
	templateId: string;
	total: number;
	completed: number;
	inProgress: number;
	blocked: number;
	issues: string[];
}

export const SEEDS_DIR_NAME = ".seeds";
export const ISSUES_FILE = "issues.jsonl";
export const TEMPLATES_FILE = "templates.jsonl";
export const CONFIG_FILE = "config.yaml";
export const LOCK_STALE_MS = 30_000;
export const LOCK_RETRY_MS = 50;
export const LOCK_TIMEOUT_MS = 5_000;

export const VALID_TYPES = ["task", "bug", "feature", "epic"] as const;
export const VALID_STATUSES = ["open", "in_progress", "closed"] as const;

export const PRIORITY_LABELS: Record<number, string> = {
	0: "Critical",
	1: "High",
	2: "Medium",
	3: "Low",
	4: "Backlog",
};
