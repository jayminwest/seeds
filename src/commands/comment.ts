import { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { generateId } from "../id.ts";
import { accent, muted, outputJson, printSuccess } from "../output.ts";
import { issuesPath, readIssues, withLock, writeIssues } from "../store.ts";
import type { IssueComment } from "../types.ts";

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const quietMode = args.includes("--quiet") || args.includes("-q");
	// Collect positional args by skipping flags and their values.
	// Value flags: --author. Boolean flags: --json, --quiet, -q.
	const VALUE_FLAGS = new Set(["--author"]);
	const positional: string[] = [];
	for (let i = 0; i < args.length; i++) {
		const a = args[i]!;
		if (VALUE_FLAGS.has(a)) {
			i++; // skip the flag's value
		} else if (!a.startsWith("--") && a !== "-q") {
			positional.push(a);
		}
	}
	const subcmd = positional[0];

	if (!subcmd) throw new Error("Usage: sd comment <add|list|delete> <issue-id> [...]");

	const dir = seedsDir ?? (await findSeedsDir());

	// sd comment add <issue-id> <body> [--author <name>]
	if (subcmd === "add") {
		const issueId = positional[1];
		const body = positional[2];
		if (!issueId) throw new Error("Usage: sd comment add <issue-id> <body> --author <name>");
		if (!body || !body.trim()) throw new Error("Comment body is required");

		const authorFlagIdx = args.indexOf("--author");
		const author =
			authorFlagIdx !== -1 && args[authorFlagIdx + 1]
				? args[authorFlagIdx + 1]!
				: (process.env.SEEDS_AUTHOR ?? "");
		if (!author.trim()) {
			throw new Error("--author is required (or set SEEDS_AUTHOR env var)");
		}

		let commentId = "";
		await withLock(issuesPath(dir), async () => {
			const issues = await readIssues(dir);
			const idx = issues.findIndex((i) => i.id === issueId);
			if (idx === -1) throw new Error(`Issue not found: ${issueId}`);

			const issue = issues[idx]!;
			const existingCommentIds = new Set((issue.comments ?? []).map((c) => c.id));
			const id = generateId("c", existingCommentIds);
			const now = new Date().toISOString();
			const comment: IssueComment = { id, author, body: body.trim(), createdAt: now };

			issues[idx] = {
				...issue,
				comments: [...(issue.comments ?? []), comment],
				updatedAt: now,
			};
			commentId = id;
			await writeIssues(dir, issues);
		});

		if (jsonMode) {
			outputJson({ success: true, command: "comment add", issueId, commentId });
		} else {
			printSuccess(`Added comment ${commentId} to ${issueId}`);
		}
		return;
	}

	// sd comment list <issue-id>
	if (subcmd === "list") {
		const issueId = positional[1];
		if (!issueId) throw new Error("Usage: sd comment list <issue-id>");

		const issues = await readIssues(dir);
		const issue = issues.find((i) => i.id === issueId);
		if (!issue) throw new Error(`Issue not found: ${issueId}`);

		const comments = issue.comments ?? [];

		if (jsonMode) {
			outputJson({
				success: true,
				command: "comment list",
				issueId,
				comments,
				count: comments.length,
			});
		} else if (!quietMode) {
			if (comments.length === 0) {
				console.log("No comments.");
				return;
			}
			console.log(
				`${accent.bold(issueId)}  ${muted(`${comments.length} comment${comments.length === 1 ? "" : "s"}`)}`,
			);
			for (const comment of comments) {
				console.log(
					`\n${accent.bold(comment.id)}  ${muted(comment.author)}  ${muted(comment.createdAt)}`,
				);
				console.log(comment.body);
			}
		}
		return;
	}

	// sd comment delete <issue-id> <comment-id>
	if (subcmd === "delete") {
		const issueId = positional[1];
		const commentId = positional[2];
		if (!issueId || !commentId) {
			throw new Error("Usage: sd comment delete <issue-id> <comment-id>");
		}

		await withLock(issuesPath(dir), async () => {
			const issues = await readIssues(dir);
			const idx = issues.findIndex((i) => i.id === issueId);
			if (idx === -1) throw new Error(`Issue not found: ${issueId}`);

			const issue = issues[idx]!;
			const comments = issue.comments ?? [];
			const commentIdx = comments.findIndex((c) => c.id === commentId);
			if (commentIdx === -1) throw new Error(`Comment not found: ${commentId}`);

			const updated = comments.filter((c) => c.id !== commentId);
			issues[idx] = {
				...issue,
				comments: updated.length > 0 ? updated : undefined,
				updatedAt: new Date().toISOString(),
			};
			await writeIssues(dir, issues);
		});

		if (jsonMode) {
			outputJson({ success: true, command: "comment delete", issueId, commentId });
		} else {
			printSuccess(`Deleted comment ${commentId} from ${issueId}`);
		}
		return;
	}

	throw new Error(`Unknown comment subcommand: ${subcmd}. Use add, list, or delete.`);
}

export function register(program: Command): void {
	const comment = new Command("comment").description("Manage issue comments");

	comment
		.command("add <issue-id> <body>")
		.description("Add a comment to an issue")
		.option("--author <name>", "Comment author (or set SEEDS_AUTHOR env var)")
		.option("--json", "Output as JSON")
		.action(async (issueId: string, body: string, opts: { author?: string; json?: boolean }) => {
			const args: string[] = ["add", issueId, body];
			if (opts.author) args.push("--author", opts.author);
			if (opts.json) args.push("--json");
			await run(args);
		});

	comment
		.command("list <issue-id>")
		.description("List comments on an issue")
		.option("--json", "Output as JSON")
		.action(async (issueId: string, opts: { json?: boolean }) => {
			const args: string[] = ["list", issueId];
			if (opts.json) args.push("--json");
			await run(args);
		});

	comment
		.command("delete <issue-id> <comment-id>")
		.description("Delete a comment")
		.option("--json", "Output as JSON")
		.action(async (issueId: string, commentId: string, opts: { json?: boolean }) => {
			const args: string[] = ["delete", issueId, commentId];
			if (opts.json) args.push("--json");
			await run(args);
		});

	program.addCommand(comment);
}
