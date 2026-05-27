import { describe, expect, test } from "bun:test";
import { stripAnsi } from "./format.ts";

describe("stripAnsi", () => {
	test("removes real ANSI escape sequences", () => {
		const input = "\x1b[31mhello\x1b[0m \x1b[1;32mworld\x1b[0m";
		expect(stripAnsi(input)).toBe("hello world");
	});

	test("returns input unchanged when no escape sequences are present", () => {
		expect(stripAnsi("plain text")).toBe("plain text");
	});

	test("does not strip bracket-only sequences that lack the ESC byte", () => {
		// "[31m" without a preceding ESC must survive — it is not an ANSI sequence.
		expect(stripAnsi("[31mhello[0m")).toBe("[31mhello[0m");
	});

	test("handles strings containing multiple escape sequences in a row", () => {
		const input = "\x1b[1m\x1b[31mbold-red\x1b[0m\x1b[0m";
		expect(stripAnsi(input)).toBe("bold-red");
	});
});
