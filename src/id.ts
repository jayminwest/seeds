import { randomBytes } from "node:crypto";

export function generateId(prefix: string, existingIds: Set<string> | string[]): string {
	const idSet = existingIds instanceof Set ? existingIds : new Set(existingIds);
	const makeId = (hexLen: number) =>
		`${prefix}-${randomBytes(Math.ceil(hexLen / 2))
			.toString("hex")
			.slice(0, hexLen)}`;

	let attempts = 0;
	while (attempts < 100) {
		const id = makeId(4);
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
