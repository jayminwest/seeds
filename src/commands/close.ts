import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { indexById } from "../id-index.ts";
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

export interface CloseOptions {
	reason?: string;
	json?: boolean;
}

export async function runClose(
	ids: string[],
	opts: CloseOptions,
	seedsDir?: string,
): Promise<void> {
	const jsonMode = opts.json === true;
	const reason = opts.reason;

	const dir = seedsDir ?? (await findSeedsDir());
	const closed: string[] = [];
	let openPlanParents: OpenPlanParent[] = [];

	// Lock order matches plan-submit: plans (outer) → issues (inner) so plan
	// lifecycle transitions stay atomic with the close write.
	await withLock(plansPath(dir), () =>
		withLock(issuesPath(dir), async () => {
			const issues = await readIssues(dir);
			const now = new Date().toISOString();
			const issueIdx = indexById(issues);

			for (const id of ids) {
				const idx = issueIdx.get(id) ?? -1;
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
		.action(async (id: string, ids: string[], opts: CloseOptions) => {
			await runClose([id, ...ids], opts);
		});
}
