// --timing hook helpers, extracted from src/index.ts for in-process testing.
//
// The CLI installs installTimingHook() on the top-level commander Program so
// that `sd <cmd> --timing` prints "⏱ <elapsed>" to stderr after the action
// completes. stdout is left untouched so `--json --timing` keeps a clean JSON
// payload on stdout and the timing line on stderr.

import type { Command } from "commander";
import { muted } from "./output.ts";

/**
 * Format an elapsed-milliseconds reading as "<n>ms" for sub-second times
 * (rounded to whole ms) and "<n.nn>s" otherwise.
 */
export function formatElapsed(ms: number): string {
	return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Install pre/postAction hooks on the given program. The hooks no-op unless
 * `program.opts().timing` is truthy at action time, so wiring a `--timing`
 * option on `program` is the caller's responsibility.
 */
export function installTimingHook(program: Command): void {
	let start = 0;
	program.hook("preAction", () => {
		if (program.opts().timing) {
			start = performance.now();
		}
	});
	program.hook("postAction", () => {
		if (program.opts().timing) {
			const elapsed = performance.now() - start;
			process.stderr.write(`${muted(`⏱ ${formatElapsed(elapsed)}`)}\n`);
		}
	});
}
