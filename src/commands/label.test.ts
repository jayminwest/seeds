import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";

let tmpDir: string;

async function run(
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return runCli(args, cwd);
}

async function runJson<T = unknown>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

let id1: string;
let id2: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-label-test-"));
	await run(["init"], tmpDir);

	const c1 = await runJson<{ success: boolean; id: string }>(
		["create", "--title", "Issue A"],
		tmpDir,
	);
	const c2 = await runJson<{ success: boolean; id: string }>(
		["create", "--title", "Issue B"],
		tmpDir,
	);
	id1 = c1.id;
	id2 = c2.id;
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd label add", () => {
	test("adds a single label", async () => {
		const result = await runJson<{ success: boolean }>(["label", "add", id1, "bug"], tmpDir);
		expect(result.success).toBe(true);

		const show = await runJson<{ success: boolean; issue: { labels?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.labels).toContain("bug");
	});

	test("adds multiple labels at once", async () => {
		await run(["label", "add", id1, "bug", "ui", "urgent"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { labels?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.labels).toContain("bug");
		expect(show.issue.labels).toContain("ui");
		expect(show.issue.labels).toContain("urgent");
	});

	test("deduplicates labels", async () => {
		await run(["label", "add", id1, "bug"], tmpDir);
		await run(["label", "add", id1, "bug"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { labels?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		const count = show.issue.labels?.filter((l) => l === "bug").length ?? 0;
		expect(count).toBe(1);
	});

	test("normalizes labels to lowercase", async () => {
		await run(["label", "add", id1, "BUG", "UI"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { labels?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.labels).toContain("bug");
		expect(show.issue.labels).toContain("ui");
	});

	test("fails if issue not found", async () => {
		const { exitCode } = await run(["label", "add", "proj-ffff", "bug"], tmpDir);
		expect(exitCode).not.toBe(0);
	});
});

describe("sd label remove", () => {
	beforeEach(async () => {
		await run(["label", "add", id1, "bug", "ui", "urgent"], tmpDir);
	});

	test("removes a label", async () => {
		await run(["label", "remove", id1, "bug"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { labels?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.labels ?? []).not.toContain("bug");
		expect(show.issue.labels).toContain("ui");
	});

	test("removing non-existent label is a no-op", async () => {
		const result = await runJson<{ success: boolean }>(
			["label", "remove", id1, "nonexistent"],
			tmpDir,
		);
		expect(result.success).toBe(true);
	});

	test("removing last label results in no labels field", async () => {
		await run(["label", "remove", id1, "bug", "ui", "urgent"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { labels?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.labels).toBeUndefined();
	});

	test("fails if issue not found", async () => {
		const { exitCode } = await run(["label", "remove", "proj-ffff", "bug"], tmpDir);
		expect(exitCode).not.toBe(0);
	});
});

describe("sd label list", () => {
	test("lists labels for an issue", async () => {
		await run(["label", "add", id1, "bug", "ui"], tmpDir);
		const result = await runJson<{ success: boolean; labels: string[] }>(
			["label", "list", id1],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.labels).toContain("bug");
		expect(result.labels).toContain("ui");
	});

	test("shows empty for issue with no labels", async () => {
		const result = await runJson<{ success: boolean; labels: string[] }>(
			["label", "list", id1],
			tmpDir,
		);
		expect(result.labels).toHaveLength(0);
	});

	test("fails if issue not found", async () => {
		const { exitCode } = await run(["label", "list", "proj-ffff"], tmpDir);
		expect(exitCode).not.toBe(0);
	});
});

describe("sd label list-all", () => {
	test("collects labels across all issues", async () => {
		await run(["label", "add", id1, "bug", "ui"], tmpDir);
		await run(["label", "add", id2, "bug", "backend"], tmpDir);
		const result = await runJson<{
			success: boolean;
			labels: string[];
			counts: Record<string, number>;
		}>(["label", "list-all"], tmpDir);
		expect(result.labels).toContain("bug");
		expect(result.labels).toContain("ui");
		expect(result.labels).toContain("backend");
		expect(result.counts.bug).toBe(2);
		expect(result.counts.ui).toBe(1);
	});

	test("returns empty when no issues have labels", async () => {
		const result = await runJson<{ success: boolean; labels: string[] }>(
			["label", "list-all"],
			tmpDir,
		);
		expect(result.labels).toHaveLength(0);
	});
});

describe("sd create --labels", () => {
	test("creates issue with labels", async () => {
		const result = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "Labeled issue", "--labels", "bug,ui"],
			tmpDir,
		);
		expect(result.success).toBe(true);

		const show = await runJson<{ success: boolean; issue: { labels?: string[] } }>(
			["show", result.id],
			tmpDir,
		);
		expect(show.issue.labels).toContain("bug");
		expect(show.issue.labels).toContain("ui");
	});
});

describe("sd update label flags", () => {
	test("--add-label adds labels", async () => {
		await run(["update", id1, "--add-label", "bug,ui"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { labels?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.labels).toContain("bug");
		expect(show.issue.labels).toContain("ui");
	});

	test("--remove-label removes labels", async () => {
		await run(["label", "add", id1, "bug", "ui", "urgent"], tmpDir);
		await run(["update", id1, "--remove-label", "bug"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { labels?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.labels ?? []).not.toContain("bug");
		expect(show.issue.labels).toContain("ui");
	});

	test("--set-labels replaces all labels", async () => {
		await run(["label", "add", id1, "bug", "ui"], tmpDir);
		await run(["update", id1, "--set-labels", "backend,api"], tmpDir);
		const show = await runJson<{ success: boolean; issue: { labels?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.labels).toContain("backend");
		expect(show.issue.labels).toContain("api");
		expect(show.issue.labels ?? []).not.toContain("bug");
	});

	test("--set-labels with empty string clears labels", async () => {
		await run(["label", "add", id1, "bug"], tmpDir);
		await run(["update", id1, "--set-labels", ""], tmpDir);
		const show = await runJson<{ success: boolean; issue: { labels?: string[] } }>(
			["show", id1],
			tmpDir,
		);
		expect(show.issue.labels).toBeUndefined();
	});
});

describe("sd list label filters", () => {
	beforeEach(async () => {
		await run(["label", "add", id1, "bug", "ui"], tmpDir);
		await run(["label", "add", id2, "bug", "backend"], tmpDir);
	});

	test("--label filters with AND logic", async () => {
		const result = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["list", "--label", "bug,ui"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(id1);
		expect(ids).not.toContain(id2);
	});

	test("--label with single label", async () => {
		const result = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["list", "--label", "bug"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(id1);
		expect(ids).toContain(id2);
	});

	test("--label-any filters with OR logic", async () => {
		const result = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["list", "--label-any", "ui,backend"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(id1);
		expect(ids).toContain(id2);
	});

	test("--unlabeled returns only unlabeled issues", async () => {
		// Create an unlabeled issue
		const c3 = await runJson<{ success: boolean; id: string }>(
			["create", "--title", "No labels"],
			tmpDir,
		);
		const result = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["list", "--unlabeled"],
			tmpDir,
		);
		const ids = result.issues.map((i) => i.id);
		expect(ids).toContain(c3.id);
		expect(ids).not.toContain(id1);
		expect(ids).not.toContain(id2);
	});
});

describe("sd stats with labels", () => {
	test("includes byLabel in stats", async () => {
		await run(["label", "add", id1, "bug", "ui"], tmpDir);
		await run(["label", "add", id2, "bug"], tmpDir);
		const result = await runJson<{
			success: boolean;
			stats: { byLabel: Record<string, number> };
		}>(["stats"], tmpDir);
		expect(result.stats.byLabel.bug).toBe(2);
		expect(result.stats.byLabel.ui).toBe(1);
	});
});
