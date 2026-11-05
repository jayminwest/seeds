import type { Issue } from "./types.ts";

export interface IssueFilterOptions {
	type?: string;
	assignee?: string;
	label?: string;
	labelAny?: string;
	unlabeled?: boolean;
	priority?: Set<number>;
	priorityMax?: number;
}

/**
 * Parse a --limit flag value.
 *
 * Returns the default when the flag is absent. Throws on negative, fractional,
 * or non-numeric input. `0` means "no limit" and returns Infinity, which
 * `Array.prototype.slice(0, limit)` treats as "keep every row".
 */
export function parseLimitFlag(raw: unknown, defaultValue = 50): number {
	if (raw === undefined || raw === null || raw === "") return defaultValue;
	if (typeof raw !== "string") {
		throw new Error(`Invalid --limit value: must be a non-negative integer`);
	}
	const trimmed = raw.trim();
	if (!/^\d+$/.test(trimmed)) {
		throw new Error(`Invalid --limit "${raw}": must be a non-negative integer`);
	}
	const n = Number.parseInt(trimmed, 10);
	return n === 0 ? Number.POSITIVE_INFINITY : n;
}

function splitLabels(value: string): string[] {
	return value
		.split(",")
		.map((l) => l.trim().toLowerCase())
		.filter(Boolean);
}

function parsePriorityToken(raw: string): number {
	const trimmed = raw.trim();
	const stripped = trimmed.toUpperCase().startsWith("P") ? trimmed.slice(1) : trimmed;
	const n = Number.parseInt(stripped, 10);
	if (Number.isNaN(n) || n < 0 || n > 4 || String(n) !== stripped) {
		throw new Error(`Invalid priority "${trimmed}": must be 0-4 or P0-P4`);
	}
	return n;
}

export function applyIssueFilters(issues: Issue[], opts: IssueFilterOptions): Issue[] {
	let result = issues;
	if (opts.type) result = result.filter((i) => i.type === opts.type);
	if (opts.assignee) result = result.filter((i) => i.assignee === opts.assignee);
	if (opts.label) {
		const required = splitLabels(opts.label);
		result = result.filter((i) => {
			const labels = i.labels ?? [];
			return required.every((r) => labels.includes(r));
		});
	}
	if (opts.labelAny) {
		const any = new Set(splitLabels(opts.labelAny));
		result = result.filter((i) => {
			const labels = i.labels ?? [];
			return labels.some((l) => any.has(l));
		});
	}
	if (opts.unlabeled) {
		result = result.filter((i) => !i.labels || i.labels.length === 0);
	}
	if (opts.priority && opts.priority.size > 0) {
		const set = opts.priority;
		result = result.filter((i) => set.has(i.priority));
	}
	if (opts.priorityMax !== undefined) {
		const max = opts.priorityMax;
		result = result.filter((i) => i.priority <= max);
	}
	return result;
}

/** Filter options as commander hands them to a list/ready/search action. */
export interface FilterFlags {
	type?: string;
	assignee?: string;
	label?: string;
	labelAny?: string;
	unlabeled?: boolean;
	priority?: string;
	priorityMax?: string;
}

export function filterOptionsFromFlags(flags: FilterFlags): IssueFilterOptions {
	let priority: Set<number> | undefined;
	if (flags.priority !== undefined) {
		const tokens = flags.priority
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);
		if (tokens.length > 0) {
			priority = new Set(tokens.map(parsePriorityToken));
		}
	}
	const priorityMax =
		flags.priorityMax !== undefined ? parsePriorityToken(flags.priorityMax) : undefined;
	return {
		type: flags.type,
		assignee: flags.assignee,
		label: flags.label,
		labelAny: flags.labelAny,
		unlabeled: flags.unlabeled === true,
		priority,
		priorityMax,
	};
}
