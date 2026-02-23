import { existsSync } from "node:fs";
import { join } from "node:path";
import { findSeedsDir, projectRootFromSeedsDir } from "../config.ts";
import { outputJson } from "../output.ts";
import { issuesPath, readIssues, withLock, writeIssues } from "../store.ts";
import type { Issue } from "../types.ts";

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
	return issue;
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const dir = seedsDir ?? (await findSeedsDir());
	const projectRoot = projectRootFromSeedsDir(dir);

	const beadsPath = join(projectRoot, ".beads", "issues.jsonl");
	if (!existsSync(beadsPath)) {
		throw new Error(`Beads issues not found at: ${beadsPath}`);
	}

	const file = Bun.file(beadsPath);
	const content = await file.text();
	const lines = content.split("\n").filter((l) => l.trim());

	const beadsIssues: BeadsIssue[] = [];
	for (const line of lines) {
		try {
			beadsIssues.push(JSON.parse(line) as BeadsIssue);
		} catch {
			// skip malformed lines
		}
	}

	const mapped: Issue[] = [];
	const skipped: string[] = [];
	for (const b of beadsIssues) {
		const issue = mapBeadsIssue(b);
		if (issue) mapped.push(issue);
		else skipped.push(b.id ?? "(unknown)");
	}

	let written = 0;
	await withLock(issuesPath(dir), async () => {
		const existing = await readIssues(dir);
		const existingIds = new Set(existing.map((i) => i.id));
		const newIssues = mapped.filter((i) => !existingIds.has(i.id));
		await writeIssues(dir, [...existing, ...newIssues]);
		written = newIssues.length;
	});

	if (jsonMode) {
		outputJson({ success: true, command: "migrate-from-beads", written, skipped: skipped.length });
	} else {
		console.log(`Migrated ${written} issues from beads.`);
		if (skipped.length > 0) {
			console.log(`Skipped ${skipped.length} malformed issues.`);
		}
	}
}
