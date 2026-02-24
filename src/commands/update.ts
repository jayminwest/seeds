import { findSeedsDir } from "../config.ts";
import { outputJson, printSuccess } from "../output.ts";
import { issuesPath, readIssues, withLock, writeIssues } from "../store.ts";
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

function parsePriority(val: string): number {
	if (val.toUpperCase().startsWith("P")) return Number.parseInt(val.slice(1), 10);
	return Number.parseInt(val, 10);
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const id = args.find((a) => !a.startsWith("--"));
	if (!id) throw new Error("Usage: sd update <id> [flags]");

	const flags = parseArgs(args);

	const dir = seedsDir ?? (await findSeedsDir());
	let updated: Issue | undefined;

	await withLock(issuesPath(dir), async () => {
		const issues = await readIssues(dir);
		const idx = issues.findIndex((i) => i.id === id);
		if (idx === -1) throw new Error(`Issue not found: ${id}`);

		const issue = issues[idx]!;
		const now = new Date().toISOString();
		const patch: Partial<Issue> = { updatedAt: now };

		if (typeof flags.status === "string") {
			const s = flags.status;
			if (!(VALID_STATUSES as readonly string[]).includes(s)) {
				throw new Error(`--status must be one of: ${VALID_STATUSES.join(", ")}`);
			}
			patch.status = s as Issue["status"];
		}
		if (typeof flags.title === "string") patch.title = flags.title;
		if (typeof flags.assignee === "string") patch.assignee = flags.assignee;
		const desc = typeof flags.description === "string" ? flags.description : flags.desc;
		if (typeof desc === "string") patch.description = desc;
		if (typeof flags.type === "string") {
			const t = flags.type;
			if (!(VALID_TYPES as readonly string[]).includes(t)) {
				throw new Error(`--type must be one of: ${VALID_TYPES.join(", ")}`);
			}
			patch.type = t as Issue["type"];
		}
		if (typeof flags.priority === "string") {
			const p = parsePriority(flags.priority);
			if (Number.isNaN(p) || p < 0 || p > 4) throw new Error("--priority must be 0-4 or P0-P4");
			patch.priority = p;
		}

		issues[idx] = { ...issue, ...patch };
		updated = issues[idx];
		await writeIssues(dir, issues);
	});

	if (jsonMode) {
		outputJson({ success: true, command: "update", issue: updated });
	} else {
		printSuccess(`Updated ${id}`);
	}
}
