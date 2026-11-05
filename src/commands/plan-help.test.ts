// Help-text accuracy for sd plan (seeds-bde5): prompt's default output is
// prose (JSON only with --json), the submit example includes every section
// the default template requires, and an unknown subcommand is reported as
// such instead of commander's "too many arguments for 'plan'".

import { describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { runCli } from "../test-harness.ts";

describe("sd plan help text", () => {
	test("prompt --help does not claim JSON is the default output", async () => {
		const { stdout, exitCode } = await runCli(["plan", "prompt", "--help"], tmpdir());
		expect(exitCode).toBe(0);
		expect(stdout).not.toContain("prompt JSON");
		expect(stdout).toContain("--json");
	});

	test("submit --help example includes the required context section", async () => {
		const { stdout } = await runCli(["plan", "submit", "--help"], tmpdir());
		for (const section of ["context", "approach", "steps", "acceptance"]) {
			expect(stdout).toContain(`"${section}"`);
		}
	});

	test("unknown subcommand is reported with a suggestion", async () => {
		const { stderr, exitCode } = await runCli(["plan", "shwo"], tmpdir());
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("unknown command 'shwo'");
		expect(stderr).toContain("Did you mean show?");
		expect(stderr).not.toContain("too many arguments");
	});
});
