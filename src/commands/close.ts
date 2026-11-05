import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { outputJson, printSuccess } from "../output.ts";
import {
	affectedPlanIds,
	applyPlanTransitions,
	type OpenPlanParent,
	openParentsOfDonePlans,
	printOpenPlanParentHints,
} from "../plan-lifecycle.ts";
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

function parseArgs(args: string[]) {
	const flags: Record<string, string | boolean> = {};
	const positional: string[] = [];
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
			positional.push(arg);
			i++;
		}
	}
	return { flags, positional };
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const { flags, positional } = parseArgs(args);

	if (positional.length === 0) throw new Error("Usage: sd close <id> [ids...] [--reason text]");

	const reason = typeof flags.reason === "string" ? flags.reason : undefined;
	const ids = positional;

	const dir = seedsDir ?? (await findSeedsDir());
	const closed: string[] = [];
	let openPlanParents: OpenPlanParent[] = [];

	// Lock order matches plan-submit: plans (outer) → issues (inner) so plan
	// lifecycle transitions stay atomic with the close write.
	await withLock(plansPath(dir), () =>
		withLock(issuesPath(dir), async () => {
			const issues = await readIssues(dir);
			const now = new Date().toISOString();

			for (const id of ids) {
				const idx = issues.findIndex((i) => i.id === id);
				const issue = issues[idx];
				if (!issue) throw new Error(`Issue not found: ${id}`);
				if (issue.status === "closed") {
					// Idempotent: re-closing must not rewrite closedAt/updatedAt (warren's
					// close-child-seed treats an unchanged issues.jsonl as a noop).
					closed.push(id);
					continue;
				}
				const updated: Issue = {
					...issue,
					status: "closed",
					closedAt: now,
					updatedAt: now,
					...(reason ? { closeReason: reason } : {}),
				};
				// Touch only the closed row. Dependents keep their blockedBy edge;
				// ready/blocked/list derive resolution from closed ids at read time, so
				// stripping it here would only rewrite sibling rows (cross-branch JSONL
				// conflicts), desync blocks/blockedBy for doctor, and lose the dep on reopen.
				issues[idx] = updated;
				closed.push(id);
			}
			await writeIssues(dir, issues);

			const plans = await readPlans(dir);
			const affected = affectedPlanIds(plans, ids);
			if (affected.length > 0) {
				const changedCount = applyPlanTransitions(plans, issues, affected, now);
				if (changedCount > 0) await writePlans(dir, plans);
				openPlanParents = openParentsOfDonePlans(plans, issues, affected);
			}
		}),
	);

	if (jsonMode) {
		await outputJson({
			success: true,
			command: "close",
			closed,
			...(openPlanParents.length > 0 ? { openPlanParents } : {}),
		});
	} else {
		for (const id of closed) {
			printSuccess(`Closed ${id}${reason ? ` — ${reason}` : ""}`);
		}
		printOpenPlanParentHints(openPlanParents);
	}
}

export function register(program: Command): void {
	program
		.command("close <id> [ids...]")
		.description("Close one or more issues")
		.option("--reason <text>", "Close reason")
		.option("--json", "Output as JSON")
		.action(async (id: string, ids: string[], opts: { reason?: string; json?: boolean }) => {
			const args: string[] = [id, ...ids];
			if (opts.reason) args.push("--reason", opts.reason);
			if (opts.json) args.push("--json");
			await run(args);
		});
}
