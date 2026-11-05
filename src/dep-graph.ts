import type { Issue } from "./types.ts";

// Dependency-cycle guard for every command that writes blockedBy edges
// (dep add, block, plan submit/adopt). An edge `[issue, dependsOn]` means
// "issue is blocked by dependsOn"; it closes a cycle when dependsOn already
// reaches issue through blockedBy. Closed issues participate: close keeps its
// blockedBy edges (resolution is derived at read time), so a cycle through a
// closed issue deadlocks both ends the moment it is reopened, and sd doctor's
// circular-dependencies check counts it too.

export type DepEdge = readonly [issue: string, dependsOn: string];

/** Shortest blockedBy path from `from` to `to` (both inclusive), or null. */
function findBlockedByPath(
	graph: ReadonlyMap<string, readonly string[]>,
	from: string,
	to: string,
): string[] | null {
	const prev = new Map<string, string>();
	const seen = new Set([from]);
	const queue = [from];
	for (let head = 0; head < queue.length; head++) {
		const node = queue[head];
		if (node === undefined) break;
		if (node === to) {
			const path = [node];
			for (let p = prev.get(node); p !== undefined; p = prev.get(p)) path.unshift(p);
			return path;
		}
		for (const next of graph.get(node) ?? []) {
			if (seen.has(next)) continue;
			seen.add(next);
			prev.set(next, node);
			queue.push(next);
		}
	}
	return null;
}

/**
 * Throw if any edge would close a blockedBy cycle in `issues`. Works on the
 * graph before or after the edges are applied: the search starts at dependsOn
 * and stops at issue, so the edge under test is never traversed.
 */
export function assertNoCycles(issues: readonly Issue[], edges: readonly DepEdge[]): void {
	const graph = new Map<string, readonly string[]>();
	for (const issue of issues) graph.set(issue.id, issue.blockedBy ?? []);
	for (const [issue, dependsOn] of edges) {
		const path = findBlockedByPath(graph, dependsOn, issue);
		if (path) {
			throw new Error(
				`Cannot add dependency ${issue} → ${dependsOn}: would create cycle ${[issue, ...path].join(" → ")}`,
			);
		}
	}
}

/** Edges a plan wires: parent blocked by every child, step j blocked by step i (1-based). */
export function planEdges(
	parentId: string,
	childIds: readonly string[],
	steps: readonly { blocks?: number[] }[] = [],
): DepEdge[] {
	const edges: DepEdge[] = childIds.map((cid) => [parentId, cid] as const);
	steps.forEach((step, i) => {
		const source = childIds[i];
		for (const j of step.blocks ?? []) {
			const target = childIds[j - 1];
			if (source && target) edges.push([target, source]);
		}
	});
	return edges;
}
