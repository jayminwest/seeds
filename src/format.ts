export type FormatMode = "markdown" | "compact" | "plain" | "ids" | "json";

export const VALID_FORMATS: readonly FormatMode[] = ["markdown", "compact", "plain", "ids", "json"];

function isFormatMode(value: string): value is FormatMode {
	return (VALID_FORMATS as readonly string[]).includes(value);
}

export interface ResolvedFormat {
	mode: FormatMode;
	error?: string;
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
	if (formatVal !== undefined) {
		if (!isFormatMode(formatVal)) {
			return {
				mode: "markdown",
				error: `Invalid --format value: ${formatVal}. Valid: ${VALID_FORMATS.join("|")}`,
			};
		}
		return { mode: formatVal };
	}
	if (args.includes("--json")) return { mode: "json" };
	return { mode: "markdown" };
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: \x1b is the ESC byte required to match real ANSI escape sequences
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

export function stripAnsi(s: string): string {
	return s.replace(ANSI_REGEX, "");
}
