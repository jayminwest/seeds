import { findSeedsDir, readConfig } from "../config.ts";
import { generateId } from "../id.ts";
import { outputJson, printSuccess } from "../output.ts";
import { appendIssue, issuesPath, readIssues, withLock } from "../store.ts";
import type { Issue } from "../types.ts";
import { VALID_TYPES } from "../types.ts";

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

function parsePriority(val: string | boolean | undefined, defaultVal = 2): number {
	if (val === undefined || val === true) return defaultVal;
	const s = String(val);
	if (s.toUpperCase().startsWith("P")) return Number.parseInt(s.slice(1), 10);
	return Number.parseInt(s, 10);
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const flags = parseArgs(args);
	const title = flags.title;
	if (!title || typeof title !== "string" || !title.trim()) {
		throw new Error("--title is required");
	}

	const typeVal = flags.type ?? "task";
	if (typeof typeVal !== "string" || !(VALID_TYPES as readonly string[]).includes(typeVal)) {
		throw new Error(`--type must be one of: ${VALID_TYPES.join(", ")}`);
	}
	const issueType = typeVal as Issue["type"];

	const priority = parsePriority(flags.priority);
	if (Number.isNaN(priority) || priority < 0 || priority > 4) {
		throw new Error("--priority must be 0-4 or P0-P4");
	}

	const assignee = typeof flags.assignee === "string" ? flags.assignee : undefined;
	const description =
		typeof flags.description === "string"
			? flags.description
			: typeof flags.desc === "string"
				? flags.desc
				: undefined;

	const dir = seedsDir ?? (await findSeedsDir());
	const config = await readConfig(dir);

	let createdId: string;
	await withLock(issuesPath(dir), async () => {
		const existing = await readIssues(dir);
		const existingIds = new Set(existing.map((i) => i.id));
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
		};
		await appendIssue(dir, issue);
		createdId = id;
	});

	if (jsonMode) {
		outputJson({ success: true, command: "create", id: createdId! });
	} else {
		printSuccess(`Created ${createdId!}`);
	}
}
