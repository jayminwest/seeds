// Issue.intent — links an issue to one or more roots ideas (r-xxxx).
//
// Seeds stores the ids and never resolves them: roots reads the top-level
// `intent` field straight from issues.jsonl (a string for one id, a string[]
// for several). The shape check matches the token roots recognises
// (`r-` + 4..8 lowercase hex), so a stored id is never silently unlinkable.

import type { Issue } from "./types.ts";

const INTENT_RE = /^r-[0-9a-f]{4,8}$/;

/** Every value of a repeatable `--<name> <v>` / `--<name>=<v>` flag, in order. */
export function collectRepeated(args: string[], name: string): string[] {
	const out: string[] = [];
	const flag = `--${name}`;
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === flag) {
			const next = args[i + 1];
			if (next !== undefined && !next.startsWith("--")) {
				out.push(next);
				i++;
			}
		} else if (arg?.startsWith(`${flag}=`)) {
			out.push(arg.slice(flag.length + 1));
		}
	}
	return out;
}

/**
 * Normalise and validate --intent values. Accepts comma-separated lists too.
 * Returns the Issue.intent value (string for one id, string[] for several),
 * or undefined when no ids were given.
 */
export function parseIntent(values: string[]): Issue["intent"] {
	const ids = values
		.flatMap((v) => v.split(","))
		.map((v) => v.trim().toLowerCase())
		.filter(Boolean);
	for (const id of ids) {
		if (!INTENT_RE.test(id)) {
			throw new Error(`Invalid --intent value: ${id}. Expected a roots idea id like r-a1b2`);
		}
	}
	const unique = Array.from(new Set(ids));
	if (unique.length === 0) return undefined;
	return unique.length === 1 ? unique[0] : unique;
}

/** Commander accumulator for repeatable options. */
export function collect(value: string, previous: string[]): string[] {
	return [...previous, value];
}
