// Top-level error handler for the `sd` CLI.
//
// Extracted from src/index.ts so it can be tested without booting the
// commander program at module load. The handler must surface the original
// command error even if the lazy `pino` logger import fails — pino lives in
// devDependencies and may be absent from end-user installs.

import chalk from "chalk";

type LoggerLoader = () => Promise<{ log: { debug: (obj: unknown, msg?: string) => void } }>;

export interface HandleTopLevelErrorOptions {
	jsonMode: boolean;
	cmd: string | undefined;
	loadLogger?: LoggerLoader;
	write?: (text: string) => void | Promise<void>;
	writeStderr?: (text: string) => void;
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
	const msg = err instanceof Error ? err.message : String(err);
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
			await Bun.write(Bun.stdout, line);
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
