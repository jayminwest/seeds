/**
 * Structured logging for the seeds CLI (pino).
 *
 * This is the observability channel — diagnostic/debug output that survives as
 * machine-parseable NDJSON in CI and non-TTY contexts, and renders prettily in
 * an interactive shell. It is NOT the user-output channel: deliberate,
 * chalk-formatted CLI prints live in `src/output.ts` and must stay there.
 *
 * Level resolution lives inside `createLog()` (never read at module top) so
 * tests can override `process.env` and re-create a logger deterministically:
 *   - explicit `SEEDS_LOG_LEVEL` wins,
 *   - `SEEDS_DEBUG === "1"` flips the default to `debug`,
 *   - otherwise `info`.
 *
 * Sensitive values are scrubbed via pino `redact` with `remove: true` (the key
 * is dropped, not masked) before any line reaches stdout.
 */

import pino from "pino";

export type Logger = pino.Logger;

export interface CreateLogOptions {
	level?: pino.LevelWithSilent;
	/** Force pretty (true) or NDJSON (false). Defaults to TTY auto-detection. */
	pretty?: boolean;
	/** Custom sink — bypasses the pretty transport (used by tests). */
	destination?: pino.DestinationStream;
}

// Paths whose values never belong in logs. Bare keys cover top-level fields;
// `*.<key>` wildcards cover one level of nesting (e.g. `req.token`). Mirrors
// burrow's redact policy. Documented in AGENTS.md (redact policy).
export const REDACT_PATHS: readonly string[] = [
	"password",
	"token",
	"apiKey",
	"secret",
	"authorization",
	"*.password",
	"*.token",
	"*.apiKey",
	"*.secret",
	"*.authorization",
	"headers.cookie",
	"headers.authorization",
];

// pino's built-in levels. Kept as a literal set so we can validate
// SEEDS_LOG_LEVEL without trusting an arbitrary env value at the type cast —
// an unknown value (e.g. SEEDS_LOG_LEVEL=chatty) would otherwise crash pino at
// logger init. Mirrors the keys of `pino.levels.values`.
const VALID_LEVELS: ReadonlySet<string> = new Set<pino.LevelWithSilent>([
	"trace",
	"debug",
	"info",
	"warn",
	"error",
	"fatal",
	"silent",
]);

function isValidLevel(value: string): value is pino.LevelWithSilent {
	return VALID_LEVELS.has(value);
}

function resolveLevel(): pino.LevelWithSilent {
	const explicit = process.env.SEEDS_LOG_LEVEL;
	if (explicit && isValidLevel(explicit)) return explicit;
	if (process.env.SEEDS_DEBUG === "1") return "debug";
	return "info";
}

export function createLog(options: CreateLogOptions = {}): Logger {
	const level = options.level ?? resolveLevel();
	const pretty = options.pretty ?? process.stdout.isTTY === true;

	const base: pino.LoggerOptions = {
		level,
		redact: { paths: [...REDACT_PATHS], remove: true },
	};

	if (pretty && !options.destination) {
		// Inline `transport` so knip's pino plugin can statically see the
		// `pino-pretty` target string and not flag it as an unused dep.
		return pino({
			...base,
			transport: {
				target: "pino-pretty",
				options: { colorize: true, translateTime: "SYS:HH:MM:ss.l" },
			},
		});
	}

	return options.destination ? pino(base, options.destination) : pino(base);
}

export const log: Logger = createLog();
