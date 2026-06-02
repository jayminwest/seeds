// Priority parsing + validation, shared between `sd create` and `sd tpl step add`.
//
// Accepts either bare digits (`"2"`) or the `P`-prefixed shorthand (`"P2"`,
// case-insensitive). Returns NaN for unparseable input so callers can produce a
// uniform error message. The valid range is 0–4 (P0 = highest, P4 = lowest).

const MIN_PRIORITY = 0;
const MAX_PRIORITY = 4;
export const PRIORITY_ERROR = "--priority must be 0-4 or P0-P4";

/**
 * Parse a CLI --priority flag value. `undefined` or a bare `true` (flag with no
 * value) yields `defaultVal`. Anything else is coerced via Number.parseInt; an
 * invalid string returns NaN, which the caller should reject with PRIORITY_ERROR.
 */
export function parsePriority(val: string | boolean | undefined, defaultVal = 2): number {
	if (val === undefined || val === true) return defaultVal;
	const s = String(val);
	if (s.toUpperCase().startsWith("P")) return Number.parseInt(s.slice(1), 10);
	return Number.parseInt(s, 10);
}

/** True if `p` is a finite integer in the inclusive 0–4 range. */
export function isValidPriority(p: number): boolean {
	return Number.isInteger(p) && p >= MIN_PRIORITY && p <= MAX_PRIORITY;
}
