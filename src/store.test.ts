import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { closeSync, openSync, readdirSync, utimesSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	appendIssue,
	appendPlan,
	plansPath,
	readIssues,
	readPlans,
	withLock,
	writeIssues,
	writePlans,
} from "./store";
import type { Issue, Plan } from "./types";

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	const now = new Date().toISOString();
	return {
		id: "test-a1b2",
		title: "Test issue",
		status: "open",
		type: "task",
		priority: 2,
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

let tmpDir: string;
let seedsDir: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-store-test-"));
	seedsDir = join(tmpDir, ".seeds");
	await Bun.write(join(seedsDir, ".gitignore"), "*.lock\n");
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("readIssues", () => {
	test("returns empty array when issues.jsonl does not exist", async () => {
		const issues = await readIssues(seedsDir);
		expect(issues).toEqual([]);
	});

	test("returns empty array for empty file", async () => {
		await Bun.write(join(seedsDir, "issues.jsonl"), "");
		const issues = await readIssues(seedsDir);
		expect(issues).toEqual([]);
	});

	test("reads single issue", async () => {
		const issue = makeIssue();
		await Bun.write(join(seedsDir, "issues.jsonl"), `${JSON.stringify(issue)}\n`);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]).toEqual(issue);
	});

	test("reads multiple issues", async () => {
		const issue1 = makeIssue({ id: "test-a1b2", title: "First" });
		const issue2 = makeIssue({ id: "test-c3d4", title: "Second" });
		const content = [JSON.stringify(issue1), JSON.stringify(issue2), ""].join("\n");
		await Bun.write(join(seedsDir, "issues.jsonl"), content);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(2);
		expect(issues[0]?.id).toBe("test-a1b2");
		expect(issues[1]?.id).toBe("test-c3d4");
	});

	test("deduplicates by id — last occurrence wins", async () => {
		const original = makeIssue({ id: "test-a1b2", title: "Original" });
		const updated = makeIssue({ id: "test-a1b2", title: "Updated" });
		const content = [JSON.stringify(original), JSON.stringify(updated), ""].join("\n");
		await Bun.write(join(seedsDir, "issues.jsonl"), content);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.title).toBe("Updated");
	});

	test("skips blank lines", async () => {
		const issue = makeIssue();
		const content = `\n${JSON.stringify(issue)}\n\n`;
		await Bun.write(join(seedsDir, "issues.jsonl"), content);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
	});

	test("round-trips Issue.extensions with mixed scalar, ISO8601, and nested values", async () => {
		const issue = makeIssue({
			extensions: {
				role: "refactor-bot",
				queued: true,
				attempts: 3,
				scheduledFor: "2026-05-12T03:00:00.000Z",
				lastRun: {
					id: "run-9c4d",
					at: "2026-05-10T16:57:24.830Z",
					ok: false,
				},
				tags: ["cron", "warren"],
				notes: null,
			},
		});
		await appendIssue(seedsDir, issue);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]).toEqual(issue);
		expect(issues[0]?.extensions).toEqual(issue.extensions);
	});
});

describe("appendIssue", () => {
	test("creates issues.jsonl if it does not exist", async () => {
		const issue = makeIssue();
		await appendIssue(seedsDir, issue);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]).toEqual(issue);
	});

	test("appends to existing file", async () => {
		const issue1 = makeIssue({ id: "test-a1b2" });
		const issue2 = makeIssue({ id: "test-c3d4" });
		await appendIssue(seedsDir, issue1);
		await appendIssue(seedsDir, issue2);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(2);
	});

	test("each appended issue is on its own line", async () => {
		const issue = makeIssue();
		await appendIssue(seedsDir, issue);
		const content = await Bun.file(join(seedsDir, "issues.jsonl")).text();
		const lines = content.split("\n").filter((l) => l.trim() !== "");
		expect(lines).toHaveLength(1);
		expect(JSON.parse(lines[0] ?? "{}")).toEqual(issue);
	});
});

describe("writeIssues", () => {
	test("writes issues atomically (overwrites file)", async () => {
		const original = makeIssue({ id: "test-a1b2", title: "Original" });
		await appendIssue(seedsDir, original);

		const updated = makeIssue({ id: "test-a1b2", title: "Updated" });
		await writeIssues(seedsDir, [updated]);

		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.title).toBe("Updated");
	});

	test("writes empty array as empty file", async () => {
		const issue = makeIssue();
		await appendIssue(seedsDir, issue);
		await writeIssues(seedsDir, []);
		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(0);
	});

	test("each issue serialized to its own line", async () => {
		const issues = [makeIssue({ id: "test-a1b2" }), makeIssue({ id: "test-c3d4" })];
		await writeIssues(seedsDir, issues);
		const content = await Bun.file(join(seedsDir, "issues.jsonl")).text();
		const lines = content.split("\n").filter((l) => l.trim() !== "");
		expect(lines).toHaveLength(2);
	});
});

function makePlan(overrides: Partial<Plan> = {}): Plan {
	const now = new Date().toISOString();
	return {
		id: "pl-a1b2",
		seed: "test-9c4d",
		template: "feature",
		status: "draft",
		revision: 1,
		sections: { context: "why", steps: [] },
		children: [],
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

describe("readPlans", () => {
	test("returns empty array when plans.jsonl does not exist", async () => {
		const plans = await readPlans(seedsDir);
		expect(plans).toEqual([]);
	});

	test("reads single plan", async () => {
		const plan = makePlan();
		await Bun.write(plansPath(seedsDir), `${JSON.stringify(plan)}\n`);
		const plans = await readPlans(seedsDir);
		expect(plans).toHaveLength(1);
		expect(plans[0]).toEqual(plan);
	});

	test("deduplicates by id — last occurrence wins", async () => {
		const original = makePlan({ id: "pl-a1b2", revision: 1 });
		const updated = makePlan({ id: "pl-a1b2", revision: 2 });
		const content = [JSON.stringify(original), JSON.stringify(updated), ""].join("\n");
		await Bun.write(plansPath(seedsDir), content);
		const plans = await readPlans(seedsDir);
		expect(plans).toHaveLength(1);
		expect(plans[0]?.revision).toBe(2);
	});
});

describe("appendPlan", () => {
	test("creates plans.jsonl when missing", async () => {
		const plan = makePlan();
		await appendPlan(seedsDir, plan);
		const plans = await readPlans(seedsDir);
		expect(plans).toEqual([plan]);
	});

	test("concurrent appends under withLock all land", async () => {
		await Promise.all(
			Array.from({ length: 8 }, (_, i) =>
				withLock(plansPath(seedsDir), () =>
					appendPlan(seedsDir, makePlan({ id: `pl-${i.toString(16).padStart(4, "0")}` })),
				),
			),
		);
		const plans = await readPlans(seedsDir);
		expect(plans).toHaveLength(8);
	});

	test("each appended plan is on its own line (no partial lines)", async () => {
		await appendPlan(seedsDir, makePlan({ id: "pl-aaaa" }));
		await appendPlan(seedsDir, makePlan({ id: "pl-bbbb" }));
		const content = await Bun.file(plansPath(seedsDir)).text();
		const lines = content.split("\n").filter((l) => l.trim() !== "");
		expect(lines).toHaveLength(2);
		for (const line of lines) {
			expect(() => JSON.parse(line)).not.toThrow();
		}
	});
});

describe("writePlans", () => {
	test("round-trip: write then read returns the same plans", async () => {
		const a = makePlan({ id: "pl-1111", template: "feature", revision: 3 });
		const b = makePlan({ id: "pl-2222", status: "approved", children: ["test-c001"] });
		await writePlans(seedsDir, [a, b]);
		const plans = await readPlans(seedsDir);
		expect(plans).toEqual([a, b]);
	});

	test("atomic rewrite leaves no partial line on disk", async () => {
		// Seed with one plan, then overwrite with two — confirm content is exactly the new set
		await appendPlan(seedsDir, makePlan({ id: "pl-1111" }));
		const a = makePlan({ id: "pl-aaaa" });
		const b = makePlan({ id: "pl-bbbb" });
		await writePlans(seedsDir, [a, b]);
		const content = await Bun.file(plansPath(seedsDir)).text();
		const lines = content.split("\n").filter((l) => l.trim() !== "");
		expect(lines).toHaveLength(2);
		expect(JSON.parse(lines[0] ?? "{}").id).toBe("pl-aaaa");
		expect(JSON.parse(lines[1] ?? "{}").id).toBe("pl-bbbb");
	});

	test("writes empty array as empty file", async () => {
		await appendPlan(seedsDir, makePlan());
		await writePlans(seedsDir, []);
		const plans = await readPlans(seedsDir);
		expect(plans).toEqual([]);
	});
});

describe("withLock", () => {
	test("executes function and returns result", async () => {
		const result = await withLock(seedsDir, async () => 42);
		expect(result).toBe(42);
	});

	test("serializes concurrent operations", async () => {
		// Run multiple concurrent withLock calls and verify they all succeed
		let counter = 0;
		await Promise.all(
			Array.from({ length: 5 }, () =>
				withLock(seedsDir, async () => {
					counter++;
				}),
			),
		);
		expect(counter).toBe(5);
	});

	test("releases lock even if function throws", async () => {
		await expect(
			withLock(seedsDir, async () => {
				throw new Error("intentional error");
			}),
		).rejects.toThrow("intentional error");

		// Lock should be released — another withLock should succeed
		const result = await withLock(seedsDir, async () => "ok");
		expect(result).toBe("ok");
	});

	test("reclaims a stale lock without leaving sidecar files", async () => {
		// Plant a stale lock file (mtime far in the past, well beyond LOCK_STALE_MS).
		const lockPath = `${seedsDir}.lock`;
		closeSync(openSync(lockPath, "w"));
		const past = new Date(Date.now() - 10 * 60_000);
		utimesSync(lockPath, past, past);

		const result = await withLock(seedsDir, async () => "claimed");
		expect(result).toBe("claimed");

		// No .lock and no `.lock.stale.*` sidecars should remain after release.
		const entries = readdirSync(tmpDir);
		const leftover = entries.filter(
			(name) => name.startsWith(".seeds.lock") || name === ".seeds.lock",
		);
		expect(leftover).toEqual([]);
	});

	test("serializes concurrent claimants when a stale lock is present", async () => {
		// Regression test for the TOCTOU race in acquireLock. Previously, when
		// multiple processes simultaneously detected a stale lock, each one
		// would `unlinkSync(lock)` — even after another claimant had already
		// won `openSync(wx)` for a fresh lock at the same path — allowing two
		// writers to think they held the lock at once.
		//
		// We can't trivially inject an arbitrary inter-process schedule from a
		// single-process test, but we can verify the invariant the fix
		// preserves: with a stale lock planted and N parallel claimants, the
		// critical section is still mutually exclusive and no sidecar files
		// leak. Under the old code with deliberate contention this assertion
		// would not hold; under the rename-based atomic claim, it does.
		const lockPath = `${seedsDir}.lock`;
		closeSync(openSync(lockPath, "w"));
		const past = new Date(Date.now() - 10 * 60_000);
		utimesSync(lockPath, past, past);

		let inside = 0;
		let maxInside = 0;
		let completed = 0;
		await Promise.all(
			Array.from({ length: 5 }, () =>
				withLock(seedsDir, async () => {
					inside++;
					maxInside = Math.max(maxInside, inside);
					// Yield to the event loop so any concurrency violation has a
					// chance to surface in `inside`.
					await new Promise((resolve) => setTimeout(resolve, 5));
					inside--;
					completed++;
				}),
			),
		);
		expect(completed).toBe(5);
		expect(maxInside).toBe(1);

		const entries = readdirSync(tmpDir);
		const leftover = entries.filter((name) => name.includes(".lock"));
		expect(leftover).toEqual([]);
	});
});
