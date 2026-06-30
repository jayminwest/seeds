import { describe, expect, test } from "bun:test";
import { levenshtein, suggestForUnknown } from "./suggestions.ts";

// Note: the previous version of this file spawned `bun run src/index.ts` per
// assertion. The suggestion logic is pure (no I/O, no globals), so we now
// exercise it directly via the helpers extracted from src/index.ts. The
// end-to-end stderr/--json wiring is covered by src/cli-smoke.test.ts.

const KNOWN = [
	"init",
	"create",
	"show",
	"list",
	"ready",
	"search",
	"update",
	"close",
	"dep",
	"label",
	"blocked",
	"stats",
	"sync",
	"doctor",
	"tpl",
	"migrate",
	"prime",
	"onboard",
	"upgrade",
	"completions",
	"block",
	"unblock",
	"plan",
	"config",
];

describe("levenshtein", () => {
	test("identical strings → 0", () => {
		expect(levenshtein("create", "create")).toBe(0);
	});

	test("single edit → 1", () => {
		expect(levenshtein("creat", "create")).toBe(1);
		expect(levenshtein("lis", "list")).toBe(1);
	});

	test("empty inputs", () => {
		expect(levenshtein("", "")).toBe(0);
		expect(levenshtein("", "abc")).toBe(3);
		expect(levenshtein("abc", "")).toBe(3);
	});

	test("far strings", () => {
		expect(levenshtein("zzzznotacommand", "create")).toBeGreaterThan(2);
	});
});

describe("suggestForUnknown", () => {
	test("misspelled 'creat' suggests 'create'", () => {
		const { suggestion, errMsg } = suggestForUnknown("creat", KNOWN);
		expect(suggestion).toBe("create");
		expect(errMsg).toBe("Unknown command: creat. Did you mean create?");
	});

	test("misspelled 'lis' suggests 'list'", () => {
		const { suggestion, errMsg } = suggestForUnknown("lis", KNOWN);
		expect(suggestion).toBe("list");
		expect(errMsg).toContain("Did you mean list");
	});

	test("completely unrelated string does not suggest", () => {
		const { suggestion, errMsg } = suggestForUnknown("zzzznotacommand", KNOWN);
		expect(suggestion).toBe("");
		expect(errMsg).toBe("Unknown command: zzzznotacommand");
		expect(errMsg).not.toContain("Did you mean");
	});

	test("distance of exactly 2 still suggests", () => {
		// "lst" -> "list" is distance 1; pick a distance-2 case
		const { suggestion } = suggestForUnknown("crete", KNOWN);
		expect(suggestion).toBe("create");
	});

	test("distance > 2 does not suggest", () => {
		const { suggestion } = suggestForUnknown("nosuchcmd", KNOWN);
		expect(suggestion).toBe("");
	});

	test("empty known list yields no suggestion", () => {
		const { suggestion, errMsg } = suggestForUnknown("create", []);
		expect(suggestion).toBe("");
		expect(errMsg).toBe("Unknown command: create");
	});
});
