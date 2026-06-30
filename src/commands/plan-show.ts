import { findSeedsDir, loadPlanTemplates, maxPlanDepth, readConfig } from "../config.ts";
import { accent, brand, muted, outputJson } from "../output.ts";
import { type ChildSummary, summarisePlanChildren } from "../plan-context.ts";
import { readIssues, readPlans } from "../store.ts";
import type { Issue, Plan, PlanTemplate, SectionSpec } from "../types.ts";

interface PlanTreeNode {
	plan: Plan;
	children: ChildSummary[];
	children_plans: PlanTreeEntry[];
}

interface PlanTreeTruncation {
	plan_id: string;
	truncated: true;
	hint: string;
}

type PlanTreeEntry = PlanTreeNode | PlanTreeTruncation;

function buildPlansBySeed(plans: Plan[]): Map<string, Plan> {
	const out = new Map<string, Plan>();
	for (const p of plans) {
		const existing = out.get(p.seed);
		if (!existing || existing.updatedAt < p.updatedAt) out.set(p.seed, p);
	}
	return out;
}

function truncationHint(planId: string): string {
	return `depth limit reached — use \`sd plan show ${planId}\` to drill in`;
}

// PLAN_SPEC.md:340, 425, 430 — recurse through nested plans up to max_plan_depth.
// Depth is 1-indexed: the root plan is at depth 1, nested plans start at 2.
function buildPlanTree(
	plan: Plan,
	issues: Issue[],
	plansBySeed: Map<string, Plan>,
	depth: number,
	maxDepth: number,
): PlanTreeNode {
	const childrenSummary = summarisePlanChildren(plan, issues);
	const childrenPlans: PlanTreeEntry[] = [];
	for (const childId of plan.children) {
		const sub = plansBySeed.get(childId);
		if (!sub) continue;
		const nextDepth = depth + 1;
		if (nextDepth > maxDepth) {
			childrenPlans.push({
				plan_id: sub.id,
				truncated: true,
				hint: truncationHint(sub.id),
			});
		} else {
			childrenPlans.push(buildPlanTree(sub, issues, plansBySeed, nextDepth, maxDepth));
		}
	}
	return { plan, children: childrenSummary, children_plans: childrenPlans };
}

function renderPlanSections(plan: Plan, template: PlanTemplate | undefined): void {
	console.log(brand("Sections:"));
	const order = ["context", "approach", "alternatives", "steps", "risks", "acceptance"];
	const knownKeys = new Set(order);
	const orderedKeys = [
		...order.filter((k) => k in plan.sections),
		...Object.keys(plan.sections).filter((k) => !knownKeys.has(k)),
	];
	for (const key of orderedKeys) {
		const value = plan.sections[key];
		const spec = template?.sections[key];
		console.log(`  ${accent.bold(key)}`);
		if (value === undefined || value === null) {
			console.log(muted("    (empty)"));
			continue;
		}
		if (typeof value === "string") {
			for (const line of value.split("\n")) console.log(`    ${line}`);
			continue;
		}
		if (Array.isArray(value)) {
			if (value.length === 0) {
				console.log(muted("    (none)"));
				continue;
			}
			renderListSection(value, spec);
			continue;
		}
		console.log(`    ${JSON.stringify(value)}`);
	}
}

function renderListSection(entries: unknown[], spec: SectionSpec | undefined): void {
	const kind = spec?.kind;
	const itemSpec = spec?.item;
	entries.forEach((entry, i) => {
		const marker = `    ${i + 1}.`;
		if (typeof entry === "string") {
			console.log(`${marker} ${entry}`);
			return;
		}
		if (kind === "steps" && isPlainRecord(entry)) {
			renderStepEntry(marker, entry);
			return;
		}
		if (kind === "list" && isPlainRecord(entry) && isItemSchema(itemSpec)) {
			renderListEntry(marker, entry, itemSpec);
			return;
		}
		console.log(`${marker} ${JSON.stringify(entry)}`);
	});
}

function renderStepEntry(marker: string, entry: Record<string, unknown>): void {
	// Adoption-only steps (existing_seed without title) used to fall through to
	// JSON.stringify; surface the existing_seed id as the headline instead so
	// the human render of an adopted step matches the rest of the list.
	const hasTitle = typeof entry.title === "string";
	const headline = hasTitle
		? (entry.title as string)
		: typeof entry.existing_seed === "string"
			? `(adopt ${entry.existing_seed})`
			: JSON.stringify(entry);
	console.log(`${marker} ${headline}`);
	const subIndent = " ".repeat(marker.length + 1);
	const blocks = entry.blocks;
	if (Array.isArray(blocks) && blocks.length > 0) {
		// blocks values are stored 1-based (seeds-185f), so render verbatim.
		const labels = blocks
			.map((b) => (typeof b === "number" ? String(b) : JSON.stringify(b)))
			.join(", ");
		console.log(`${subIndent}${muted(`blocks: ${labels}`)}`);
	}
	if (entry.requires_plan === true) {
		console.log(`${subIndent}${muted("requires_plan: true")}`);
	}
	if (typeof entry.plan_template === "string" && entry.plan_template.length > 0) {
		console.log(`${subIndent}${muted(`plan_template: ${entry.plan_template}`)}`);
	}
	// STEP_SCHEMA surfaces (seeds-5892): type, priority, labels, existing_seed
	// are first-class in --json but were previously dropped from the human
	// render. Emit each as a dim sub-line when present and non-empty.
	if (typeof entry.type === "string" && entry.type.length > 0) {
		console.log(`${subIndent}${muted(`type: ${entry.type}`)}`);
	}
	if (typeof entry.priority === "number") {
		console.log(`${subIndent}${muted(`priority: ${entry.priority}`)}`);
	}
	const stepLabels = entry.labels;
	if (Array.isArray(stepLabels) && stepLabels.length > 0) {
		const rendered = stepLabels
			.map((l) => (typeof l === "string" ? l : JSON.stringify(l)))
			.join(", ");
		console.log(`${subIndent}${muted(`labels: ${rendered}`)}`);
	}
	// When existing_seed is the headline we skip the sub-line to avoid the
	// redundant `(adopt seeds-xxxx)` + `existing_seed: seeds-xxxx` pair.
	if (hasTitle && typeof entry.existing_seed === "string" && entry.existing_seed.length > 0) {
		console.log(`${subIndent}${muted(`existing_seed: ${entry.existing_seed}`)}`);
	}
}

function renderListEntry(
	marker: string,
	entry: Record<string, unknown>,
	itemSpec: Record<string, SectionSpec>,
): void {
	const subIndent = " ".repeat(marker.length + 1);
	const fieldNames = Object.keys(itemSpec);
	let firstLineWritten = false;
	for (const field of fieldNames) {
		const fv = entry[field];
		if (fv === undefined || fv === null || fv === "") continue;
		const rendered = typeof fv === "string" ? fv : JSON.stringify(fv);
		if (!firstLineWritten) {
			console.log(`${marker} ${field}: ${rendered}`);
			firstLineWritten = true;
		} else {
			console.log(`${subIndent}${field}: ${rendered}`);
		}
	}
	if (!firstLineWritten) {
		console.log(`${marker} ${JSON.stringify(entry)}`);
	}
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isItemSchema(item: SectionSpec["item"]): item is Record<string, SectionSpec> {
	return typeof item === "object" && item !== null;
}

function renderNestedPlanHuman(entry: PlanTreeEntry, indent: string): void {
	if ("truncated" in entry) {
		console.log(`${indent}${muted(entry.hint)}`);
		return;
	}
	const { plan, children, children_plans } = entry;
	const nameLabel = plan.name ? `  ${plan.name}` : "";
	console.log(
		`${indent}${brand("Sub-plan:")} ${accent.bold(plan.id)}${nameLabel}  ${muted(`[${plan.status}]`)}  ${muted(`rev ${plan.revision}`)}  ${muted(`seed=${plan.seed}`)}`,
	);
	console.log(`${indent}${muted(`Children (${children.length}):`)}`);
	const childIndent = `${indent}  `;
	if (children.length === 0) {
		console.log(`${childIndent}${muted("(none)")}`);
	} else {
		for (const c of children) {
			const tag = c.adopted ? ` ${muted("(adopted)")}` : "";
			console.log(`${childIndent}${accent(c.id)}  ${muted(`[${c.status}]`)}  ${c.title}${tag}`);
		}
	}
	for (const sub of children_plans) {
		console.log("");
		renderNestedPlanHuman(sub, childIndent);
	}
}

// Accept either a plan id (pl-xxxx) or a seed id; seeds resolve through
// seed.plan_id (PLAN_SPEC contract: "the seed knows its plan"). The shared
// helper keeps show/validate/outcome/review consistent so an agent that has a
// seed id in hand never has to round-trip through `sd plan list` for the
// pl-xxxx token.
export async function resolvePlanIdArg(arg: string, dir: string): Promise<string> {
	if (arg.startsWith("pl-")) return arg;
	const issues = await readIssues(dir);
	const seed = issues.find((i) => i.id === arg);
	if (!seed) {
		throw new Error(`Plan not found: ${arg}. Run 'sd plan list' to see available plans.`);
	}
	if (!seed.plan_id) {
		throw new Error(
			`Seed ${arg} has no plan. Submit one with 'sd plan submit ${arg} --plan <file>'.`,
		);
	}
	return seed.plan_id;
}

export async function runShow(idArg: string, jsonMode: boolean): Promise<void> {
	const dir = await findSeedsDir();
	const planId = await resolvePlanIdArg(idArg, dir);
	const config = await readConfig(dir);
	const maxDepth = maxPlanDepth(config);
	const plans = await readPlans(dir);
	const plan = plans.find((p) => p.id === planId);
	if (!plan) {
		throw new Error(`Plan not found: ${planId}. Run 'sd plan list' to see available plans.`);
	}
	const issues = await readIssues(dir);
	const plansBySeed = buildPlansBySeed(plans);
	const tree = buildPlanTree(plan, issues, plansBySeed, 1, maxDepth);
	const templates = await loadPlanTemplates(dir);
	const template = templates[plan.template];

	if (jsonMode) {
		await outputJson({
			success: true,
			command: "plan show",
			plan,
			children: tree.children,
			children_plans: tree.children_plans,
		});
		return;
	}

	console.log(`${accent.bold(plan.id)}  ${brand(plan.status)}  ${muted(`rev ${plan.revision}`)}`);
	if (plan.name) console.log(`Name:     ${plan.name}`);
	console.log(`Seed:     ${accent(plan.seed)}`);
	console.log(`Template: ${plan.template}`);
	console.log(`Created:  ${muted(plan.createdAt)}`);
	console.log(`Updated:  ${muted(plan.updatedAt)}`);
	if (plan.outcome) {
		const note = plan.outcomeNote ? ` — ${plan.outcomeNote}` : "";
		console.log(`Outcome:  ${plan.outcome}${note}`);
	}
	// PLAN_SPEC.md:404-413 — review hint is purely cosmetic and only relevant
	// while a plan is awaiting work or in flight.
	const reviewActionable = plan.status === "approved" || plan.status === "active";
	if (!plan.reviewedBy && reviewActionable) {
		console.log(muted("Review suggested (no reviewer recorded yet)"));
	}
	if (plan.reviewedBy) {
		console.log(`Reviewed: ${plan.reviewedBy}`);
	}

	console.log("");
	renderPlanSections(plan, template);

	console.log("");
	console.log(brand(`Children (${tree.children.length}):`));
	if (tree.children.length === 0) {
		console.log(muted("  (none)"));
	} else {
		for (const c of tree.children) {
			const tag = c.adopted ? ` ${muted("(adopted)")}` : "";
			console.log(`  ${accent(c.id)}  ${muted(`[${c.status}]`)}  ${c.title}${tag}`);
		}
	}

	for (const sub of tree.children_plans) {
		console.log("");
		renderNestedPlanHuman(sub, "  ");
	}
}
