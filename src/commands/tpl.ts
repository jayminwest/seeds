import { findSeedsDir, readConfig } from "../config.ts";
import { generateId } from "../id.ts";
import { c, outputJson, printIssueOneLine, printSuccess } from "../output.ts";
import {
	appendIssue,
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
	const subcmd = positional[0];

	if (!subcmd) throw new Error("Usage: sd tpl <create|step|list|show|pour|status>");

	const dir = seedsDir ?? (await findSeedsDir());

	// sd tpl create --name "..."
	if (subcmd === "create") {
		const name = flags.name;
		if (!name || typeof name !== "string") throw new Error("--name is required");

		let createdId: string;
		await withLock(templatesPath(dir), async () => {
			const existing = await readTemplates(dir);
			const existingIds = new Set(existing.map((t) => t.id));
			const id = generateId("tpl", existingIds);
			const template: Template = { id, name, steps: [] };
			await appendTemplate(dir, template);
			createdId = id;
		});

		if (jsonMode) {
			outputJson({ success: true, command: "tpl create", id: createdId! });
		} else {
			printSuccess(`Created template ${createdId!}: ${name}`);
		}
		return;
	}

	// sd tpl step add <template-id> --title "..." [--type task] [--priority 2]
	if (subcmd === "step") {
		const stepSubcmd = positional[1];
		if (stepSubcmd !== "add") throw new Error("Usage: sd tpl step add <id> --title ...");
		const templateId = positional[2];
		if (!templateId) throw new Error("Template ID is required");
		const title = flags.title;
		if (!title || typeof title !== "string") throw new Error("--title is required");

		const typeVal = typeof flags.type === "string" ? flags.type : "task";
		if (!(VALID_TYPES as readonly string[]).includes(typeVal)) {
			throw new Error(`--type must be one of: ${VALID_TYPES.join(", ")}`);
		}
		const priorityStr = typeof flags.priority === "string" ? flags.priority : "2";
		const priority = Number.parseInt(priorityStr, 10);

		let stepCount = 0;
		await withLock(templatesPath(dir), async () => {
			const templates = await readTemplates(dir);
			const idx = templates.findIndex((t) => t.id === templateId);
			if (idx === -1) throw new Error(`Template not found: ${templateId}`);
			const tpl = templates[idx]!;
			const step: TemplateStep = { title, type: typeVal, priority };
			templates[idx] = { ...tpl, steps: [...tpl.steps, step] };
			stepCount = templates[idx]?.steps.length;
			await writeTemplates(dir, templates);
		});

		if (jsonMode) {
			outputJson({ success: true, command: "tpl step add", id: templateId, stepCount });
		} else {
			printSuccess(`Added step ${stepCount} to ${templateId}: "${title}"`);
		}
		return;
	}

	// sd tpl list
	if (subcmd === "list") {
		const templates = await readTemplates(dir);
		if (jsonMode) {
			outputJson({ success: true, command: "tpl list", templates, count: templates.length });
		} else {
			if (templates.length === 0) {
				console.log("No templates.");
				return;
			}
			for (const tpl of templates) {
				console.log(
					`${c.bold}${tpl.id}${c.reset}  ${tpl.name}  ${c.gray}(${tpl.steps.length} steps)${c.reset}`,
				);
			}
		}
		return;
	}

	// sd tpl show <id>
	if (subcmd === "show") {
		const templateId = positional[1];
		if (!templateId) throw new Error("Usage: sd tpl show <id>");
		const templates = await readTemplates(dir);
		const tpl = templates.find((t) => t.id === templateId);
		if (!tpl) throw new Error(`Template not found: ${templateId}`);

		if (jsonMode) {
			outputJson({ success: true, command: "tpl show", template: tpl });
		} else {
			console.log(`${c.bold}${tpl.id}${c.reset}  ${tpl.name}`);
			console.log(`Steps (${tpl.steps.length}):`);
			tpl.steps.forEach((step, i) => {
				console.log(
					`  ${i + 1}. ${step.title}  ${c.gray}[${step.type ?? "task"} P${step.priority ?? 2}]${c.reset}`,
				);
			});
		}
		return;
	}

	// sd tpl pour <id> --prefix "..."
	if (subcmd === "pour") {
		const templateId = positional[1];
		if (!templateId) throw new Error("Usage: sd tpl pour <id> --prefix ...");
		const prefix = typeof flags.prefix === "string" ? flags.prefix : "";

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
			for (const step of tpl.steps) {
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
				newIssues.push(issue);
				createdIds.push(id);
			}

			// Wire dependencies: step[i+1] blocked by step[i]
			for (let i = 1; i < newIssues.length; i++) {
				const prev = newIssues[i - 1]!;
				const curr = newIssues[i]!;
				curr.blockedBy = [prev.id];
				prev.blocks = [curr.id];
			}

			// Append all new issues
			const allIssues = [...existing, ...newIssues];
			await writeIssues(dir, allIssues);
		});

		if (jsonMode) {
			outputJson({ success: true, command: "tpl pour", ids: createdIds });
		} else {
			printSuccess(`Poured template ${templateId} — created ${createdIds.length} issues`);
			for (const id of createdIds) console.log(`  ${id}`);
		}
		return;
	}

	// sd tpl status <id>
	if (subcmd === "status") {
		const templateId = positional[1];
		if (!templateId) throw new Error("Usage: sd tpl status <id>");

		const issues = await readIssues(dir);
		const convoyIssues = issues.filter((i: Issue) => i.convoy === templateId);

		if (convoyIssues.length === 0) {
			if (jsonMode) {
				outputJson({ success: true, command: "tpl status", templateId, total: 0, issues: [] });
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
			outputJson({ success: true, command: "tpl status", ...status });
		} else {
			console.log(`${c.bold}Convoy: ${templateId}${c.reset}`);
			console.log(`  Total:       ${status.total}`);
			console.log(`  Completed:   ${completed}`);
			console.log(`  In progress: ${inProgress}`);
			console.log(`  Blocked:     ${blocked}`);
			console.log("  Issues:");
			for (const issue of convoyIssues) {
				process.stdout.write("    ");
				printIssueOneLine(issue);
			}
		}
		return;
	}

	throw new Error(
		`Unknown tpl subcommand: ${subcmd}. Use create, step, list, show, pour, or status.`,
	);
}
