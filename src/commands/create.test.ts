import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readIssues } from "../store.ts";
import { run as runCreate } from "./create.ts";
import { run as runShow } from "./show.ts";

let tmpDir: string;
let seedsDir: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "seeds-create-test-"));
	seedsDir = join(tmpDir, ".seeds");
	mkdirSync(seedsDir, { recursive: true });
	writeFileSync(join(seedsDir, "config.yaml"), 'project: "testproj"\nversion: "1"\n');
	writeFileSync(join(seedsDir, "issues.jsonl"), "");
	writeFileSync(join(seedsDir, "templates.jsonl"), "");
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

describe("sd create", () => {
	test("creates an issue with required title", async () => {
		await runCreate(["--title", "My test issue"], seedsDir);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.title).toBe("My test issue");
	});

	test("issue has correct defaults", async () => {
		await runCreate(["--title", "Test"], seedsDir);
		const issues = await readIssues(seedsDir);
		const issue = issues[0]!;
		expect(issue.status).toBe("open");
		expect(issue.type).toBe("task");
		expect(issue.priority).toBe(2);
	});

	test("respects --type flag", async () => {
		await runCreate(["--title", "Bug", "--type", "bug"], seedsDir);
		const issues = await readIssues(seedsDir);
		expect(issues[0]?.type).toBe("bug");
	});

	test("respects --priority flag (numeric)", async () => {
		await runCreate(["--title", "Critical", "--priority", "0"], seedsDir);
		const issues = await readIssues(seedsDir);
		expect(issues[0]?.priority).toBe(0);
	});

	test("respects --priority flag (P-notation)", async () => {
		await runCreate(["--title", "High", "--priority", "P1"], seedsDir);
		const issues = await readIssues(seedsDir);
		expect(issues[0]?.priority).toBe(1);
	});

	test("respects --assignee flag", async () => {
		await runCreate(["--title", "Assigned", "--assignee", "builder-1"], seedsDir);
		const issues = await readIssues(seedsDir);
		expect(issues[0]?.assignee).toBe("builder-1");
	});

	test("respects --description flag", async () => {
		await runCreate(["--title", "Described", "--description", "Detailed description"], seedsDir);
		const issues = await readIssues(seedsDir);
		expect(issues[0]?.description).toBe("Detailed description");
	});

	test("id uses project prefix", async () => {
		await runCreate(["--title", "Test"], seedsDir);
		const issues = await readIssues(seedsDir);
		expect(issues[0]?.id.startsWith("testproj-")).toBe(true);
	});

	test("throws if --title missing", async () => {
		await expect(runCreate([], seedsDir)).rejects.toThrow("--title is required");
	});

	test("throws on invalid --type", async () => {
		await expect(runCreate(["--title", "T", "--type", "invalid"], seedsDir)).rejects.toThrow();
	});

	test("creates multiple issues with unique ids", async () => {
		await runCreate(["--title", "First"], seedsDir);
		await runCreate(["--title", "Second"], seedsDir);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(2);
		expect(issues[0]?.id).not.toBe(issues[1]?.id);
	});

	test("has createdAt and updatedAt timestamps", async () => {
		await runCreate(["--title", "Timed"], seedsDir);
		const issues = await readIssues(seedsDir);
		const issue = issues[0]!;
		expect(issue.createdAt).toBeTruthy();
		expect(issue.updatedAt).toBeTruthy();
	});
});

describe("sd show", () => {
	test("shows existing issue", async () => {
		await runCreate(["--title", "My issue"], seedsDir);
		const issues = await readIssues(seedsDir);
		const id = issues[0]?.id ?? "";
		// Should not throw
		await runShow([id], seedsDir);
	});

	test("throws for unknown id", async () => {
		await expect(runShow(["testproj-0000"], seedsDir)).rejects.toThrow("not found");
	});
});
