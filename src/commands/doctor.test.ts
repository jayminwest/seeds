import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;

const CLI = join(import.meta.dir, "../../src/index.ts");

async function run(
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(["bun", "run", CLI, ...args], {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
	});
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	return { stdout, stderr, exitCode };
}

async function runJson<T = unknown>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

interface DoctorResult {
	success: boolean;
	command: string;
	checks: Array<{
		name: string;
		status: "pass" | "warn" | "fail";
		message: string;
		details: string[];
		fixable: boolean;
	}>;
	summary: { pass: number; warn: number; fail: number };
	fixed?: string[];
}

function seedsDir(dir: string): string {
	return join(dir, ".seeds");
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-doctor-test-"));
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("doctor: config check", () => {
	test("fails when .seeds/ directory is missing", async () => {
		const { exitCode } = await run(["doctor"], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	test("passes with valid config", async () => {
		await run(["init"], tmpDir);
		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const configCheck = result.checks.find((ch) => ch.name === "config");
		expect(configCheck?.status).toBe("pass");
	});
});

describe("doctor: jsonl-integrity check", () => {
	test("fails on malformed JSON lines", async () => {
		await run(["init"], tmpDir);
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), '{"id":"a"}\nNOT JSON\n');

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "jsonl-integrity");
		expect(check?.status).toBe("fail");
		expect(check?.details.length).toBeGreaterThan(0);
	});

	test("passes with clean JSONL", async () => {
		await run(["init"], tmpDir);
		await run(["create", "--title", "Test issue"], tmpDir);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "jsonl-integrity");
		expect(check?.status).toBe("pass");
	});

	test("--fix removes malformed lines", async () => {
		await run(["init"], tmpDir);
		// Create a valid issue first, then corrupt the file
		await run(["create", "--title", "Valid issue"], tmpDir);
		const content = readFileSync(join(seedsDir(tmpDir), "issues.jsonl"), "utf8");
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${content}BROKEN LINE\n`);

		// Verify broken
		const before = await runJson<DoctorResult>(["doctor"], tmpDir);
		const beforeCheck = before.checks.find((ch) => ch.name === "jsonl-integrity");
		expect(beforeCheck?.status).toBe("fail");

		// Fix
		const after = await runJson<DoctorResult>(["doctor", "--fix"], tmpDir);
		const afterCheck = after.checks.find((ch) => ch.name === "jsonl-integrity");
		expect(afterCheck?.status).toBe("pass");
		expect(after.fixed).toBeDefined();
		expect(after.fixed!.length).toBeGreaterThan(0);
	});
});

describe("doctor: schema-validation check", () => {
	test("fails with invalid status", async () => {
		await run(["init"], tmpDir);
		const now = new Date().toISOString();
		const bad = JSON.stringify({
			id: "test-0001",
			title: "Bad",
			status: "invalid_status",
			type: "task",
			priority: 2,
			createdAt: now,
			updatedAt: now,
		});
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${bad}\n`);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "schema-validation");
		expect(check?.status).toBe("fail");
	});

	test("fails with invalid type", async () => {
		await run(["init"], tmpDir);
		const now = new Date().toISOString();
		const bad = JSON.stringify({
			id: "test-0001",
			title: "Bad",
			status: "open",
			type: "invalid_type",
			priority: 2,
			createdAt: now,
			updatedAt: now,
		});
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${bad}\n`);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "schema-validation");
		expect(check?.status).toBe("fail");
	});

	test("fails with invalid priority", async () => {
		await run(["init"], tmpDir);
		const now = new Date().toISOString();
		const bad = JSON.stringify({
			id: "test-0001",
			title: "Bad",
			status: "open",
			type: "task",
			priority: 9,
			createdAt: now,
			updatedAt: now,
		});
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${bad}\n`);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "schema-validation");
		expect(check?.status).toBe("fail");
	});

	test("passes with valid issues", async () => {
		await run(["init"], tmpDir);
		await run(["create", "--title", "Valid issue"], tmpDir);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "schema-validation");
		expect(check?.status).toBe("pass");
	});
});

describe("doctor: duplicate-ids check", () => {
	test("warns on duplicate IDs", async () => {
		await run(["init"], tmpDir);
		const now = new Date().toISOString();
		const issue = {
			id: "test-0001",
			title: "Dup",
			status: "open",
			type: "task",
			priority: 2,
			createdAt: now,
			updatedAt: now,
		};
		const line = JSON.stringify(issue);
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${line}\n${line}\n`);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "duplicate-ids");
		expect(check?.status).toBe("warn");
	});

	test("passes with unique IDs", async () => {
		await run(["init"], tmpDir);
		await run(["create", "--title", "Issue 1"], tmpDir);
		await run(["create", "--title", "Issue 2"], tmpDir);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "duplicate-ids");
		expect(check?.status).toBe("pass");
	});

	test("--fix deduplicates", async () => {
		await run(["init"], tmpDir);
		const now = new Date().toISOString();
		const issue = {
			id: "test-0001",
			title: "Dup",
			status: "open",
			type: "task",
			priority: 2,
			createdAt: now,
			updatedAt: now,
		};
		const line = JSON.stringify(issue);
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${line}\n${line}\n`);

		const after = await runJson<DoctorResult>(["doctor", "--fix"], tmpDir);
		const check = after.checks.find((ch) => ch.name === "duplicate-ids");
		expect(check?.status).toBe("pass");
	});
});

describe("doctor: referential-integrity check", () => {
	test("warns on dangling dependency reference", async () => {
		await run(["init"], tmpDir);
		const now = new Date().toISOString();
		const issue = JSON.stringify({
			id: "test-0001",
			title: "Orphan ref",
			status: "open",
			type: "task",
			priority: 2,
			blockedBy: ["test-xxxx"],
			createdAt: now,
			updatedAt: now,
		});
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${issue}\n`);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "referential-integrity");
		expect(check?.status).toBe("warn");
		expect(check?.details[0]).toContain("test-xxxx");
	});

	test("passes with valid references", async () => {
		await run(["init"], tmpDir);
		const c1 = await runJson<{ id: string }>(["create", "--title", "A"], tmpDir);
		const c2 = await runJson<{ id: string }>(["create", "--title", "B"], tmpDir);
		await run(["dep", "add", c2.id, c1.id], tmpDir);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "referential-integrity");
		expect(check?.status).toBe("pass");
	});

	test("--fix removes dangling references", async () => {
		await run(["init"], tmpDir);
		const now = new Date().toISOString();
		const issue = JSON.stringify({
			id: "test-0001",
			title: "Orphan ref",
			status: "open",
			type: "task",
			priority: 2,
			blockedBy: ["test-xxxx"],
			createdAt: now,
			updatedAt: now,
		});
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${issue}\n`);

		const after = await runJson<DoctorResult>(["doctor", "--fix"], tmpDir);
		const check = after.checks.find((ch) => ch.name === "referential-integrity");
		expect(check?.status).toBe("pass");
	});
});

describe("doctor: bidirectional-consistency check", () => {
	test("warns when back-reference is missing", async () => {
		await run(["init"], tmpDir);
		const now = new Date().toISOString();
		const issueA = JSON.stringify({
			id: "test-0001",
			title: "A",
			status: "open",
			type: "task",
			priority: 2,
			blockedBy: ["test-0002"],
			createdAt: now,
			updatedAt: now,
		});
		const issueB = JSON.stringify({
			id: "test-0002",
			title: "B",
			status: "open",
			type: "task",
			priority: 2,
			createdAt: now,
			updatedAt: now,
		});
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${issueA}\n${issueB}\n`);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "bidirectional-consistency");
		expect(check?.status).toBe("warn");
	});

	test("--fix adds missing back-references", async () => {
		await run(["init"], tmpDir);
		const now = new Date().toISOString();
		const issueA = JSON.stringify({
			id: "test-0001",
			title: "A",
			status: "open",
			type: "task",
			priority: 2,
			blockedBy: ["test-0002"],
			createdAt: now,
			updatedAt: now,
		});
		const issueB = JSON.stringify({
			id: "test-0002",
			title: "B",
			status: "open",
			type: "task",
			priority: 2,
			createdAt: now,
			updatedAt: now,
		});
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${issueA}\n${issueB}\n`);

		const after = await runJson<DoctorResult>(["doctor", "--fix"], tmpDir);
		const check = after.checks.find((ch) => ch.name === "bidirectional-consistency");
		expect(check?.status).toBe("pass");
	});
});

describe("doctor: circular-dependencies check", () => {
	test("warns on circular dependency", async () => {
		await run(["init"], tmpDir);
		const now = new Date().toISOString();
		const issueA = JSON.stringify({
			id: "test-0001",
			title: "A",
			status: "open",
			type: "task",
			priority: 2,
			blockedBy: ["test-0002"],
			blocks: ["test-0002"],
			createdAt: now,
			updatedAt: now,
		});
		const issueB = JSON.stringify({
			id: "test-0002",
			title: "B",
			status: "open",
			type: "task",
			priority: 2,
			blockedBy: ["test-0001"],
			blocks: ["test-0001"],
			createdAt: now,
			updatedAt: now,
		});
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${issueA}\n${issueB}\n`);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "circular-dependencies");
		expect(check?.status).toBe("warn");
	});

	test("passes with DAG (no cycles)", async () => {
		await run(["init"], tmpDir);
		const c1 = await runJson<{ id: string }>(["create", "--title", "A"], tmpDir);
		const c2 = await runJson<{ id: string }>(["create", "--title", "B"], tmpDir);
		await run(["dep", "add", c2.id, c1.id], tmpDir);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "circular-dependencies");
		expect(check?.status).toBe("pass");
	});
});

describe("doctor: stale-locks check", () => {
	test("warns on stale lock file", async () => {
		await run(["init"], tmpDir);
		const lockPath = join(seedsDir(tmpDir), "issues.jsonl.lock");
		writeFileSync(lockPath, "");
		// Set mtime to 60s ago to make it stale
		const past = new Date(Date.now() - 60_000);
		const { utimesSync } = await import("node:fs");
		utimesSync(lockPath, past, past);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "stale-locks");
		expect(check?.status).toBe("warn");
	});

	test("passes when no lock files", async () => {
		await run(["init"], tmpDir);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "stale-locks");
		expect(check?.status).toBe("pass");
	});

	test("--fix removes stale lock files", async () => {
		await run(["init"], tmpDir);
		const lockPath = join(seedsDir(tmpDir), "issues.jsonl.lock");
		writeFileSync(lockPath, "");
		const past = new Date(Date.now() - 60_000);
		const { utimesSync } = await import("node:fs");
		utimesSync(lockPath, past, past);

		await runJson<DoctorResult>(["doctor", "--fix"], tmpDir);
		expect(existsSync(lockPath)).toBe(false);
	});
});

describe("doctor: gitattributes check", () => {
	test("warns when .gitattributes is missing", async () => {
		await run(["init"], tmpDir);
		// Remove the .gitattributes created by init
		const gitattrsPath = join(tmpDir, ".gitattributes");
		if (existsSync(gitattrsPath)) {
			const { unlinkSync } = await import("node:fs");
			unlinkSync(gitattrsPath);
		}

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "gitattributes");
		expect(check?.status).toBe("warn");
	});

	test("passes when entries are present", async () => {
		await run(["init"], tmpDir);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "gitattributes");
		expect(check?.status).toBe("pass");
	});

	test("--fix adds missing entries", async () => {
		await run(["init"], tmpDir);
		const gitattrsPath = join(tmpDir, ".gitattributes");
		writeFileSync(gitattrsPath, "# empty\n");

		const after = await runJson<DoctorResult>(["doctor", "--fix"], tmpDir);
		const check = after.checks.find((ch) => ch.name === "gitattributes");
		expect(check?.status).toBe("pass");

		const content = readFileSync(gitattrsPath, "utf8");
		expect(content).toContain(".seeds/issues.jsonl merge=union");
		expect(content).toContain(".seeds/templates.jsonl merge=union");
	});
});

describe("doctor: json output", () => {
	test("--json returns structured output", async () => {
		await run(["init"], tmpDir);
		const result = await runJson<DoctorResult>(["doctor"], tmpDir);

		expect(result.success).toBe(true);
		expect(result.command).toBe("doctor");
		expect(Array.isArray(result.checks)).toBe(true);
		expect(result.checks.length).toBeGreaterThan(0);
		expect(result.summary).toBeDefined();
		expect(typeof result.summary.pass).toBe("number");
		expect(typeof result.summary.warn).toBe("number");
		expect(typeof result.summary.fail).toBe("number");
	});

	test("all checks pass on clean project", async () => {
		await run(["init"], tmpDir);
		const result = await runJson<DoctorResult>(["doctor"], tmpDir);

		expect(result.success).toBe(true);
		expect(result.summary.fail).toBe(0);
		expect(result.summary.warn).toBe(0);
		expect(result.summary.pass).toBe(9);
	});
});

describe("doctor: exit code", () => {
	test("exits 0 when all pass", async () => {
		await run(["init"], tmpDir);
		const { exitCode } = await run(["doctor"], tmpDir);
		expect(exitCode).toBe(0);
	});

	test("exits 0 when only warnings", async () => {
		await run(["init"], tmpDir);
		const now = new Date().toISOString();
		const issue = JSON.stringify({
			id: "test-0001",
			title: "Orphan",
			status: "open",
			type: "task",
			priority: 2,
			blockedBy: ["test-xxxx"],
			createdAt: now,
			updatedAt: now,
		});
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), `${issue}\n`);

		const { exitCode } = await run(["doctor"], tmpDir);
		expect(exitCode).toBe(0);
	});

	test("exits 1 when failures present", async () => {
		await run(["init"], tmpDir);
		writeFileSync(join(seedsDir(tmpDir), "issues.jsonl"), "NOT JSON\n");

		const { exitCode } = await run(["doctor"], tmpDir);
		expect(exitCode).toBe(1);
	});
});
