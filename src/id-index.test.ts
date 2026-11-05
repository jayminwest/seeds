import { describe, expect, test } from "bun:test";
import { indexById, mapById } from "./id-index.ts";

const rows = [
	{ id: "a", n: 1 },
	{ id: "b", n: 2 },
	{ id: "a", n: 3 },
];

describe("indexById", () => {
	test("matches findIndex, including first-occurrence wins and misses", () => {
		const index = indexById(rows);
		for (const id of ["a", "b", "zz"]) {
			expect(index.get(id) ?? -1).toBe(rows.findIndex((r) => r.id === id));
		}
	});
});

describe("mapById", () => {
	test("matches find, including first-occurrence wins and misses", () => {
		const map = mapById(rows);
		for (const id of ["a", "b", "zz"]) {
			expect(map.get(id)).toBe(rows.find((r) => r.id === id));
		}
	});
});
