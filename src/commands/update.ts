import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { outputJson, printSuccess } from "../output.ts";
import { affectedPlanIds, applyPlanTransitions } from "../plan-lifecycle.ts";
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
import type { Issue } from "../types.ts";
import { VALID_STATUSES, VALID_TYPES } from "../types.ts";

function parseArgs(args: string[]) {
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

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const id = args.find((a) => !a.startsWith("--"));
	if (!id) throw new Error("Usage: sd update <id> [flags]");

	const flags = parseArgs(args);

	const dir = seedsDir ?? (await findSeedsDir());
	let updated: Issue | undefined;

	const statusChanging = typeof flags.status === "string";
	const inner = async () => {
		const issues = await readIssues(dir);
		const idx = issues.findIndex((i) => i.id === id);
		const issue = issues[idx];
		if (!issue) throw new Error(`Issue not found: ${id}`);
		const now = new Date().toISOString();
		const patch: Partial<Issue> = { updatedAt: now };

		if (typeof flags.status === "string") {
			const s = flags.status;
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
			}
		}
		if (typeof flags.title === "string") {
			const trimmedTitle = flags.title.trim();
			if (trimmedTitle === "") {
				throw new Error("--title must not be empty");
			}
			patch.title = trimmedTitle;
		}
		if (typeof flags.assignee === "string") patch.assignee = flags.assignee;
		const desc =
			typeof flags.description === "string"
				? flags.description
				: typeof flags.desc === "string"
					? flags.desc
					: flags.body;
		if (typeof desc === "string") patch.description = desc;
		if (typeof flags.type === "string") {
			const t = flags.type;
			if (!(VALID_TYPES as readonly string[]).includes(t)) {
				throw new Error(`Invalid --type value: ${t}. Valid: ${VALID_TYPES.join("|")}`);
			}
			patch.type = t as Issue["type"];
		}
		if (typeof flags.priority === "string") {
			const p = parsePriority(flags.priority);
			if (!isValidPriority(p)) throw new Error(PRIORITY_ERROR);
			patch.priority = p;
		}

		const extPatchProvided = typeof flags.extensions === "string";
		const clearExt = flags["clear-extensions"] === true;
		if (extPatchProvided && clearExt) {
			throw new Error("--extensions and --clear-extensions are mutually exclusive");
		}
		if (clearExt) {
			patch.extensions = undefined;
		} else if (extPatchProvided) {
			const incoming = parseExtensionsPatch(flags.extensions as string);
			const merged: Record<string, unknown> = { ...(issue.extensions ?? {}), ...incoming };
			patch.extensions = Object.keys(merged).length > 0 ? merged : undefined;
		}

		if (typeof flags["set-labels"] === "string") {
			const val = flags["set-labels"];
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
		if (typeof flags["add-label"] === "string") {
			const toAdd = flags["add-label"]
				.split(",")
				.map((l) => l.trim().toLowerCase())
				.filter(Boolean);
			const base = patch.labels ?? issue.labels ?? [];
			const merged = Array.from(new Set([...base, ...toAdd]));
			patch.labels = merged.length > 0 ? merged : undefined;
		}
		if (typeof flags["remove-label"] === "string") {
			const toRemove = new Set(flags["remove-label"].split(",").map((l) => l.trim().toLowerCase()));
			const base = patch.labels ?? issue.labels ?? [];
			const remaining = base.filter((l) => !toRemove.has(l));
			patch.labels = remaining.length > 0 ? remaining : undefined;
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
		await outputJson({ success: true, command: "update", issue: updated });
	} else {
		printSuccess(`Updated ${id}`);
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
		.option("--json", "Output as JSON")
		.action(
			async (
				id: string,
				opts: {
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
					json?: boolean;
				},
			) => {
				const args: string[] = [id];
				if (opts.status) args.push("--status", opts.status);
				if (opts.title !== undefined) args.push("--title", opts.title);
				if (opts.assignee) args.push("--assignee", opts.assignee);
				if (opts.description) args.push("--description", opts.description);
				if (opts.desc) args.push("--desc", opts.desc);
				if (opts.body) args.push("--body", opts.body);
				if (opts.type) args.push("--type", opts.type);
				if (opts.priority) args.push("--priority", opts.priority);
				if (opts.addLabel) args.push("--add-label", opts.addLabel);
				if (opts.removeLabel) args.push("--remove-label", opts.removeLabel);
				if (opts.setLabels !== undefined) args.push("--set-labels", opts.setLabels);
				if (opts.extensions !== undefined) args.push("--extensions", opts.extensions);
				if (opts.clearExtensions) args.push("--clear-extensions");
				if (opts.json) args.push("--json");
				await run(args);
			},
		);
}
