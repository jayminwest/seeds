import { describe, expect, test } from "bun:test";
import { parseYaml, stringifyYaml } from "./yaml.ts";

describe("parseYaml", () => {
	test("parses basic key-value pairs", () => {
		const result = parseYaml('project: seeds\nversion: "1"\n');
		expect(result.project).toBe("seeds");
		expect(result.version).toBe("1");
	});

	test("strips double quotes", () => {
		const result = parseYaml('key: "hello world"');
		expect(result.key).toBe("hello world");
	});

	test("strips single quotes", () => {
		const result = parseYaml("key: 'hello world'");
		expect(result.key).toBe("hello world");
	});

	test("skips comments", () => {
		const result = parseYaml("# comment\nkey: value");
		expect(result.key).toBe("value");
		expect(Object.keys(result)).toHaveLength(1);
	});

	test("skips empty lines", () => {
		const result = parseYaml("\n\nkey: value\n\n");
		expect(result.key).toBe("value");
	});

	test("handles unquoted values", () => {
		const result = parseYaml("priority: 2");
		expect(result.priority).toBe("2");
	});

	test("returns empty object for empty input", () => {
		expect(parseYaml("")).toEqual({});
	});
});

describe("stringifyYaml", () => {
	test("serializes to quoted key-value pairs", () => {
		const result = stringifyYaml({ project: "myproj", version: "1" });
		expect(result).toContain('project: "myproj"');
		expect(result).toContain('version: "1"');
	});

	test("ends with newline", () => {
		const result = stringifyYaml({ a: "b" });
		expect(result.endsWith("\n")).toBe(true);
	});

	test("round-trips through parse", () => {
		const original = { project: "test", version: "1" };
		const parsed = parseYaml(stringifyYaml(original));
		expect(parsed.project).toBe(original.project);
		expect(parsed.version).toBe(original.version);
	});
});
