// Top-level error handler for the `sd` CLI.
//
// Extracted from src/index.ts so it can be tested without booting the
// commander program at module load. The handler must surface the original
// command error even if the lazy `pino` logger import fails — pino lives in
// devDependencies and may be absent from end-user installs.

import chalk from "chalk";
import { type Command, CommanderError } from "commander";
import { writeStdout } from "./output.ts";

type LoggerLoader = () => Promise<{ log: { debug: (obj: unknown, msg?: string) => void } }>;

export interface HandleTopLevelErrorOptions {
	jsonMode: boolean;
	cmd: string | undefined;
	loadLogger?: LoggerLoader;
	write?: (text: string) => void | Promise<void>;
	writeStderr?: (text: string) => void;
}

/**
 * Route commander-level failures (missing required option, unknown option,
 * excess arguments, ...) through handleTopLevelError when --json is set
 * (seeds-cb18). exitOverride() makes commander throw a CommanderError instead
 * of calling process.exit, and the no-op outputError suppresses its plain-text
 * "error: ..." stderr line so the JSON envelope is the only failure output.
 * Neither setting is inherited by already-registered subcommands (mx-8e81ac),
 * so walk the whole tree.
 */
export function routeCommanderErrors(cmd: Command): void {
	cmd.exitOverride();
	cmd.configureOutput({ outputError: () => {} });
	for (const child of cmd.commands) routeCommanderErrors(child);
}

/**
 * Handle a top-level error from the CLI's main() promise chain.
 *
 * The logger import is wrapped in a try/catch: if `./log.ts` (or its pino
 * dependency) cannot be loaded we swallow the import failure silently so the
 * actual command error is what the user sees on stderr / --json stdout.
 */
export async function handleTopLevelError(
	err: unknown,
	opts: HandleTopLevelErrorOptions,
): Promise<void> {
	if (err instanceof CommanderError && err.exitCode === 0) {
		// --help / --version under exitOverride: output already written.
		process.exitCode = 0;
		return;
	}
	const msg = errorMessage(err, opts.cmd);
	const loadLogger: LoggerLoader = opts.loadLogger ?? (() => import("./log.ts"));
	try {
		const { log } = await loadLogger();
		log.debug({ err, cmd: opts.cmd }, "command failed");
	} catch {
		// Logger unavailable (e.g. pino not installed); swallow silently so the
		// original error below is what the user sees.
	}
	if (opts.jsonMode) {
		const line = `${JSON.stringify({ success: false, command: opts.cmd, error: msg }, null, 2)}\n`;
		if (opts.write) {
			await opts.write(line);
		} else {
			await writeStdout(line);
		}
	} else {
		const line = chalk.red(`Error: ${msg}`);
		if (opts.writeStderr) {
			opts.writeStderr(`${line}\n`);
		} else {
			console.error(line);
		}
	}
	process.exitCode = 1;
}

function errorMessage(err: unknown, cmd: string | undefined): string {
	if (err instanceof CommanderError) {
		// Help shown (on stderr) because a command was invoked without a subcommand.
		if (err.code === "commander.help") {
			const named = cmd !== undefined && !cmd.startsWith("-");
			return named
				? `missing subcommand. Run 'sd ${cmd} --help' for usage.`
				: "missing command. Run 'sd --help' for usage.";
		}
		return err.message.replace(/^error: /, "");
	}
	return err instanceof Error ? err.message : String(err);
}
