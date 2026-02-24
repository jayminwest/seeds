import { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { c, outputJson, printIssueOneLine } from "../output.ts";
import { issuesPath, readIssues, withLock, writeIssues } from "../store.ts";
import type { Issue } from "../types.ts";

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const positional = args.filter((a) => !a.startsWith("--"));

	const subcmd = positional[0];
	if (!subcmd) throw new Error("Usage: sd dep <add|remove|list> <issue> [depends-on]");

	const dir = seedsDir ?? (await findSeedsDir());

	if (subcmd === "list") {
		const issueId = positional[1];
		if (!issueId) throw new Error("Usage: sd dep list <issue>");
		const issues = await readIssues(dir);
		const issue = issues.find((i) => i.id === issueId);
		if (!issue) throw new Error(`Issue not found: ${issueId}`);

		const blockedBy = issue.blockedBy ?? [];
		const blocks = issue.blocks ?? [];

		if (jsonMode) {
			outputJson({ success: true, command: "dep list", issueId, blockedBy, blocks });
		} else {
			console.log(`${c.bold}${issueId}${c.reset} dependencies:`);
			if (blockedBy.length > 0) {
				console.log("  Blocked by:");
				for (const bid of blockedBy) {
					const b = issues.find((i) => i.id === bid);
					if (b) {
						process.stdout.write("    ");
						printIssueOneLine(b);
					} else {
						console.log(`    ${bid} (not found)`);
					}
				}
			}
			if (blocks.length > 0) {
				console.log("  Blocks:");
				for (const bid of blocks) {
					const b = issues.find((i) => i.id === bid);
					if (b) {
						process.stdout.write("    ");
						printIssueOneLine(b);
					} else {
						console.log(`    ${bid} (not found)`);
					}
				}
			}
			if (blockedBy.length === 0 && blocks.length === 0) {
				console.log("  No dependencies.");
			}
		}
		return;
	}

	if (subcmd === "add" || subcmd === "remove") {
		const issueId = positional[1];
		const dependsOnId = positional[2];
		if (!issueId || !dependsOnId) {
			throw new Error(`Usage: sd dep ${subcmd} <issue> <depends-on>`);
		}

		await withLock(issuesPath(dir), async () => {
			const issues = await readIssues(dir);
			const issueIdx = issues.findIndex((i) => i.id === issueId);
			const depIdx = issues.findIndex((i) => i.id === dependsOnId);

			if (issueIdx === -1) throw new Error(`Issue not found: ${issueId}`);
			if (depIdx === -1) throw new Error(`Issue not found: ${dependsOnId}`);

			const issue = issues[issueIdx]!;
			const dep = issues[depIdx]!;

			if (subcmd === "add") {
				const blockedBy = Array.from(new Set([...(issue.blockedBy ?? []), dependsOnId]));
				const depBlocks = Array.from(new Set([...(dep.blocks ?? []), issueId]));
				issues[issueIdx] = { ...issue, blockedBy, updatedAt: new Date().toISOString() };
				issues[depIdx] = { ...dep, blocks: depBlocks, updatedAt: new Date().toISOString() };
			} else {
				const blockedBy = (issue.blockedBy ?? []).filter((id: string) => id !== dependsOnId);
				const depBlocks = (dep.blocks ?? []).filter((id: string) => id !== issueId);
				const updatedIssue: Issue = { ...issue, updatedAt: new Date().toISOString() };
				if (blockedBy.length > 0) updatedIssue.blockedBy = blockedBy;
				else updatedIssue.blockedBy = undefined;
				const updatedDep: Issue = { ...dep, updatedAt: new Date().toISOString() };
				if (depBlocks.length > 0) updatedDep.blocks = depBlocks;
				else updatedDep.blocks = undefined;
				issues[issueIdx] = updatedIssue;
				issues[depIdx] = updatedDep;
			}
			await writeIssues(dir, issues);
		});

		if (jsonMode) {
			outputJson({ success: true, command: `dep ${subcmd}`, issueId, dependsOnId });
		} else {
			const verb = subcmd === "add" ? "Added" : "Removed";
			console.log(`${verb} dependency: ${issueId} → ${dependsOnId}`);
		}
		return;
	}

	throw new Error(`Unknown dep subcommand: ${subcmd}. Use add, remove, or list.`);
}

export function register(program: Command): void {
	const dep = new Command("dep").description("Manage issue dependencies");

	dep
		.command("add <issue> <depends-on>")
		.description("Add a dependency (issue depends on depends-on)")
		.option("--json", "Output as JSON")
		.action(async (issue: string, dependsOn: string, opts: { json?: boolean }) => {
			const args: string[] = ["add", issue, dependsOn];
			if (opts.json) args.push("--json");
			await run(args);
		});

	dep
		.command("remove <issue> <depends-on>")
		.description("Remove a dependency")
		.option("--json", "Output as JSON")
		.action(async (issue: string, dependsOn: string, opts: { json?: boolean }) => {
			const args: string[] = ["remove", issue, dependsOn];
			if (opts.json) args.push("--json");
			await run(args);
		});

	dep
		.command("list <issue>")
		.description("Show dependencies for an issue")
		.option("--json", "Output as JSON")
		.action(async (issue: string, opts: { json?: boolean }) => {
			const args: string[] = ["list", issue];
			if (opts.json) args.push("--json");
			await run(args);
		});

	program.addCommand(dep);
}
