import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertNoCycles, planEdges } from "./dep-graph.ts";
import { runCli } from "./test-harness.ts";
import type { Issue } from "./types.ts";

function issue(id: string, blockedBy?: string[], status: Issue["status"] = "open"): Issue {
	const now = new Date().toISOString();
	return {
		id,
		title: id,
		status,
		type: "task",
		priority: 2,
		blockedBy,
		createdAt: now,
		updatedAt: now,
	};
}

describe("assertNoCycles", () => {
	test("accepts an edge that keeps the graph acyclic", () => {
		expect(() => assertNoCycles([issue("a"), issue("b", ["a"])], [["c", "b"]])).not.toThrow();
	});

	test("rejects a direct two-node cycle and names the path", () => {
		expect(() => assertNoCycles([issue("a"), issue("b", ["a"])], [["a", "b"]])).toThrow(
			"would create cycle a → b → a",
		);
	});

	test("rejects a transitive cycle with the shortest path", () => {
		const issues = [issue("a"), issue("b", ["a"]), issue("c", ["b", "a"])];
		expect(() => assertNoCycles(issues, [["a", "c"]])).toThrow("would create cycle a → c → a");
	});

	test("closed issues participate (their blockedBy edges survive close)", () => {
		const issues = [issue("a", undefined, "closed"), issue("b", ["a"], "closed")];
		expect(() => assertNoCycles(issues, [["a", "b"]])).toThrow("cycle a → b → a");
	});

	test("works on the post-mutation graph without tripping on the edge itself", () => {
		expect(() => assertNoCycles([issue("a", ["b"]), issue("b")], [["a", "b"]])).not.toThrow();
		const cyclic = [issue("a", ["b"]), issue("b", ["a"])];
		expect(() => assertNoCycles(cyclic, [["a", "b"]])).toThrow("cycle a → b → a");
	});

	test("ignores an unrelated pre-existing cycle", () => {
		const issues = [issue("a", ["b"]), issue("b", ["a"]), issue("c"), issue("d")];
		expect(() => assertNoCycles(issues, [["c", "d"]])).not.toThrow();
	});
});

describe("planEdges", () => {
	test("parent blocked by each child; step.blocks is 1-based forward", () => {
		const edges = planEdges("p", ["x", "y", "z"], [{ blocks: [2] }, {}, { blocks: [9] }]);
		expect(edges).toEqual([
			["p", "x"],
			["p", "y"],
			["p", "z"],
			["y", "x"],
		]);
	});
});

describe("cycle refusal at the CLI", () => {
	let tmpDir: string;
	const ids: string[] = [];

	async function create(title: string): Promise<string> {
		const { stdout } = await runCli(["create", "--title", title, "--json"], tmpDir);
		return (JSON.parse(stdout) as { id: string }).id;
	}

	async function blockedBy(id: string): Promise<string[] | undefined> {
		const { stdout } = await runCli(["show", id, "--json"], tmpDir);
		return (JSON.parse(stdout) as { issue: Issue }).issue.blockedBy;
	}

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), "seeds-dep-graph-"));
		await runCli(["init"], tmpDir);
		ids.length = 0;
		for (const t of ["A", "B", "C"]) ids.push(await create(t));
	});

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true });
	});

	test("sd dep add refuses a cycle and writes nothing", async () => {
		const [a = "", b = ""] = ids;
		expect((await runCli(["dep", "add", a, b], tmpDir)).exitCode).toBe(0);
		const { exitCode, stderr } = await runCli(["dep", "add", b, a], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain(`would create cycle ${b} → ${a} → ${b}`);
		expect(await blockedBy(b)).toBeUndefined();
		const ready = await runCli(["ready", "--json"], tmpDir);
		expect(ready.stdout).toContain(b);
	});

	test("sd block refuses a transitive cycle", async () => {
		const [a = "", b = "", c = ""] = ids;
		await runCli(["block", b, "--by", a], tmpDir);
		await runCli(["block", c, "--by", b], tmpDir);
		const { exitCode, stderr } = await runCli(["block", a, "--by", c], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain(`would create cycle ${a} → ${c} → ${b} → ${a}`);
		expect(await blockedBy(a)).toBeUndefined();
	});

	test("sd plan adopt refuses a seed already blocked by the plan's parent", async () => {
		const [parent = "", child = ""] = ids;
		await runCli(["dep", "add", child, parent], tmpDir);
		const created = await runCli(["plan", "create", parent, "--json"], tmpDir);
		const planId = (JSON.parse(created.stdout) as { plan_id: string }).plan_id;
		const { exitCode, stderr } = await runCli(["plan", "adopt", planId, child], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain(`would create cycle ${parent} → ${child} → ${parent}`);
		expect(await blockedBy(parent)).toBeUndefined();
	});

	test("sd plan submit refuses steps that block each other", async () => {
		const [parent = ""] = ids;
		const plan = {
			template: "feature",
			sections: {
				context: "This work matters because cyclic step graphs deadlock every spawned child.",
				approach: "Reject the submission before any write.",
				alternatives: [],
				steps: [
					{ title: "Step 1", blocks: [2] },
					{ title: "Step 2", blocks: [1] },
				],
				risks: [],
				acceptance: ["Refused"],
			},
		};
		const file = join(tmpDir, "plan.json");
		await Bun.write(file, JSON.stringify(plan));
		const before = await Bun.file(join(tmpDir, ".seeds", "issues.jsonl")).text();
		const { exitCode, stderr } = await runCli(["plan", "submit", parent, "--plan", file], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("would create cycle");
		expect(await Bun.file(join(tmpDir, ".seeds", "issues.jsonl")).text()).toBe(before);
	});
});
