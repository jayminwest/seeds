import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { registerAll } from "../register-all.ts";
import { runCli } from "../test-harness.ts";
import { generateBash, generateFish, generateZsh } from "./completions.ts";

// Previously this file spawned `bun run src/index.ts completions <shell>` to
// see every registered command. We now build a fully-populated Program
// in-process via registerAll() and call the exported generators directly.
// Validation-error paths (unknown shell, missing argument) are still
// exercised through the in-process runCli harness so the printError ✗-prefix
// contract is enforced.

let fullProgram: Command;

beforeAll(async () => {
	fullProgram = new Command();
	await registerAll(fullProgram);
});

describe("sd completions (script generators)", () => {
	test("bash output contains complete -F", () => {
		const out = generateBash(fullProgram);
		expect(out).toContain("complete -F");
		expect(out).toContain("_sd_completions");
	});

	test("zsh output contains #compdef sd", () => {
		const out = generateZsh(fullProgram);
		expect(out).toContain("#compdef sd");
		expect(out).toContain("_sd");
	});

	test("fish output contains complete -c sd", () => {
		const out = generateFish(fullProgram);
		expect(out).toContain("complete -c sd");
	});

	test("output includes known commands", () => {
		const out = generateBash(fullProgram);
		expect(out).toContain("create");
		expect(out).toContain("list");
		expect(out).toContain("stats");
	});

	test("output includes subcommands for dep and tpl", () => {
		const out = generateBash(fullProgram);
		expect(out).toContain("dep");
		expect(out).toContain("tpl");
		// dep subcommands
		expect(out).toContain("add");
		expect(out).toContain("remove");
		// tpl subcommands
		expect(out).toContain("pour");
	});
});

describe("sd completions (CLI validation)", () => {
	let tmpDir: string;

	beforeAll(async () => {
		// runCli chdirs into the working dir; give it a real temp dir even
		// though `completions` itself doesn't touch the filesystem.
		tmpDir = await mkdtemp(join(tmpdir(), "seeds-completions-"));
	});

	test("unknown shell exits non-zero with printError ✗ prefix", async () => {
		const { exitCode, stderr } = await runCli(["completions", "powershell"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Unknown shell");
		// pl-c94f step 1: validation errors flow through printError ("✗ " prefix)
		expect(stderr).toMatch(/^✗ /);
	});

	test("missing argument exits non-zero", async () => {
		const { exitCode } = await runCli(["completions"], tmpDir);
		expect(exitCode).not.toBe(0);
	});

	afterAll(async () => {
		await rm(tmpDir, { recursive: true, force: true });
	});
});
