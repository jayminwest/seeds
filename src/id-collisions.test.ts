import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dedupKey, findIdCollisions } from "./id-collisions.ts";
import { runCli } from "./test-harness.ts";

function issue(id: string, title: string, createdAt: string, updatedAt = createdAt) {
	return { id, title, status: "open", type: "task", priority: 2, createdAt, updatedAt };
}

describe("findIdCollisions", () => {
	test("same id + same createdAt is an edit, not a collision", () => {
		const rows = [issue("p-0001", "A", "t1"), issue("p-0001", "A edited", "t1", "t2")];
		expect(findIdCollisions(rows).size).toBe(0);
	});

	test("same id + different createdAt is a collision", () => {
		const rows = [
			issue("p-0001", "A", "t1"),
			issue("p-0001", "B", "t2"),
			issue("p-0002", "C", "t1"),
		];
		expect([...findIdCollisions(rows)]).toEqual(["p-0001"]);
	});

	test("ignores non-objects and rows without a string id", () => {
		expect(findIdCollisions([null, 3, "x", { id: 1 }, undefined]).size).toBe(0);
	});

	test("dedupKey separates collided ids by createdAt only", () => {
		const collisions = new Set(["p-0001"]);
		expect(dedupKey(issue("p-0002", "C", "t1"), collisions)).toBe("p-0002");
		expect(dedupKey(issue("p-0001", "A", "t1"), collisions)).not.toBe(
			dedupKey(issue("p-0001", "B", "t2"), collisions),
		);
	});
});

describe("doctor: id collisions", () => {
	let tmpDir: string;
	let issuesPath: string;

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), "seeds-collision-test-"));
		await runCli(["init"], tmpDir);
		issuesPath = join(tmpDir, ".seeds", "issues.jsonl");
		// Two branches minted p-0001 independently; branch A also edited theirs once.
		const rows = [
			issue("p-0001", "Branch A", "2026-01-01T00:00:00.000Z"),
			issue("p-0001", "Branch A edited", "2026-01-01T00:00:00.000Z", "2026-01-03T00:00:00.000Z"),
			issue("p-0001", "Branch B", "2026-01-02T00:00:00.000Z"),
		];
		writeFileSync(issuesPath, `${rows.map((r) => JSON.stringify(r)).join("\n")}\n`);
	});

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true });
	});

	interface Check {
		name: string;
		status: string;
		message: string;
		details: string[];
	}

	async function duplicateCheck(args: string[]): Promise<Check | undefined> {
		const { stdout } = await runCli([...args, "--json"], tmpDir);
		const result = JSON.parse(stdout) as { checks: Check[] };
		return result.checks.find((c) => c.name === "duplicate-ids");
	}

	test("flags differing createdAt as a collision (fail), not an edit", async () => {
		const check = await duplicateCheck(["doctor"]);
		expect(check?.status).toBe("fail");
		expect(check?.message).toContain("1 collision(s)");
		expect(check?.details[0]).toContain("p-0001: ID collision in issues.jsonl");
	});

	test("--fix collapses edits but keeps both colliding issues", async () => {
		const check = await duplicateCheck(["doctor", "--fix"]);
		expect(check?.status).toBe("fail");
		const titles = readFileSync(issuesPath, "utf8")
			.trim()
			.split("\n")
			.map((l) => (JSON.parse(l) as { title: string }).title);
		expect(titles.sort()).toEqual(["Branch A edited", "Branch B"]);
	});
});
