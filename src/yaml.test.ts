import { describe, expect, test } from "bun:test";
import { parse as parseStdYaml } from "yaml";
import { parseScalarOrFlow, parseYaml, stringifyYaml, type YamlValue } from "./yaml";

describe("parseYaml — flat (legacy)", () => {
	test("parses simple key-value pairs", () => {
		const result = parseYaml('project: overstory\nversion: "1"');
		expect(result.project).toBe("overstory");
		expect(result.version).toBe("1");
	});

	test("parses unquoted string values", () => {
		const result = parseYaml("name: myapp");
		expect(result.name).toBe("myapp");
	});

	test("parses double-quoted string values", () => {
		const result = parseYaml('version: "1.0.0"');
		expect(result.version).toBe("1.0.0");
	});

	test("parses single-quoted string values", () => {
		const result = parseYaml("name: 'myapp'");
		expect(result.name).toBe("myapp");
	});

	test("ignores blank lines", () => {
		const result = parseYaml('project: seeds\n\nversion: "1"');
		expect(result.project).toBe("seeds");
		expect(result.version).toBe("1");
	});

	test("ignores comment lines", () => {
		const result = parseYaml("# This is a comment\nproject: seeds");
		expect(result.project).toBe("seeds");
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
		expect(result.url).toBe("http://example.com");
	});

	test("trims whitespace from keys and values", () => {
		const result = parseYaml("  project : seeds  ");
		expect(result.project).toBe("seeds");
	});
});

describe("parseYaml — typed scalars", () => {
	test("parses booleans", () => {
		const result = parseYaml("flag: true\nother: false");
		expect(result.flag).toBe(true);
		expect(result.other).toBe(false);
	});

	test("parses integers", () => {
		const result = parseYaml("count: 42\nneg: -7");
		expect(result.count).toBe(42);
		expect(result.neg).toBe(-7);
	});

	test("parses floats", () => {
		const result = parseYaml("ratio: 3.14");
		expect(result.ratio).toBe(3.14);
	});

	test("parses null and tilde", () => {
		const result = parseYaml("a: null\nb: ~");
		expect(result.a).toBeNull();
		expect(result.b).toBeNull();
	});

	test("quoted digit-string stays a string", () => {
		const result = parseYaml('version: "1"');
		expect(result.version).toBe("1");
		expect(typeof result.version).toBe("string");
	});

	test("strips trailing comments outside quotes", () => {
		const result = parseYaml('name: foo  # inline comment\nv: "x # not comment"');
		expect(result.name).toBe("foo");
		expect(result.v).toBe("x # not comment");
	});
});

describe("parseYaml — nested maps", () => {
	test("two-level nested map", () => {
		const result = parseYaml(["a:", "  b: 1", "  c: 2"].join("\n"));
		expect(result.a).toEqual({ b: 1, c: 2 });
	});

	test("three-level nested map", () => {
		const result = parseYaml(
			["plan_templates:", "  feature:", "    sections:", "      context: hi"].join("\n"),
		);
		expect(result).toEqual({
			plan_templates: { feature: { sections: { context: "hi" } } },
		});
	});

	test("handles mixed indentation depths within siblings", () => {
		const result = parseYaml(["a:", "  x: 1", "b:", "  y: 2"].join("\n"));
		expect(result).toEqual({ a: { x: 1 }, b: { y: 2 } });
	});
});

describe("parseYaml — sequences", () => {
	test("block sequence of strings", () => {
		const result = parseYaml(["items:", "  - a", "  - b", "  - c"].join("\n"));
		expect(result.items).toEqual(["a", "b", "c"]);
	});

	test("inline flow sequence", () => {
		const result = parseYaml("items: [a, b, c]");
		expect(result.items).toEqual(["a", "b", "c"]);
	});

	test("flow sequence with quoted entries", () => {
		const result = parseYaml('items: ["foo, bar", baz]');
		expect(result.items).toEqual(["foo, bar", "baz"]);
	});

	test("empty inline sequence", () => {
		const result = parseYaml("items: []");
		expect(result.items).toEqual([]);
	});

	test("block sequence of typed scalars", () => {
		const result = parseYaml(["nums:", "  - 1", "  - 2", "  - true"].join("\n"));
		expect(result.nums).toEqual([1, 2, true]);
	});

	test("block sequence of objects (multi-key)", () => {
		const yaml = [
			"alternatives:",
			"  - name: Alpha",
			"    rejected_because: too slow",
			"  - name: Beta",
			"    rejected_because: too risky",
		].join("\n");
		const result = parseYaml(yaml);
		expect(result.alternatives).toEqual([
			{ name: "Alpha", rejected_because: "too slow" },
			{ name: "Beta", rejected_because: "too risky" },
		]);
	});
});

describe("parseYaml — flow maps", () => {
	test("inline flow map", () => {
		const result = parseYaml("item: { kind: text }");
		expect(result.item).toEqual({ kind: "text" });
	});

	test("inline flow map with multiple entries", () => {
		const result = parseYaml("item: { name: foo, count: 3, ok: true }");
		expect(result.item).toEqual({ name: "foo", count: 3, ok: true });
	});

	test("nested flow maps inside block map", () => {
		const yaml = ["item:", "  name: { kind: text }", "  rejected_because: { kind: text }"].join(
			"\n",
		);
		const result = parseYaml(yaml);
		expect(result.item).toEqual({
			name: { kind: "text" },
			rejected_because: { kind: "text" },
		});
	});

	test("empty flow map", () => {
		const result = parseYaml("item: {}");
		expect(result.item).toEqual({});
	});
});

describe("parseYaml — full plan_templates block (PLAN_SPEC.md:36-78)", () => {
	test("round-trips the full feature template", () => {
		const yaml = [
			"project: overstory",
			'version: "1"',
			"",
			"plan_templates:",
			"  feature:",
			"    sections:",
			"      context:",
			"        required: true",
			"        kind: text",
			"        min_length: 50",
			'        prompt: "Why does this work need to happen?"',
			"      alternatives:",
			"        kind: list",
			"        item:",
			"          name: { kind: text }",
			"          rejected_because: { kind: text }",
			"      steps:",
			"        kind: steps",
			"        min: 2",
			"      acceptance:",
			"        required: true",
			"        kind: list",
			"        item: text",
			"        min: 1",
		].join("\n");
		const result = parseYaml(yaml);
		expect(result.project).toBe("overstory");
		expect(result.version).toBe("1");
		const tpl = (result.plan_templates as Record<string, YamlValue>).feature as Record<
			string,
			YamlValue
		>;
		const sections = tpl.sections as Record<string, YamlValue>;
		expect((sections.context as Record<string, YamlValue>).required).toBe(true);
		expect((sections.context as Record<string, YamlValue>).min_length).toBe(50);
		expect((sections.context as Record<string, YamlValue>).prompt).toBe(
			"Why does this work need to happen?",
		);
		expect((sections.alternatives as Record<string, YamlValue>).item).toEqual({
			name: { kind: "text" },
			rejected_because: { kind: "text" },
		});
		expect((sections.steps as Record<string, YamlValue>).kind).toBe("steps");
		expect((sections.steps as Record<string, YamlValue>).min).toBe(2);
		expect((sections.acceptance as Record<string, YamlValue>).item).toBe("text");
	});
});

describe("stringifyYaml", () => {
	test("serializes simple key-value pairs", () => {
		const yaml = stringifyYaml({ project: "seeds", version: "1" });
		const parsed = parseYaml(yaml);
		expect(parsed.project).toBe("seeds");
		expect(parsed.version).toBe("1");
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

	test("round-trips nested maps", () => {
		const original: Record<string, YamlValue> = {
			project: "seeds",
			plan_templates: {
				feature: {
					sections: {
						context: { required: true, kind: "text", min_length: 50 },
					},
				},
			},
		};
		const yaml = stringifyYaml(original);
		const parsed = parseYaml(yaml);
		expect(parsed).toEqual(original);
	});

	test("round-trips sequences of objects", () => {
		const original: Record<string, YamlValue> = {
			alternatives: [
				{ name: "A", rejected_because: "slow" },
				{ name: "B", rejected_because: "risky" },
			],
		};
		const yaml = stringifyYaml(original);
		const parsed = parseYaml(yaml);
		expect(parsed).toEqual(original);
	});
});

describe("stringifyYaml — indicator quoting (round-trips via ours and std YAML)", () => {
	function roundTrip(original: Record<string, YamlValue>): string {
		const yaml = stringifyYaml(original);
		expect(parseYaml(yaml)).toEqual(original);
		expect(parseStdYaml(yaml)).toEqual(original);
		return yaml;
	}

	test("key '-' keeps the map and the keys after it", () => {
		const yaml = roundTrip({ "-": "x", after: "y" });
		expect(yaml).toContain('"-": x');
	});

	test("keys starting with '-' or '?' and keys with escapes round-trip", () => {
		roundTrip({ "-foo": 1, "? q": 2, '"': 3, "a\\b": 4, "": 5 });
	});

	test("quoted keys as the first entry of a sequence item", () => {
		roundTrip({ items: [{ "-": "a", b: "c" }, { '"q"': 1 }] });
	});

	test("values starting with indicators are quoted", () => {
		const yaml = roundTrip({ a: "- dash", b: "-", c: "? q", d: "-x" });
		expect(yaml).toContain('a: "- dash"');
	});

	test("strings std YAML would type as non-strings are quoted", () => {
		const strs = [".inf", "-.inf", ".nan", "+1", "1e3", "0x1F", "0o7", "1.", ".5", "yes", "No"];
		const original = Object.fromEntries(strs.map((v, i) => [`k${i}`, v]));
		roundTrip(original);
		roundTrip({ seq: strs });
	});

	test("control characters round-trip inside double quotes", () => {
		roundTrip({ a: "x\ty", b: "x\ry", c: "x\ny" });
	});
});

describe("parseScalarOrFlow — JSON input", () => {
	test("accepts compact JSON flow maps and sequences", () => {
		expect(parseScalarOrFlow('[{"name":"why"}]')).toEqual([{ name: "why" }]);
		expect(parseScalarOrFlow('{"a":1,"b":[true,null]}')).toEqual({ a: 1, b: [true, null] });
	});

	test("still parses YAML flow style", () => {
		expect(parseScalarOrFlow("{ kind: text, n: 3 }")).toEqual({ kind: "text", n: 3 });
		expect(parseScalarOrFlow("[a, b]")).toEqual(["a", "b"]);
	});
});
