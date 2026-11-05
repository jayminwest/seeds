// The one Issue row validator, shared by the store (quarantine on read, refuse
// on write), doctor's schema-validation check, and writers that build issues
// from untrusted input (migrate, tpl pour).
//
// Only the required core fields are checked. Optional fields keep their own
// doctor checks (labels, closed fields) and `extensions` stays opaque.

import { isValidPriority } from "./priority.ts";
import type { Issue } from "./types.ts";
import { VALID_STATUSES, VALID_TYPES } from "./types.ts";

function nonEmptyString(v: unknown): v is string {
	return typeof v === "string" && v.length > 0;
}

/** Problems with a parsed JSONL row as an Issue; empty means valid. */
export function validateIssue(row: unknown): string[] {
	if (typeof row !== "object" || row === null || Array.isArray(row)) {
		return ["row is not a JSON object"];
	}
	const r = row as Record<string, unknown>;
	const problems: string[] = [];
	for (const field of ["id", "title", "createdAt", "updatedAt"] as const) {
		if (!nonEmptyString(r[field])) problems.push(`missing or invalid '${field}'`);
	}
	if (!(VALID_STATUSES as readonly unknown[]).includes(r.status)) {
		problems.push(`invalid status ${JSON.stringify(r.status) ?? "(missing)"}`);
	}
	if (!(VALID_TYPES as readonly unknown[]).includes(r.type)) {
		problems.push(`invalid type ${JSON.stringify(r.type) ?? "(missing)"}`);
	}
	if (typeof r.priority !== "number" || !isValidPriority(r.priority)) {
		const got = JSON.stringify(r.priority) ?? "(missing)";
		problems.push(`invalid priority ${got} (must be an integer 0-4)`);
	}
	return problems;
}

/** Label for a row in diagnostics: its id when it has one, else the fallback. */
export function rowLabel(row: unknown, fallback: string): string {
	const id = (row as { id?: unknown } | null)?.id;
	return nonEmptyString(id) ? id : fallback;
}

/** Throw if any issue about to be persisted is invalid; names every bad row. */
export function assertValidIssues(issues: readonly Issue[]): void {
	const bad: string[] = [];
	for (const [i, issue] of issues.entries()) {
		const problems = validateIssue(issue);
		if (problems.length > 0) {
			bad.push(`${rowLabel(issue, `#${String(i + 1)}`)}: ${problems.join(", ")}`);
		}
	}
	if (bad.length > 0) {
		throw new Error(`Refusing to write invalid issue(s): ${bad.join("; ")}`);
	}
}
