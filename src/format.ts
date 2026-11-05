export type FormatMode = "markdown" | "compact" | "plain" | "ids" | "json";

export const VALID_FORMATS: readonly FormatMode[] = ["markdown", "compact", "plain", "ids", "json"];

function isFormatMode(value: string): value is FormatMode {
	return (VALID_FORMATS as readonly string[]).includes(value);
}

export interface ResolvedFormat {
	mode: FormatMode;
	error?: string;
}

/** Output-format options as commander hands them to an action. */
export interface FormatOptions {
	format?: string;
	json?: boolean;
}

/** --format wins over --json; an unknown --format value is reported via `error`. */
export function formatFromOptions(opts: FormatOptions): ResolvedFormat {
	if (opts.format !== undefined) {
		if (!isFormatMode(opts.format)) {
			return {
				mode: "markdown",
				error: `Invalid --format value: ${opts.format}. Valid: ${VALID_FORMATS.join("|")}`,
			};
		}
		return { mode: opts.format };
	}
	return { mode: opts.json ? "json" : "markdown" };
}

export function resolveFormat(args: string[]): ResolvedFormat {
	let formatVal: string | undefined;
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--format") {
			const next = args[i + 1];
			if (next !== undefined && !next.startsWith("--")) formatVal = next;
		} else if (arg?.startsWith("--format=")) {
			formatVal = arg.slice("--format=".length);
		}
	}
	return formatFromOptions({ format: formatVal, json: args.includes("--json") });
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: \x1b is the ESC byte required to match real ANSI escape sequences
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

export function stripAnsi(s: string): string {
	return s.replace(ANSI_REGEX, "");
}
