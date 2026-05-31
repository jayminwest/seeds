import { dirname } from "node:path";
import { Command } from "commander";
import { findSeedsDir, loadPlanTemplates, readConfig } from "../config.ts";
import { generateId } from "../id.ts";
import { accent, brand, muted, outputJson, printSuccess } from "../output.ts";
import { applyPlanBackref, buildPlanBackref, stripPlanBackref } from "../plan-backref.ts";
import { inferDomain } from "../plan-domain.ts";
import { enrichPriorArt, recordDecision } from "../plan-mulch.ts";
import { compilePlanTemplate, defaultTemplateForType } from "../plan-schema.ts";
import {
	appendPlan,
	issuesPath,
	plansPath,
	readIssues,
	readPlans,
	withLock,
	writeIssues,
	writePlans,
} from "../store.ts";
import type { Issue, Plan, PlanStatus, PlanTemplate, SectionSpec } from "../types.ts";
import { VALID_TYPES } from "../types.ts";
import { normalizeLabels } from "./label.ts";
import { resolvePlanIdArg, runShow } from "./plan-show.ts";

export function register(program: Command): void {
	const plan = new Command("plan").description("Plan management");

	plan
		.command("templates")
		.description("List available plan templates")
		.option("--json", "Output as JSON")
		.action(async (opts: { json?: boolean }) => {
			await runTemplates(Boolean(opts.json));
		});

	plan
		.command("prompt <seed-id>")
		.description("Emit structured planning prompt JSON for a seed")
		.option("--template <name>", "Override the inferred template")
		.option("--domain <name>", "Force the mulch domain used for prior_art enrichment")
		.option("--json", "Output as JSON")
		.action(
			async (seedId: string, opts: { template?: string; domain?: string; json?: boolean }) => {
				await runPrompt(seedId, opts.template, opts.domain, Boolean(opts.json));
			},
		);

	plan
		.command("submit <seed-id>")
		.description("Validate a plan, spawn children, write plans.jsonl row")
		.requiredOption("--plan <file>", "Path to plan JSON, or '-' to read from stdin")
		.option(
			"--overwrite",
			"Replace an existing non-draft plan: rewrite the row, bump revision, flag obsolete children",
		)
		.option(
			"--record-decision",
			"Best-effort: after success, record the chosen approach as a mulch decision",
		)
		.option("--domain <name>", "Force the mulch domain used for --record-decision")
		.option(
			"--name <text>",
			"Human-readable plan label; overrides plan JSON 'name' and the seed-title default",
		)
		.option("--json", "Output as JSON")
		.addHelpText(
			"after",
			`
Plan file shape:

  {
    "template": "feature",
    "name": "Schema-driven config editor",
    "sections": {
      "approach": "Plain-text approach...",
      "steps": [{ "title": "Step 1", "labels": ["nightwatch"] }, ...],
      "acceptance": ["criterion 1", ...]
    }
  }

The shape mirrors 'sd plan prompt': drop the plan_request wrapper, and
sections is an object keyed by name (not the array of section metadata
that the prompt emits). Section names and value kinds match the template.

Plan name resolution:
  --name flag > plan JSON 'name' > parent seed title (fallback)
`,
		)
		.action(
			async (
				seedId: string,
				opts: {
					plan: string;
					overwrite?: boolean;
					recordDecision?: boolean;
					domain?: string;
					name?: string;
					json?: boolean;
				},
			) => {
				await runSubmit(seedId, opts.plan, {
					overwrite: Boolean(opts.overwrite),
					recordDecision: Boolean(opts.recordDecision),
					domainOverride: opts.domain,
					nameOverride: opts.name,
					jsonMode: Boolean(opts.json),
				});
			},
		);

	plan
		.command("show <id>")
		.description("Show a plan with sections, children, and status (accepts plan id or seed id)")
		.option("--json", "Output as JSON")
		.action(async (id: string, opts: { json?: boolean }) => {
			await runShow(id, Boolean(opts.json));
		});

	plan
		.command("validate <id>")
		.description(
			"Re-run validation against the current template definition (accepts plan id or seed id)",
		)
		.option("--json", "Output as JSON")
		.action(async (id: string, opts: { json?: boolean }) => {
			await runValidate(id, Boolean(opts.json));
		});

	plan
		.command("outcome <id>")
		.description(
			"Record a plan outcome (storage-only; not a state transition; accepts plan id or seed id)",
		)
		.requiredOption("--result <value>", "One of: success, partial, failure")
		.option("--note <text>", "Optional free-form note")
		.option("--json", "Output as JSON")
		.action(async (id: string, opts: { result: string; note?: string; json?: boolean }) => {
			await runOutcome(id, opts.result, opts.note, Boolean(opts.json));
		});

	plan
		.command("review <id>")
		.description(
			"Record a reviewer (informational; not a state transition; accepts plan id or seed id)",
		)
		.requiredOption("--by <name>", "Reviewer name")
		.option("--json", "Output as JSON")
		.action(async (id: string, opts: { by: string; json?: boolean }) => {
			await runReview(id, opts.by, Boolean(opts.json));
		});

	plan
		.command("edit <id>")
		.description("Edit plan fields in place (accepts plan id or seed id); bumps revision")
		.option("--name <text>", "Set the plan's human-readable label")
		.option(
			"--section <name-and-text...>",
			"Replace a text section: --section <name> <text> (V1: text sections only)",
		)
		.option("--step <i>", "1-based step index to edit (requires --title/--priority/--type)")
		.option("--title <text>", "New title for the step (with --step); propagates to child seed")
		.option("--priority <p>", "New priority (0-4 or P0-P4) for the step (with --step)")
		.option("--type <type>", `New type for the step (with --step): ${VALID_TYPES.join("|")}`)
		.option("--json", "Output as JSON")
		.action(
			async (
				id: string,
				opts: {
					name?: string;
					section?: string[];
					step?: string;
					title?: string;
					priority?: string;
					type?: string;
					json?: boolean;
				},
			) => {
				await runEdit(id, {
					name: opts.name,
					section: opts.section,
					step: opts.step,
					stepTitle: opts.title,
					stepPriority: opts.priority,
					stepType: opts.type,
					jsonMode: Boolean(opts.json),
				});
			},
		);

	plan
		.command("create <seed-id>")
		.description(
			"Create an adopt-only plan with zero spawned children (populate via 'sd plan adopt')",
		)
		.option("--name <text>", "Human-readable plan label (defaults to the seed title)")
		.option("--template <name>", "Plan template name (defaults to the seed type's default)")
		.option("--json", "Output as JSON")
		.action(async (seedId: string, opts: { name?: string; template?: string; json?: boolean }) => {
			await runCreate(seedId, {
				name: opts.name,
				template: opts.template,
				jsonMode: Boolean(opts.json),
			});
		});

	plan
		.command("adopt <plan-id> <seed-ids...>")
		.description("Adopt existing open seeds into a plan (link-only; bumps plan revision)")
		.option(
			"--step <i>",
			"1-based step index within the plan blueprint; sets plan_step_index on adopted seeds",
		)
		.option(
			"--at <i>",
			"1-based position in plan.children to insert the adopted seeds (default: append)",
		)
		.option("--before <seed>", "Insert the adopted seeds before this existing child seed")
		.option("--after <seed>", "Insert the adopted seeds after this existing child seed")
		.option("--json", "Output as JSON")
		.action(
			async (
				planIdArg: string,
				seedIds: string[],
				opts: { step?: string; at?: string; before?: string; after?: string; json?: boolean },
			) => {
				await runAdopt(planIdArg, seedIds, {
					step: opts.step,
					at: opts.at,
					before: opts.before,
					after: opts.after,
					jsonMode: Boolean(opts.json),
				});
			},
		);

	plan
		.command("reorder <plan-id> <seed-ids...>")
		.description("Set the exact order of plan.children (must be a permutation of current children)")
		.option("--json", "Output as JSON")
		.action(async (planIdArg: string, seedIds: string[], opts: { json?: boolean }) => {
			await runReorder(planIdArg, seedIds, { jsonMode: Boolean(opts.json) });
		});

	plan
		.command("release <plan-id> <seed-ids...>")
		.description("Release seeds from a plan (link-only; seeds stay open; bumps plan revision)")
		.option("--json", "Output as JSON")
		.action(async (planIdArg: string, seedIds: string[], opts: { json?: boolean }) => {
			await runRelease(planIdArg, seedIds, {
				jsonMode: Boolean(opts.json),
			});
		});

	plan
		.command("list")
		.description("List plans with optional filters")
		.option("--seed <id>", "Filter by parent seed id")
		.option("--status <status>", "Filter by status (draft|approved|active|done)")
		.option("--outcome <outcome>", "Filter by outcome (success|partial|failure)")
		.option("--template <name>", "Filter by template name")
		.option("--json", "Output as JSON")
		.action(
			async (opts: {
				seed?: string;
				status?: string;
				outcome?: string;
				template?: string;
				json?: boolean;
			}) => {
				await runList(opts, Boolean(opts.json));
			},
		);

	// `sd plan` (no subcommand) prints help and exits non-zero so scripted callers notice.
	plan.action(() => {
		plan.outputHelp();
		process.exitCode = 1;
	});

	program.addCommand(plan);
}

async function runTemplates(jsonMode: boolean): Promise<void> {
	const dir = await findSeedsDir();
	const templates = await loadPlanTemplates(dir);
	const list = Object.keys(templates).sort();
	const entries = list.map((name) => ({
		name,
		description: templates[name]?.description ?? "",
	}));
	if (jsonMode) {
		await outputJson({
			success: true,
			command: "plan templates",
			templates: entries,
			count: entries.length,
		});
		return;
	}
	console.log(`${brand("Available templates:")}`);
	for (const t of entries) {
		const desc = t.description ? `  ${muted(t.description)}` : "";
		console.log(`  ${accent.bold(t.name)}${desc}`);
	}
}

interface PromptSection {
	name: string;
	required: boolean;
	kind: SectionSpec["kind"];
	prompt: string;
	prior_art: unknown[];
	min_length?: number;
	min?: number;
	item?: SectionSpec["item"];
}

interface PlanRequest {
	seed: string;
	template: string;
	instructions: string;
	sections: PromptSection[];
	validation: {
		all_required_present: boolean;
		min_steps: number;
		min_acceptance: number;
	};
}

const INSTRUCTIONS =
	'Fill every section. Required fields are marked. Use prior_art entries to ground decisions. Reply with JSON shaped { "template": "<name>", "name": "<short label>", "sections": { "<section-name>": <value>, ... } } — drop the plan_request wrapper, and sections in your reply is an object keyed by name (not the array of section metadata above). The top-level `name` field is an optional short human-readable label (e.g. "Schema-driven config editor"); if you omit it, sd plan submit derives one from the parent seed title. Each step is shaped { title?, type?, priority?, blocks?: number[], labels?: string[], plan_template?, existing_seed? }. In each step, `blocks` lists 1-based step indices that this step blocks (step 1 is the first step, step N is the last); e.g. step 1 with `blocks: [2]` means step 1 must finish before step 2 starts. Leave empty if nothing depends on it. Optional `labels` is an array of non-empty strings applied to the spawned (or adopted) child seed; values are normalized (lowercased, trimmed, deduped) and merged additively on adoption — they never clobber existing labels.';

function buildPlanRequest(
	seedId: string,
	templateName: string,
	template: PlanTemplate,
): PlanRequest {
	const sections: PromptSection[] = Object.entries(template.sections).map(([name, s]) => {
		const out: PromptSection = {
			name,
			required: s.required,
			kind: s.kind,
			prompt: s.prompt,
			prior_art: [], // Phase 1: empty; Phase 3 fills from mulch
		};
		if (s.min_length !== undefined) out.min_length = s.min_length;
		if (s.min !== undefined) out.min = s.min;
		if (s.item !== undefined) out.item = s.item;
		return out;
	});
	const stepsSection = template.sections.steps;
	const acceptanceSection = template.sections.acceptance;
	return {
		seed: seedId,
		template: templateName,
		instructions: INSTRUCTIONS,
		sections,
		validation: {
			all_required_present: true,
			min_steps: stepsSection?.min ?? 0,
			min_acceptance: acceptanceSection?.min ?? 0,
		},
	};
}

async function runPrompt(
	seedId: string,
	templateOverride: string | undefined,
	domainOverride: string | undefined,
	jsonMode: boolean,
): Promise<void> {
	const dir = await findSeedsDir();
	const issues = await readIssues(dir);
	const seed = issues.find((i) => i.id === seedId);
	if (!seed) throw new Error(`Seed not found: ${seedId}`);

	const templates = await loadPlanTemplates(dir);
	// PLAN_SPEC.md:329-342 — a child spawned from a step with plan_template
	// inherits that template name unless --template overrides. The back-link
	// to the parent plan is via plan_step_index + plan.children[].
	const inheritedTemplate = templateOverride ? undefined : await resolveStepPlanTemplate(dir, seed);
	const templateName = templateOverride ?? inheritedTemplate ?? defaultTemplateForType(seed.type);
	const template = templates[templateName];
	if (!template) {
		const available = Object.keys(templates).join(", ");
		throw new Error(`Unknown template: ${templateName}. Available: ${available}`);
	}

	const planRequest = buildPlanRequest(seedId, templateName, template);

	// Phase 3: prior_art enrichment via mulch. Soft coupling — empty arrays
	// when ml is absent or a domain cannot be inferred.
	const { domain } = inferDomain({ seed, explicitDomain: domainOverride });
	const sectionRequests = Object.entries(template.sections).map(([name, spec]) => ({
		name,
		mulchSource: spec.mulch_source,
	}));
	const priorArt = enrichPriorArt({ domain, sections: sectionRequests });
	for (const section of planRequest.sections) {
		const entries = priorArt[section.name];
		if (entries && entries.length > 0) section.prior_art = entries;
	}

	if (jsonMode) {
		await outputJson({
			success: true,
			command: "plan prompt",
			plan_request: planRequest,
		});
		return;
	}

	console.log(`${brand("Plan prompt")} for ${accent.bold(seedId)}`);
	console.log(`${muted("Template:")} ${planRequest.template}`);
	console.log(`${muted("Seed title:")} ${seed.title}`);
	console.log("");
	console.log(planRequest.instructions);
	console.log("");
	for (const s of planRequest.sections) {
		const tag = s.required ? brand("required") : muted("optional");
		const kindLabel = typeof s.kind === "string" ? s.kind : "object";
		console.log(`  ${accent.bold(s.name)} ${muted(`(${kindLabel})`)} ${tag}`);
		console.log(`    ${muted(s.prompt)}`);
		if (s.min_length !== undefined) console.log(`    ${muted(`min_length: ${s.min_length}`)}`);
		if (s.min !== undefined) console.log(`    ${muted(`min entries: ${s.min}`)}`);
	}
	console.log("");
	console.log(`${muted("Pipe --json into a file the LLM fills, then run:")}`);
	console.log(`  sd plan submit ${seedId} --plan <file>`);
}

interface SubmittedStep {
	// Title is optional only when `existing_seed` is set (adoption-only steps).
	// The post-AJV validator in plan-schema.ts enforces the invariant; reaching
	// the fresh-spawn branch implies `title` is present.
	title?: string;
	type?: string;
	priority?: number;
	blocks?: number[];
	plan_template?: string;
	existing_seed?: string;
	// Optional per-step labels (seeds-7561 / pl-e5a8 step 1). Normalization
	// (lowercase/trim/dedup) and propagation into spawned/adopted children land
	// in subsequent plan steps (seeds-745e fresh-spawn, seeds-bac9 adoption).
	labels?: string[];
}

// Additively merge per-step labels into an adopted seed's existing labels
// (seeds-bac9 / pl-e5a8 step 3). Normalization mirrors `sd label add`
// (lowercase, trim, drop empties); the result is deduped via Set. Returns the
// merged array when it differs from `existing`, or `undefined` when there is
// nothing to add. Adoption is link-only: we never remove labels the seed
// already carries — manual user labels survive plan submits.
function mergeAdoptedLabels(
	existing: string[] | undefined,
	stepLabels: string[] | undefined,
): string[] | undefined {
	if (!stepLabels || stepLabels.length === 0) return undefined;
	const normalized = normalizeLabels(stepLabels);
	if (normalized.length === 0) return undefined;
	const current = existing ?? [];
	const merged = Array.from(new Set([...current, ...normalized]));
	if (merged.length === current.length && merged.every((l, i) => l === current[i])) {
		return undefined;
	}
	return merged;
}

interface SubmittedPlan {
	template: string;
	name?: string;
	sections: {
		steps: SubmittedStep[];
		[key: string]: unknown;
	};
}

// Resolve the plan_template declared on the parent plan's step that spawned
// this seed (PLAN_SPEC.md:329-342). For plan_template children, plan_id is
// unset, so we fall back to scanning plans by children[] membership.
async function resolveStepPlanTemplate(dir: string, seed: Issue): Promise<string | undefined> {
	if (seed.plan_step_index === undefined) return undefined;
	const plans = await readPlans(dir);
	let parentPlan: Plan | undefined;
	if (seed.plan_id) {
		parentPlan = plans.find((p) => p.id === seed.plan_id);
	}
	if (!parentPlan) {
		parentPlan = plans.find((p) => p.children.includes(seed.id));
	}
	if (!parentPlan) return undefined;
	const sections = parentPlan.sections as { steps?: SubmittedStep[] };
	const step = sections.steps?.[seed.plan_step_index];
	return step?.plan_template;
}

// PLAN_SPEC.md:329-338 — submit-time check that step.plan_template references
// a template defined in plan_templates: in config.yaml. Returns null on success
// or a one-line error message pointing the author at the template config.
function validatePlanTemplateRefs(
	steps: SubmittedStep[],
	templates: Record<string, PlanTemplate>,
): string | null {
	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		if (!step) continue;
		const ref = step.plan_template;
		if (!ref) continue;
		if (!templates[ref]) {
			const available = Object.keys(templates).join(", ");
			const label = step.title ?? "untitled";
			return `step ${i + 1} (${label}): plan_template '${ref}' is not defined. Available: ${available}. Add it under plan_templates: in .seeds/config.yaml.`;
		}
	}
	return null;
}

async function readPlanInput(planFile: string): Promise<string> {
	if (planFile === "-") {
		return await Bun.stdin.text();
	}
	const file = Bun.file(planFile);
	if (!(await file.exists())) {
		throw new Error(`Plan file not found: ${planFile}`);
	}
	return await file.text();
}

interface SubmitOptions {
	overwrite: boolean;
	recordDecision: boolean;
	domainOverride?: string;
	nameOverride?: string;
	jsonMode: boolean;
}

// Plan names are short human-readable labels. Empty/whitespace-only inputs are
// treated as "not provided" so the fall-through to seed title kicks in.
function normalizePlanName(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

async function runSubmit(seedId: string, planFile: string, opts: SubmitOptions): Promise<void> {
	const {
		overwrite,
		recordDecision: shouldRecordDecision,
		domainOverride,
		nameOverride,
		jsonMode,
	} = opts;
	const dir = await findSeedsDir();

	const raw = await readPlanInput(planFile);
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (e) {
		throw new Error(`Invalid JSON in plan file: ${(e as Error).message}`);
	}

	const templateName =
		parsed &&
		typeof parsed === "object" &&
		typeof (parsed as { template?: unknown }).template === "string"
			? (parsed as { template: string }).template
			: "feature";

	const templates = await loadPlanTemplates(dir);
	const template = templates[templateName];
	if (!template) {
		const available = Object.keys(templates).join(", ");
		throw new Error(`Unknown template in plan: ${templateName}. Available: ${available}`);
	}

	const validate = compilePlanTemplate(template);
	const result = validate(parsed);
	if (!result.valid) {
		// Partial-state diff JSON to stderr (PLAN_SPEC.md:180-195).
		// stdout stays clean so callers can pipe it into a file.
		process.stderr.write(`${JSON.stringify(result.diff, null, 2)}\n`);
		process.exitCode = 1;
		return;
	}

	const submitted = parsed as SubmittedPlan;
	const refError = validatePlanTemplateRefs(submitted.sections.steps, templates);
	if (refError) {
		process.stderr.write(`${refError}\n`);
		process.exitCode = 1;
		return;
	}
	const config = await readConfig(dir);

	// Name resolution priority (seeds-5640): --name flag > plan JSON `name` >
	// seed.title (fresh submit) or existing plan.name (overwrite). The third
	// fallback is decided inside the lock so we see the live seed/plan state.
	const explicitName = normalizePlanName(nameOverride) ?? normalizePlanName(submitted.name);

	let createdPlanId = "";
	let childIds: string[] = [];
	let revision = 1;
	let obsoleteChildren: Issue[] = [];
	let aborted = false;
	// Captured inside the lock so the post-success outbound mulch write has
	// access without re-reading issues.jsonl.
	let seedSnapshot: Issue | null = null;
	// Captured inside the lock so the post-success Next-block can decide
	// whether to suggest `sd plan review` (only when no reviewer yet and the
	// plan is in a reviewable state).
	let planStatus: PlanStatus = "approved";
	let planReviewedBy: string | undefined;

	// Combined lock: hold plans + issues while we read and write both.
	// Order: outer lock = plans, inner = issues. Same across submit/validate
	// to avoid deadlocks.
	await withLock(plansPath(dir), async () => {
		await withLock(issuesPath(dir), async () => {
			const allIssues = await readIssues(dir);
			const allPlans = await readPlans(dir);

			const seedIdx = allIssues.findIndex((i) => i.id === seedId);
			const seed = allIssues[seedIdx];
			if (!seed) throw new Error(`Seed not found: ${seedId}`);
			seedSnapshot = seed;

			const existingPlan = allPlans.find((p) => p.seed === seedId && p.status !== "draft");
			if (existingPlan && !overwrite) {
				// PLAN_SPEC.md:374-391 — reject without --overwrite, exit non-zero
				// with a multi-line stderr message.
				process.stderr.write(
					`✗ plan ${existingPlan.id} already exists for ${seedId} (status: ${existingPlan.status}, revision: ${existingPlan.revision})\n  Use --overwrite to replace it.\n`,
				);
				process.exitCode = 1;
				aborted = true;
				return;
			}

			const steps = submitted.sections.steps;
			const now = new Date().toISOString();

			if (existingPlan && overwrite) {
				const result = applyOverwrite({
					existingPlan,
					seed,
					seedIdx,
					allIssues,
					allPlans,
					steps,
					projectName: config.project,
					templateName,
					newSections: submitted.sections as Record<string, unknown>,
					name: explicitName ?? existingPlan.name ?? normalizePlanName(seed.title),
					now,
				});
				await writeIssues(dir, allIssues);
				await writePlans(dir, allPlans);
				createdPlanId = existingPlan.id;
				childIds = result.finalChildIds;
				revision = result.revision;
				obsoleteChildren = result.obsolete;
				// Overwrite preserves status + reviewer from the prior plan row.
				planStatus = existingPlan.status;
				planReviewedBy = existingPlan.reviewedBy;
				return;
			}

			// Fresh-submit path (no existing non-draft plan).
			//
			// Steps may carry `existing_seed: "<id>"` to adopt an already-open
			// seed instead of spawning a fresh child (seeds-3c89 / pl-43ff).
			// Adoption is link-only: status/title/type/priority/assignee/labels
			// stay with the seed; we only set plan_id, plan_step_index, prepend
			// the backref block, and wire blocks/blockedBy edges.
			const adoptions = validateAdoptions({ steps, seedId, allIssues });

			const issueIds = new Set(allIssues.map((i) => i.id));
			const planIds = new Set(allPlans.map((p) => p.id));
			const planId = generateId("pl", planIds);

			const finalChildIds: string[] = [];
			for (let i = 0; i < steps.length; i++) {
				const adoption = adoptions.get(i);
				if (adoption) {
					finalChildIds.push(adoption.seedId);
					continue;
				}
				const id = generateId(config.project, new Set([...issueIds, ...finalChildIds]));
				finalChildIds.push(id);
			}

			// Build fresh issues; mutate adopted seeds in place. Edge wiring
			// runs in a unified pass below so adopted + fresh edges go through
			// the same pipeline.
			const newIssues: Issue[] = [];
			for (let i = 0; i < steps.length; i++) {
				const step = steps[i];
				if (!step) continue;
				const childId = finalChildIds[i];
				if (!childId) continue;
				const adoption = adoptions.get(i);
				if (adoption) {
					const matched = allIssues[adoption.seedAllIdx];
					if (!matched) continue;
					// seeds-bac9 — additively merge step.labels into the adopted
					// seed's existing labels (link-only path; user-added labels
					// survive).
					const mergedLabels = mergeAdoptedLabels(matched.labels, step.labels);
					allIssues[adoption.seedAllIdx] = {
						...matched,
						plan_id: planId,
						plan_step_index: i,
						description: applyPlanBackref(matched.description, {
							stepIndex: i,
							planId,
							parentSeedId: seedId,
							parentSeedTitle: seed.title,
							templateName,
							approach: submitted.sections.approach,
						}),
						...(mergedLabels ? { labels: mergedLabels } : {}),
						updatedAt: now,
					};
					continue;
				}
				const stepType = (step.type ?? "task") as Issue["type"];
				// Non-adopting spawn path: validateStepTitleOrAdopt guarantees title
				// is present here (else this step would carry existing_seed and the
				// adoption branch above would have handled it).
				if (!step.title) continue;
				const issue: Issue = {
					id: childId,
					title: step.title,
					status: "open",
					type: stepType,
					priority: step.priority ?? 2,
					plan_step_index: i,
					description: buildPlanBackref({
						stepIndex: i,
						planId,
						parentSeedId: seedId,
						parentSeedTitle: seed.title,
						templateName,
						approach: submitted.sections.approach,
					}),
					createdAt: now,
					updatedAt: now,
				};
				// seeds-745e / pl-e5a8 step 2 — apply per-step labels to the
				// freshly spawned child. Normalization mirrors `sd label add`
				// (lowercase, trim, dedup); empty arrays after normalization
				// are omitted so the on-disk Issue stays minimal.
				if (step.labels && step.labels.length > 0) {
					const normalized = Array.from(new Set(normalizeLabels(step.labels)));
					if (normalized.length > 0) issue.labels = normalized;
				}
				// PLAN_SPEC.md:329-342 — when the parent step declares a
				// plan_template, the child needs its own sub-plan first. Mark it
				// requires_plan and leave plan_id unset so it does not back-link
				// to the parent plan; the back-link is via children: [] on the
				// parent plan row + plan_step_index on the child.
				if (step.plan_template) {
					issue.requires_plan = true;
				} else {
					issue.plan_id = planId;
				}
				newIssues.push(issue);
			}

			// Unified edge wiring: source/target may each be fresh or adopted.
			// Order matters — forward step.blocks edges first, then parent-seed
			// reverse edge, so a fresh child's `blocks` reads as
			// [...stepTargets, parentSeed] (preserves the pre-adoption shape).
			const updateChildField = (
				stepIdx: number,
				field: "blocks" | "blockedBy",
				id: string,
			): void => {
				const adoption = adoptions.get(stepIdx);
				if (adoption) {
					const m = allIssues[adoption.seedAllIdx];
					if (!m) return;
					const next = appendUnique(m[field], id);
					if (next === m[field]) return;
					allIssues[adoption.seedAllIdx] = { ...m, [field]: next, updatedAt: now };
					return;
				}
				const childId = finalChildIds[stepIdx];
				if (!childId) return;
				const fresh = newIssues.find((n) => n.id === childId);
				if (!fresh) return;
				fresh[field] = appendUnique(fresh[field], id);
			};

			// PLAN_SPEC.md:248-257 — forward semantics: step i with blocks=[j]
			// means "this step blocks step j". 1-based (seeds-185f).
			for (let i = 0; i < steps.length; i++) {
				const step = steps[i];
				if (!step) continue;
				const sourceId = finalChildIds[i];
				if (!sourceId) continue;
				for (const j of step.blocks ?? []) {
					const targetId = finalChildIds[j - 1];
					if (!targetId) continue;
					updateChildField(i, "blocks", targetId);
					updateChildField(j - 1, "blockedBy", sourceId);
				}
			}

			// Each child blocks the parent seed.
			for (let i = 0; i < steps.length; i++) {
				updateChildField(i, "blocks", seedId);
			}

			// Parent seed picks up every child as a blocker. Dedupe so an
			// adopted seed the parent already depended on doesn't double up.
			const dedupedBlockedBy = [...(seed.blockedBy ?? [])];
			for (const cid of finalChildIds) {
				if (!dedupedBlockedBy.includes(cid)) dedupedBlockedBy.push(cid);
			}
			const updatedSeed: Issue = {
				...seed,
				plan_id: planId,
				blockedBy: dedupedBlockedBy,
				updatedAt: now,
			};
			allIssues[seedIdx] = updatedSeed;

			const resolvedName = explicitName ?? normalizePlanName(seed.title);
			const plan: Plan = {
				id: planId,
				seed: seedId,
				template: templateName,
				status: "approved",
				revision: 1,
				sections: submitted.sections as Record<string, unknown>,
				children: finalChildIds,
				createdAt: now,
				updatedAt: now,
			};
			if (resolvedName) plan.name = resolvedName;
			// Track submit-time existing_seed adoptions so `sd plan show` can tag
			// them (seeds-a3ab). Only persist when non-empty so plans that don't
			// use adoption stay byte-identical to pre-feature output.
			const submitAdopted = [...adoptions.values()].map((a) => a.seedId);
			if (submitAdopted.length > 0) plan.adoptedChildren = submitAdopted;

			await writeIssues(dir, [...allIssues, ...newIssues]);

			const draftIdx = allPlans.findIndex((p) => p.seed === seedId && p.status === "draft");
			if (draftIdx >= 0) {
				allPlans[draftIdx] = plan;
				await writePlans(dir, allPlans);
			} else {
				await appendPlan(dir, plan);
			}

			createdPlanId = planId;
			childIds = finalChildIds;
		});
	});

	if (aborted) return;

	let recordedMulchId: string | null = null;
	if (shouldRecordDecision && seedSnapshot) {
		// PLAN_SPEC.md:354-356 — best-effort outbound write. Submit has already
		// succeeded by this point; any failure here warns on stderr and leaves
		// the plan + children intact.
		recordedMulchId = await runOutboundDecision({
			seed: seedSnapshot,
			planId: createdPlanId,
			approach: submitted.sections.approach,
			domainOverride,
			cwd: dir,
		});
	}

	if (obsoleteChildren.length > 0) {
		// PLAN_SPEC.md:388 — emit one suggestion line per obsolete child to
		// stderr; never auto-close.
		for (const o of obsoleteChildren) {
			process.stderr.write(
				`sd close ${o.id} --reason "obsoleted by plan ${createdPlanId} revision ${revision}"\n`,
			);
		}
	}

	if (jsonMode) {
		await outputJson({
			success: true,
			command: "plan submit",
			plan_id: createdPlanId,
			children: childIds,
			parent_seed: seedId,
			revision,
			obsolete: obsoleteChildren.map((o) => o.id),
			overwritten: revision > 1,
		});
		return;
	}

	if (revision > 1) {
		printSuccess(
			`plan ${accent(createdPlanId)} overwritten (revision ${revision}, status: approved)`,
		);
	} else {
		printSuccess(`plan ${accent(createdPlanId)} created (status: approved)`);
	}
	printSuccess(
		`${childIds.length} child seed${childIds.length === 1 ? "" : "s"}: ${childIds
			.map((id) => accent(id))
			.join(", ")}`,
	);
	if (obsoleteChildren.length > 0) {
		printSuccess(
			`${obsoleteChildren.length} obsolete child seed${
				obsoleteChildren.length === 1 ? "" : "s"
			} flagged (see stderr for close suggestions)`,
		);
	}
	printSuccess(`${accent(seedId)} now blocked by ${childIds.length} children`);
	if (recordedMulchId) {
		printSuccess(`recorded mulch decision ${accent(recordedMulchId)}`);
	}
	writeNextHints({
		planId: createdPlanId,
		reviewable: !planReviewedBy && (planStatus === "approved" || planStatus === "active"),
	});
}

// Next-block hints follow the convention used by the obsolete-children
// suggestions: stderr only, so JSON consumers (stdout) stay clean. The review
// hint is conditional — once a reviewer is on the plan, suggesting
// `sd plan review` again is just noise.
function writeNextHints(opts: { planId: string; reviewable: boolean }): void {
	const lines: string[] = [
		"",
		"Next:",
		`  sd plan show ${opts.planId}          # review the plan as a unit`,
		"  sd ready                      # pick up the first child step",
	];
	if (opts.reviewable) {
		lines.push(`  sd plan review ${opts.planId} --by <name>   # record approval (optional)`);
	}
	process.stderr.write(`${lines.join("\n")}\n`);
}

interface AdoptionEntry {
	seedId: string;
	seedAllIdx: number;
}

interface AdoptionValidationArgs {
	steps: SubmittedStep[];
	seedId: string;
	allIssues: Issue[];
	// When set, seeds with plan_id === allowedCurrentPlanId pass the
	// already-attached check. The overwrite path passes the live plan id so a
	// step can reference a current plan-child by id (rename + reorder) without
	// being mistaken for cross-plan poaching.
	allowedCurrentPlanId?: string;
}

// Validate every step's existing_seed before any writes. Returns a
// step-index → adoption map for the fresh-submit pipeline. Throws on the first
// invalid candidate so the lock callback aborts cleanly.
function validateAdoptions(args: AdoptionValidationArgs): Map<number, AdoptionEntry> {
	const { steps, seedId, allIssues, allowedCurrentPlanId } = args;
	const out = new Map<number, AdoptionEntry>();
	const seen = new Set<string>();
	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		if (!step?.existing_seed) continue;
		const adoptId = step.existing_seed;
		// Step titles are optional on adoption-only steps (seeds-5583), so the
		// error label falls back to the adopted seed id when title is absent.
		const label = step.title ? `step ${i + 1} (${step.title})` : `step ${i + 1} (adopt ${adoptId})`;
		if (step.plan_template) {
			throw new Error(
				`${label}: existing_seed and plan_template are mutually exclusive — adoption replaces spawning, so a sub-plan template cannot apply.`,
			);
		}
		if (adoptId === seedId) {
			throw new Error(`${label}: cannot adopt the parent seed ${seedId} into its own plan.`);
		}
		if (seen.has(adoptId)) {
			throw new Error(
				`${label}: existing_seed ${adoptId} is already adopted by an earlier step in this plan.`,
			);
		}
		const idx = allIssues.findIndex((iss) => iss.id === adoptId);
		const seed = allIssues[idx];
		if (!seed) {
			throw new Error(`${label}: existing_seed ${adoptId} not found.`);
		}
		if (seed.status === "closed") {
			throw new Error(
				`${label}: existing_seed ${adoptId} is closed; only open or in-progress seeds can be adopted.`,
			);
		}
		if (seed.plan_id && seed.plan_id !== allowedCurrentPlanId) {
			throw new Error(
				`${label}: existing_seed ${adoptId} is already attached to plan ${seed.plan_id}.`,
			);
		}
		// The mismatch warning only fires when the author supplied an explicit
		// step.title that disagrees with the adopted seed. Omitted titles
		// (synthesis-style submits) are not a mismatch.
		if (step.title && seed.title !== step.title) {
			process.stderr.write(
				`⚠ step ${i + 1}: existing_seed ${adoptId} title "${seed.title}" differs from step.title "${step.title}"; seed title is preserved.\n`,
			);
		}
		seen.add(adoptId);
		out.set(i, { seedId: adoptId, seedAllIdx: idx });
	}
	return out;
}

// Append-unique helper used by the fresh-submit edge wiring. Returns the same
// reference when no change is needed so callers can short-circuit writes.
function appendUnique(list: string[] | undefined, id: string): string[] {
	const arr = list ?? [];
	if (arr.includes(id)) return arr;
	return [...arr, id];
}

interface OverwriteArgs {
	existingPlan: Plan;
	seed: Issue;
	seedIdx: number;
	allIssues: Issue[];
	allPlans: Plan[];
	steps: SubmittedStep[];
	projectName: string;
	templateName: string;
	newSections: Record<string, unknown>;
	name?: string;
	now: string;
}

interface OverwriteResult {
	finalChildIds: string[];
	revision: number;
	obsolete: Issue[];
}

// applyOverwrite mutates allIssues + allPlans in place. The caller is expected
// to have already acquired the plans + issues locks.
function applyOverwrite(args: OverwriteArgs): OverwriteResult {
	const {
		existingPlan,
		seed,
		seedIdx,
		allIssues,
		allPlans,
		steps,
		projectName,
		templateName,
		newSections,
		name,
		now,
	} = args;

	// Validate any existing_seed adoptions before mutating state. Seeds
	// already attached to *this* plan are allowed; that's how the overwrite
	// path lets a step pin to a current plan-child by id (rename, reorder)
	// instead of relying on title matching alone. (seeds-99ae / pl-43ff step 3)
	const adoptions = validateAdoptions({
		steps,
		seedId: seed.id,
		allIssues,
		allowedCurrentPlanId: existingPlan.id,
	});

	// Match existing children to new steps. Precedence:
	//   1. step.existing_seed id — current plan-child or external adoption.
	//   2. step.title against unmatched current plan-children (legacy path).
	//   3. Spawn a fresh child.
	// (PLAN_SPEC.md:387-388)
	const oldChildIssues: Issue[] = [];
	for (const cid of existingPlan.children) {
		const c = allIssues.find((i) => i.id === cid);
		if (c) oldChildIssues.push(c);
	}
	const oldChildIdSet = new Set(oldChildIssues.map((c) => c.id));
	const usedOldIds = new Set<string>();
	const adoptedExternalIds = new Set<string>();
	const finalChildIds: string[] = [];
	const newSpawnedIds: string[] = [];
	const issueIds = new Set(allIssues.map((i) => i.id));

	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		if (!step) continue;
		const adoption = adoptions.get(i);
		if (adoption) {
			finalChildIds.push(adoption.seedId);
			if (oldChildIdSet.has(adoption.seedId)) {
				usedOldIds.add(adoption.seedId);
			} else {
				adoptedExternalIds.add(adoption.seedId);
			}
			continue;
		}
		const match = oldChildIssues.find((c) => !usedOldIds.has(c.id) && c.title === step.title);
		if (match) {
			usedOldIds.add(match.id);
			finalChildIds.push(match.id);
		} else {
			const taken = new Set([...issueIds, ...newSpawnedIds, ...finalChildIds]);
			const id = generateId(projectName, taken);
			newSpawnedIds.push(id);
			finalChildIds.push(id);
		}
	}

	// Build issues for newly spawned children. Existing matched children keep
	// their fields (assignee, labels, status, etc.) but their backref block is
	// refreshed in place so the snippet stays in sync with the live plan
	// (seeds-76af). External adoptions get linked into the plan (plan_id,
	// plan_step_index, backref) without touching other fields; the parent-
	// blocks edge is added in the unified wiring pass below.
	const approach = (newSections as { approach?: unknown }).approach;
	const newIssues: Issue[] = [];
	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		if (!step) continue;
		const childId = finalChildIds[i];
		if (!childId) continue;
		if (usedOldIds.has(childId)) {
			const matchedIdx = allIssues.findIndex((iss) => iss.id === childId);
			const matched = allIssues[matchedIdx];
			if (matched) {
				// seeds-bac9 — overwrite/revision path: additively merge
				// step.labels into the matched child's labels. Never strips
				// labels — manual edits and previously merged labels survive.
				const mergedLabels = mergeAdoptedLabels(matched.labels, step.labels);
				allIssues[matchedIdx] = {
					...matched,
					description: applyPlanBackref(matched.description, {
						stepIndex: i,
						planId: existingPlan.id,
						parentSeedId: seed.id,
						parentSeedTitle: seed.title,
						templateName,
						approach,
					}),
					...(mergedLabels ? { labels: mergedLabels } : {}),
					updatedAt: now,
				};
			}
			continue;
		}
		if (adoptedExternalIds.has(childId)) {
			const matchedIdx = allIssues.findIndex((iss) => iss.id === childId);
			const matched = allIssues[matchedIdx];
			if (matched) {
				// seeds-bac9 — overwrite path external adoption: merge
				// step.labels into the newly linked seed's existing labels.
				const mergedLabels = mergeAdoptedLabels(matched.labels, step.labels);
				allIssues[matchedIdx] = {
					...matched,
					plan_id: existingPlan.id,
					plan_step_index: i,
					description: applyPlanBackref(matched.description, {
						stepIndex: i,
						planId: existingPlan.id,
						parentSeedId: seed.id,
						parentSeedTitle: seed.title,
						templateName,
						approach,
					}),
					...(mergedLabels ? { labels: mergedLabels } : {}),
					updatedAt: now,
				};
			}
			continue;
		}
		const stepType = (step.type ?? "task") as Issue["type"];
		// Non-adopting spawn path: validateStepTitleOrAdopt guarantees title.
		if (!step.title) continue;
		const issue: Issue = {
			id: childId,
			title: step.title,
			status: "open",
			type: stepType,
			priority: step.priority ?? 2,
			plan_step_index: i,
			description: buildPlanBackref({
				stepIndex: i,
				planId: existingPlan.id,
				parentSeedId: seed.id,
				parentSeedTitle: seed.title,
				templateName,
				approach,
			}),
			createdAt: now,
			updatedAt: now,
		};
		if (step.plan_template) {
			issue.requires_plan = true;
		} else {
			issue.plan_id = existingPlan.id;
		}
		// seeds-745e / pl-e5a8 step 2 — apply per-step labels to the freshly
		// spawned child on the overwrite/revision path. Same normalization as
		// the initial-submit branch above.
		if (step.labels && step.labels.length > 0) {
			const normalized = Array.from(new Set(normalizeLabels(step.labels)));
			if (normalized.length > 0) issue.labels = normalized;
		}
		// PLAN_SPEC.md:248-257 — forward semantics: step.blocks=[j] means
		// this step blocks step j. Both directions are wired below in a
		// unified pass that handles new and matched children alike.
		issue.blocks = [seed.id];
		newIssues.push(issue);
	}

	// Wire step.blocks edges in both directions:
	//   source.blocks       gains targetId
	//   target.blockedBy    gains sourceId
	// Source and target may each be freshly spawned (in newIssues) or matched
	// (in allIssues). Dedupe so edges already present from the prior revision
	// don't compound; we don't strip stale edges (full reconciliation is out
	// of scope).
	const addToList = (
		list: string[] | undefined,
		id: string,
	): { list: string[]; changed: boolean } => {
		const arr = list ?? [];
		if (arr.includes(id)) return { list: arr, changed: false };
		return { list: [...arr, id], changed: true };
	};
	const updateMatched = (
		targetId: string,
		field: "blocks" | "blockedBy",
		valueId: string,
	): boolean => {
		const idx = allIssues.findIndex((iss) => iss.id === targetId);
		if (idx < 0) return false;
		const matched = allIssues[idx];
		if (!matched) return false;
		const result = addToList(matched[field], valueId);
		if (!result.changed) return false;
		allIssues[idx] = { ...matched, [field]: result.list, updatedAt: now };
		return true;
	};
	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		if (!step) continue;
		const sourceId = finalChildIds[i];
		if (!sourceId) continue;
		// step.blocks is 1-based (seeds-185f); translate to 0-based.
		for (const j of step.blocks ?? []) {
			const targetId = finalChildIds[j - 1];
			if (!targetId) continue;
			// Forward edge on source.
			const newSource = newIssues.find((ni) => ni.id === sourceId);
			if (newSource) {
				const r = addToList(newSource.blocks, targetId);
				if (r.changed) newSource.blocks = r.list;
			} else {
				updateMatched(sourceId, "blocks", targetId);
			}
			// Reverse edge on target.
			const newTarget = newIssues.find((ni) => ni.id === targetId);
			if (newTarget) {
				const r = addToList(newTarget.blockedBy, sourceId);
				if (r.changed) newTarget.blockedBy = r.list;
			} else {
				updateMatched(targetId, "blockedBy", sourceId);
			}
		}
	}

	// External adoptions need the parent-blocks edge added (matched old
	// children already have it; fresh children get it inline above).
	for (const childId of adoptedExternalIds) {
		updateMatched(childId, "blocks", seed.id);
	}

	// Obsolete children = old plan children with no matching step in new plan.
	const obsolete: Issue[] = oldChildIssues.filter((c) => !usedOldIds.has(c.id));

	// Parent seed: drop obsolete from blockedBy, ensure all current plan
	// children are present. Preserve unrelated blockers; dedupe against
	// finalChildIds so an externally-adopted seed the parent already depended
	// on doesn't double up.
	const oldChildSet = new Set(existingPlan.children);
	const finalChildSet = new Set(finalChildIds);
	const externalBlockers = (seed.blockedBy ?? []).filter(
		(b) => !oldChildSet.has(b) && !finalChildSet.has(b),
	);
	const updatedSeed: Issue = {
		...seed,
		plan_id: existingPlan.id,
		blockedBy: [...externalBlockers, ...finalChildIds],
		updatedAt: now,
	};
	allIssues[seedIdx] = updatedSeed;

	// Update the plan row in place — single mutation per overwrite.
	const planIdx = allPlans.findIndex((p) => p.id === existingPlan.id);
	// Preserve prior adoptions for children that survive the overwrite, then
	// add the freshly-adopted external seeds from this rewrite. seeds-a3ab.
	const finalChildIdSet = new Set(finalChildIds);
	const survivingAdopted = (existingPlan.adoptedChildren ?? []).filter((id) =>
		finalChildIdSet.has(id),
	);
	const mergedAdopted: string[] = [...survivingAdopted];
	for (const id of adoptedExternalIds) {
		if (!mergedAdopted.includes(id)) mergedAdopted.push(id);
	}
	const updatedPlan: Plan = {
		...existingPlan,
		template: templateName,
		sections: newSections,
		children: finalChildIds,
		revision: existingPlan.revision + 1,
		updatedAt: now,
	};
	if (mergedAdopted.length > 0) {
		updatedPlan.adoptedChildren = mergedAdopted;
	} else {
		delete updatedPlan.adoptedChildren;
	}
	if (name) updatedPlan.name = name;
	if (planIdx >= 0) allPlans[planIdx] = updatedPlan;

	const allIssuesWithNew = [...allIssues, ...newIssues];
	// allIssues is mutated; replace its contents to reflect appended new children
	// so the caller's writeIssues snapshot is consistent.
	allIssues.length = 0;
	allIssues.push(...allIssuesWithNew);

	// Caller already holds locks; do the persistence here so the row mutation
	// of plans.jsonl shows up as a single replaced line in git diff.
	return { finalChildIds, revision: updatedPlan.revision, obsolete };
}

interface ListFilters {
	seed?: string;
	status?: string;
	outcome?: string;
	template?: string;
}

const VALID_PLAN_STATUSES = new Set(["draft", "approved", "active", "done"]);
const VALID_PLAN_OUTCOMES = new Set(["success", "partial", "failure"]);

async function runList(filters: ListFilters, jsonMode: boolean): Promise<void> {
	if (filters.status && !VALID_PLAN_STATUSES.has(filters.status)) {
		throw new Error(
			`--status must be one of: ${[...VALID_PLAN_STATUSES].join(", ")} (got: ${filters.status})`,
		);
	}
	if (filters.outcome && !VALID_PLAN_OUTCOMES.has(filters.outcome)) {
		throw new Error(
			`--outcome must be one of: ${[...VALID_PLAN_OUTCOMES].join(", ")} (got: ${filters.outcome})`,
		);
	}

	const dir = await findSeedsDir();
	const plans = await readPlans(dir);
	const filtered = plans
		.filter((p) => (filters.seed ? p.seed === filters.seed : true))
		.filter((p) => (filters.status ? p.status === filters.status : true))
		.filter((p) => (filters.outcome ? p.outcome === filters.outcome : true))
		.filter((p) => (filters.template ? p.template === filters.template : true))
		.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

	if (jsonMode) {
		await outputJson({
			success: true,
			command: "plan list",
			plans: filtered,
			count: filtered.length,
		});
		return;
	}

	if (filtered.length === 0) {
		console.log(muted("No plans match."));
		return;
	}
	const nameWidth = 40;
	for (const p of filtered) {
		const outcome = p.outcome ? muted(` (${p.outcome})`) : "";
		const namePart = p.name
			? `  ${truncateName(p.name, nameWidth)}`
			: `  ${muted("(unnamed)".padEnd(nameWidth))}`;
		console.log(
			`${accent.bold(p.id)}  ${muted(p.status)}  rev ${p.revision}${namePart}  ${muted(p.template)}  ${muted(`seed=${p.seed}`)}  ${muted(`children=${p.children.length}`)}${outcome}  ${muted(p.createdAt)}`,
		);
	}
}

function truncateName(value: string, width: number): string {
	if (value.length <= width) return value.padEnd(width);
	return `${value.slice(0, Math.max(0, width - 1))}…`;
}

const VALID_OUTCOMES = new Set(["success", "partial", "failure"]);

async function runOutcome(
	idArg: string,
	result: string,
	note: string | undefined,
	jsonMode: boolean,
): Promise<void> {
	if (!VALID_OUTCOMES.has(result)) {
		throw new Error(`--result must be one of: ${[...VALID_OUTCOMES].join(", ")} (got: ${result})`);
	}
	const dir = await findSeedsDir();
	const planId = await resolvePlanIdArg(idArg, dir);
	let updatedPlan: Plan | null = null;
	let openChildren = 0;
	await withLock(plansPath(dir), async () => {
		await withLock(issuesPath(dir), async () => {
			const plans = await readPlans(dir);
			const idx = plans.findIndex((p) => p.id === planId);
			const plan = plans[idx];
			if (!plan) {
				throw new Error(`Plan not found: ${planId}. Run 'sd plan list' to see available plans.`);
			}
			const issues = await readIssues(dir);
			openChildren = plan.children.filter((cid) => {
				const issue = issues.find((i) => i.id === cid);
				return issue && issue.status !== "closed";
			}).length;
			const next: Plan = {
				...plan,
				outcome: result as Plan["outcome"],
				updatedAt: new Date().toISOString(),
			};
			if (note !== undefined) next.outcomeNote = note;
			plans[idx] = next;
			await writePlans(dir, plans);
			updatedPlan = next;
		});
	});

	if (!updatedPlan) return; // unreachable; throw above
	const finalPlan: Plan = updatedPlan;

	// PLAN_SPEC.md:431 — open children → warning, not error.
	if (openChildren > 0) {
		process.stderr.write(
			`⚠ plan ${finalPlan.id} has ${openChildren} open child${openChildren === 1 ? "" : "ren"}\n`,
		);
	}

	if (jsonMode) {
		await outputJson({
			success: true,
			command: "plan outcome",
			plan_id: finalPlan.id,
			outcome: finalPlan.outcome,
			outcomeNote: finalPlan.outcomeNote,
			open_children: openChildren,
		});
		return;
	}
	const noteSuffix = finalPlan.outcomeNote ? ` — ${finalPlan.outcomeNote}` : "";
	printSuccess(`plan ${accent(finalPlan.id)} outcome recorded: ${finalPlan.outcome}${noteSuffix}`);
}

interface CreateOptions {
	name?: string;
	template?: string;
	jsonMode: boolean;
}

// sd plan create <seed-id> (seeds-3dd1). First-class adopt-only plan: writes a
// plan row with zero spawned children and an empty steps blueprint, intended to
// be populated via `sd plan adopt`. This removes the placeholder-step dance
// (submit 2 throwaway steps → release → close) the release-train use case
// previously required. Link contract mirrors submit's fresh path: the parent
// seed's plan_id is set so `sd plan show <seed>`/adopt resolve seed → plan.
// No children means no blockedBy edges yet — those land as seeds are adopted.
// Lock order matches submit/adopt: outer plans, inner issues (mx-f29e43).
async function runCreate(seedId: string, opts: CreateOptions): Promise<void> {
	const dir = await findSeedsDir();
	const templates = await loadPlanTemplates(dir);
	const explicitName = normalizePlanName(opts.name);

	let createdPlanId = "";
	let templateName = "";
	let aborted = false;

	await withLock(plansPath(dir), async () => {
		await withLock(issuesPath(dir), async () => {
			const allIssues = await readIssues(dir);
			const allPlans = await readPlans(dir);

			const seedIdx = allIssues.findIndex((i) => i.id === seedId);
			const seed = allIssues[seedIdx];
			if (!seed) throw new Error(`Seed not found: ${seedId}`);

			templateName = opts.template ?? defaultTemplateForType(seed.type);
			if (!templates[templateName]) {
				const available = Object.keys(templates).join(", ");
				throw new Error(`Unknown template: ${templateName}. Available: ${available}`);
			}

			const existingPlan = allPlans.find((p) => p.seed === seedId && p.status !== "draft");
			if (existingPlan) {
				process.stderr.write(
					`✗ plan ${existingPlan.id} already exists for ${seedId} (status: ${existingPlan.status}, revision: ${existingPlan.revision})\n  Adopt seeds into it with 'sd plan adopt ${existingPlan.id} <seed-ids...>'.\n`,
				);
				process.exitCode = 1;
				aborted = true;
				return;
			}

			const planIds = new Set(allPlans.map((p) => p.id));
			const planId = generateId("pl", planIds);
			const now = new Date().toISOString();
			const resolvedName = explicitName ?? normalizePlanName(seed.title);

			const plan: Plan = {
				id: planId,
				seed: seedId,
				template: templateName,
				status: "approved",
				revision: 1,
				sections: { steps: [] },
				children: [],
				createdAt: now,
				updatedAt: now,
			};
			if (resolvedName) plan.name = resolvedName;

			allIssues[seedIdx] = { ...seed, plan_id: planId, updatedAt: now };
			await writeIssues(dir, allIssues);

			const draftIdx = allPlans.findIndex((p) => p.seed === seedId && p.status === "draft");
			if (draftIdx >= 0) {
				allPlans[draftIdx] = plan;
				await writePlans(dir, allPlans);
			} else {
				await appendPlan(dir, plan);
			}

			createdPlanId = planId;
		});
	});

	if (aborted) return;

	if (opts.jsonMode) {
		await outputJson({
			success: true,
			command: "plan create",
			plan_id: createdPlanId,
			parent_seed: seedId,
			template: templateName,
			children: [],
		});
		return;
	}
	printSuccess(`plan ${accent(createdPlanId)} created (status: approved, adopt-only)`);
	process.stderr.write(
		`\nNext:\n  sd plan adopt ${createdPlanId} <seed-ids...>   # populate children in order\n  sd plan reorder ${createdPlanId} <seed-ids...> # set the exact children order\n`,
	);
}

interface AdoptOptions {
	step?: string;
	at?: string;
	before?: string;
	after?: string;
	jsonMode: boolean;
}

// Positioning for `sd plan adopt`: at most one of --at/--before/--after may be
// given. --at is a 1-based slot in the resulting children array; --before /
// --after anchor on an existing child id. Returns a discriminated spec the
// in-lock resolver translates into a 0-based insertion index once the live
// children array is known. Default (none given) appends.
type AdoptPosition =
	| { kind: "append" }
	| { kind: "at"; index: number }
	| { kind: "before"; anchor: string }
	| { kind: "after"; anchor: string };

function parseAdoptPosition(opts: AdoptOptions): AdoptPosition {
	const provided = [
		opts.at !== undefined ? "--at" : null,
		opts.before !== undefined ? "--before" : null,
		opts.after !== undefined ? "--after" : null,
	].filter((x): x is string => x !== null);
	if (provided.length > 1) {
		throw new Error(
			`--at, --before, and --after are mutually exclusive (got: ${provided.join(", ")}).`,
		);
	}
	if (opts.at !== undefined) {
		const n = Number.parseInt(opts.at, 10);
		if (!Number.isInteger(n) || String(n) !== opts.at.trim() || n < 1) {
			throw new Error(`--at must be a positive integer (got: ${opts.at}).`);
		}
		return { kind: "at", index: n - 1 };
	}
	if (opts.before !== undefined) {
		if (opts.before.trim().length === 0) throw new Error("--before requires a seed id.");
		return { kind: "before", anchor: opts.before };
	}
	if (opts.after !== undefined) {
		if (opts.after.trim().length === 0) throw new Error("--after requires a seed id.");
		return { kind: "after", anchor: opts.after };
	}
	return { kind: "append" };
}

// Translate an AdoptPosition into a 0-based insertion index against the live
// children array. Throws (aborting before writes) when --at is out of range or
// a --before/--after anchor is not a current child.
function resolveInsertIndex(position: AdoptPosition, children: string[], planId: string): number {
	switch (position.kind) {
		case "append":
			return children.length;
		case "at":
			if (position.index > children.length) {
				throw new Error(
					`--at ${position.index + 1} is out of range (plan ${planId} has ${children.length} child${children.length === 1 ? "" : "ren"}; valid range 1..${children.length + 1}).`,
				);
			}
			return position.index;
		case "before": {
			const idx = children.indexOf(position.anchor);
			if (idx < 0) {
				throw new Error(`--before ${position.anchor} is not a child of plan ${planId}.`);
			}
			return idx;
		}
		case "after": {
			const idx = children.indexOf(position.anchor);
			if (idx < 0) {
				throw new Error(`--after ${position.anchor} is not a child of plan ${planId}.`);
			}
			return idx + 1;
		}
	}
}

// sd plan adopt <plan-id> <seed-ids...> [--step <i>] (seeds-2b93 / pl-43ff step 4).
// Post-submit adoption: link existing open seeds into an active plan without
// spawning fresh children. Adoption is link-only — status, type, priority,
// assignee, labels stay with the seed; we only set plan_id (+ optionally
// plan_step_index when --step is given), prepend the seeds:plan-backref block,
// wire the seed.blocks/parent.blockedBy edges, append to plan.children, and
// bump plan.revision. Validation runs in a single pre-write pass so an invalid
// candidate leaves issues + plans untouched. Lock order matches submit:
// outer plans, inner issues (mx-f29e43).
async function runAdopt(planIdArg: string, seedIds: string[], opts: AdoptOptions): Promise<void> {
	const dir = await findSeedsDir();
	const planId = await resolvePlanIdArg(planIdArg, dir);

	if (seedIds.length === 0) {
		throw new Error("At least one seed id is required.");
	}
	const dupes = findDuplicates(seedIds);
	if (dupes.length > 0) {
		throw new Error(
			`Duplicate seed id${dupes.length === 1 ? "" : "s"} in args: ${dupes.join(", ")}.`,
		);
	}

	const stepIndex = parseStepFlag(opts.step);
	const position = parseAdoptPosition(opts);

	let finalPlan: Plan | null = null;
	let adoptedIds: string[] = [];

	await withLock(plansPath(dir), async () => {
		await withLock(issuesPath(dir), async () => {
			const allIssues = await readIssues(dir);
			const allPlans = await readPlans(dir);

			const planIdx = allPlans.findIndex((p) => p.id === planId);
			const plan = allPlans[planIdx];
			if (!plan) {
				throw new Error(`Plan not found: ${planId}. Run 'sd plan list' to see available plans.`);
			}

			// --step (when given) must be in-range against the blueprint, so a
			// typo at the CLI is caught instead of silently writing a dangling
			// plan_step_index.
			if (stepIndex !== undefined) {
				const blueprintSteps = countBlueprintSteps(plan);
				if (stepIndex < 0 || stepIndex >= blueprintSteps) {
					throw new Error(
						`--step ${stepIndex + 1} is out of range (plan ${planId} has ${blueprintSteps} step${blueprintSteps === 1 ? "" : "s"}).`,
					);
				}
			}

			const parentIdx = allIssues.findIndex((i) => i.id === plan.seed);
			const parentSeed = allIssues[parentIdx];
			if (!parentSeed) {
				throw new Error(
					`Plan ${planId} references parent seed ${plan.seed} which no longer exists.`,
				);
			}

			// Resolve every candidate first; any failure aborts before writes.
			interface Resolved {
				seedId: string;
				idx: number;
			}
			const resolved: Resolved[] = [];
			for (const seedId of seedIds) {
				if (seedId === plan.seed) {
					throw new Error(`cannot adopt the parent seed ${seedId} into its own plan ${planId}.`);
				}
				const idx = allIssues.findIndex((i) => i.id === seedId);
				const seed = allIssues[idx];
				if (!seed) {
					throw new Error(`seed ${seedId} not found.`);
				}
				if (seed.status === "closed") {
					throw new Error(
						`seed ${seedId} is closed; only open or in-progress seeds can be adopted.`,
					);
				}
				if (seed.plan_id) {
					throw new Error(
						`seed ${seedId} is already attached to plan ${seed.plan_id}; release it first.`,
					);
				}
				resolved.push({ seedId, idx });
			}

			const now = new Date().toISOString();
			const templateName = plan.template;
			const approach = (plan.sections as { approach?: unknown }).approach;

			// When the operator pins these adoptions to a specific blueprint
			// step (--step <i>), pick up any labels declared on that step so
			// post-submit adoption ends up label-equivalent to submit-time
			// adoption (seeds-bac9 / pl-e5a8 step 3). No --step ⇒ no step ⇒
			// no labels to merge.
			let stepLabels: string[] | undefined;
			if (stepIndex !== undefined) {
				const blueprintSteps = (plan.sections as { steps?: SubmittedStep[] }).steps;
				stepLabels = blueprintSteps?.[stepIndex]?.labels;
			}

			// Apply all link mutations under the lock.
			for (const { idx } of resolved) {
				const seed = allIssues[idx];
				if (!seed) continue;
				const mergedLabels = mergeAdoptedLabels(seed.labels, stepLabels);
				const updated: Issue = {
					...seed,
					plan_id: planId,
					description: applyPlanBackref(seed.description, {
						stepIndex,
						planId,
						parentSeedId: parentSeed.id,
						parentSeedTitle: parentSeed.title,
						templateName,
						approach,
					}),
					blocks: appendUnique(seed.blocks, parentSeed.id),
					updatedAt: now,
				};
				if (stepIndex !== undefined) {
					updated.plan_step_index = stepIndex;
				}
				if (mergedLabels) updated.labels = mergedLabels;
				allIssues[idx] = updated;
			}

			// Parent seed: blockedBy gains each adopted child (deduped). The
			// parent's plan_id is already set on submit; we don't touch it.
			const updatedParentBlockedBy = [...(parentSeed.blockedBy ?? [])];
			for (const { seedId } of resolved) {
				if (!updatedParentBlockedBy.includes(seedId)) updatedParentBlockedBy.push(seedId);
			}
			allIssues[parentIdx] = {
				...parentSeed,
				blockedBy: updatedParentBlockedBy,
				updatedAt: now,
			};

			// Plan row: insert adopted ids into children at the resolved
			// position (default append), preserving command-line order. The
			// already-attached check above rejects re-adoption, so the candidate
			// ids are guaranteed absent from plan.children. Bump revision once
			// per command call.
			const insertAt = resolveInsertIndex(position, plan.children, plan.id);
			const insertedIds = resolved.map((r) => r.seedId);
			const nextChildren = [
				...plan.children.slice(0, insertAt),
				...insertedIds,
				...plan.children.slice(insertAt),
			];
			// seeds-a3ab: tag these ids on the plan so `sd plan show` renders
			// them with "(adopted)". Always non-empty here because runAdopt
			// requires at least one seed id.
			const nextAdopted = [...(plan.adoptedChildren ?? [])];
			for (const { seedId } of resolved) {
				if (!nextAdopted.includes(seedId)) nextAdopted.push(seedId);
			}
			const updatedPlan: Plan = {
				...plan,
				children: nextChildren,
				adoptedChildren: nextAdopted,
				revision: plan.revision + 1,
				updatedAt: now,
			};
			allPlans[planIdx] = updatedPlan;

			await writeIssues(dir, allIssues);
			await writePlans(dir, allPlans);

			finalPlan = updatedPlan;
			adoptedIds = resolved.map((r) => r.seedId);
		});
	});

	if (!finalPlan) return;
	const plan: Plan = finalPlan;

	if (opts.jsonMode) {
		await outputJson({
			success: true,
			command: "plan adopt",
			plan_id: plan.id,
			adopted: adoptedIds,
			revision: plan.revision,
		});
		return;
	}
	for (const id of adoptedIds) {
		printSuccess(`${accent(id)} adopted into plan ${accent(plan.id)}`);
	}
	printSuccess(`plan ${accent(plan.id)} revision bumped to ${plan.revision}`);
}

interface ReleaseOptions {
	jsonMode: boolean;
}

// sd plan release <plan-id> <seed-ids...> (seeds-2b8a / pl-43ff step 5).
// Inverse of runAdopt: detach seeds from a plan without closing them. Each
// candidate must currently be attached to the named plan (seed.plan_id ===
// planId). Mutation per seed: strip the seeds:plan-backref block, clear
// plan_id + plan_step_index, drop parent.id from seed.blocks; on the parent,
// drop seed.id from blockedBy. The plan row drops seed.id from children and
// bumps revision once per command call. Validation runs in a single pre-write
// pass so an invalid candidate leaves issues + plans untouched. Lock order
// matches submit/adopt: outer plans, inner issues (mx-f29e43).
async function runRelease(
	planIdArg: string,
	seedIds: string[],
	opts: ReleaseOptions,
): Promise<void> {
	const dir = await findSeedsDir();
	const planId = await resolvePlanIdArg(planIdArg, dir);

	if (seedIds.length === 0) {
		throw new Error("At least one seed id is required.");
	}
	const dupes = findDuplicates(seedIds);
	if (dupes.length > 0) {
		throw new Error(
			`Duplicate seed id${dupes.length === 1 ? "" : "s"} in args: ${dupes.join(", ")}.`,
		);
	}

	let finalPlan: Plan | null = null;
	let releasedIds: string[] = [];

	await withLock(plansPath(dir), async () => {
		await withLock(issuesPath(dir), async () => {
			const allIssues = await readIssues(dir);
			const allPlans = await readPlans(dir);

			const planIdx = allPlans.findIndex((p) => p.id === planId);
			const plan = allPlans[planIdx];
			if (!plan) {
				throw new Error(`Plan not found: ${planId}. Run 'sd plan list' to see available plans.`);
			}

			const parentIdx = allIssues.findIndex((i) => i.id === plan.seed);
			const parentSeed = allIssues[parentIdx];
			if (!parentSeed) {
				throw new Error(
					`Plan ${planId} references parent seed ${plan.seed} which no longer exists.`,
				);
			}

			// Resolve every candidate first; any failure aborts before writes.
			interface Resolved {
				seedId: string;
				idx: number;
			}
			const resolved: Resolved[] = [];
			for (const seedId of seedIds) {
				if (seedId === plan.seed) {
					throw new Error(`cannot release the parent seed ${seedId} from its own plan ${planId}.`);
				}
				const idx = allIssues.findIndex((i) => i.id === seedId);
				const seed = allIssues[idx];
				if (!seed) {
					throw new Error(`seed ${seedId} not found.`);
				}
				if (seed.plan_id !== planId) {
					if (seed.plan_id) {
						throw new Error(`seed ${seedId} is attached to plan ${seed.plan_id}, not ${planId}.`);
					}
					throw new Error(`seed ${seedId} is not attached to plan ${planId}.`);
				}
				resolved.push({ seedId, idx });
			}

			const now = new Date().toISOString();

			// Apply all unlink mutations under the lock. plan_id and plan_step_index
			// are set to undefined so JSON.stringify drops them from the row
			// (matches the closedAt-on-reopen convention, mx-8b2e32).
			for (const { idx } of resolved) {
				const seed = allIssues[idx];
				if (!seed) continue;
				const updated: Issue = {
					...seed,
					plan_id: undefined,
					plan_step_index: undefined,
					description: stripPlanBackref(seed.description),
					blocks: removeValue(seed.blocks, parentSeed.id),
					updatedAt: now,
				};
				allIssues[idx] = updated;
			}

			// Parent seed: drop each released child from blockedBy.
			const releasedSet = new Set(resolved.map((r) => r.seedId));
			const nextParentBlockedBy = (parentSeed.blockedBy ?? []).filter((id) => !releasedSet.has(id));
			allIssues[parentIdx] = {
				...parentSeed,
				blockedBy: nextParentBlockedBy,
				updatedAt: now,
			};

			// Plan row: drop released ids from children, bump revision once per
			// command call.
			const nextChildren = plan.children.filter((id) => !releasedSet.has(id));
			// seeds-a3ab: mirror children — released ids leave adoptedChildren
			// too. Drop the field when it becomes empty so JSONL diffs stay
			// minimal for plans that never used adoption.
			const nextAdopted = (plan.adoptedChildren ?? []).filter((id) => !releasedSet.has(id));
			const updatedPlan: Plan = {
				...plan,
				children: nextChildren,
				revision: plan.revision + 1,
				updatedAt: now,
			};
			if (nextAdopted.length > 0) {
				updatedPlan.adoptedChildren = nextAdopted;
			} else {
				delete updatedPlan.adoptedChildren;
			}
			allPlans[planIdx] = updatedPlan;

			await writeIssues(dir, allIssues);
			await writePlans(dir, allPlans);

			finalPlan = updatedPlan;
			releasedIds = resolved.map((r) => r.seedId);
		});
	});

	if (!finalPlan) return;
	const plan: Plan = finalPlan;

	if (opts.jsonMode) {
		await outputJson({
			success: true,
			command: "plan release",
			plan_id: plan.id,
			released: releasedIds,
			revision: plan.revision,
		});
		return;
	}
	for (const id of releasedIds) {
		printSuccess(`${accent(id)} released from plan ${accent(plan.id)}`);
	}
	printSuccess(`plan ${accent(plan.id)} revision bumped to ${plan.revision}`);
}

interface ReorderOptions {
	jsonMode: boolean;
}

// sd plan reorder <plan-id> <seed-ids...> (seeds-3dd1). Set the exact order of
// plan.children in one call. The provided ids must be a permutation of the
// current children (same set, no missing, no extra, no dupes) — reorder is a
// pure ordering operation, never an add/remove (use adopt/release for that).
// warren's plan-run consumes plan.children order verbatim (seq = index + 1), so
// this is the surface for pinning a release seed last. Link state on the seeds
// (plan_id, plan_step_index, blockedBy edges) is untouched; only the plan row's
// children array order changes. Bumps revision once per call. Lock: plans only
// — no issue mutation.
async function runReorder(
	planIdArg: string,
	seedIds: string[],
	opts: ReorderOptions,
): Promise<void> {
	const dir = await findSeedsDir();
	const planId = await resolvePlanIdArg(planIdArg, dir);

	if (seedIds.length === 0) {
		throw new Error("At least one seed id is required.");
	}
	const dupes = findDuplicates(seedIds);
	if (dupes.length > 0) {
		throw new Error(
			`Duplicate seed id${dupes.length === 1 ? "" : "s"} in args: ${dupes.join(", ")}.`,
		);
	}

	let finalPlan: Plan | null = null;

	await withLock(plansPath(dir), async () => {
		const allPlans = await readPlans(dir);
		const planIdx = allPlans.findIndex((p) => p.id === planId);
		const plan = allPlans[planIdx];
		if (!plan) {
			throw new Error(`Plan not found: ${planId}. Run 'sd plan list' to see available plans.`);
		}

		const current = new Set(plan.children);
		const provided = new Set(seedIds);
		const missing = plan.children.filter((id) => !provided.has(id));
		const extra = seedIds.filter((id) => !current.has(id));
		if (extra.length > 0) {
			throw new Error(
				`${extra.join(", ")} ${extra.length === 1 ? "is" : "are"} not ${extra.length === 1 ? "a child" : "children"} of plan ${planId}. Adopt first with 'sd plan adopt'.`,
			);
		}
		if (missing.length > 0) {
			throw new Error(
				`reorder must list every child exactly once; missing: ${missing.join(", ")}. Use 'sd plan release' to drop a child.`,
			);
		}

		const now = new Date().toISOString();
		const updatedPlan: Plan = {
			...plan,
			children: [...seedIds],
			revision: plan.revision + 1,
			updatedAt: now,
		};
		allPlans[planIdx] = updatedPlan;
		await writePlans(dir, allPlans);
		finalPlan = updatedPlan;
	});

	if (!finalPlan) return;
	const plan: Plan = finalPlan;

	if (opts.jsonMode) {
		await outputJson({
			success: true,
			command: "plan reorder",
			plan_id: plan.id,
			children: plan.children,
			revision: plan.revision,
		});
		return;
	}
	printSuccess(`plan ${accent(plan.id)} children reordered (revision ${plan.revision})`);
	printSuccess(`order: ${plan.children.map((id) => accent(id)).join(", ")}`);
}

// removeValue: inverse of appendUnique. Returns undefined when the resulting
// array is empty so the field gets dropped from the serialized issue.
function removeValue(list: string[] | undefined, id: string): string[] | undefined {
	if (!list || list.length === 0) return list;
	const next = list.filter((x) => x !== id);
	if (next.length === list.length) return list;
	return next.length === 0 ? undefined : next;
}

function findDuplicates(ids: string[]): string[] {
	const seen = new Set<string>();
	const dupes = new Set<string>();
	for (const id of ids) {
		if (seen.has(id)) dupes.add(id);
		seen.add(id);
	}
	return [...dupes];
}

// --step is 1-based on the CLI (mx-cf60e9) and stored 0-based internally.
function parseStepFlag(raw: string | undefined): number | undefined {
	if (raw === undefined) return undefined;
	const n = Number.parseInt(raw, 10);
	if (!Number.isInteger(n) || String(n) !== raw.trim() || n < 1) {
		throw new Error(`--step must be a positive integer (got: ${raw}).`);
	}
	return n - 1;
}

function countBlueprintSteps(plan: Plan): number {
	const steps = (plan.sections as { steps?: unknown }).steps;
	return Array.isArray(steps) ? steps.length : 0;
}

interface EditOptions {
	name?: string;
	section?: string[];
	step?: string;
	stepTitle?: string;
	stepPriority?: string;
	stepType?: string;
	jsonMode: boolean;
}

// Parse `--priority` for step edits. Mirrors update.ts: accepts P0..P4 or 0..4.
function parseStepPriority(raw: string): number {
	const s = raw.trim();
	const n = s.toUpperCase().startsWith("P")
		? Number.parseInt(s.slice(1), 10)
		: Number.parseInt(s, 10);
	if (!Number.isInteger(n) || n < 0 || n > 4) {
		throw new Error(`--priority must be 0-4 or P0-P4 (got: ${raw}).`);
	}
	return n;
}

interface StepPatch {
	index: number; // 0-based
	title?: string;
	priority?: number;
	type?: Issue["type"];
}

// Validate and parse the --step / --title / --priority / --type combination.
// Returns undefined when --step is absent (and the title/priority/type flags
// must also be absent in that case — they only make sense with --step).
function parseStepPatch(opts: EditOptions): StepPatch | undefined {
	const stepProvided = opts.step !== undefined;
	const stepTitleProvided = opts.stepTitle !== undefined;
	const stepPriorityProvided = opts.stepPriority !== undefined;
	const stepTypeProvided = opts.stepType !== undefined;
	const anyMetaProvided = stepTitleProvided || stepPriorityProvided || stepTypeProvided;
	if (!stepProvided) {
		if (anyMetaProvided) {
			throw new Error("--title/--priority/--type require --step <i> (the step index to edit).");
		}
		return undefined;
	}
	const index = parseStepFlag(opts.step);
	if (index === undefined) {
		throw new Error("--step requires a value (1-based step index).");
	}
	if (!anyMetaProvided) {
		throw new Error("--step requires at least one of --title, --priority, --type.");
	}
	const patch: StepPatch = { index };
	if (stepTitleProvided) {
		const t = (opts.stepTitle ?? "").trim();
		if (t.length === 0) throw new Error("--title must be a non-empty string.");
		patch.title = t;
	}
	if (stepPriorityProvided && opts.stepPriority !== undefined) {
		patch.priority = parseStepPriority(opts.stepPriority);
	}
	if (stepTypeProvided && opts.stepType !== undefined) {
		const t = opts.stepType;
		if (!(VALID_TYPES as readonly string[]).includes(t)) {
			throw new Error(`--type must be one of: ${VALID_TYPES.join(", ")}`);
		}
		patch.type = t as Issue["type"];
	}
	return patch;
}

// Parse `--section <name> <text>` variadic capture into (name, text). The
// commander option type is `<name-and-text...>` so users MUST shell-quote the
// text (otherwise additional words spill into the array and we error rather
// than silently joining — agents wrapping seeds rely on explicit failure).
function parseSectionFlag(raw: string[] | undefined): { name: string; text: string } | undefined {
	if (raw === undefined) return undefined;
	if (raw.length < 2) {
		throw new Error("--section requires two arguments: --section <name> <text> (quote the text).");
	}
	if (raw.length > 2) {
		throw new Error(
			'--section received more than two arguments. Quote the text: --section <name> "<text>".',
		);
	}
	const name = raw[0];
	const text = raw[1];
	if (!name || name.trim().length === 0) {
		throw new Error("--section name must be a non-empty string.");
	}
	return { name, text: text ?? "" };
}

// sd plan edit <id> (pl-dee8). In-place plan field editing. V1 supports --name,
// --section (text sections only), and --step <i> --title/--priority/--type
// (step metadata; propagates to the child seed at plan_step_index=i-1).
// Mutation always bumps revision + updatedAt, even when no fields actually
// changed from prior values — the revision bump is the contract, callers rely
// on it for cache invalidation.
//
// Lock order: outer plans, inner issues (mx-f29e43). Issues lock is only
// acquired when --section approach changes (children backref refresh) or when
// --step propagates title/priority/type to a child seed.
async function runEdit(idArg: string, opts: EditOptions): Promise<void> {
	const dir = await findSeedsDir();
	const planId = await resolvePlanIdArg(idArg, dir);

	const section = parseSectionFlag(opts.section);
	const stepPatch = parseStepPatch(opts);

	const editedFields: string[] = [];
	if (opts.name !== undefined) editedFields.push("name");
	if (section !== undefined) editedFields.push(`section:${section.name}`);
	if (stepPatch !== undefined) {
		const oneBased = stepPatch.index + 1;
		if (stepPatch.title !== undefined) editedFields.push(`step:${oneBased}:title`);
		if (stepPatch.priority !== undefined) editedFields.push(`step:${oneBased}:priority`);
		if (stepPatch.type !== undefined) editedFields.push(`step:${oneBased}:type`);
	}
	if (editedFields.length === 0) {
		throw new Error(
			"No fields to edit. Pass at least one of: --name <text>, --section <name> <text>, --step <i> --title/--priority/--type.",
		);
	}

	let nextName: string | undefined;
	if (opts.name !== undefined) {
		nextName = normalizePlanName(opts.name);
		if (!nextName) {
			throw new Error("--name must be a non-empty string.");
		}
	}

	let updatedPlan: Plan | null = null;
	let approachChanged = false;
	const propagatedChildren: string[] = [];
	await withLock(plansPath(dir), async () => {
		const plans = await readPlans(dir);
		const idx = plans.findIndex((p) => p.id === planId);
		const plan = plans[idx];
		if (!plan) {
			throw new Error(`Plan not found: ${planId}. Run 'sd plan list' to see available plans.`);
		}

		let nextSections = plan.sections;
		if (section !== undefined) {
			const templates = await loadPlanTemplates(dir);
			const template = templates[plan.template];
			if (!template) {
				const available = Object.keys(templates).join(", ");
				throw new Error(
					`Plan ${planId} references unknown template '${plan.template}'. Available: ${available}.`,
				);
			}
			const spec = template.sections[section.name];
			if (!spec) {
				const known = Object.keys(template.sections).join(", ");
				throw new Error(
					`Unknown section '${section.name}' for template '${plan.template}'. Known: ${known}.`,
				);
			}
			if (spec.kind !== "text") {
				throw new Error(
					`--section editing supports kind=text only (V1). Section '${section.name}' is kind=${typeof spec.kind === "string" ? spec.kind : "object"}. Use 'sd plan submit --overwrite' for structural edits.`,
				);
			}
			const minLength = spec.min_length ?? 0;
			if (spec.required && section.text.trim().length === 0) {
				throw new Error(`Section '${section.name}' is required and cannot be empty.`);
			}
			if (minLength > 0 && section.text.length < minLength) {
				throw new Error(
					`Section '${section.name}' must be at least ${minLength} characters (got ${section.text.length}).`,
				);
			}
			const prior = (plan.sections as Record<string, unknown>)[section.name];
			nextSections = { ...plan.sections, [section.name]: section.text };
			if (section.name === "approach" && prior !== section.text) {
				approachChanged = true;
			}
		}

		if (stepPatch !== undefined) {
			const rawSteps = (nextSections as { steps?: unknown }).steps;
			if (!Array.isArray(rawSteps)) {
				throw new Error(
					`Plan ${planId} has no steps section to edit. Use 'sd plan submit --overwrite' to add steps.`,
				);
			}
			const total = rawSteps.length;
			if (stepPatch.index < 0 || stepPatch.index >= total) {
				throw new Error(
					`--step ${stepPatch.index + 1} is out of range (plan ${planId} has ${total} step${total === 1 ? "" : "s"}).`,
				);
			}
			const existing = rawSteps[stepPatch.index];
			const existingObj =
				existing && typeof existing === "object" && !Array.isArray(existing)
					? (existing as Record<string, unknown>)
					: {};
			const nextStep: Record<string, unknown> = { ...existingObj };
			if (stepPatch.title !== undefined) nextStep.title = stepPatch.title;
			if (stepPatch.priority !== undefined) nextStep.priority = stepPatch.priority;
			if (stepPatch.type !== undefined) nextStep.type = stepPatch.type;
			const nextSteps = rawSteps.slice();
			nextSteps[stepPatch.index] = nextStep;
			nextSections = { ...nextSections, steps: nextSteps };
		}

		const now = new Date().toISOString();
		const next: Plan = {
			...plan,
			sections: nextSections,
			revision: plan.revision + 1,
			updatedAt: now,
		};
		if (nextName !== undefined) next.name = nextName;
		plans[idx] = next;
		await writePlans(dir, plans);
		updatedPlan = next;

		// Refresh backref on every child seed when approach text changes (plan
		// children are ordered to align with sections.steps — children[i] is the
		// seed for step i; loose adoptions hit the stepIndex=undefined branch in
		// applyPlanBackref) and/or propagate --step metadata to the child(ren)
		// whose plan_step_index matches. Both happen under a single issues lock
		// so combined edits remain atomic.
		if (approachChanged || stepPatch !== undefined) {
			await withLock(issuesPath(dir), async () => {
				const allIssues = await readIssues(dir);
				const parentIdx = allIssues.findIndex((iss) => iss.id === next.seed);
				const parent = allIssues[parentIdx];
				const approach = (next.sections as { approach?: unknown }).approach;
				let dirty = false;
				if (approachChanged && parent) {
					for (const childId of next.children) {
						const cIdx = allIssues.findIndex((iss) => iss.id === childId);
						const child = allIssues[cIdx];
						if (!child) continue;
						const stepIndex = child.plan_step_index;
						allIssues[cIdx] = {
							...child,
							description: applyPlanBackref(child.description, {
								stepIndex,
								planId: next.id,
								parentSeedId: parent.id,
								parentSeedTitle: parent.title,
								templateName: next.template,
								approach,
							}),
							updatedAt: now,
						};
						dirty = true;
					}
				}
				if (stepPatch !== undefined) {
					// Match every child that carries plan_step_index === stepPatch.index.
					// Multiple matches are legal (adoption via `sd plan adopt --step`
					// stamps the same index on extra seeds); propagate to all of them.
					for (let i = 0; i < allIssues.length; i++) {
						const child = allIssues[i];
						if (!child) continue;
						if (!next.children.includes(child.id)) continue;
						if (child.plan_step_index !== stepPatch.index) continue;
						const updates: Partial<Issue> = { updatedAt: now };
						if (stepPatch.title !== undefined) updates.title = stepPatch.title;
						if (stepPatch.priority !== undefined) updates.priority = stepPatch.priority;
						if (stepPatch.type !== undefined) updates.type = stepPatch.type;
						allIssues[i] = { ...child, ...updates };
						propagatedChildren.push(child.id);
						dirty = true;
					}
				}
				if (dirty) await writeIssues(dir, allIssues);
			});
		}
	});

	if (!updatedPlan) return;
	const finalPlan: Plan = updatedPlan;

	if (opts.jsonMode) {
		await outputJson({
			success: true,
			command: "plan edit",
			plan_id: finalPlan.id,
			revision: finalPlan.revision,
			edited: editedFields,
			name: finalPlan.name,
			backrefs_refreshed: approachChanged ? finalPlan.children.length : 0,
			propagated_children: propagatedChildren,
		});
		return;
	}
	printSuccess(
		`plan ${accent(finalPlan.id)} edited (${editedFields.join(", ")}); revision ${finalPlan.revision}`,
	);
	if (approachChanged) {
		printSuccess(`refreshed backrefs on ${finalPlan.children.length} child seed(s)`);
	}
	if (propagatedChildren.length > 0) {
		printSuccess(
			`propagated step metadata to ${propagatedChildren.length} child seed(s): ${propagatedChildren.join(", ")}`,
		);
	}
}

async function runReview(idArg: string, by: string, jsonMode: boolean): Promise<void> {
	const dir = await findSeedsDir();
	const planId = await resolvePlanIdArg(idArg, dir);
	let updatedPlan: Plan | null = null;
	await withLock(plansPath(dir), async () => {
		const plans = await readPlans(dir);
		const idx = plans.findIndex((p) => p.id === planId);
		const plan = plans[idx];
		if (!plan) {
			throw new Error(`Plan not found: ${planId}. Run 'sd plan list' to see available plans.`);
		}
		const next: Plan = { ...plan, reviewedBy: by, updatedAt: new Date().toISOString() };
		plans[idx] = next;
		await writePlans(dir, plans);
		updatedPlan = next;
	});

	if (!updatedPlan) return;
	const finalPlan: Plan = updatedPlan;

	if (jsonMode) {
		await outputJson({
			success: true,
			command: "plan review",
			plan_id: finalPlan.id,
			reviewedBy: finalPlan.reviewedBy,
		});
		return;
	}
	printSuccess(`plan ${accent(finalPlan.id)} reviewed by ${finalPlan.reviewedBy}`);
}

async function runValidate(idArg: string, jsonMode: boolean): Promise<void> {
	const dir = await findSeedsDir();
	const planId = await resolvePlanIdArg(idArg, dir);
	const plans = await readPlans(dir);
	const plan = plans.find((p) => p.id === planId);
	if (!plan) {
		throw new Error(`Plan not found: ${planId}. Run 'sd plan list' to see available plans.`);
	}
	const templates = await loadPlanTemplates(dir);
	const template = templates[plan.template];
	if (!template) {
		const available = Object.keys(templates).join(", ");
		throw new Error(
			`Plan ${planId} references unknown template '${plan.template}'. Available: ${available}.`,
		);
	}

	// Re-run the same validator submit uses so the partial-state diff shape stays
	// in sync (PLAN_SPEC.md:148-149 + 180-195).
	const validate = compilePlanTemplate(template);
	const subject = { template: plan.template, sections: plan.sections };
	const result = validate(subject);

	if (result.valid) {
		if (jsonMode) {
			await outputJson({ success: true, command: "plan validate", valid: true, plan_id: planId });
		} else {
			printSuccess(`plan ${accent(planId)} valid`);
		}
		return;
	}

	process.stderr.write(`${JSON.stringify(result.diff, null, 2)}\n`);
	process.exitCode = 1;
}

interface OutboundDecisionArgs {
	seed: Issue;
	planId: string;
	approach: unknown;
	domainOverride?: string;
	cwd: string;
}

async function runOutboundDecision(args: OutboundDecisionArgs): Promise<string | null> {
	const projectRoot = dirname(args.cwd);
	// Check ml availability first so the stderr warning distinguishes
	// "ml not installed" from "no domain matched" — the spec mandates the
	// former phrasing for the absent-ml branch (PLAN_SPEC.md:354-356).
	if (!Bun.which("ml", { PATH: process.env.PATH })) {
		process.stderr.write("⚠ --record-decision: ml not found on PATH; skipping\n");
		return null;
	}
	const { domain } = inferDomain({
		seed: args.seed,
		explicitDomain: args.domainOverride,
		cwd: projectRoot,
	});
	if (!domain) {
		process.stderr.write("⚠ --record-decision: no mulch domain inferred (skipping)\n");
		return null;
	}
	const approach = typeof args.approach === "string" ? args.approach : "";
	const result = recordDecision({
		domain,
		planId: args.planId,
		title: args.seed.title,
		approach,
		cwd: projectRoot,
	});
	if (!result.ok) {
		process.stderr.write(`⚠ --record-decision: ${result.reason ?? "failed"}\n`);
		return null;
	}
	return result.mulchId ?? null;
}
