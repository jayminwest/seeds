import { describe, expect, test } from "bun:test";
import {
	END_MARKER,
	START_MARKER,
	hasMarkerSection,
	replaceMarkerSection,
	wrapInMarkers,
} from "./markers.ts";

describe("markers", () => {
	test("START_MARKER and END_MARKER are correct", () => {
		expect(START_MARKER).toBe("<!-- seeds:start -->");
		expect(END_MARKER).toBe("<!-- seeds:end -->");
	});

	describe("hasMarkerSection", () => {
		test("returns true when both markers present", () => {
			const content = `before\n${START_MARKER}\nstuff\n${END_MARKER}\nafter`;
			expect(hasMarkerSection(content)).toBe(true);
		});

		test("returns false when only start marker present", () => {
			const content = `before\n${START_MARKER}\nstuff`;
			expect(hasMarkerSection(content)).toBe(false);
		});

		test("returns false when only end marker present", () => {
			const content = `stuff\n${END_MARKER}\nafter`;
			expect(hasMarkerSection(content)).toBe(false);
		});

		test("returns false when no markers present", () => {
			expect(hasMarkerSection("just some text")).toBe(false);
		});
	});

	describe("wrapInMarkers", () => {
		test("wraps content with start and end markers", () => {
			const result = wrapInMarkers("hello world");
			expect(result).toBe(`${START_MARKER}\nhello world\n${END_MARKER}`);
		});

		test("handles multi-line content", () => {
			const result = wrapInMarkers("line 1\nline 2\nline 3");
			expect(result).toBe(`${START_MARKER}\nline 1\nline 2\nline 3\n${END_MARKER}`);
		});
	});

	describe("replaceMarkerSection", () => {
		test("replaces content between markers", () => {
			const content = `before\n${START_MARKER}\nold stuff\n${END_MARKER}\nafter`;
			const result = replaceMarkerSection(content, "new stuff");
			expect(result).toBe(`before\n${START_MARKER}\nnew stuff\n${END_MARKER}\nafter`);
		});

		test("preserves surrounding content", () => {
			const content = `# Title\n\nsome text\n${START_MARKER}\nold\n${END_MARKER}\n\n## Footer`;
			const result = replaceMarkerSection(content, "replaced");
			expect(result).toContain("# Title");
			expect(result).toContain("## Footer");
			expect(result).toContain("replaced");
			expect(result).not.toContain("old");
		});

		test("returns null when no markers present", () => {
			expect(replaceMarkerSection("no markers here", "new")).toBeNull();
		});

		test("returns null when only start marker present", () => {
			expect(replaceMarkerSection(`${START_MARKER}\nstuff`, "new")).toBeNull();
		});
	});
});
