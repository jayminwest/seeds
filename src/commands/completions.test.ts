import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const CLI = join(import.meta.dir, "../../src/index.ts");

async function run(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(["bun", "run", CLI, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	return { stdout, stderr, exitCode };
}

describe("sd completions", () => {
	test("bash output contains complete -F", async () => {
		const { stdout, exitCode } = await run(["completions", "bash"]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("complete -F");
		expect(stdout).toContain("_sd_completions");
	});

	test("zsh output contains #compdef sd", async () => {
		const { stdout, exitCode } = await run(["completions", "zsh"]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("#compdef sd");
		expect(stdout).toContain("_sd");
	});

	test("fish output contains complete -c sd", async () => {
		const { stdout, exitCode } = await run(["completions", "fish"]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("complete -c sd");
	});

	test("output includes known commands", async () => {
		const { stdout } = await run(["completions", "bash"]);
		expect(stdout).toContain("create");
		expect(stdout).toContain("list");
		expect(stdout).toContain("stats");
	});

	test("output includes subcommands for dep and tpl", async () => {
		const { stdout } = await run(["completions", "bash"]);
		expect(stdout).toContain("dep");
		expect(stdout).toContain("tpl");
		// dep subcommands
		expect(stdout).toContain("add");
		expect(stdout).toContain("remove");
		// tpl subcommands
		expect(stdout).toContain("pour");
	});

	test("unknown shell exits non-zero", async () => {
		const { exitCode, stderr } = await run(["completions", "powershell"]);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Unknown shell");
	});

	test("missing argument exits non-zero", async () => {
		const { exitCode } = await run(["completions"]);
		expect(exitCode).not.toBe(0);
	});
});
