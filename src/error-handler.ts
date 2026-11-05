// Top-level error handler for the `sd` CLI.
//
// Extracted from src/index.ts so it can be tested without booting the
// commander program at module load.

import chalk from "chalk";
import { type Command, CommanderError } from "commander";
import { writeStdout } from "./output.ts";

export interface HandleTopLevelErrorOptions {
	jsonMode: boolean;
	cmd: string | undefined;
	/** Also print the stack to stderr. Defaults to `SEEDS_DEBUG === "1"`. */
	debug?: boolean;
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
 * The space-joined subcommand path argv invokes (`"dep add"`, `"tpl step add"`),
 * so a failure envelope's `command` matches the one the same invocation
 * reports on success (seeds-7f39). Options are skipped; the walk stops at the
 * first token that is not a subcommand of the current command. Falls back to
 * argv[2] when no top-level command matches (unknown command, or registration
 * never ran).
 */
export function resolveCommandPath(program: Command, argv: string[]): string | undefined {
	const path: string[] = [];
	let current = program;
	for (const token of argv.slice(2)) {
		if (token.startsWith("-")) continue;
		const sub = current.commands.find((c) => c.name() === token || c.aliases().includes(token));
		if (!sub) break;
		path.push(sub.name());
		current = sub;
		if (current.commands.length === 0) break;
	}
	return path.length > 0 ? path.join(" ") : argv[2];
}

/**
 * Handle a top-level error from the CLI's main() promise chain.
 *
 * Under `SEEDS_DEBUG=1` the stack goes to stderr, never stdout, so the --json
 * contract holds even while debugging.
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
	const writeStderr = opts.writeStderr ?? ((text: string) => process.stderr.write(text));
	const debug = opts.debug ?? process.env.SEEDS_DEBUG === "1";
	if (debug && err instanceof Error && err.stack) writeStderr(`${err.stack}\n`);
	if (opts.jsonMode) {
		const line = `${JSON.stringify({ success: false, command: opts.cmd, error: msg }, null, 2)}\n`;
		if (opts.write) {
			await opts.write(line);
		} else {
			await writeStdout(line);
		}
	} else {
		writeStderr(`${chalk.red(`Error: ${msg}`)}\n`);
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
