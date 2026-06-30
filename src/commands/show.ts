import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { resolveFormat, stripAnsi, VALID_FORMATS } from "../format.ts";
import {
	accent,
	brand,
	formatIssueFull,
	formatIssueOneLineCompact,
	muted,
	outputJson,
	printError,
	printIssueFull,
} from "../output.ts";
import { loadPlanContext, planForIssue, summarisePlanChildren } from "../plan-context.ts";
import { readIssues } from "../store.ts";
import type { Issue } from "../types.ts";
import { runShow as runPlanShow } from "./plan-show.ts";

const HUMAN_DIVIDER = "─".repeat(60);

function collectPositional(args: string[]): string[] {
	const ids: string[] = [];
	let i = 0;
	while (i < args.length) {
		const arg = args[i];
		if (arg === undefined) {
			i++;
			continue;
		}
		if (arg === "--format") {
			i += 2;
			continue;
		}
		if (arg.startsWith("--")) {
			i++;
			continue;
		}
		ids.push(arg);
		i++;
	}
	return ids;
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const fmt = resolveFormat(args);
	const jsonMode = fmt.mode === "json";
	if (fmt.error) {
		if (jsonMode) {
			await outputJson({ success: false, command: "show", error: fmt.error });
		} else {
			printError(fmt.error);
		}
		process.exitCode = 1;
		return;
	}

	const ids = collectPositional(args);
	if (ids.length === 0) throw new Error("Usage: sd show <id> [ids...]");

	const dir = seedsDir ?? (await findSeedsDir());
	const issues = await readIssues(dir);

	if (ids.length === 1) {
		const id = ids[0];
		if (id === undefined) throw new Error("Usage: sd show <id> [ids...]");
		await renderSingle(id, issues, dir, fmt.mode);
		return;
	}

	await renderMultiple(ids, issues, dir, fmt.mode);
}

async function renderSingle(
	id: string,
	issues: Issue[],
	dir: string,
	mode: ReturnType<typeof resolveFormat>["mode"],
): Promise<void> {
	const issue = issues.find((i) => i.id === id);
	if (!issue) {
		if (id.startsWith("pl-")) {
			if (mode !== "markdown" && mode !== "json") {
				const errMsg = `sd show ${id}: --format ${mode} is not supported for plan ids; pass --json or use 'sd plan show ${id}'`;
				printError(errMsg);
				process.exitCode = 1;
				return;
			}
			await runPlanShow(id, mode === "json");
			return;
		}
		throw new Error(`Issue not found: ${id}`);
	}

	const planCtx = await loadPlanContext(dir);
	const plan = planForIssue(planCtx, issue);
	const planChildren = plan ? summarisePlanChildren(plan, issues) : undefined;

	switch (mode) {
		case "json": {
			const out: Record<string, unknown> = { success: true, command: "show", issue };
			if (plan) {
				out.plan = {
					id: plan.id,
					status: plan.status,
					revision: plan.revision,
					template: plan.template,
					children: plan.children,
				};
				out.plan_children = planChildren;
			}
			await outputJson(out);
			return;
		}
		case "ids":
			console.log(issue.id);
			return;
		case "compact": {
			const closedBlockerIds = new Set(
				issues.filter((i) => i.status === "closed").map((i) => i.id),
			);
			console.log(formatIssueOneLineCompact(issue, closedBlockerIds));
			return;
		}
		case "plain":
			console.log(stripAnsi(formatIssueFull(issue) + renderPlanBlock(plan, planChildren)));
			return;
		default:
			printIssueFull(issue);
			if (plan) process.stdout.write(renderPlanBlock(plan, planChildren));
			return;
	}
}

interface MultiResult {
	id: string;
	issue?: Issue;
	error?: string;
}

async function renderMultiple(
	ids: string[],
	issues: Issue[],
	dir: string,
	mode: ReturnType<typeof resolveFormat>["mode"],
): Promise<void> {
	const results: MultiResult[] = ids.map((id) => {
		const issue = issues.find((i) => i.id === id);
		if (issue) return { id, issue };
		if (id.startsWith("pl-")) {
			return {
				id,
				error: `Plan id ${id} not supported in multi-id 'sd show'; run 'sd plan show ${id}' instead`,
			};
		}
		return { id, error: `Issue not found: ${id}` };
	});

	const found = results.filter((r): r is MultiResult & { issue: Issue } => r.issue !== undefined);
	const errors = results.filter((r): r is MultiResult & { error: string } => r.error !== undefined);
	const anyMissing = errors.length > 0;

	switch (mode) {
		case "json": {
			const planCtx = await loadPlanContext(dir);
			const items = found.map((r) => {
				const plan = planForIssue(planCtx, r.issue);
				const planChildren = plan ? summarisePlanChildren(plan, issues) : undefined;
				const item: Record<string, unknown> = { issue: r.issue };
				if (plan) {
					item.plan = {
						id: plan.id,
						status: plan.status,
						revision: plan.revision,
						template: plan.template,
						children: plan.children,
					};
					item.plan_children = planChildren;
				}
				return item;
			});
			const out: Record<string, unknown> = {
				success: !anyMissing,
				command: "show",
				issues: items.map((i) => i.issue),
				results: items,
			};
			if (errors.length > 0) {
				out.errors = errors.map((e) => ({ id: e.id, error: e.error }));
			}
			await outputJson(out);
			if (anyMissing) process.exitCode = 1;
			return;
		}
		case "ids": {
			for (const r of found) console.log(r.issue.id);
			for (const e of errors) printError(`${e.id}: ${e.error}`);
			if (anyMissing) process.exitCode = 1;
			return;
		}
		case "compact": {
			const closedBlockerIds = new Set(
				issues.filter((i) => i.status === "closed").map((i) => i.id),
			);
			for (const r of found) {
				console.log(formatIssueOneLineCompact(r.issue, closedBlockerIds));
			}
			for (const e of errors) printError(`${e.id}: ${e.error}`);
			if (anyMissing) process.exitCode = 1;
			return;
		}
		case "plain": {
			const planCtx = await loadPlanContext(dir);
			const blocks = found.map((r) => {
				const plan = planForIssue(planCtx, r.issue);
				const planChildren = plan ? summarisePlanChildren(plan, issues) : undefined;
				return stripAnsi(formatIssueFull(r.issue) + renderPlanBlock(plan, planChildren));
			});
			console.log(blocks.join("\n\n"));
			for (const e of errors) printError(`${e.id}: ${e.error}`);
			if (anyMissing) process.exitCode = 1;
			return;
		}
		default: {
			const planCtx = await loadPlanContext(dir);
			let first = true;
			for (const r of found) {
				if (!first) {
					process.stdout.write(`\n${muted(HUMAN_DIVIDER)}\n\n`);
				}
				first = false;
				printIssueFull(r.issue);
				const plan = planForIssue(planCtx, r.issue);
				if (plan) {
					const planChildren = summarisePlanChildren(plan, issues);
					process.stdout.write(renderPlanBlock(plan, planChildren));
				}
			}
			for (const e of errors) printError(`${e.id}: ${e.error}`);
			if (anyMissing) process.exitCode = 1;
			return;
		}
	}
}

function renderPlanBlock(
	plan: ReturnType<typeof planForIssue>,
	children: ReturnType<typeof summarisePlanChildren> | undefined,
): string {
	if (!plan) return "";
	const lines: string[] = [
		"",
		`${brand("Plan:")} ${accent(plan.id)}  ${muted(`[${plan.status}]`)}`,
	];
	if (plan.status === "draft") {
		lines.push(`${accent("plan in draft — run sd plan submit")}`);
	} else if (children && children.length > 0) {
		lines.push(`${muted(`Plan steps (${children.length}):`)}`);
		for (const c of children) {
			const tag = c.adopted ? ` ${muted("(adopted)")}` : "";
			lines.push(`  ${accent(c.id)}  ${muted(`[${c.status}]`)}  ${c.title}${tag}`);
		}
	}
	return `\n${lines.join("\n")}\n`;
}

export function register(program: Command): void {
	program
		.command("show <id> [ids...]")
		.description("Show one or more issues")
		.option("--format <mode>", `Output format (${VALID_FORMATS.join("|")})`)
		.option("--json", "Output as JSON (alias for --format json)")
		.action(async (id: string, ids: string[], opts: { format?: string; json?: boolean }) => {
			const args: string[] = [id, ...ids];
			if (opts.format) args.push("--format", opts.format);
			if (opts.json) args.push("--json");
			await run(args);
		});
}
