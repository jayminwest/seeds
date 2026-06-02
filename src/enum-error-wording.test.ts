// Regression for seeds-3df8: every enum-style validation error in the CLI
// surface (src/commands/ and src/format.ts) must use the canonical
// `Invalid --X value: <val>. Valid: a|b|c` wording. Catches regressions where
// a new command grows back the old `must be one of: a, b, c` phrasing or
// switches the `|` delimiter back to `, `.

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const s = statSync(full);
		if (s.isDirectory()) out.push(...walk(full));
		else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) out.push(full);
	}
	return out;
}

describe("enum validation error wording", () => {
	const files = [...walk("src/commands"), "src/format.ts"];

	test("no source file uses the legacy 'must be one of' phrasing", () => {
		const offenders: string[] = [];
		for (const f of files) {
			const text = readFileSync(f, "utf8");
			if (text.includes("must be one of")) offenders.push(f);
		}
		expect(offenders).toEqual([]);
	});

	test("every 'Invalid --X value' message uses the canonical 'Valid: …' suffix with '|' delimiter", () => {
		const bad: { file: string; line: number; text: string }[] = [];
		// Matches `Invalid --<flag> value: ...` followed (on the same line) by
		// `Valid: ` and then a list. The list must NOT contain ", " — comma+space
		// is the legacy delimiter we are normalizing away.
		const invalidRe = /Invalid --[a-z-]+ value:/;
		const validSuffixRe = /Valid: ([^`"\\)]+)/;
		for (const f of files) {
			const lines = readFileSync(f, "utf8").split("\n");
			lines.forEach((line, i) => {
				if (!invalidRe.test(line)) return;
				const m = line.match(validSuffixRe);
				if (!m) {
					bad.push({ file: f, line: i + 1, text: line.trim() });
					return;
				}
				const list = m[1] ?? "";
				if (list.includes(", ")) bad.push({ file: f, line: i + 1, text: line.trim() });
			});
		}
		expect(bad).toEqual([]);
	});
});
