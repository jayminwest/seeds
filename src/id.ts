import { randomBytes } from "node:crypto";

/**
 * Suffix length for new ids. The existence check is local only, so ids minted on
 * separate branches can collide after a merge; 6 hex (16.7M values) keeps that rare.
 * Readers accept any hex length, so older 4-hex ids stay valid.
 */
export const ID_HEX_LEN = 6;

export function generateId(prefix: string, existingIds: Set<string> | string[]): string {
	const idSet = existingIds instanceof Set ? existingIds : new Set(existingIds);
	const makeId = (hexLen: number) =>
		`${prefix}-${randomBytes(Math.ceil(hexLen / 2))
			.toString("hex")
			.slice(0, hexLen)}`;

	let attempts = 0;
	while (attempts < 100) {
		const id = makeId(ID_HEX_LEN);
		if (!idSet.has(id)) return id;
		attempts++;
	}
	// Fallback to 8 hex chars after 100 collisions
	let id = makeId(8);
	while (idSet.has(id)) {
		id = makeId(8);
	}
	return id;
}
