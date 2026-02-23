import { describe, expect, test } from "bun:test";
import { parseYaml, stringifyYaml } from "./yaml.ts";

describe("parseYaml", () => {
	test("parses simple key-value pairs", () => {
		const result = parseYaml("project: myproject\nversion: 1\n");
		expect(result.project).toBe("myproject");
		expect(result.version).toBe("1");
	});

	test("strips double-quoted values", () => {
		const result = parseYaml('project: "my project"\n');
		expect(result.project).toBe("my project");
	});

	test("strips single-quoted values", () => {
		const result = parseYaml("project: 'test value'\n");
		expect(result.project).toBe("test value");
	});

	test("ignores comment lines", () => {
		const result = parseYaml("# this is a comment\nproject: seeds\n");
		expect(result.project).toBe("seeds");
		expect(Object.keys(result)).toHaveLength(1);
	});

	test("ignores blank lines", () => {
		const result = parseYaml("\n\nproject: seeds\n\n");
		expect(result.project).toBe("seeds");
		expect(Object.keys(result)).toHaveLength(1);
	});

	test("returns empty object for empty input", () => {
		expect(parseYaml("")).toEqual({});
		expect(parseYaml("\n\n")).toEqual({});
	});

	test("handles value with colon in quotes", () => {
		const result = parseYaml('url: "http://example.com"\n');
		expect(result.url).toBe("http://example.com");
	});

	test("trims whitespace around key and value", () => {
		const result = parseYaml("  project :   seeds  \n");
		expect(result.project).toBe("seeds");
	});
});

describe("stringifyYaml", () => {
	test("produces parseable output for simple values", () => {
		const data = { project: "test", version: "1" };
		const text = stringifyYaml(data);
		const parsed = parseYaml(text);
		expect(parsed.project).toBe("test");
		expect(parsed.version).toBe("1");
	});

	test("quotes values with colons", () => {
		const data = { url: "http://example.com" };
		const text = stringifyYaml(data);
		const parsed = parseYaml(text);
		expect(parsed.url).toBe("http://example.com");
	});

	test("round-trips project config", () => {
		const data = { project: "overstory", version: "1" };
		const text = stringifyYaml(data);
		const parsed = parseYaml(text);
		expect(parsed.project).toBe("overstory");
		expect(parsed.version).toBe("1");
	});

	test("ends with newline", () => {
		const text = stringifyYaml({ key: "value" });
		expect(text.endsWith("\n")).toBe(true);
	});
});
