import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readSnapshot } from "./doctor-store.ts";
import { readIssues } from "./store.ts";
import { runCli } from "./test-harness.ts";

// seeds-b79d: doctor reads every store once (readSnapshot) instead of once per
// check; its issue view must match readIssues() exactly.

let tmpDir: string;
const seedsDir = () => join(tmpDir, ".seeds");
const now = "2026-01-01T00:00:00.000Z";

function issue(id: string, extra: Record<string, unknown> = {}): string {
	const base = { title: id, status: "open", type: "task", priority: 2 };
	return JSON.stringify({ id, ...base, createdAt: now, updatedAt: now, ...extra });
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-doctor-snapshot-test-"));
	await runCli(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("readSnapshot", () => {
	test("issues match readIssues(): valid rows only, last occurrence wins", async () => {
		const rows = [
			issue("test-0001"),
			"NOT JSON",
			issue("test-0002", { priority: "high" }),
			issue("test-0003"),
			issue("test-0001", { title: "renamed" }),
			"null",
		];
		writeFileSync(join(seedsDir(), "issues.jsonl"), `${rows.join("\n")}\n`);

		const snap = readSnapshot(seedsDir());
		expect(snap.issues).toEqual(await readIssues(seedsDir()));
		expect(snap.issues.map((i) => i.title)).toEqual(["renamed", "test-0003"]);
		expect(snap.lines["issues.jsonl"]).toHaveLength(6);
		expect(snap.invalid.map((v) => v.line.lineNumber)).toEqual([3, 6]);
	});

	test("missing stores read as empty", async () => {
		await rm(join(seedsDir(), "plans.jsonl"), { force: true });
		const snap = readSnapshot(seedsDir());
		expect(snap.lines["plans.jsonl"]).toEqual([]);
		expect(snap.issues).toEqual([]);
	});
});

describe("doctor: circular-dependencies over a shared path stack", () => {
	async function cycles(rows: string[]): Promise<{ status: string; details: string[] }> {
		writeFileSync(join(seedsDir(), "issues.jsonl"), `${rows.join("\n")}\n`);
		const { stdout } = await runCli(["doctor", "--json"], tmpDir);
		const result = JSON.parse(stdout) as {
			checks: { name: string; status: string; details: string[] }[];
		};
		const found = result.checks.find((c) => c.name === "circular-dependencies");
		if (!found) throw new Error("circular-dependencies check missing");
		return found;
	}

	test("reports only the cycle, not the chain leading into it", async () => {
		// 0001 → 0002 → 0003 → 0004 → 0002
		const result = await cycles([
			issue("test-0001", { blockedBy: ["test-0002"] }),
			issue("test-0002", { blockedBy: ["test-0003"] }),
			issue("test-0003", { blockedBy: ["test-0004"] }),
			issue("test-0004", { blockedBy: ["test-0002"] }),
		]);
		expect(result.status).toBe("warn");
		expect(result.details).toEqual(["test-0002 → test-0003 → test-0004 → test-0002"]);
	});

	test("a long acyclic chain passes", async () => {
		const n = 2000;
		const id = (i: number) => `test-${i.toString(16).padStart(4, "0")}`;
		const rows = Array.from({ length: n }, (_, i) =>
			issue(id(i), i + 1 < n ? { blockedBy: [id(i + 1)] } : {}),
		);
		expect((await cycles(rows)).status).toBe("pass");
	});
});
