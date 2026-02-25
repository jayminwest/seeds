#!/usr/bin/env bun
export const VERSION = "0.2.3";

import chalk from "chalk";
import { Command, Help } from "commander";
import { brand, muted, setQuiet } from "./output.ts";

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
	.option("--verbose", "Extra diagnostic output")
	.option("--timing", "Show command execution time")
	.addHelpCommand(false)
	.configureHelp({
		formatHelp(cmd: Command, helper: Help): string {
			if (cmd.parent) {
				return Help.prototype.formatHelp.call(helper, cmd, helper);
			}
			const header = `${brand(chalk.bold("seeds"))} ${muted(`v${VERSION}`)} — Git-native issue tracking\n\nUsage: sd <command> [options]`;

			const cmdLines: string[] = ["\nCommands:"];
			for (const sub of cmd.commands) {
				const name = sub.name();
				const argStr = sub.registeredArguments
					.map((a) => (a.required ? `<${a.name()}>` : `[${a.name()}]`))
					.join(" ");
				const rawEntry = argStr ? `${name} ${argStr}` : name;
				const colored = argStr ? `${chalk.green(name)} ${chalk.dim(argStr)}` : chalk.green(name);
				const pad = " ".repeat(Math.max(18 - rawEntry.length, 2));
				cmdLines.push(`  ${colored}${pad}${sub.description()}`);
			}

			const opts: [string, string][] = [
				["-h, --help", "Show help"],
				["-v, --version", "Print version"],
				["--json", "Output as JSON"],
				["-q, --quiet", "Suppress non-error output"],
				["--verbose", "Extra diagnostic output"],
				["--timing", "Show command execution time"],
			];
			const optLines: string[] = ["\nOptions:"];
			for (const [flag, desc] of opts) {
				const pad = " ".repeat(Math.max(18 - flag.length, 2));
				optLines.push(`  ${chalk.dim(flag)}${pad}${desc}`);
			}

			const footer = `\nRun '${chalk.dim("sd")} <command> --help' for command-specific help.`;

			return `${[header, ...cmdLines, ...optLines, footer].join("\n")}\n`;
		},
	});

// --timing: measure command execution time
let timingStart = 0;
program.hook("preAction", () => {
	if (program.opts().timing) {
		timingStart = performance.now();
	}
});
program.hook("postAction", () => {
	if (program.opts().timing) {
		const elapsed = performance.now() - timingStart;
		const formatted =
			elapsed < 1000 ? `${Math.round(elapsed)}ms` : `${(elapsed / 1000).toFixed(2)}s`;
		process.stderr.write(`${muted(`⏱ ${formatted}`)}\n`);
	}
});

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
		import("./commands/completions.ts"),
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
