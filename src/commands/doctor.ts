import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import type { Command } from "commander";
import { findSeedsDir, projectRootFromSeedsDir, readConfig } from "../config.ts";
import { dedupKey, findIdCollisions } from "../id-collisions.ts";
import { ensureMergeStrategy, inspectMergeStrategy } from "../merge-strategy.ts";
import { brand, muted, outputJson } from "../output.ts";
import { readIssues, readPlans } from "../store.ts";
import type { Issue, Plan, Template } from "../types.ts";
import {
	ISSUES_FILE,
	LOCK_STALE_MS,
	TEMPLATES_FILE,
	VALID_STATUSES,
	VALID_TYPES,
} from "../types.ts";

interface DoctorCheck {
	name: string;
	status: "pass" | "warn" | "fail";
	message: string;
	details: string[];
	fixable: boolean;
}

interface RawLine {
	lineNumber: number;
	text: string;
	parsed?: unknown;
	error?: string;
}

function readRawLines(filePath: string): RawLine[] {
	if (!existsSync(filePath)) return [];
	const content = readFileSync(filePath, "utf8");
	const lines: RawLine[] = [];
	for (const [i, raw] of content.split("\n").entries()) {
		const text = raw.trim();
		if (!text) continue;
		try {
			lines.push({ lineNumber: i + 1, text, parsed: JSON.parse(text) });
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			lines.push({ lineNumber: i + 1, text, error: msg });
		}
	}
	return lines;
}

function checkConfig(seedsDir: string, config: { project: string } | null): DoctorCheck {
	if (!existsSync(seedsDir)) {
		return {
			name: "config",
			status: "fail",
			message: ".seeds/ directory not found",
			details: [],
			fixable: false,
		};
	}
	if (!config) {
		return {
			name: "config",
			status: "fail",
			message: "config.yaml is missing or unparseable",
			details: [],
			fixable: false,
		};
	}
	if (!config.project) {
		return {
			name: "config",
			status: "fail",
			message: "config.yaml missing required 'project' field",
			details: [],
			fixable: false,
		};
	}
	return {
		name: "config",
		status: "pass",
		message: "Config is valid",
		details: [],
		fixable: false,
	};
}

function checkJsonlIntegrity(seedsDir: string): DoctorCheck {
	const details: string[] = [];
	for (const file of [ISSUES_FILE, TEMPLATES_FILE]) {
		const lines = readRawLines(join(seedsDir, file));
		for (const line of lines) {
			if (line.error) {
				details.push(`${file} line ${String(line.lineNumber)}: ${line.error}`);
			}
		}
	}
	if (details.length > 0) {
		return {
			name: "jsonl-integrity",
			status: "fail",
			message: `${String(details.length)} malformed line(s) in JSONL files`,
			details,
			fixable: true,
		};
	}
	return {
		name: "jsonl-integrity",
		status: "pass",
		message: "All JSONL lines parse correctly",
		details: [],
		fixable: false,
	};
}

function checkSchemaValidation(seedsDir: string): DoctorCheck {
	const details: string[] = [];
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Record<string, unknown>;
		const id = typeof issue.id === "string" ? issue.id : `line ${String(line.lineNumber)}`;
		if (!issue.id || typeof issue.id !== "string") {
			details.push(`${id}: missing or invalid 'id'`);
		}
		if (!issue.title || typeof issue.title !== "string") {
			details.push(`${id}: missing or invalid 'title'`);
		}
		if (!issue.createdAt || typeof issue.createdAt !== "string") {
			details.push(`${id}: missing or invalid 'createdAt'`);
		}
		if (!issue.updatedAt || typeof issue.updatedAt !== "string") {
			details.push(`${id}: missing or invalid 'updatedAt'`);
		}
		if (
			typeof issue.status === "string" &&
			!(VALID_STATUSES as readonly string[]).includes(issue.status)
		) {
			details.push(`${id}: invalid status '${issue.status}'`);
		}
		if (
			typeof issue.type === "string" &&
			!(VALID_TYPES as readonly string[]).includes(issue.type)
		) {
			details.push(`${id}: invalid type '${issue.type}'`);
		}
		if (typeof issue.priority === "number" && (issue.priority < 0 || issue.priority > 4)) {
			details.push(`${id}: invalid priority ${String(issue.priority)} (must be 0-4)`);
		}
	}
	if (details.length > 0) {
		return {
			name: "schema-validation",
			status: "fail",
			message: `${String(details.length)} schema violation(s)`,
			details,
			fixable: false,
		};
	}
	return {
		name: "schema-validation",
		status: "pass",
		message: "All issues have valid schema",
		details: [],
		fixable: false,
	};
}

function checkDuplicateIds(seedsDir: string): DoctorCheck {
	const details: string[] = [];
	let collided = 0;
	for (const file of [ISSUES_FILE, TEMPLATES_FILE]) {
		const lines = readRawLines(join(seedsDir, file));
		const collisions = findIdCollisions(lines.map((l) => l.parsed));
		collided += collisions.size;
		const counts = new Map<string, number>();
		for (const line of lines) {
			if (!line.parsed) continue;
			const item = line.parsed as { id?: string };
			if (typeof item.id === "string") {
				counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
			}
		}
		for (const [id, count] of counts) {
			if (collisions.has(id)) {
				details.push(
					`${id}: ID collision in ${file}, ${String(count)} rows with different createdAt (distinct items; rename one by hand)`,
				);
			} else if (count > 1) {
				details.push(`${id} appears ${String(count)} times in ${file}`);
			}
		}
	}
	if (details.length > 0) {
		return {
			name: "duplicate-ids",
			status: collided > 0 ? "fail" : "warn",
			message: `${String(details.length)} duplicate ID(s) found${collided > 0 ? ` (${String(collided)} collision(s))` : ""}`,
			details,
			fixable: true,
		};
	}
	return {
		name: "duplicate-ids",
		status: "pass",
		message: "No duplicate IDs",
		details: [],
		fixable: false,
	};
}

function checkReferentialIntegrity(issues: Issue[]): DoctorCheck {
	const ids = new Set(issues.map((i) => i.id));
	const details: string[] = [];
	for (const issue of issues) {
		for (const ref of issue.blockedBy ?? []) {
			if (!ids.has(ref)) {
				details.push(`${issue.id}.blockedBy → ${ref} (not found)`);
			}
		}
		for (const ref of issue.blocks ?? []) {
			if (!ids.has(ref)) {
				details.push(`${issue.id}.blocks → ${ref} (not found)`);
			}
		}
	}
	if (details.length > 0) {
		return {
			name: "referential-integrity",
			status: "warn",
			message: `${String(details.length)} dangling dependency reference(s)`,
			details,
			fixable: true,
		};
	}
	return {
		name: "referential-integrity",
		status: "pass",
		message: "All dependency references are valid",
		details: [],
		fixable: false,
	};
}

function checkBidirectionalConsistency(issues: Issue[]): DoctorCheck {
	const byId = new Map<string, Issue>();
	for (const issue of issues) {
		byId.set(issue.id, issue);
	}
	const details: string[] = [];
	for (const issue of issues) {
		for (const ref of issue.blockedBy ?? []) {
			const target = byId.get(ref);
			if (target && !(target.blocks ?? []).includes(issue.id)) {
				details.push(`${issue.id}.blockedBy has ${ref}, but ${ref}.blocks missing ${issue.id}`);
			}
		}
		for (const ref of issue.blocks ?? []) {
			const target = byId.get(ref);
			if (target && !(target.blockedBy ?? []).includes(issue.id)) {
				details.push(`${issue.id}.blocks has ${ref}, but ${ref}.blockedBy missing ${issue.id}`);
			}
		}
	}
	if (details.length > 0) {
		return {
			name: "bidirectional-consistency",
			status: "warn",
			message: `${String(details.length)} bidirectional mismatch(es)`,
			details,
			fixable: true,
		};
	}
	return {
		name: "bidirectional-consistency",
		status: "pass",
		message: "All dependency links are bidirectional",
		details: [],
		fixable: false,
	};
}

// seeds-fb42 — plan_step_index is how `sd plan edit --step` and the backref
// block resolve a child to its blueprint step. Flag indexes that point nowhere:
// the seed is not a child of any plan, the index is outside the plan's steps,
// or the step pins a different seed via existing_seed.
function checkPlanStepIndex(issues: Issue[], plans: Plan[]): DoctorCheck {
	const planByChild = new Map<string, Plan>();
	for (const plan of plans) {
		for (const childId of plan.children) planByChild.set(childId, plan);
	}
	const details: string[] = [];
	for (const issue of issues) {
		const idx = issue.plan_step_index;
		if (idx === undefined) continue;
		const plan = planByChild.get(issue.id);
		if (!plan) {
			details.push(`${issue.id}.plan_step_index=${String(idx)} but it is not a child of any plan`);
			continue;
		}
		const rawSteps = plan.sections.steps;
		const steps = Array.isArray(rawSteps) ? rawSteps : [];
		const step: unknown = steps[idx];
		if (step === undefined) {
			details.push(
				`${issue.id}.plan_step_index=${String(idx)} is out of range for ${plan.id} (${String(steps.length)} steps)`,
			);
			continue;
		}
		const pinned =
			typeof step === "object" && step !== null
				? (step as { existing_seed?: unknown }).existing_seed
				: undefined;
		if (typeof pinned === "string" && pinned !== issue.id) {
			details.push(
				`${issue.id}.plan_step_index=${String(idx)} but ${plan.id} step ${String(idx + 1)} pins ${pinned}`,
			);
		}
	}
	if (details.length > 0) {
		return {
			name: "plan-step-index",
			status: "warn",
			message: `${String(details.length)} incoherent plan_step_index value(s)`,
			details,
			fixable: false,
		};
	}
	return {
		name: "plan-step-index",
		status: "pass",
		message: "All plan_step_index values map to a plan step",
		details: [],
		fixable: false,
	};
}

function checkCircularDependencies(issues: Issue[]): DoctorCheck {
	const graph = new Map<string, string[]>();
	for (const issue of issues) {
		graph.set(issue.id, issue.blockedBy ?? []);
	}
	const visited = new Set<string>();
	const inStack = new Set<string>();
	const cycles: string[][] = [];

	function dfs(node: string, path: string[]): void {
		if (inStack.has(node)) {
			const cycleStart = path.indexOf(node);
			if (cycleStart >= 0) {
				cycles.push(path.slice(cycleStart).concat(node));
			}
			return;
		}
		if (visited.has(node)) return;
		visited.add(node);
		inStack.add(node);
		for (const dep of graph.get(node) ?? []) {
			dfs(dep, [...path, node]);
		}
		inStack.delete(node);
	}

	for (const id of graph.keys()) {
		dfs(id, []);
	}

	if (cycles.length > 0) {
		const details = cycles.map((cycle) => cycle.join(" → "));
		return {
			name: "circular-dependencies",
			status: "warn",
			message: `${String(cycles.length)} circular dependency chain(s) found`,
			details,
			fixable: false,
		};
	}
	return {
		name: "circular-dependencies",
		status: "pass",
		message: "No circular dependencies",
		details: [],
		fixable: false,
	};
}

function checkLabelSchema(seedsDir: string): DoctorCheck {
	const details: string[] = [];
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Record<string, unknown>;
		const id = typeof issue.id === "string" ? issue.id : `line ${String(line.lineNumber)}`;
		if (issue.labels !== undefined) {
			if (!Array.isArray(issue.labels)) {
				details.push(`${id}: labels is not an array`);
			} else {
				for (const label of issue.labels) {
					if (typeof label !== "string") {
						details.push(`${id}: label is not a string: ${JSON.stringify(label)}`);
					} else if (label.trim() === "") {
						details.push(`${id}: empty label string`);
					}
				}
			}
		}
	}
	if (details.length > 0) {
		return {
			name: "label-schema",
			status: "warn",
			message: `${String(details.length)} label schema issue(s)`,
			details,
			fixable: true,
		};
	}
	return {
		name: "label-schema",
		status: "pass",
		message: "All label arrays are valid",
		details: [],
		fixable: false,
	};
}

function checkExtensionsSchema(seedsDir: string): DoctorCheck {
	const details: string[] = [];
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Record<string, unknown>;
		const id = typeof issue.id === "string" ? issue.id : `line ${String(line.lineNumber)}`;
		if (issue.extensions === undefined) continue;
		const ext = issue.extensions;
		if (ext === null || typeof ext !== "object" || Array.isArray(ext)) {
			details.push(`${id}: extensions must be a plain object: ${JSON.stringify(ext)}`);
		}
	}
	if (details.length > 0) {
		return {
			name: "extensions-schema",
			status: "warn",
			message: `${String(details.length)} malformed extensions field(s)`,
			details,
			fixable: true,
		};
	}
	return {
		name: "extensions-schema",
		status: "pass",
		message: "All extensions fields are valid",
		details: [],
		fixable: false,
	};
}

function checkClosedFieldsConsistency(seedsDir: string): DoctorCheck {
	const failures: string[] = [];
	const warnings: string[] = [];
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Record<string, unknown>;
		const id = typeof issue.id === "string" ? issue.id : `line ${String(line.lineNumber)}`;
		const status = typeof issue.status === "string" ? issue.status : undefined;
		const hasClosedAt = typeof issue.closedAt === "string" && issue.closedAt.length > 0;
		const hasReason = typeof issue.closeReason === "string" && issue.closeReason.length > 0;
		if (status && status !== "closed" && (hasClosedAt || hasReason)) {
			const stale: string[] = [];
			if (hasClosedAt) stale.push("closedAt");
			if (hasReason) stale.push("closeReason");
			failures.push(`${id}: status=${status} but ${stale.join("+")} still set`);
		} else if (status === "closed" && !hasClosedAt) {
			warnings.push(`${id}: status=closed but closedAt missing`);
		}
	}
	const total = failures.length + warnings.length;
	if (failures.length > 0) {
		return {
			name: "closed-fields-consistency",
			status: "fail",
			message: `${String(total)} status/close-metadata mismatch(es)`,
			details: [...failures, ...warnings],
			fixable: true,
		};
	}
	if (warnings.length > 0) {
		return {
			name: "closed-fields-consistency",
			status: "warn",
			message: `${String(warnings.length)} closed issue(s) missing closedAt`,
			details: warnings,
			fixable: true,
		};
	}
	return {
		name: "closed-fields-consistency",
		status: "pass",
		message: "All status/close-metadata pairs are consistent",
		details: [],
		fixable: false,
	};
}

function checkStaleLocks(seedsDir: string): DoctorCheck {
	const details: string[] = [];
	for (const file of [ISSUES_FILE, TEMPLATES_FILE]) {
		const lockPath = join(seedsDir, `${file}.lock`);
		if (existsSync(lockPath)) {
			try {
				const st = statSync(lockPath);
				const age = Date.now() - st.mtimeMs;
				if (age > LOCK_STALE_MS) {
					details.push(`${file}.lock is stale (${String(Math.round(age / 1000))}s old)`);
				} else {
					details.push(
						`${file}.lock exists (${String(Math.round(age / 1000))}s old, may be active)`,
					);
				}
			} catch {
				details.push(`${file}.lock exists but cannot stat`);
			}
		}
	}
	if (details.length > 0) {
		return {
			name: "stale-locks",
			status: "warn",
			message: `${String(details.length)} lock file(s) found`,
			details,
			fixable: true,
		};
	}
	return {
		name: "stale-locks",
		status: "pass",
		message: "No stale lock files",
		details: [],
		fixable: false,
	};
}

function checkGitattributes(seedsDir: string): DoctorCheck {
	const problems = inspectMergeStrategy(projectRootFromSeedsDir(seedsDir));
	if (problems.length > 0) {
		return {
			name: "gitattributes",
			status: "warn",
			message: "Unsafe or missing merge strategy for .seeds/*.jsonl",
			details: problems.map((p) => p.message),
			fixable: problems.some((p) => p.fixable),
		};
	}
	return {
		name: "gitattributes",
		status: "pass",
		message: "Gitattributes configured correctly",
		details: [],
		fixable: false,
	};
}

function applyFixes(seedsDir: string, checks: DoctorCheck[]): string[] {
	const fixed: string[] = [];

	for (const check of checks) {
		if (check.status === "pass" || !check.fixable) continue;

		switch (check.name) {
			case "jsonl-integrity": {
				for (const file of [ISSUES_FILE, TEMPLATES_FILE]) {
					const filePath = join(seedsDir, file);
					if (!existsSync(filePath)) continue;
					const lines = readRawLines(filePath);
					const validLines = lines.filter((l) => !l.error);
					if (validLines.length < lines.length) {
						const content =
							validLines.length > 0 ? `${validLines.map((l) => l.text).join("\n")}\n` : "";
						writeFileSync(filePath, content);
						fixed.push(
							`Removed ${String(lines.length - validLines.length)} malformed line(s) from ${file}`,
						);
					}
				}
				break;
			}
			case "duplicate-ids": {
				// Dedup edits (last wins); id collisions keep every distinct item
				fixDuplicates(seedsDir, fixed);
				break;
			}
			case "referential-integrity": {
				fixDanglingRefs(seedsDir, fixed);
				break;
			}
			case "bidirectional-consistency": {
				fixBidirectional(seedsDir, fixed);
				break;
			}
			case "stale-locks": {
				for (const file of [ISSUES_FILE, TEMPLATES_FILE]) {
					const lockPath = join(seedsDir, `${file}.lock`);
					if (existsSync(lockPath)) {
						try {
							const st = statSync(lockPath);
							if (Date.now() - st.mtimeMs > LOCK_STALE_MS) {
								unlinkSync(lockPath);
								fixed.push(`Removed stale ${file}.lock`);
							}
						} catch {
							// best-effort
						}
					}
				}
				break;
			}
			case "label-schema": {
				fixLabelSchema(seedsDir, fixed);
				break;
			}
			case "extensions-schema": {
				fixExtensionsSchema(seedsDir, fixed);
				break;
			}
			case "closed-fields-consistency": {
				fixClosedFieldsConsistency(seedsDir, fixed);
				break;
			}
			case "gitattributes": {
				fixed.push(...ensureMergeStrategy(projectRootFromSeedsDir(seedsDir)));
				break;
			}
		}
	}
	return fixed;
}

function fixLabelSchema(seedsDir: string, fixed: string[]): void {
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	const idMap = new Map<string, Issue>();
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Issue;
		if (typeof issue.id === "string") {
			idMap.set(issue.id, issue);
		}
	}
	const issues = Array.from(idMap.values());
	let changed = false;
	for (const issue of issues) {
		if (issue.labels !== undefined) {
			if (!Array.isArray(issue.labels)) {
				issue.labels = undefined;
				changed = true;
			} else {
				const cleaned = issue.labels.filter(
					(l): l is string => typeof l === "string" && l.trim() !== "",
				);
				if (cleaned.length !== issue.labels.length) {
					issue.labels = cleaned.length > 0 ? cleaned : undefined;
					changed = true;
				}
			}
		}
	}
	if (changed) {
		const content = `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`;
		writeFileSync(join(seedsDir, ISSUES_FILE), content);
		fixed.push("Cleaned up invalid label entries");
	}
}

function fixExtensionsSchema(seedsDir: string, fixed: string[]): void {
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	const idMap = new Map<string, Issue>();
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Issue;
		if (typeof issue.id === "string") {
			idMap.set(issue.id, issue);
		}
	}
	const issues = Array.from(idMap.values());
	let changed = false;
	for (const issue of issues) {
		const ext = issue.extensions as unknown;
		if (ext === undefined) continue;
		if (ext === null || typeof ext !== "object" || Array.isArray(ext)) {
			issue.extensions = undefined;
			changed = true;
		}
	}
	if (changed) {
		const content = `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`;
		writeFileSync(join(seedsDir, ISSUES_FILE), content);
		fixed.push("Dropped malformed extensions fields");
	}
}

function fixClosedFieldsConsistency(seedsDir: string, fixed: string[]): void {
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	const idMap = new Map<string, Issue>();
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Issue;
		if (typeof issue.id === "string") {
			idMap.set(issue.id, issue);
		}
	}
	const issues = Array.from(idMap.values());
	let changed = false;
	for (const issue of issues) {
		if (issue.status !== "closed") {
			if (issue.closedAt !== undefined || issue.closeReason !== undefined) {
				issue.closedAt = undefined;
				issue.closeReason = undefined;
				changed = true;
			}
		} else if (!issue.closedAt) {
			issue.closedAt = issue.updatedAt;
			changed = true;
		}
	}
	if (changed) {
		const content = `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`;
		writeFileSync(join(seedsDir, ISSUES_FILE), content);
		fixed.push("Repaired status/close-metadata mismatches");
	}
}

function fixDuplicates(seedsDir: string, fixed: string[]): void {
	// Issues
	const issueLines = readRawLines(join(seedsDir, ISSUES_FILE));
	const issueCollisions = findIdCollisions(issueLines.map((l) => l.parsed));
	const issueMap = new Map<string, Issue>();
	for (const line of issueLines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Issue;
		if (typeof issue.id === "string") {
			issueMap.set(dedupKey(issue, issueCollisions), issue);
		}
	}
	if (issueMap.size < issueLines.filter((l) => l.parsed).length) {
		const content = `${Array.from(issueMap.values())
			.map((i) => JSON.stringify(i))
			.join("\n")}\n`;
		writeFileSync(join(seedsDir, ISSUES_FILE), content);
		fixed.push("Deduplicated issues.jsonl");
	}

	// Templates
	const tplLines = readRawLines(join(seedsDir, TEMPLATES_FILE));
	const tplCollisions = findIdCollisions(tplLines.map((l) => l.parsed));
	const tplMap = new Map<string, Template>();
	for (const line of tplLines) {
		if (!line.parsed) continue;
		const tpl = line.parsed as Template;
		if (typeof tpl.id === "string") {
			tplMap.set(dedupKey(tpl, tplCollisions), tpl);
		}
	}
	if (tplMap.size < tplLines.filter((l) => l.parsed).length) {
		const content = `${Array.from(tplMap.values())
			.map((t) => JSON.stringify(t))
			.join("\n")}\n`;
		writeFileSync(join(seedsDir, TEMPLATES_FILE), content);
		fixed.push("Deduplicated templates.jsonl");
	}
}

function fixDanglingRefs(seedsDir: string, fixed: string[]): void {
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	const issues: Issue[] = [];
	const idMap = new Map<string, Issue>();
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Issue;
		if (typeof issue.id === "string") {
			idMap.set(issue.id, issue);
		}
	}
	// Dedup: last wins
	const deduped = Array.from(idMap.values());
	const ids = new Set(deduped.map((i) => i.id));
	let changed = false;
	for (const issue of deduped) {
		const origBlockedBy = issue.blockedBy?.length ?? 0;
		const origBlocks = issue.blocks?.length ?? 0;
		if (issue.blockedBy) {
			issue.blockedBy = issue.blockedBy.filter((ref) => ids.has(ref));
			if (issue.blockedBy.length === 0) issue.blockedBy = undefined;
		}
		if (issue.blocks) {
			issue.blocks = issue.blocks.filter((ref) => ids.has(ref));
			if (issue.blocks.length === 0) issue.blocks = undefined;
		}
		if (
			(issue.blockedBy?.length ?? 0) !== origBlockedBy ||
			(issue.blocks?.length ?? 0) !== origBlocks
		) {
			changed = true;
		}
		issues.push(issue);
	}
	if (changed) {
		const content = `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`;
		writeFileSync(join(seedsDir, ISSUES_FILE), content);
		fixed.push("Removed dangling dependency references");
	}
}

function fixBidirectional(seedsDir: string, fixed: string[]): void {
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	const idMap = new Map<string, Issue>();
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Issue;
		if (typeof issue.id === "string") {
			idMap.set(issue.id, issue);
		}
	}
	const issues = Array.from(idMap.values());
	let changed = false;

	for (const issue of issues) {
		for (const ref of issue.blockedBy ?? []) {
			const target = idMap.get(ref);
			if (target && !(target.blocks ?? []).includes(issue.id)) {
				target.blocks = [...(target.blocks ?? []), issue.id];
				changed = true;
			}
		}
		for (const ref of issue.blocks ?? []) {
			const target = idMap.get(ref);
			if (target && !(target.blockedBy ?? []).includes(issue.id)) {
				target.blockedBy = [...(target.blockedBy ?? []), issue.id];
				changed = true;
			}
		}
	}

	if (changed) {
		const content = `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`;
		writeFileSync(join(seedsDir, ISSUES_FILE), content);
		fixed.push("Added missing bidirectional dependency links");
	}
}

function printCheck(check: DoctorCheck, verbose: boolean): void {
	if (check.status === "pass" && !verbose) return;

	const icon =
		check.status === "pass"
			? brand("✓")
			: check.status === "warn"
				? chalk.yellow("!")
				: chalk.red("✗");

	console.log(`  ${icon} ${check.message}`);
	for (const detail of check.details) {
		console.log(`      ${muted(detail)}`);
	}
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const fixMode = args.includes("--fix");
	const verbose = args.includes("--verbose");

	const dir = seedsDir ?? (await findSeedsDir());

	// Load config
	let config: { project: string } | null = null;
	try {
		config = await readConfig(dir);
	} catch {
		config = null;
	}

	// Run checks
	const checks: DoctorCheck[] = [];

	const configCheck = checkConfig(dir, config);
	checks.push(configCheck);

	// If config fails, skip remaining checks
	if (configCheck.status === "fail") {
		return await reportResults(checks, jsonMode, verbose, fixMode, dir);
	}

	checks.push(checkJsonlIntegrity(dir));
	checks.push(checkSchemaValidation(dir));
	checks.push(checkDuplicateIds(dir));

	// Load deduped issues for dependency checks
	const issues = await readIssues(dir);
	checks.push(checkReferentialIntegrity(issues));
	checks.push(checkBidirectionalConsistency(issues));
	checks.push(checkCircularDependencies(issues));
	checks.push(checkPlanStepIndex(issues, await readPlans(dir)));
	checks.push(checkLabelSchema(dir));
	checks.push(checkExtensionsSchema(dir));
	checks.push(checkClosedFieldsConsistency(dir));
	checks.push(checkStaleLocks(dir));
	checks.push(checkGitattributes(dir));

	// Apply fixes if requested
	if (fixMode) {
		const fixableFailures = checks.filter((ch) => ch.fixable && ch.status !== "pass");
		if (fixableFailures.length > 0) {
			const fixedItems = applyFixes(dir, checks);

			// Re-run all checks after fixes
			const reChecks: DoctorCheck[] = [];
			let reConfig: { project: string } | null = null;
			try {
				reConfig = await readConfig(dir);
			} catch {
				reConfig = null;
			}
			reChecks.push(checkConfig(dir, reConfig));
			if (reChecks[0]?.status !== "fail") {
				reChecks.push(checkJsonlIntegrity(dir));
				reChecks.push(checkSchemaValidation(dir));
				reChecks.push(checkDuplicateIds(dir));
				const reIssues = await readIssues(dir);
				reChecks.push(checkReferentialIntegrity(reIssues));
				reChecks.push(checkBidirectionalConsistency(reIssues));
				reChecks.push(checkCircularDependencies(reIssues));
				reChecks.push(checkPlanStepIndex(reIssues, await readPlans(dir)));
				reChecks.push(checkLabelSchema(dir));
				reChecks.push(checkExtensionsSchema(dir));
				reChecks.push(checkClosedFieldsConsistency(dir));
				reChecks.push(checkStaleLocks(dir));
				reChecks.push(checkGitattributes(dir));
			}
			return await reportResults(reChecks, jsonMode, verbose, fixMode, dir, fixedItems);
		}
	}

	return await reportResults(checks, jsonMode, verbose, fixMode, dir);
}

async function reportResults(
	checks: DoctorCheck[],
	jsonMode: boolean,
	verbose: boolean,
	_fixMode: boolean,
	_seedsDir: string,
	fixedItems?: string[],
): Promise<void> {
	const summary = {
		pass: checks.filter((ch) => ch.status === "pass").length,
		warn: checks.filter((ch) => ch.status === "warn").length,
		fail: checks.filter((ch) => ch.status === "fail").length,
	};

	if (jsonMode) {
		await outputJson({
			success: summary.fail === 0,
			command: "doctor",
			checks: checks.map((ch) => ({
				name: ch.name,
				status: ch.status,
				message: ch.message,
				details: ch.details,
				fixable: ch.fixable,
			})),
			summary,
			...(fixedItems && fixedItems.length > 0 ? { fixed: fixedItems } : {}),
		});
	} else {
		console.log(`\n${chalk.bold("Seeds Doctor")}\n`);
		for (const check of checks) {
			printCheck(check, verbose);
		}
		console.log(
			`\n${muted(`${String(summary.pass)} passed, ${String(summary.warn)} warning(s), ${String(summary.fail)} failure(s)`)}`,
		);
		if (fixedItems && fixedItems.length > 0) {
			console.log(`\n${chalk.bold("Fixed:")}`);
			for (const item of fixedItems) {
				console.log(`  ${brand("✓")} ${item}`);
			}
		}
	}

	if (summary.fail > 0) {
		process.exitCode = 1;
	}
}

export function register(program: Command): void {
	program
		.command("doctor")
		.description("Check project health and data integrity")
		.option("--fix", "Auto-fix fixable issues")
		.option("--verbose", "Show all check results including passes")
		.option("--json", "Output as JSON")
		.action(async (opts: { fix?: boolean; verbose?: boolean; json?: boolean }) => {
			const args: string[] = [];
			if (opts.fix) args.push("--fix");
			if (opts.verbose) args.push("--verbose");
			if (opts.json) args.push("--json");
			await run(args);
		});
}
