import { type Command, Option } from "commander";
import { findSeedsDir, readConfig } from "../config.ts";
import { generateId } from "../id.ts";
import { collect, parseIntent } from "../intent.ts";
import { outputJson, printSuccess } from "../output.ts";
import { isValidPriority, PRIORITY_ERROR, parsePriority } from "../priority.ts";
import { appendIssue, issuesPath, readIssues, withLock } from "../store.ts";
import type { Issue } from "../types.ts";
import { VALID_TYPES } from "../types.ts";

interface CreateOptions {
	title: string;
	type?: string;
	priority?: string;
	assignee?: string;
	description?: string;
	desc?: string;
	body?: string;
	labels?: string;
	label?: string;
	from?: string;
	intent?: string[];
	json?: boolean;
}

async function runCreate(opts: CreateOptions, seedsDir?: string): Promise<void> {
	const jsonMode = opts.json === true;
	const title = opts.title;
	if (!title.trim()) throw new Error("--title is required");

	const typeVal = opts.type ?? "task";
	if (!(VALID_TYPES as readonly string[]).includes(typeVal)) {
		throw new Error(`Invalid --type value: ${typeVal}. Valid: ${VALID_TYPES.join("|")}`);
	}
	const issueType = typeVal as Issue["type"];

	const priority = parsePriority(opts.priority);
	if (!isValidPriority(priority)) {
		throw new Error(PRIORITY_ERROR);
	}

	// --label is a hidden alias for --labels; --labels wins when both are supplied.
	const labelsRaw = opts.labels ?? opts.label;
	const labels = labelsRaw
		? labelsRaw
				.split(",")
				.map((l) => l.trim().toLowerCase())
				.filter(Boolean)
		: undefined;

	const assignee = opts.assignee;
	const description = opts.description ?? opts.desc ?? opts.body;
	const intent = parseIntent(opts.intent ?? []);
	const from = opts.from?.trim();
	if (from === "") throw new Error("--from requires an issue id");

	const dir = seedsDir ?? (await findSeedsDir());
	const config = await readConfig(dir);

	const created = await withLock(issuesPath(dir), async () => {
		const existing = await readIssues(dir);
		const existingIds = new Set(existing.map((i) => i.id));
		if (from && !existingIds.has(from)) throw new Error(`--from issue not found: ${from}`);
		const id = generateId(config.project, existingIds);
		const now = new Date().toISOString();
		const issue: Issue = {
			id,
			title: title.trim(),
			status: "open",
			type: issueType,
			priority,
			createdAt: now,
			updatedAt: now,
			...(assignee ? { assignee } : {}),
			...(description ? { description } : {}),
			...(labels && labels.length > 0 ? { labels } : {}),
			...(from ? { discoveredFrom: from } : {}),
			...(intent ? { intent } : {}),
		};
		await appendIssue(dir, issue);
		return issue;
	});

	if (jsonMode) {
		// `id` stays top-level for existing consumers; `issue` matches update/show (seeds-7f39).
		await outputJson({ success: true, command: "create", id: created.id, issue: created });
	} else {
		printSuccess(`Created ${created.id}`);
	}
}

export function register(program: Command): void {
	program
		.command("create")
		.description("Create a new issue")
		.requiredOption("--title <text>", "Issue title")
		.option("--type <type>", "Issue type (task|bug|feature|epic)", "task")
		.option("--priority <n>", "Priority 0-4 or P0-P4", "2")
		.option("--assignee <name>", "Assignee name")
		.option("--description <text>", "Issue description")
		.option("--desc <text>", "Issue description (alias for --description)")
		.option("--body <text>", "Issue description (alias for --description)")
		.option("--labels <labels>", "Comma-separated labels")
		.addOption(new Option("--label <labels>", "Comma-separated labels (alias)").hideHelp())
		.option("--from <id>", "Record the issue this was discovered from (provenance, non-blocking)")
		.option("--intent <r-id>", "Link to a roots idea (repeatable)", collect, [])
		.option("--json", "Output as JSON")
		.action(async (opts: CreateOptions) => {
			await runCreate(opts);
		});
}
