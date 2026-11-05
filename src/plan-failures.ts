// Shared non-throwing failure reporters for `sd plan` (seeds-cb18). Each one
// routes through outputFailure so --json callers get the standard
// {success:false, command, error, ...} envelope on stdout while human callers
// keep the PLAN_SPEC stderr text unchanged.

import { outputFailure } from "./output.ts";
import type { Plan } from "./types.ts";
import type { PartialStateDiff } from "./validation.ts";

// Partial-state diff (PLAN_SPEC.md:180-195): bare diff JSON on stderr so stdout
// stays clean for piping; under --json the diff fields ride in the envelope.
export async function reportInvalidPlan(
	jsonMode: boolean,
	command: string,
	diff: PartialStateDiff,
	extra: Record<string, unknown> = {},
): Promise<void> {
	const error = `plan failed validation (${diff.errors.length} error(s))`;
	const human = `${JSON.stringify(diff, null, 2)}\n`;
	await outputFailure(jsonMode, command, error, human, { ...extra, ...diff });
}

// A non-draft plan already exists for the seed (PLAN_SPEC.md:374-391).
export async function reportPlanExists(
	jsonMode: boolean,
	command: string,
	plan: Plan,
	hint: string,
): Promise<void> {
	const msg = `plan ${plan.id} already exists for ${plan.seed} (status: ${plan.status}, revision: ${plan.revision})`;
	await outputFailure(jsonMode, command, `${msg}. ${hint}`, `✗ ${msg}\n  ${hint}\n`, {
		plan_id: plan.id,
	});
}
