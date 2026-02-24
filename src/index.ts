#!/usr/bin/env bun
export const VERSION = "0.2.1";

import chalk from "chalk";
import { Command } from "commander";
import { setQuiet } from "./output.ts";

// Handle --version --json before Commander processes the flag
const rawArgs = process.argv.slice(2);
if ((rawArgs.includes("-v") || rawArgs.includes("--version")) && rawArgs.includes("--json")) {
	const platform = `${process.platform}-${process.arch}`;
	console.log(
		JSON.stringify({ name: "@os-eco/seeds-cli", version: VERSION, runtime: "bun", platform }),
	);
	process.exit();
}

// Apply quiet mode early so it affects all output during command execution
if (rawArgs.includes("--quiet") || rawArgs.includes("-q")) {
	setQuiet(true);
}

const program = new Command();

program
	.name("sd")
	.description("seeds — git-native issue tracker")
	.version(VERSION, "-v, --version", "Print version")
	.option("-q, --quiet", "Suppress non-error output")
	.option("--verbose", "Extra diagnostic output");

// Lazy-load and register all commands
async function registerAll(): Promise<void> {
	const mods = await Promise.all([
		import("./commands/init.ts"),
		import("./commands/create.ts"),
		import("./commands/show.ts"),
		import("./commands/list.ts"),
		import("./commands/ready.ts"),
		import("./commands/update.ts"),
		import("./commands/close.ts"),
		import("./commands/dep.ts"),
		import("./commands/blocked.ts"),
		import("./commands/stats.ts"),
		import("./commands/sync.ts"),
		import("./commands/doctor.ts"),
		import("./commands/tpl.ts"),
		import("./commands/migrate.ts"),
		import("./commands/prime.ts"),
		import("./commands/onboard.ts"),
		import("./commands/upgrade.ts"),
	]);

	for (const mod of mods) {
		mod.register(program);
	}
}

async function main(): Promise<void> {
	await registerAll();
	await program.parseAsync(process.argv);
}

const jsonMode = process.argv.includes("--json");

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	const cmd = process.argv[2];
	if (jsonMode) {
		console.log(JSON.stringify({ success: false, command: cmd, error: msg }));
	} else {
		console.error(chalk.red(`Error: ${msg}`));
	}
	process.exitCode = 1;
});
