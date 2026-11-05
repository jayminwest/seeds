/**
 * id → array position, first occurrence wins (same answer as `findIndex`).
 * Build once per read and look up inside loops: a per-id `findIndex` over the
 * whole store is O(ids × issues) and dominates on large stores (seeds-b79d).
 * Positions stay valid while rows are replaced in place; rebuild after a
 * splice or filter.
 */
export function indexById<T extends { id: string }>(items: readonly T[]): Map<string, number> {
	const index = new Map<string, number>();
	for (const [i, item] of items.entries()) {
		if (!index.has(item.id)) index.set(item.id, i);
	}
	return index;
}

/** id → row, first occurrence wins (same answer as `find`). */
export function mapById<T extends { id: string }>(items: readonly T[]): Map<string, T> {
	const map = new Map<string, T>();
	for (const item of items) {
		if (!map.has(item.id)) map.set(item.id, item);
	}
	return map;
}
