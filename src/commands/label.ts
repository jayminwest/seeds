import { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { accent, muted, outputJson, printSuccess } from "../output.ts";
import { issuesPath, readIssues, withLock, writeIssues } from "../store.ts";

// Exported so plan submit/adopt paths can reuse the same normalization
// (lowercase, trim, drop empties) when applying step.labels to spawned/
// adopted children (seeds-745e / seeds-bac9 under pl-e5a8).
export function normalizeLabels(raw: string[]): string[] {
	return raw.map((l) => l.trim().toLowerCase()).filter(Boolean);
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const positional = args.filter((a) => !a.startsWith("--"));

	const subcmd = positional[0];
	if (!subcmd) throw new Error("Usage: sd label <add|remove|list|list-all>");

	const dir = seedsDir ?? (await findSeedsDir());

	if (subcmd === "list-all") {
		const issues = await readIssues(dir);
		const counts: Record<string, number> = {};
		for (const issue of issues) {
			for (const label of issue.labels ?? []) {
				counts[label] = (counts[label] ?? 0) + 1;
			}
		}
		const labels = Object.keys(counts).sort();

		if (jsonMode) {
			await outputJson({ success: true, command: "label list-all", labels, counts });
		} else {
			if (labels.length === 0) {
				console.log("No labels found.");
				return;
			}
			for (const label of labels) {
				console.log(`  ${accent(label.padEnd(20))} ${muted(String(counts[label]))}`);
			}
			console.log(`\n${labels.length} label(s)`);
		}
		return;
	}

	if (subcmd === "list") {
		const issueId = positional[1];
		if (!issueId) throw new Error("Usage: sd label list <issue>");
		const issues = await readIssues(dir);
		const issue = issues.find((i) => i.id === issueId);
		if (!issue) throw new Error(`Issue not found: ${issueId}`);

		const labels = issue.labels ?? [];

		if (jsonMode) {
			await outputJson({ success: true, command: "label list", issueId, labels });
		} else {
			if (labels.length === 0) {
				console.log(`${accent.bold(issueId)} has no labels.`);
			} else {
				console.log(`${accent.bold(issueId)} ${muted("labels:")}`);
				for (const label of labels) {
					console.log(`  ${accent(label)}`);
				}
			}
		}
		return;
	}

	if (subcmd === "add") {
		const issueId = positional[1];
		const rawLabels = positional.slice(2);
		if (!issueId || rawLabels.length === 0) {
			throw new Error("Usage: sd label add <issue> <label> [<label2> ...]");
		}
		const newLabels = normalizeLabels(rawLabels);
		if (newLabels.length === 0) throw new Error("No valid labels provided");

		await withLock(issuesPath(dir), async () => {
			const issues = await readIssues(dir);
			const idx = issues.findIndex((i) => i.id === issueId);
			const issue = issues[idx];
			if (!issue) throw new Error(`Issue not found: ${issueId}`);

			const merged = Array.from(new Set([...(issue.labels ?? []), ...newLabels]));
			issues[idx] = { ...issue, labels: merged, updatedAt: new Date().toISOString() };
			await writeIssues(dir, issues);
		});

		if (jsonMode) {
			await outputJson({ success: true, command: "label add", issueId, labels: newLabels });
		} else {
			printSuccess(
				`Added label(s) ${newLabels.map((l) => accent(l)).join(", ")} to ${accent(issueId)}`,
			);
		}
		return;
	}

	if (subcmd === "remove") {
		const issueId = positional[1];
		const rawLabels = positional.slice(2);
		if (!issueId || rawLabels.length === 0) {
			throw new Error("Usage: sd label remove <issue> <label> [<label2> ...]");
		}
		const removeSet = new Set(normalizeLabels(rawLabels));

		await withLock(issuesPath(dir), async () => {
			const issues = await readIssues(dir);
			const idx = issues.findIndex((i) => i.id === issueId);
			const issue = issues[idx];
			if (!issue) throw new Error(`Issue not found: ${issueId}`);

			const remaining = (issue.labels ?? []).filter((l) => !removeSet.has(l));
			const updated: typeof issue = { ...issue, updatedAt: new Date().toISOString() };
			if (remaining.length > 0) updated.labels = remaining;
			else updated.labels = undefined;
			issues[idx] = updated;
			await writeIssues(dir, issues);
		});

		if (jsonMode) {
			await outputJson({ success: true, command: "label remove", issueId, labels: [...removeSet] });
		} else {
			printSuccess(`Removed label(s) from ${accent(issueId)}`);
		}
		return;
	}

	throw new Error(`Unknown label subcommand: ${subcmd}. Use add, remove, list, or list-all.`);
}

export function register(program: Command): void {
	const label = new Command("label").description("Manage issue labels");

	label
		.command("add <issue> <labels...>")
		.description("Add labels to an issue")
		.option("--json", "Output as JSON")
		.action(async (issue: string, labels: string[], opts: { json?: boolean }) => {
			const args: string[] = ["add", issue, ...labels];
			if (opts.json) args.push("--json");
			await run(args);
		});

	label
		.command("remove <issue> <labels...>")
		.description("Remove labels from an issue")
		.option("--json", "Output as JSON")
		.action(async (issue: string, labels: string[], opts: { json?: boolean }) => {
			const args: string[] = ["remove", issue, ...labels];
			if (opts.json) args.push("--json");
			await run(args);
		});

	label
		.command("list <issue>")
		.description("List labels on an issue")
		.option("--json", "Output as JSON")
		.action(async (issue: string, opts: { json?: boolean }) => {
			const args: string[] = ["list", issue];
			if (opts.json) args.push("--json");
			await run(args);
		});

	label
		.command("list-all")
		.description("List all labels used in the project")
		.option("--json", "Output as JSON")
		.action(async (opts: { json?: boolean }) => {
			const args: string[] = ["list-all"];
			if (opts.json) args.push("--json");
			await run(args);
		});

	program.addCommand(label);
}
