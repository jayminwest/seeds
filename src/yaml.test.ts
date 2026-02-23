import { describe, expect, test } from "bun:test";
import { parseYaml, stringifyYaml } from "./yaml";

describe("parseYaml", () => {
	test("parses simple key-value pairs", () => {
		const result = parseYaml('project: overstory\nversion: "1"');
		expect(result["project"]).toBe("overstory");
		expect(result["version"]).toBe("1");
	});

	test("parses unquoted string values", () => {
		const result = parseYaml("name: myapp");
		expect(result["name"]).toBe("myapp");
	});

	test("parses double-quoted string values", () => {
		const result = parseYaml('version: "1.0.0"');
		expect(result["version"]).toBe("1.0.0");
	});

	test("parses single-quoted string values", () => {
		const result = parseYaml("name: 'myapp'");
		expect(result["name"]).toBe("myapp");
	});

	test("ignores blank lines", () => {
		const result = parseYaml("project: seeds\n\nversion: 1");
		expect(result["project"]).toBe("seeds");
		expect(result["version"]).toBe("1");
	});

	test("ignores comment lines", () => {
		const result = parseYaml("# This is a comment\nproject: seeds");
		expect(result["project"]).toBe("seeds");
		expect(Object.keys(result)).not.toContain("# This is a comment");
	});

	test("returns empty object for empty string", () => {
		const result = parseYaml("");
		expect(Object.keys(result)).toHaveLength(0);
	});

	test("parses config.yaml format used by seeds", () => {
		const yaml = 'project: overstory\nversion: "1"';
		const result = parseYaml(yaml);
		expect(result).toEqual({ project: "overstory", version: "1" });
	});

	test("handles values with colons in quoted strings", () => {
		const result = parseYaml('url: "http://example.com"');
		expect(result["url"]).toBe("http://example.com");
	});

	test("trims whitespace from keys and values", () => {
		const result = parseYaml("  project : seeds  ");
		expect(result["project"]).toBe("seeds");
	});
});

describe("stringifyYaml", () => {
	test("serializes simple key-value pairs", () => {
		const yaml = stringifyYaml({ project: "seeds", version: "1" });
		const parsed = parseYaml(yaml);
		expect(parsed["project"]).toBe("seeds");
		expect(parsed["version"]).toBe("1");
	});

	test("round-trips flat objects", () => {
		const original = { project: "overstory", version: "1" };
		const yaml = stringifyYaml(original);
		const parsed = parseYaml(yaml);
		expect(parsed).toEqual(original);
	});

	test("produces newline-terminated output", () => {
		const yaml = stringifyYaml({ key: "value" });
		expect(yaml.endsWith("\n")).toBe(true);
	});
});
