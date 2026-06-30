#!/usr/bin/env bun
import chalk from "chalk";
import { Command, Help } from "commander";
import { handleTopLevelError } from "./error-handler.ts";
import { brand, muted, outputJson, setQuiet } from "./output.ts";
import { registerAll } from "./register-all.ts";
import { suggestForUnknown } from "./suggestions.ts";
import { installTimingHook } from "./timing.ts";
import { VERSION } from "./version.ts";

export { VERSION };

// Exit cleanly when a downstream reader closes the pipe early (the common
// `sd ... --json | head` idiom). Node/Bun deliver a broken pipe as an EPIPE
// "error" event on the stream rather than a SIGPIPE signal; without a handler
// the process throws an uncaught error or, on Linux, busy-spins at 100% CPU
// retrying the write. (The Bun.write stdout path is guarded separately in
// src/output.ts since it bypasses these stream objects.)
function exitOnEpipe(err: NodeJS.ErrnoException): void {
	if (err.code === "EPIPE") {
		process.exit(0);
	}
	throw err;
}
process.stdout.on("error", exitOnEpipe);
process.stderr.on("error", exitOnEpipe);

// Apply quiet mode early so it affects all output during command execution
const rawArgs = process.argv.slice(2);
if (rawArgs.includes("--quiet") || rawArgs.includes("-q")) {
	setQuiet(true);
}

// Declared above main() so the closure read inside main() and the top-level
// .catch() handler both see a fully initialized binding (no TDZ window).
const jsonMode = process.argv.includes("--json");

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
				["--format <mode>", "Output format (markdown|compact|plain|ids|json)"],
				["--json", "Alias for --format json"],
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
installTimingHook(program);

async function main(): Promise<void> {
	// Handle --version --json before Commander processes the flag
	if ((rawArgs.includes("-v") || rawArgs.includes("--version")) && rawArgs.includes("--json")) {
		const platform = `${process.platform}-${process.arch}`;
		await outputJson({
			success: true,
			command: "version",
			name: "@os-eco/seeds-cli",
			version: VERSION,
			runtime: "bun",
			platform,
		});
		process.exitCode = 0;
		return;
	}

	await registerAll(program);

	// Check for unknown commands before parsing
	const firstArg = process.argv[2];
	if (firstArg && !firstArg.startsWith("-")) {
		const knownNames = program.commands.map((c) => c.name());
		if (!knownNames.includes(firstArg)) {
			const { suggestion, errMsg } = suggestForUnknown(firstArg, knownNames);
			if (jsonMode) {
				const payload: Record<string, unknown> = {
					success: false,
					command: firstArg,
					error: errMsg,
				};
				if (suggestion) payload.suggestion = suggestion;
				await outputJson(payload);
			} else {
				process.stderr.write(`${errMsg}\n`);
			}
			process.exitCode = 1;
			return;
		}
	}

	await program.parseAsync(process.argv);
}

main().catch((err: unknown) => handleTopLevelError(err, { jsonMode, cmd: process.argv[2] }));
