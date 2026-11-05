import { describe, expect, test } from "bun:test";
import { Command } from "commander";
import { COMMAND_LOADERS, registerAll, registerForArgv } from "./register-all.ts";

function names(program: Command): string[] {
	return program.commands.map((c) => c.name());
}

async function registered(...args: string[]): Promise<string[]> {
	const program = new Command();
	await registerForArgv(program, ["bun", "sd", ...args]);
	return names(program);
}

describe("COMMAND_LOADERS", () => {
	test("each key loads the module that registers that command name", async () => {
		for (const [name, load] of Object.entries(COMMAND_LOADERS)) {
			const program = new Command();
			(await load()).register(program);
			expect(names(program)).toEqual([name]);
		}
	});

	test("registerAll registers every command in loader order", async () => {
		const program = new Command();
		await registerAll(program);
		expect(names(program)).toEqual(Object.keys(COMMAND_LOADERS));
	});
});

describe("registerForArgv (seeds-2ba4)", () => {
	test("registers only the invoked command, skipping leading global flags", async () => {
		expect(await registered("list", "--json")).toEqual(["list"]);
		expect(await registered("-q", "--timing", "dep", "add", "a", "b")).toEqual(["dep"]);
	});

	test("registers the full tree for no command, an unknown command, or completions", async () => {
		const all = Object.keys(COMMAND_LOADERS);
		expect(await registered("--help")).toEqual(all);
		expect(await registered("lsit")).toEqual(all);
		expect(await registered("completions", "zsh")).toEqual(all);
	});
});
