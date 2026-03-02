import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";
import { findSeedsDir, projectRootFromSeedsDir } from "../config.ts";
import { outputJson } from "../output.ts";
import { issuesPath, readIssues, withLock, writeIssues } from "../store.ts";
import type { Issue, IssueComment } from "../types.ts";

interface BeadsComment {
	id?: number | string;
	author?: string;
	text?: string;
	body?: string;
	created_at?: string;
	createdAt?: string;
}

interface BeadsIssue {
	id?: string;
	title?: string;
	status?: string;
	issue_type?: string;
	type?: string;
	priority?: number;
	owner?: string;
	assignee?: string;
	description?: string;
	close_reason?: string;
	closeReason?: string;
	blocks?: string[];
	blocked_by?: string[];
	blockedBy?: string[];
	created_at?: string;
	createdAt?: string;
	updated_at?: string;
	updatedAt?: string;
	closed_at?: string;
	closedAt?: string;
	comments?: BeadsComment[];
}

function mapStatus(s: string | undefined): Issue["status"] {
	if (s === "in_progress" || s === "in-progress") return "in_progress";
	if (s === "closed" || s === "done" || s === "complete") return "closed";
	return "open";
}

function mapType(t: string | undefined): Issue["type"] {
	if (t === "bug") return "bug";
	if (t === "feature") return "feature";
	if (t === "epic") return "epic";
	return "task";
}

function mapBeadsIssue(b: BeadsIssue): Issue | null {
	if (!b.id || !b.title) return null;
	const now = new Date().toISOString();
	const issue: Issue = {
		id: b.id,
		title: b.title,
		status: mapStatus(b.status),
		type: mapType(b.issue_type ?? b.type),
		priority: b.priority ?? 2,
		createdAt: b.created_at ?? b.createdAt ?? now,
		updatedAt: b.updated_at ?? b.updatedAt ?? now,
	};
	const assignee = b.owner ?? b.assignee;
	if (assignee) issue.assignee = assignee;
	if (b.description) issue.description = b.description;
	const closeReason = b.close_reason ?? b.closeReason;
	if (closeReason) issue.closeReason = closeReason;
	const blockedBy = b.blocked_by ?? b.blockedBy;
	if (blockedBy?.length) issue.blockedBy = blockedBy;
	if (b.blocks?.length) issue.blocks = b.blocks;
	const closedAt = b.closed_at ?? b.closedAt;
	if (closedAt) issue.closedAt = closedAt;
	if (b.comments?.length) {
		const mapped: IssueComment[] = [];
		for (const c of b.comments) {
			const body = c.text ?? c.body;
			if (!body) continue;
			mapped.push({
				id: `c-${String(c.id ?? mapped.length)}`,
				author: c.author ?? "unknown",
				body,
				createdAt: c.created_at ?? c.createdAt ?? now,
			});
		}
		if (mapped.length > 0) issue.comments = mapped;
	}
	return issue;
}

async function loadFromJsonl(beadsPath: string): Promise<BeadsIssue[]> {
	const file = Bun.file(beadsPath);
	const content = await file.text();
	const lines = content.split("\n").filter((l) => l.trim());

	const issues: BeadsIssue[] = [];
	for (const line of lines) {
		try {
			issues.push(JSON.parse(line) as BeadsIssue);
		} catch {
			// skip malformed lines
		}
	}
	return issues;
}

async function bdAvailable(): Promise<boolean> {
	try {
		const proc = Bun.spawn(["bd", "--version"], { stdout: "pipe", stderr: "pipe" });
		await proc.exited;
		return proc.exitCode === 0;
	} catch {
		return false;
	}
}

async function loadFromDolt(projectRoot: string): Promise<BeadsIssue[]> {
	// Get all issue IDs (open + closed)
	const openProc = Bun.spawn(["bd", "list", "--json"], {
		cwd: projectRoot,
		stdout: "pipe",
		stderr: "pipe",
	});
	const openOut = await new Response(openProc.stdout).text();
	await openProc.exited;
	if (openProc.exitCode !== 0) throw new Error("Failed to run 'bd list --json'");

	const closedProc = Bun.spawn(["bd", "list", "--status", "closed", "--json"], {
		cwd: projectRoot,
		stdout: "pipe",
		stderr: "pipe",
	});
	const closedOut = await new Response(closedProc.stdout).text();
	await closedProc.exited;
	if (closedProc.exitCode !== 0) throw new Error("Failed to run 'bd list --status closed --json'");

	const openIssues = JSON.parse(openOut) as Array<{ id: string }>;
	const closedIssues = JSON.parse(closedOut) as Array<{ id: string }>;
	const allIds = [...openIssues.map((i) => i.id), ...closedIssues.map((i) => i.id)];

	const issues: BeadsIssue[] = [];
	for (const id of allIds) {
		const proc = Bun.spawn(["bd", "show", id, "--json"], {
			cwd: projectRoot,
			stdout: "pipe",
			stderr: "pipe",
		});
		const out = await new Response(proc.stdout).text();
		await proc.exited;
		if (proc.exitCode !== 0) continue;

		try {
			const data = JSON.parse(out) as BeadsIssue | BeadsIssue[];
			const issue = Array.isArray(data) ? data[0] : data;
			if (issue) issues.push(issue);
		} catch {
			// skip unparseable
		}
	}
	return issues;
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const dir = seedsDir ?? (await findSeedsDir());
	const projectRoot = projectRootFromSeedsDir(dir);

	let beadsIssues: BeadsIssue[];
	let source: string;

	const beadsPath = join(projectRoot, ".beads", "issues.jsonl");
	if (existsSync(beadsPath)) {
		// Legacy beads: JSONL file exists
		beadsIssues = await loadFromJsonl(beadsPath);
		source = "jsonl";
	} else if (existsSync(join(projectRoot, ".beads")) && (await bdAvailable())) {
		// Modern beads (Dolt): .beads/ directory exists but no JSONL, use bd CLI
		beadsIssues = await loadFromDolt(projectRoot);
		source = "dolt";
	} else {
		throw new Error(
			"No beads data found. Expected .beads/issues.jsonl (legacy) or .beads/ directory with 'bd' CLI available (Dolt).",
		);
	}

	const mapped: Issue[] = [];
	const skipped: string[] = [];
	for (const b of beadsIssues) {
		const issue = mapBeadsIssue(b);
		if (issue) mapped.push(issue);
		else skipped.push(b.id ?? "(unknown)");
	}

	let written = 0;
	let commentCount = 0;
	await withLock(issuesPath(dir), async () => {
		const existing = await readIssues(dir);
		const existingIds = new Set(existing.map((i) => i.id));
		const newIssues = mapped.filter((i) => !existingIds.has(i.id));
		await writeIssues(dir, [...existing, ...newIssues]);
		written = newIssues.length;
		commentCount = newIssues.reduce((sum, i) => sum + (i.comments?.length ?? 0), 0);
	});

	if (jsonMode) {
		outputJson({
			success: true,
			command: "migrate-from-beads",
			written,
			comments: commentCount,
			skipped: skipped.length,
			source,
		});
	} else {
		const sourceLabel = source === "dolt" ? " (via bd CLI)" : " (from JSONL)";
		console.log(`Migrated ${written} issues (${commentCount} comments) from beads${sourceLabel}.`);
		if (skipped.length > 0) {
			console.log(`Skipped ${skipped.length} malformed issues.`);
		}
	}
}

export function register(program: Command): void {
	program
		.command("migrate-from-beads")
		.description("Migrate issues from beads issue tracker")
		.option("--json", "Output as JSON")
		.action(async (opts: { json?: boolean }) => {
			await run(opts.json ? ["--json"] : []);
		});
}
