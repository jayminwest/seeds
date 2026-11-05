// Pure helpers for "unknown command" typo suggestions.
//
// Extracted from src/index.ts so they can be unit-tested in-process without
// spawning a subprocess. The CLI entrypoint (src/index.ts) wires
// suggestForUnknown() in front of program.parseAsync() to short-circuit
// unknown commands with a Levenshtein-based hint.

// Cost of reaching (i, j) by swapping a[i-2..i-1], or Infinity when not a swap.
function swapCost(a: string, b: string, i: number, j: number, prevPrev: number[]): number {
	const isSwap = i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1];
	return isSwap ? (prevPrev[j - 2] ?? 0) + 1 : Number.POSITIVE_INFINITY;
}

// Optimal-string-alignment distance: Levenshtein plus adjacent transposition
// as a single edit, so the commonest typo ('lsit') ranks 'list' (1) above
// 'init' (2) instead of tying with it.
export function levenshtein(a: string, b: string): number {
	const m = a.length;
	const n = b.length;
	if (m === 0) return n;
	if (n === 0) return m;
	let prevPrev: number[] = [];
	let prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
	for (let i = 1; i <= m; i++) {
		const curr: number[] = [i];
		for (let j = 1; j <= n; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			const left = curr[j - 1] ?? 0;
			const up = prev[j] ?? 0;
			const diag = prev[j - 1] ?? 0;
			curr.push(Math.min(left + 1, up + 1, diag + cost, swapCost(a, b, i, j, prevPrev)));
		}
		prevPrev = prev;
		prev = curr;
	}
	return prev[n] ?? 0;
}

export interface UnknownCommandSuggestion {
	/** Closest known command name, or "" when the nearest match is too far. */
	suggestion: string;
	/** Pre-formatted human error message (no trailing newline). */
	errMsg: string;
}

/**
 * Given an unknown CLI command and the set of known command names, compute
 * the best suggestion (Levenshtein distance ≤ 2) and a human error string.
 */
export function suggestForUnknown(
	firstArg: string,
	knownNames: readonly string[],
): UnknownCommandSuggestion {
	let best = "";
	let bestDist = Number.POSITIVE_INFINITY;
	for (const name of knownNames) {
		const d = levenshtein(firstArg, name);
		if (d < bestDist) {
			bestDist = d;
			best = name;
		}
	}
	const suggestion = bestDist <= 2 ? best : "";
	const errMsg = suggestion
		? `Unknown command: ${firstArg}. Did you mean ${suggestion}?`
		: `Unknown command: ${firstArg}`;
	return { suggestion, errMsg };
}

/**
 * Commander-style error for an unknown subcommand of a group command whose
 * own action would otherwise report "too many arguments" (e.g. `sd plan ready`).
 */
export function unknownSubcommandMessage(arg: string, knownNames: readonly string[]): string {
	const { suggestion } = suggestForUnknown(arg, knownNames);
	const hint = suggestion ? `\n(Did you mean ${suggestion}?)` : "";
	return `error: unknown command '${arg}'${hint}`;
}
