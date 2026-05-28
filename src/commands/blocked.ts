import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { resolveFormat, stripAnsi, VALID_FORMATS } from "../format.ts";
import {
	formatIssueOneLine,
	formatIssueOneLineCompact,
	outputJson,
	printIssueOneLine,
} from "../output.ts";
import { issueJsonWithPlan, loadPlanContext, planForIssue } from "../plan-context.ts";
import { readIssues } from "../store.ts";
import type { Issue } from "../types.ts";

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const fmt = resolveFormat(args);
	const jsonMode = fmt.mode === "json";
	if (fmt.error) {
		if (jsonMode) {
			await outputJson({ success: false, command: "blocked", error: fmt.error });
		} else {
			console.error(fmt.error);
		}
		process.exitCode = 1;
		return;
	}
	const dir = seedsDir ?? (await findSeedsDir());
	const issues = await readIssues(dir);
	const planCtx = await loadPlanContext(dir);

	const closedIds = new Set(issues.filter((i: Issue) => i.status === "closed").map((i) => i.id));

	const blocked = issues.filter((i: Issue) => {
		if (i.status === "closed") return false;
		const blockers = i.blockedBy ?? [];
		return blockers.some((bid) => !closedIds.has(bid));
	});

	switch (fmt.mode) {
		case "json": {
			const issuesWithPlan = blocked.map((i) => issueJsonWithPlan(i, planForIssue(planCtx, i)));
			await outputJson({
				success: true,
				command: "blocked",
				issues: issuesWithPlan,
				count: blocked.length,
			});
			return;
		}
		case "ids":
			for (const issue of blocked) console.log(issue.id);
			return;
		case "compact":
			for (const issue of blocked) console.log(formatIssueOneLineCompact(issue, closedIds));
			return;
		case "plain":
			if (blocked.length === 0) {
				console.log("No blocked issues.");
				return;
			}
			for (const issue of blocked) console.log(stripAnsi(formatIssueOneLine(issue, closedIds)));
			console.log(`\n${blocked.length} blocked issue(s)`);
			return;
		default:
			if (blocked.length === 0) {
				console.log("No blocked issues.");
				return;
			}
			for (const issue of blocked) printIssueOneLine(issue, closedIds);
			console.log(`\n${blocked.length} blocked issue(s)`);
			return;
	}
}

export function register(program: Command): void {
	program
		.command("blocked")
		.description("Show all blocked issues")
		.option("--format <mode>", `Output format (${VALID_FORMATS.join("|")})`)
		.option("--json", "Output as JSON (alias for --format json)")
		.action(async (opts: { format?: string; json?: boolean }) => {
			const args: string[] = [];
			if (opts.format) args.push("--format", opts.format);
			if (opts.json) args.push("--json");
			await run(args);
		});
}
