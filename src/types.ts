// --- Issue ---

export type IssueStatus = "open" | "in_progress" | "closed";
export type IssueType = "task" | "bug" | "feature" | "epic";

export interface Issue {
	// Identity
	id: string; // "{project}-{4hex}", e.g. "overstory-a1b2"

	// Core
	title: string;
	status: IssueStatus;
	type: IssueType;
	priority: number; // 0=critical, 1=high, 2=medium, 3=low, 4=backlog

	// Optional
	assignee?: string;
	description?: string;
	notes?: string;
	design?: string;
	closeReason?: string;

	// Dependencies
	blocks?: string[]; // Issue IDs this blocks
	blockedBy?: string[]; // Issue IDs blocking this

	// Template convoy
	convoyId?: string; // Set when poured from a template

	// Timestamps
	createdAt: string; // ISO 8601
	updatedAt: string; // ISO 8601
	closedAt?: string; // ISO 8601, set on close
}

// --- Template (Molecule) ---

export interface TemplateStep {
	title: string; // Supports {prefix} interpolation
	type?: string; // Default: "task"
	priority?: number; // Default: 2
}

export interface Template {
	id: string; // "tpl-{4hex}"
	name: string;
	steps: TemplateStep[];
}

// --- Convoy ---

export interface ConvoyStatus {
	templateId: string;
	total: number;
	completed: number;
	inProgress: number;
	blocked: number;
	issues: string[]; // IDs of created issues, in step order
}

// --- Config ---

export interface Config {
	project: string;
	version: string;
}

// --- Constants ---

export const PRIORITY_LABELS: Record<number, string> = {
	0: "Critical",
	1: "High",
	2: "Medium",
	3: "Low",
	4: "Backlog",
};

export const PRIORITY_MAX = 4;

export const STATUS_LABELS: Record<IssueStatus, string> = {
	open: "Open",
	in_progress: "In Progress",
	closed: "Closed",
};

export const TYPE_LABELS: Record<IssueType, string> = {
	task: "Task",
	bug: "Bug",
	feature: "Feature",
	epic: "Epic",
};
