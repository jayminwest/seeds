import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { computeMetrics } from "../graph.ts";
import { accent, brand, muted, outputJson, printIssueOneLine } from "../output.ts";
import { readIssues } from "../store.ts";
import type { Issue } from "../types.ts";

interface TriageEntry {
	id: string;
	title: string;
	status: Issue["status"];
	priority: number;
	pagerank: number;
	betweenness: number;
	criticalPathLength: number;
	score: number;
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const limitArg = args.indexOf("--limit");
	const limit = limitArg !== -1 ? Number(args[limitArg + 1] ?? 0) : 0;

	const dir = seedsDir ?? (await findSeedsDir());
	const issues = await readIssues(dir);

	// Only open issues participate — same eligibility as `sd ready`
	const closedIds = new Set(issues.filter((i) => i.status === "closed").map((i) => i.id));
	const openIssues = issues.filter((i) => i.status !== "closed");

	// Compute metrics across all open issues (blocked ones inform the graph)
	const metrics = computeMetrics(openIssues);

	// Ready = open + all blockers closed
	const ready = openIssues.filter((i) => (i.blockedBy ?? []).every((bid) => closedIds.has(bid)));

	// Sort ready issues by composite score descending
	const ranked = ready
		.map((issue): TriageEntry => {
			const m = metrics.get(issue.id);
			return {
				id: issue.id,
				title: issue.title,
				status: issue.status,
				priority: issue.priority,
				pagerank: m?.pagerank ?? 0,
				betweenness: m?.betweenness ?? 0,
				criticalPathLength: m?.criticalPathLength ?? 0,
				score: m?.score ?? 0,
			};
		})
		.sort((a, b) => b.score - a.score || a.priority - b.priority);

	const output = limit > 0 ? ranked.slice(0, limit) : ranked;

	if (jsonMode) {
		outputJson({ success: true, command: "triage", issues: output, count: output.length });
		return;
	}

	if (output.length === 0) {
		console.log("No ready issues.");
		return;
	}

	for (const entry of output) {
		const issue = issues.find((i) => i.id === entry.id);
		if (issue) {
			printIssueOneLine(issue);
			const scoreStr = brand(`${(entry.score * 100).toFixed(0)}pts`);
			const cpStr = entry.criticalPathLength > 0 ? ` · cp:${entry.criticalPathLength}` : "";
			const bStr = entry.betweenness > 0.01 ? ` · btw:${entry.betweenness.toFixed(2)}` : "";
			console.log(`    ${muted("score:")} ${scoreStr}${cpStr}${bStr}`);
		}
	}
	console.log(`\n${accent(`${output.length} ready issue(s)`)} ${muted("(ranked by graph score)")}`);
}

export function register(program: Command): void {
	program
		.command("triage")
		.description("Ready issues ranked by graph score (PageRank + betweenness + critical path)")
		.option("--json", "Output as JSON")
		.option("--limit <n>", "Return top N issues only")
		.action(async (opts: { json?: boolean; limit?: string }) => {
			const args: string[] = [];
			if (opts.json) args.push("--json");
			if (opts.limit) args.push("--limit", opts.limit);
			await run(args);
		});
}
