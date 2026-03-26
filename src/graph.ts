/**
 * Graph algorithms for issue dependency analysis.
 *
 * All algorithms operate on the directed graph where an edge A → B means
 * "A blocks B" (B depends on A). PageRank and betweenness run on the full
 * graph of open issues; critical path is computed forward from each node.
 */

import type { Issue } from "./types.ts";

export interface GraphMetrics {
	pagerank: number;
	betweenness: number;
	criticalPathLength: number;
	score: number;
}

export type IssueMetrics = Map<string, GraphMetrics>;

/**
 * Build adjacency from issues. Returns:
 *   blocksMap:     id → ids it blocks (outgoing edges A → B: A blocks B)
 *   blockedByMap:  id → ids blocking it (incoming edges)
 */
function buildAdjacency(issues: Issue[]): {
	blocksMap: Map<string, string[]>;
	blockedByMap: Map<string, string[]>;
	ids: string[];
} {
	const ids = issues.map((i) => i.id);
	const idSet = new Set(ids);
	const blocksMap = new Map<string, string[]>();
	const blockedByMap = new Map<string, string[]>();

	for (const id of ids) {
		blocksMap.set(id, []);
		blockedByMap.set(id, []);
	}

	for (const issue of issues) {
		for (const blocked of issue.blocks ?? []) {
			if (!idSet.has(blocked)) continue;
			blocksMap.get(issue.id)?.push(blocked);
			blockedByMap.get(blocked)?.push(issue.id);
		}
	}

	return { blocksMap, blockedByMap, ids };
}

/**
 * PageRank on the reversed graph: authority flows from dependents back to
 * their blockers. A node that blocks many important things accumulates higher
 * rank — exactly the nodes you want to start first.
 *
 * Reversed graph edge (u → v) means v blocks u (v is needed before u).
 * In-neighbours of v in the reversed graph = blocks(v).
 * Out-degree of u in the reversed graph = len(blockedBy(u)).
 *
 * Converges after ~50 iterations at d=0.85.
 */
function computePageRank(
	ids: string[],
	blocksMap: Map<string, string[]>,
	blockedByMap: Map<string, string[]>,
	iterations = 50,
	damping = 0.85,
): Map<string, number> {
	const n = ids.length;
	if (n === 0) return new Map();

	const rank = new Map<string, number>();
	const initial = 1 / n;
	for (const id of ids) rank.set(id, initial);

	for (let iter = 0; iter < iterations; iter++) {
		const next = new Map<string, number>();
		for (const id of ids) {
			// In the reversed graph, in-neighbours of v are the nodes v blocks.
			// Each such neighbour u contributes rank(u) / out_degree_reversed(u),
			// where out_degree_reversed(u) = len(blockedBy(u)).
			let incoming = 0;
			for (const dep of blocksMap.get(id) ?? []) {
				const depReversedOut = blockedByMap.get(dep)?.length ?? 0;
				if (depReversedOut > 0) {
					incoming += (rank.get(dep) ?? 0) / depReversedOut;
				}
			}
			next.set(id, (1 - damping) / n + damping * incoming);
		}
		for (const [id, r] of next) rank.set(id, r);
	}

	return rank;
}

/**
 * Betweenness centrality via Brandes algorithm (unweighted).
 * High betweenness = many shortest paths pass through this node,
 * meaning it's a coordination bottleneck.
 */
function computeBetweenness(ids: string[], blocksMap: Map<string, string[]>): Map<string, number> {
	const betweenness = new Map<string, number>();
	for (const id of ids) betweenness.set(id, 0);

	for (const source of ids) {
		const stack: string[] = [];
		const predecessors = new Map<string, string[]>();
		const sigma = new Map<string, number>();
		const dist = new Map<string, number>();

		for (const id of ids) {
			predecessors.set(id, []);
			sigma.set(id, 0);
			dist.set(id, -1);
		}

		sigma.set(source, 1);
		dist.set(source, 0);

		const queue: string[] = [source];
		while (queue.length > 0) {
			const v = queue.shift();
			if (v === undefined) break;
			stack.push(v);
			for (const w of blocksMap.get(v) ?? []) {
				if (dist.get(w) === -1) {
					queue.push(w);
					dist.set(w, (dist.get(v) ?? 0) + 1);
				}
				if (dist.get(w) === (dist.get(v) ?? 0) + 1) {
					sigma.set(w, (sigma.get(w) ?? 0) + (sigma.get(v) ?? 0));
					predecessors.get(w)?.push(v);
				}
			}
		}

		const delta = new Map<string, number>();
		for (const id of ids) delta.set(id, 0);

		while (stack.length > 0) {
			const w = stack.pop();
			if (w === undefined) break;
			for (const v of predecessors.get(w) ?? []) {
				const contribution =
					((sigma.get(v) ?? 0) / (sigma.get(w) ?? 1)) * (1 + (delta.get(w) ?? 0));
				delta.set(v, (delta.get(v) ?? 0) + contribution);
			}
			if (w !== source) {
				betweenness.set(w, (betweenness.get(w) ?? 0) + (delta.get(w) ?? 0));
			}
		}
	}

	// Normalize by (n-1)(n-2) for directed graphs
	const n = ids.length;
	const norm = n > 2 ? (n - 1) * (n - 2) : 1;
	for (const [id, b] of betweenness) {
		betweenness.set(id, b / norm);
	}

	return betweenness;
}

/**
 * Critical path length: longest chain of "blocks" edges forward from each node.
 * A node with criticalPathLength=3 has 3 more hops of dependent work after it.
 */
function computeCriticalPath(ids: string[], blocksMap: Map<string, string[]>): Map<string, number> {
	const memo = new Map<string, number>();

	const dfs = (id: string): number => {
		const cached = memo.get(id);
		if (cached !== undefined) return cached;
		const successors = blocksMap.get(id) ?? [];
		if (successors.length === 0) {
			memo.set(id, 0);
			return 0;
		}
		const max = Math.max(...successors.map(dfs));
		memo.set(id, max + 1);
		return max + 1;
	};

	for (const id of ids) dfs(id);
	return memo;
}

/**
 * Compute all graph metrics for a set of issues.
 * Composite score weights: 50% pagerank, 30% betweenness, 20% critical path.
 */
export function computeMetrics(issues: Issue[]): IssueMetrics {
	if (issues.length === 0) return new Map();

	const { blocksMap, blockedByMap, ids } = buildAdjacency(issues);
	const pagerank = computePageRank(ids, blocksMap, blockedByMap);
	const betweenness = computeBetweenness(ids, blocksMap);
	const criticalPath = computeCriticalPath(ids, blocksMap);

	const maxCp = Array.from(criticalPath.values()).reduce((a, b) => Math.max(a, b), 0) || 1;

	// Normalize pagerank to [0,1]
	const prValues = Array.from(pagerank.values());
	const maxPr = prValues.reduce((a, b) => Math.max(a, b), 0) || 1;
	const minPr = Math.min(...prValues);
	const prRange = maxPr - minPr || 1;

	// Normalize betweenness to [0,1] (already normalized by Brandes, but rescale to max)
	const bValues = Array.from(betweenness.values());
	const maxB = bValues.reduce((a, b) => Math.max(a, b), 0) || 1;

	const result: IssueMetrics = new Map();
	for (const id of ids) {
		const pr = ((pagerank.get(id) ?? 0) - minPr) / prRange;
		const b = (betweenness.get(id) ?? 0) / maxB;
		const cp = (criticalPath.get(id) ?? 0) / maxCp;
		const score = 0.5 * pr + 0.3 * b + 0.2 * cp;
		result.set(id, {
			pagerank: pagerank.get(id) ?? 0,
			betweenness: betweenness.get(id) ?? 0,
			criticalPathLength: criticalPath.get(id) ?? 0,
			score,
		});
	}

	return result;
}
