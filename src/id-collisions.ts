/**
 * Repeated ids in a JSONL store are normally the same item written twice (an edit
 * surviving a union merge) and share `createdAt`. Rows that share an id but differ in
 * `createdAt` are distinct items minted independently on separate branches: last-wins
 * dedup would silently drop one, so callers must surface them instead of collapsing.
 */
export function findIdCollisions(rows: unknown[]): Set<string> {
	const createdAts = new Map<string, Set<unknown>>();
	for (const row of rows) {
		if (typeof row !== "object" || row === null) continue;
		const { id, createdAt } = row as { id?: unknown; createdAt?: unknown };
		if (typeof id !== "string") continue;
		const seen = createdAts.get(id) ?? new Set<unknown>();
		seen.add(createdAt);
		createdAts.set(id, seen);
	}
	const collisions = new Set<string>();
	for (const [id, seen] of createdAts) {
		if (seen.size > 1) collisions.add(id);
	}
	return collisions;
}

/** Dedup key: plain id, or id + createdAt for collided ids so both items survive. */
export function dedupKey(
	row: { id: string; createdAt?: unknown },
	collisions: Set<string>,
): string {
	return collisions.has(row.id) ? `${row.id}\u0000${String(row.createdAt)}` : row.id;
}
