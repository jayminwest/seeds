import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { collect, parseIntent } from "../intent.ts";
import { outputJson, printSuccess } from "../output.ts";
import {
	affectedPlanIds,
	applyPlanTransitions,
	type OpenPlanParent,
	openParentsOfDonePlans,
	printOpenPlanParentHints,
} from "../plan-lifecycle.ts";
import { isValidPriority, PRIORITY_ERROR, parsePriority } from "../priority.ts";
import {
	issuesPath,
	plansPath,
	readIssues,
	readPlans,
	withLock,
	writeIssues,
	writePlans,
} from "../store.ts";
import { normalizeTitle } from "../title.ts";
import type { Issue } from "../types.ts";
import { VALID_STATUSES, VALID_TYPES } from "../types.ts";

export interface UpdateOptions {
	status?: string;
	title?: string;
	assignee?: string;
	description?: string;
	desc?: string;
	body?: string;
	type?: string;
	priority?: string;
	addLabel?: string;
	removeLabel?: string;
	setLabels?: string;
	extensions?: string;
	clearExtensions?: boolean;
	claim?: boolean;
	as?: string;
	intent?: string[];
	json?: boolean;
}

// Accept only a JSON object literal (not array, scalar, or null) — extensions
// is a Record<string, unknown> by contract. See plan pl-c195 risk #5.
function parseExtensionsPatch(raw: string): Record<string, unknown> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new Error(`--extensions must be valid JSON: ${msg}`);
	}
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("--extensions must be a JSON object (not array, null, or scalar)");
	}
	return parsed as Record<string, unknown>;
}

// --claim identity: --as wins, then $USER. --claim sets status and assignee
// itself, so it rejects the flags it would silently override.
function resolveClaimant(opts: UpdateOptions): string {
	if (opts.status !== undefined || opts.assignee !== undefined) {
		throw new Error("--claim cannot be combined with --status or --assignee");
	}
	const as = opts.as !== undefined ? opts.as.trim() : (process.env.USER ?? "");
	if (!as) throw new Error("--claim needs an identity: pass --as <agent>");
	return as;
}

export async function runUpdate(id: string, opts: UpdateOptions, seedsDir?: string): Promise<void> {
	const jsonMode = opts.json === true;
	const dir = seedsDir ?? (await findSeedsDir());
	let updated: Issue | undefined;
	let openPlanParents: OpenPlanParent[] = [];

	const claim = opts.claim === true;
	const claimant = claim ? resolveClaimant(opts) : undefined;
	const intentValues = opts.intent ?? [];
	const intent = intentValues.length > 0 ? parseIntent(intentValues) : undefined;
	const statusChanging = opts.status !== undefined || claim;
	const inner = async () => {
		const issues = await readIssues(dir);
		const idx = issues.findIndex((i) => i.id === id);
		const issue = issues[idx];
		if (!issue) throw new Error(`Issue not found: ${id}`);
		const now = new Date().toISOString();
		const patch: Partial<Issue> = { updatedAt: now };

		// Claim is checked and applied under the issues lock, so of any number
		// of concurrent claimants exactly one sees status=open and wins. Re-claiming
		// an issue already in_progress under the same identity succeeds, so an agent
		// retrying after a crash is not locked out of its own work.
		if (claimant !== undefined) {
			const ownRetry = issue.status === "in_progress" && issue.assignee === claimant;
			if (issue.status !== "open" && !ownRetry) {
				const by = issue.assignee ? ` by ${issue.assignee}` : "";
				throw new Error(`Cannot claim ${id}: status is ${issue.status}${by}`);
			}
			if (issue.assignee && issue.assignee !== claimant) {
				throw new Error(`Cannot claim ${id}: already assigned to ${issue.assignee}`);
			}
			patch.status = "in_progress";
			patch.assignee = claimant;
		}
		if (intent !== undefined) patch.intent = intent;

		if (opts.status !== undefined) {
			const s = opts.status;
			if (!(VALID_STATUSES as readonly string[]).includes(s)) {
				throw new Error(`Invalid --status value: ${s}. Valid: ${VALID_STATUSES.join("|")}`);
			}
			patch.status = s as Issue["status"];
			// Reopening (status moving away from "closed"): drop stale close metadata
			// so `sd show` doesn't display a phantom closedAt/closeReason on an open
			// issue. JSON.stringify omits keys with `undefined` values, so the spread
			// `{...issue, ...patch}` followed by writeIssues clears them on disk.
			if (patch.status !== "closed") {
				patch.closedAt = undefined;
				patch.closeReason = undefined;
			} else if (!issue.closedAt) {
				// Closing via update must stamp closedAt like `sd close` does, or doctor's
				// closed-fields-consistency check flags the row.
				patch.closedAt = now;
			}
		}
		if (opts.title !== undefined) {
			patch.title = normalizeTitle(opts.title);
		}
		// An empty --assignee / --description clears the field rather than storing "".
		if (opts.assignee !== undefined) patch.assignee = opts.assignee || undefined;
		const desc = opts.description ?? opts.desc ?? opts.body;
		if (desc !== undefined) patch.description = desc || undefined;
		if (opts.type !== undefined) {
			const t = opts.type;
			if (!(VALID_TYPES as readonly string[]).includes(t)) {
				throw new Error(`Invalid --type value: ${t}. Valid: ${VALID_TYPES.join("|")}`);
			}
			patch.type = t as Issue["type"];
		}
		if (opts.priority !== undefined) {
			const p = parsePriority(opts.priority);
			if (!isValidPriority(p)) throw new Error(PRIORITY_ERROR);
			patch.priority = p;
		}

		const clearExt = opts.clearExtensions === true;
		if (opts.extensions !== undefined && clearExt) {
			throw new Error("--extensions and --clear-extensions are mutually exclusive");
		}
		if (clearExt) {
			patch.extensions = undefined;
		} else if (opts.extensions !== undefined) {
			const incoming = parseExtensionsPatch(opts.extensions);
			const merged: Record<string, unknown> = { ...(issue.extensions ?? {}), ...incoming };
			patch.extensions = Object.keys(merged).length > 0 ? merged : undefined;
		}

		if (opts.setLabels !== undefined) {
			const val = opts.setLabels;
			if (val === "") {
				patch.labels = undefined;
			} else {
				const parsed = val
					.split(",")
					.map((l) => l.trim().toLowerCase())
					.filter(Boolean);
				patch.labels = parsed.length > 0 ? parsed : undefined;
			}
		}
		if (opts.addLabel !== undefined) {
			const toAdd = opts.addLabel
				.split(",")
				.map((l) => l.trim().toLowerCase())
				.filter(Boolean);
			const base = patch.labels ?? issue.labels ?? [];
			const merged = Array.from(new Set([...base, ...toAdd]));
			patch.labels = merged.length > 0 ? merged : undefined;
		}
		if (opts.removeLabel !== undefined) {
			const toRemove = new Set(opts.removeLabel.split(",").map((l) => l.trim().toLowerCase()));
			const base = patch.labels ?? issue.labels ?? [];
			const remaining = base.filter((l) => !toRemove.has(l));
			patch.labels = remaining.length > 0 ? remaining : undefined;
		}

		// updatedAt is always in the patch; nothing else means no field flag was
		// given, which is a usage error rather than a silent timestamp bump.
		if (Object.keys(patch).length === 1) {
			throw new Error(`No fields to update for ${id}: pass at least one field flag`);
		}

		issues[idx] = { ...issue, ...patch };
		updated = issues[idx];
		await writeIssues(dir, issues);

		// Plan lifecycle: if a child seed's status changed, recompute owning plan(s).
		if (statusChanging && patch.status !== undefined && patch.status !== issue.status) {
			const plans = await readPlans(dir);
			const affected = affectedPlanIds(plans, [id]);
			if (affected.length > 0) {
				const changedCount = applyPlanTransitions(plans, issues, affected, now);
				if (changedCount > 0) await writePlans(dir, plans);
				openPlanParents = openParentsOfDonePlans(plans, issues, affected);
			}
		}
	};

	if (statusChanging) {
		// Lock order matches plan-submit: plans (outer) → issues (inner).
		await withLock(plansPath(dir), () => withLock(issuesPath(dir), inner));
	} else {
		await withLock(issuesPath(dir), inner);
	}

	if (jsonMode) {
		await outputJson({
			success: true,
			command: "update",
			issue: updated,
			...(openPlanParents.length > 0 ? { openPlanParents } : {}),
		});
	} else {
		printSuccess(`Updated ${id}`);
		printOpenPlanParentHints(openPlanParents);
	}
}

export function register(program: Command): void {
	program
		.command("update <id>")
		.description("Update issue fields")
		.option("--status <status>", "New status (open|in_progress|closed)")
		.option("--title <text>", "New title")
		.option("--assignee <name>", "New assignee")
		.option("--description <text>", "New description")
		.option("--desc <text>", "New description (alias for --description)")
		.option("--body <text>", "New description (alias for --description)")
		.option("--type <type>", "New type (task|bug|feature|epic)")
		.option("--priority <n>", "New priority 0-4 or P0-P4")
		.option("--add-label <labels>", "Add label(s) (comma-separated)")
		.option("--remove-label <labels>", "Remove label(s) (comma-separated)")
		.option("--set-labels <labels>", "Set labels (comma-separated, empty to clear)")
		.option("--extensions <json>", "Shallow-merge JSON object into Issue.extensions")
		.option("--clear-extensions", "Remove the extensions field")
		.option("--claim", "Atomically claim: open → in_progress, assignee = --as (fails if taken)")
		.option("--as <agent>", "Identity for --claim (default: $USER)")
		.option("--intent <r-id>", "Set linked roots idea(s) (repeatable, replaces)", collect, [])
		.option("--json", "Output as JSON")
		.action(async (id: string, opts: UpdateOptions) => {
			await runUpdate(id, opts);
		});
}
