import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { accent, muted, outputJson } from "../output.ts";
import { issuesPath, readIssues, withLock, writeIssues } from "../store.ts";

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");

	// Parse --by <blocker-id>
	const byIdx = args.indexOf("--by");
	const blockerId = byIdx !== -1 ? args[byIdx + 1] : undefined;

	// Collect positional args (skip flags and their values)
	const skipNext = new Set<number>();
	if (byIdx !== -1) skipNext.add(byIdx + 1);
	const positional = args.filter((a, i) => !a.startsWith("--") && !skipNext.has(i));

	const issueId = positional[0];
	if (!issueId) throw new Error("Usage: sd block <id> --by <blocker-id>");
	if (!blockerId) throw new Error("Usage: sd block <id> --by <blocker-id>");
	if (issueId === blockerId) throw new Error(`Cannot block an issue by itself: ${issueId}`);

	const dir = seedsDir ?? (await findSeedsDir());

	await withLock(issuesPath(dir), async () => {
		const issues = await readIssues(dir);
		const issueIdx = issues.findIndex((i) => i.id === issueId);
		const issue = issues[issueIdx];
		if (!issue) throw new Error(`Issue not found: ${issueId}`);

		const blockerIdx = issues.findIndex((i) => i.id === blockerId);
		const blocker = issues[blockerIdx];
		if (!blocker) throw new Error(`Issue not found: ${blockerId}`);

		const blockedBy = Array.from(new Set([...(issue.blockedBy ?? []), blockerId]));
		const blocks = Array.from(new Set([...(blocker.blocks ?? []), issueId]));

		issues[issueIdx] = { ...issue, blockedBy, updatedAt: new Date().toISOString() };
		issues[blockerIdx] = { ...blocker, blocks, updatedAt: new Date().toISOString() };

		await writeIssues(dir, issues);
	});

	if (jsonMode) {
		await outputJson({ success: true, command: "block", issueId, blockerId });
	} else {
		console.log(`${accent(issueId)} ${muted("is now blocked by")} ${accent(blockerId)}`);
	}
}

export function register(program: Command): void {
	program
		.command("block")
		.description("Add a blocker to an issue")
		.argument("<id>", "Issue ID to block")
		.option("--by <blocker-id>", "Issue that blocks this issue")
		.option("--json", "Output as JSON")
		.action(async (id: string, opts: { by?: string; json?: boolean }) => {
			const args: string[] = [id];
			if (opts.by) args.push("--by", opts.by);
			if (opts.json) args.push("--json");
			await run(args);
		});
}
