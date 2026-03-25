import { describe, expect, it } from "bun:test";
import { computeMetrics } from "./graph.ts";
import type { Issue } from "./types.ts";

function makeIssue(id: string, blocks: string[] = [], blockedBy: string[] = []): Issue {
	return {
		id,
		title: id,
		status: "open",
		type: "task",
		priority: 2,
		blocks,
		blockedBy,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
}

describe("computeMetrics", () => {
	it("returns empty map for no issues", () => {
		const m = computeMetrics([]);
		expect(m.size).toBe(0);
	});

	it("returns metrics for a single issue", () => {
		const m = computeMetrics([makeIssue("a")]);
		expect(m.has("a")).toBe(true);
		const entry = m.get("a");
		expect(entry).toBeDefined();
		expect(entry?.criticalPathLength).toBe(0);
		expect(entry?.score).toBeGreaterThanOrEqual(0);
	});

	it("critical path: linear chain a→b→c gives a=2, b=1, c=0", () => {
		// a blocks b, b blocks c
		const a = makeIssue("a", ["b"], []);
		const b = makeIssue("b", ["c"], ["a"]);
		const c = makeIssue("c", [], ["b"]);
		const m = computeMetrics([a, b, c]);
		expect(m.get("a")?.criticalPathLength).toBe(2);
		expect(m.get("b")?.criticalPathLength).toBe(1);
		expect(m.get("c")?.criticalPathLength).toBe(0);
	});

	it("bottleneck ranks higher than leaf in a diamond graph", () => {
		// a→b, a→c, b→d, c→d  — a and d are the bottleneck/sink
		const a = makeIssue("a", ["b", "c"], []);
		const b = makeIssue("b", ["d"], ["a"]);
		const c = makeIssue("c", ["d"], ["a"]);
		const d = makeIssue("d", [], ["b", "c"]);
		const m = computeMetrics([a, b, c, d]);

		// a has the longest critical path (2: a→b→d or a→c→d) and blocks the most
		expect(m.get("a")?.criticalPathLength).toBe(2);
		// b and c are equivalent leaves with cp=1
		expect(m.get("b")?.criticalPathLength).toBe(1);
		expect(m.get("c")?.criticalPathLength).toBe(1);
		// d is a terminal with cp=0
		expect(m.get("d")?.criticalPathLength).toBe(0);

		// a should score higher than b or c (it unblocks more work)
		expect(m.get("a")?.score).toBeGreaterThan(m.get("b")?.score ?? 0);
		expect(m.get("a")?.score).toBeGreaterThan(m.get("c")?.score ?? 0);
	});

	it("scores are in [0,1] range", () => {
		const issues = [
			makeIssue("a", ["b", "c"]),
			makeIssue("b", ["d"], ["a"]),
			makeIssue("c", ["d"], ["a"]),
			makeIssue("d", [], ["b", "c"]),
		];
		const m = computeMetrics(issues);
		for (const [, entry] of m) {
			expect(entry.score).toBeGreaterThanOrEqual(0);
			expect(entry.score).toBeLessThanOrEqual(1);
		}
	});

	it("ignores edges to issues not in the set", () => {
		// b references external id "z" that isn't in the list
		const a = makeIssue("a", ["b"]);
		const b = makeIssue("b", ["z"], ["a"]);
		expect(() => computeMetrics([a, b])).not.toThrow();
		const m = computeMetrics([a, b]);
		expect(m.get("b")?.criticalPathLength).toBe(0); // z filtered out
	});
});
