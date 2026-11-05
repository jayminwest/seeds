import chalk from "chalk";
import { Command } from "commander";
import { findSeedsDir, readConfig } from "../config.ts";
import { generateId } from "../id.ts";
import { validateIssue } from "../issue-schema.ts";
import { accent, muted, outputJson, printIssueOneLine, printSuccess } from "../output.ts";
import { isValidPriority, PRIORITY_ERROR, parsePriority } from "../priority.ts";
import {
	appendTemplate,
	issuesPath,
	readIssues,
	readTemplates,
	templatesPath,
	withLock,
	writeIssues,
	writeTemplates,
} from "../store.ts";
import type { Issue, Template, TemplateStep } from "../types.ts";
import { VALID_TYPES } from "../types.ts";

interface JsonOption {
	json?: boolean;
}

interface TplStepAddOptions extends JsonOption {
	title: string;
	type?: string;
	priority?: string;
}

// sd tpl create --name "..."
async function runTplCreate(opts: JsonOption & { name: string }, seedsDir?: string): Promise<void> {
	const jsonMode = opts.json === true;
	const dir = seedsDir ?? (await findSeedsDir());

	const name = opts.name;
	if (!name) throw new Error("--name is required");

	let createdId = "";
	await withLock(templatesPath(dir), async () => {
		const existing = await readTemplates(dir);
		const existingIds = new Set(existing.map((t) => t.id));
		const id = generateId("tpl", existingIds);
		const template: Template = { id, name, steps: [] };
		await appendTemplate(dir, template);
		createdId = id;
	});

	if (jsonMode) {
		await outputJson({ success: true, command: "tpl create", id: createdId });
	} else {
		printSuccess(`Created template ${createdId}: ${name}`);
	}
}

// sd tpl step add <template-id> --title "..." [--type task] [--priority 2]
async function runTplStepAdd(
	templateId: string,
	opts: TplStepAddOptions,
	seedsDir?: string,
): Promise<void> {
	const jsonMode = opts.json === true;
	const dir = seedsDir ?? (await findSeedsDir());

	const title = opts.title;
	if (!title) throw new Error("--title is required");

	const typeVal = opts.type ?? "task";
	if (!(VALID_TYPES as readonly string[]).includes(typeVal)) {
		throw new Error(`Invalid --type value: ${typeVal}. Valid: ${VALID_TYPES.join("|")}`);
	}
	const priority = parsePriority(opts.priority);
	if (!isValidPriority(priority)) {
		throw new Error(PRIORITY_ERROR);
	}

	let stepCount = 0;
	await withLock(templatesPath(dir), async () => {
		const templates = await readTemplates(dir);
		const idx = templates.findIndex((t) => t.id === templateId);
		const tpl = templates[idx];
		if (!tpl) throw new Error(`Template not found: ${templateId}`);
		const step: TemplateStep = { title, type: typeVal, priority };
		const updated: Template = { ...tpl, steps: [...tpl.steps, step] };
		templates[idx] = updated;
		stepCount = updated.steps.length;
		await writeTemplates(dir, templates);
	});

	if (jsonMode) {
		await outputJson({ success: true, command: "tpl step add", id: templateId, stepCount });
	} else {
		printSuccess(`Added step ${stepCount} to ${templateId}: "${title}"`);
	}
}

// sd tpl list
async function runTplList(opts: JsonOption, seedsDir?: string): Promise<void> {
	const jsonMode = opts.json === true;
	const dir = seedsDir ?? (await findSeedsDir());

	const templates = await readTemplates(dir);
	if (jsonMode) {
		await outputJson({ success: true, command: "tpl list", templates, count: templates.length });
	} else {
		if (templates.length === 0) {
			console.log("No templates.");
			return;
		}
		for (const tpl of templates) {
			console.log(`${accent.bold(tpl.id)}  ${tpl.name}  ${muted(`(${tpl.steps.length} steps)`)}`);
		}
	}
}

// sd tpl show <id>
async function runTplShow(templateId: string, opts: JsonOption, seedsDir?: string): Promise<void> {
	const jsonMode = opts.json === true;
	const dir = seedsDir ?? (await findSeedsDir());

	const templates = await readTemplates(dir);
	const tpl = templates.find((t) => t.id === templateId);
	if (!tpl) throw new Error(`Template not found: ${templateId}`);

	if (jsonMode) {
		await outputJson({ success: true, command: "tpl show", template: tpl });
	} else {
		console.log(`${accent.bold(tpl.id)}  ${tpl.name}`);
		console.log(muted(`Steps (${tpl.steps.length}):`));
		tpl.steps.forEach((step, i) => {
			console.log(
				`  ${i + 1}. ${step.title}  ${muted(`[${step.type ?? "task"} P${step.priority ?? 2}]`)}`,
			);
		});
	}
}

// sd tpl pour <id> --prefix "..."
async function runTplPour(
	templateId: string,
	opts: JsonOption & { prefix: string },
	seedsDir?: string,
): Promise<void> {
	const jsonMode = opts.json === true;
	const dir = seedsDir ?? (await findSeedsDir());

	const prefix = opts.prefix;

	const templates = await readTemplates(dir);
	const tpl = templates.find((t) => t.id === templateId);
	if (!tpl) throw new Error(`Template not found: ${templateId}`);
	if (tpl.steps.length === 0) throw new Error(`Template ${templateId} has no steps`);

	const config = await readConfig(dir);
	const createdIds: string[] = [];

	await withLock(issuesPath(dir), async () => {
		const existing = await readIssues(dir);
		const existingIds = new Set(existing.map((i) => i.id));
		const now = new Date().toISOString();

		// Create all issues first (collect IDs)
		const newIssues: Issue[] = [];
		for (const [stepIdx, step] of tpl.steps.entries()) {
			const id = generateId(
				config.project,
				new Set([...existingIds, ...newIssues.map((i) => i.id)]),
			);
			const title = step.title.replace(/\{prefix\}/g, prefix);
			const issue: Issue = {
				id,
				title,
				status: "open",
				type: (step.type ?? "task") as Issue["type"],
				priority: step.priority ?? 2,
				createdAt: now,
				updatedAt: now,
				convoy: templateId,
			};
			// templates.jsonl is hand-editable; never pour a step seeds cannot store
			const problems = validateIssue(issue);
			if (problems.length > 0) {
				throw new Error(
					`Template ${templateId} step ${String(stepIdx + 1)} is invalid: ${problems.join(", ")}`,
				);
			}
			newIssues.push(issue);
			createdIds.push(id);
		}

		// Wire dependencies: step[i+1] blocked by step[i]
		for (let i = 1; i < newIssues.length; i++) {
			const prev = newIssues[i - 1];
			const curr = newIssues[i];
			if (!prev || !curr) continue;
			curr.blockedBy = [prev.id];
			prev.blocks = [curr.id];
		}

		// Append all new issues
		const allIssues = [...existing, ...newIssues];
		await writeIssues(dir, allIssues);
	});

	if (jsonMode) {
		await outputJson({ success: true, command: "tpl pour", ids: createdIds });
	} else {
		printSuccess(`Poured template ${accent(templateId)} — created ${createdIds.length} issues`);
		for (const id of createdIds) console.log(`  ${accent(id)}`);
	}
}

// sd tpl status <id>
async function runTplStatus(
	templateId: string,
	opts: JsonOption,
	seedsDir?: string,
): Promise<void> {
	const jsonMode = opts.json === true;
	const dir = seedsDir ?? (await findSeedsDir());

	const issues = await readIssues(dir);
	const convoyIssues = issues.filter((i: Issue) => i.convoy === templateId);

	if (convoyIssues.length === 0) {
		if (jsonMode) {
			await outputJson({
				success: true,
				command: "tpl status",
				templateId,
				total: 0,
				issues: [],
			});
		} else {
			console.log(`No issues found for convoy ${templateId}`);
		}
		return;
	}

	const closedIds = new Set(issues.filter((i: Issue) => i.status === "closed").map((i) => i.id));
	const completed = convoyIssues.filter((i) => i.status === "closed").length;
	const inProgress = convoyIssues.filter((i) => i.status === "in_progress").length;
	const blocked = convoyIssues.filter((i) => {
		if (i.status === "closed") return false;
		return (i.blockedBy ?? []).some((bid) => !closedIds.has(bid));
	}).length;

	const status = {
		templateId,
		total: convoyIssues.length,
		completed,
		inProgress,
		blocked,
		issues: convoyIssues.map((i) => i.id),
	};

	if (jsonMode) {
		await outputJson({ success: true, command: "tpl status", status });
	} else {
		console.log(`${chalk.bold("Convoy:")} ${accent(templateId)}`);
		console.log(`  ${muted("Total:")}       ${status.total}`);
		console.log(`  ${muted("Completed:")}   ${completed}`);
		console.log(`  ${muted("In progress:")} ${inProgress}`);
		console.log(`  ${muted("Blocked:")}     ${blocked}`);
		console.log(muted("  Issues:"));
		for (const issue of convoyIssues) {
			process.stdout.write("    ");
			printIssueOneLine(issue, closedIds);
		}
	}
}

export function register(program: Command): void {
	const tpl = new Command("tpl").description("Manage issue templates (molecules)");

	tpl
		.command("create")
		.description("Create a new template")
		.requiredOption("--name <text>", "Template name")
		.option("--json", "Output as JSON")
		.action(async (opts: JsonOption & { name: string }) => {
			await runTplCreate(opts);
		});

	const step = new Command("step").description("Manage template steps");
	step
		.command("add <id>")
		.description("Add a step to a template")
		.requiredOption("--title <text>", "Step title")
		.option("--type <type>", "Step type (task|bug|feature|epic)", "task")
		.option("--priority <n>", "Step priority 0-4", "2")
		.option("--json", "Output as JSON")
		.action(async (id: string, opts: TplStepAddOptions) => {
			await runTplStepAdd(id, opts);
		});
	tpl.addCommand(step);

	tpl
		.command("list")
		.description("List all templates")
		.option("--json", "Output as JSON")
		.action(async (opts: JsonOption) => {
			await runTplList(opts);
		});

	tpl
		.command("show <id>")
		.description("Show template with steps")
		.option("--json", "Output as JSON")
		.action(async (id: string, opts: JsonOption) => {
			await runTplShow(id, opts);
		});

	tpl
		.command("pour <id>")
		.description("Instantiate template into issues")
		.requiredOption("--prefix <text>", "Prefix for issue titles")
		.option("--json", "Output as JSON")
		.action(async (id: string, opts: JsonOption & { prefix: string }) => {
			await runTplPour(id, opts);
		});

	tpl
		.command("status <id>")
		.description("Show convoy status for a template")
		.option("--json", "Output as JSON")
		.action(async (id: string, opts: JsonOption) => {
			await runTplStatus(id, opts);
		});

	program.addCommand(tpl);
}
