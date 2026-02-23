import { describe, expect, test } from "bun:test";
import { generateId } from "./id.ts";

describe("generateId", () => {
	test("generates id with correct prefix-4hex format", () => {
		const id = generateId("myproject", new Set());
		expect(id).toMatch(/^myproject-[0-9a-f]{4}$/);
	});

	test("uses prefix verbatim", () => {
		const id = generateId("overstory", new Set());
		expect(id.startsWith("overstory-")).toBe(true);
	});

	test("generates unique IDs across multiple calls", () => {
		const existing = new Set<string>();
		const ids = new Set<string>();
		for (let i = 0; i < 20; i++) {
			const id = generateId("proj", existing);
			ids.add(id);
			existing.add(id);
		}
		expect(ids.size).toBe(20);
	});

	test("avoids IDs already in the existing set", () => {
		// Put all possible 4-hex IDs for prefix "x" into existing (there are 65536 of them)
		// Instead, test deterministically: put a known ID in, generate and verify not that
		const existing = new Set<string>(["proj-abcd"]);
		for (let i = 0; i < 50; i++) {
			const id = generateId("proj", existing);
			expect(id).not.toBe("proj-abcd");
			existing.add(id);
		}
	});

	test("falls back to 8 hex chars when retries >= 100", () => {
		const id = generateId("x", new Set(), 100);
		expect(id).toMatch(/^x-[0-9a-f]{8}$/);
	});

	test("template IDs use tpl prefix", () => {
		const id = generateId("tpl", new Set());
		expect(id).toMatch(/^tpl-[0-9a-f]{4}$/);
	});
});
