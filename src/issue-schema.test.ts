import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateIssue } from "./issue-schema.ts";
import { appendIssue, readIssues, writeIssues } from "./store.ts";
import { runCli, runCliJson } from "./test-harness.ts";
import type { Issue } from "./types.ts";

let tmpDir: string;

function issue(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id,
		title: `Issue ${id}`,
		status: "open",
		type: "task",
		priority: 2,
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		...extra,
	};
}

async function writeRows(rows: unknown[]): Promise<void> {
	const content = rows.map((r) => JSON.stringify(r)).join("\n");
	await writeFile(join(tmpDir, ".seeds", "issues.jsonl"), `${content}\n`);
}

interface DoctorJson {
	checks: Array<{ name: string; status: string; details: string[] }>;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-issue-schema-test-"));
	await runCli(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("validateIssue", () => {
	test("accepts a complete row", () => {
		expect(validateIssue(issue("t-1"))).toEqual([]);
	});

	test("rejects string priority, unknown status/type, missing id", () => {
		const { id: _id, ...noId } = issue("t-1", { priority: "high", status: "done", type: "chore" });
		const problems = validateIssue(noId);
		expect(problems).toContain("missing or invalid 'id'");
		expect(problems).toContain('invalid priority "high" (must be an integer 0-4)');
		expect(problems).toContain('invalid status "done"');
		expect(problems).toContain('invalid type "chore"');
	});

	test("rejects missing status, non-integer priority, non-object rows", () => {
		const { status: _s, ...noStatus } = issue("t-1", { priority: 1.5 });
		expect(validateIssue(noStatus)).toEqual([
			"invalid status (missing)",
			"invalid priority 1.5 (must be an integer 0-4)",
		]);
		expect(validateIssue(null)).toEqual(["row is not a JSON object"]);
		expect(validateIssue([])).toEqual(["row is not a JSON object"]);
	});
});

describe("store: invalid rows are quarantined", () => {
	test("read hides invalid rows and warns once on stderr", async () => {
		await writeRows([issue("t-1"), issue("t-2", { priority: "high" }), { title: "no id" }, null]);
		const { stdout, stderr } = await runCli(["list", "--json"], tmpDir);
		const ids = (JSON.parse(stdout) as { issues: Issue[] }).issues.map((i) => i.id);
		expect(ids).toEqual(["t-1"]);
		expect(stderr).toContain("3 invalid issue row(s)");
		expect(stderr).toContain("sd doctor");
	});

	test("an invalid later row never shadows a valid row with the same id", async () => {
		await writeRows([issue("t-1"), issue("t-1", { status: "done" })]);
		const issues = await readIssues(join(tmpDir, ".seeds"));
		expect(issues.map((i) => i.status)).toEqual(["open"]);
	});

	test("rewrite keeps quarantined rows instead of deleting them", async () => {
		const bad = issue("t-2", { priority: "high" });
		await writeRows([issue("t-1"), bad]);
		const { exitCode } = await runCli(["update", "t-1", "--title", "Renamed"], tmpDir);
		expect(exitCode).toBe(0);
		const lines = (await readFile(join(tmpDir, ".seeds", "issues.jsonl"), "utf8"))
			.trim()
			.split("\n")
			.map((l) => JSON.parse(l) as Record<string, unknown>);
		expect(lines.find((r) => r.id === "t-1")?.title).toBe("Renamed");
		expect(lines).toContainEqual(bad);
	});

	test("writes refuse invalid issues", async () => {
		const dir = join(tmpDir, ".seeds");
		const bad = issue("t-9", { priority: 7 }) as unknown as Issue;
		await expect(writeIssues(dir, [bad])).rejects.toThrow(/t-9: invalid priority 7/);
		await expect(appendIssue(dir, bad)).rejects.toThrow(/Refusing to write invalid issue/);
		expect(await readIssues(dir)).toEqual([]);
	});
});

describe("doctor schema-validation uses validateIssue", () => {
	test("flags string priority and missing status", async () => {
		const { status: _s, ...noStatus } = issue("t-2");
		await writeRows([issue("t-1", { priority: "high" }), noStatus]);
		const { stdout } = await runCli(["doctor", "--json"], tmpDir);
		const result = JSON.parse(stdout) as DoctorJson;
		const check = result.checks.find((c) => c.name === "schema-validation");
		expect(check?.status).toBe("fail");
		expect(check?.details).toContain('t-1: invalid priority "high" (must be an integer 0-4)');
		expect(check?.details).toContain("t-2: invalid status (missing)");
	});
});

describe("write paths that build issues from untrusted input", () => {
	test("migrate-from-beads skips rows with an invalid priority", async () => {
		await mkdir(join(tmpDir, ".beads"));
		const beads = [
			{ id: "bd-1", title: "ok", priority: 1 },
			{ id: "bd-2", title: "bad", priority: "high" },
		];
		await writeFile(
			join(tmpDir, ".beads", "issues.jsonl"),
			`${beads.map((b) => JSON.stringify(b)).join("\n")}\n`,
		);
		const result = await runCliJson<{ written: number; skipped: number }>(
			["migrate", "--json"],
			tmpDir,
		);
		expect(result).toMatchObject({ written: 1, skipped: 1 });
	});

	test("tpl pour rejects a hand-edited step with an invalid type", async () => {
		const tpl = { id: "tpl-bad", name: "bad", steps: [{ title: "s", type: "chore" }] };
		await writeFile(join(tmpDir, ".seeds", "templates.jsonl"), `${JSON.stringify(tpl)}\n`);
		const { exitCode, stderr } = await runCli(["tpl", "pour", "tpl-bad", "--prefix", "x"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain('Template tpl-bad step 1 is invalid: invalid type "chore"');
		expect(await readIssues(join(tmpDir, ".seeds"))).toEqual([]);
	});
});
