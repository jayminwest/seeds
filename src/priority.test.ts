import { describe, expect, test } from "bun:test";
import { isValidPriority, PRIORITY_ERROR, parsePriority } from "./priority.ts";

describe("parsePriority", () => {
	test("returns default when undefined", () => {
		expect(parsePriority(undefined)).toBe(2);
		expect(parsePriority(undefined, 4)).toBe(4);
	});

	test("returns default when flag passed without value (true)", () => {
		expect(parsePriority(true)).toBe(2);
	});

	test("parses bare digits", () => {
		expect(parsePriority("0")).toBe(0);
		expect(parsePriority("3")).toBe(3);
	});

	test("parses P-prefixed shorthand (case-insensitive)", () => {
		expect(parsePriority("P1")).toBe(1);
		expect(parsePriority("p4")).toBe(4);
	});

	test("returns NaN for unparseable strings", () => {
		expect(Number.isNaN(parsePriority("high"))).toBe(true);
		expect(Number.isNaN(parsePriority("Pzz"))).toBe(true);
	});
});

describe("isValidPriority", () => {
	test("accepts 0..4", () => {
		for (let p = 0; p <= 4; p++) expect(isValidPriority(p)).toBe(true);
	});

	test("rejects out-of-range and non-integers", () => {
		expect(isValidPriority(-1)).toBe(false);
		expect(isValidPriority(5)).toBe(false);
		expect(isValidPriority(1.5)).toBe(false);
		expect(isValidPriority(Number.NaN)).toBe(false);
	});

	test("PRIORITY_ERROR is a stable, human-readable string", () => {
		expect(PRIORITY_ERROR).toContain("0-4");
	});
});
