import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "./test-harness.ts";
import { normalizeTitle } from "./title.ts";

describe("normalizeTitle", () => {
	test("trims surrounding whitespace", () => {
		expect(normalizeTitle("  Fix it \n")).toBe("Fix it");
	});

	test("rejects empty and whitespace-only titles", () => {
		expect(() => normalizeTitle("   ")).toThrow("--title must not be empty");
	});

	test("rejects embedded newlines, tabs and other control characters", () => {
		for (const bad of ["two\nlines", "cr\rhere", "tab\there", "esc\u001b[31m"]) {
			expect(() => normalizeTitle(bad)).toThrow("must be a single line");
		}
	});

	test("names the flag in the error", () => {
		expect(() => normalizeTitle("a\nb", "--name")).toThrow("--name must be a single line");
	});
});

describe("title validation on the CLI", () => {
	let tmpDir: string;

	beforeEach(async () => {
		tmpDir = await mkdtemp(join(tmpdir(), "seeds-title-test-"));
		await runCli(["init"], tmpDir);
	});

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true });
	});

	test("sd create rejects a multi-line title", async () => {
		const res = await runCli(["create", "--title", "two\nlines"], tmpDir);
		expect(res.exitCode).not.toBe(0);
		expect(res.stderr).toContain("single line");
	});

	test("sd update rejects a multi-line title", async () => {
		const { stdout } = await runCli(["create", "--title", "ok", "--json"], tmpDir);
		const id = (JSON.parse(stdout) as { id: string }).id;
		const res = await runCli(["update", id, "--title", "a\nb"], tmpDir);
		expect(res.exitCode).not.toBe(0);
		expect(res.stderr).toContain("single line");
	});

	test("sd tpl step add trims the title and rejects newlines", async () => {
		const { stdout } = await runCli(["tpl", "create", "--name", "t", "--json"], tmpDir);
		const tplId = (JSON.parse(stdout) as { id: string }).id;
		await runCli(["tpl", "step", "add", tplId, "--title", "  Scout  "], tmpDir);
		const bad = await runCli(["tpl", "step", "add", tplId, "--title", "a\nb"], tmpDir);
		expect(bad.exitCode).not.toBe(0);
		const show = await runCli(["tpl", "show", tplId, "--json"], tmpDir);
		const steps = (JSON.parse(show.stdout) as { template: { steps: Array<{ title: string }> } })
			.template.steps;
		expect(steps.map((s) => s.title)).toEqual(["Scout"]);
	});
});
