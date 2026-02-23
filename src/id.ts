import { randomBytes } from "node:crypto";

/**
 * Generate a short ID: "{prefix}-{4hex}"
 *
 * Collision-checked against existing IDs.
 * Falls back to 8 hex chars after 100 collisions (won't happen in practice).
 * Matches beads' format for familiarity.
 */
export function generateId(prefix: string, existing: Set<string>, retries = 0): string {
	const hexLen = retries >= 100 ? 8 : 4;
	const hex = randomBytes(hexLen / 2).toString("hex");
	const id = `${prefix}-${hex}`;
	if (existing.has(id)) {
		return generateId(prefix, existing, retries + 1);
	}
	return id;
}
