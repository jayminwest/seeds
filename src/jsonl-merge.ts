// Three-way merge of a seeds JSONL store (issues / plans / templates), keyed by
// row `id`. This is what `sd merge-driver` runs when git merges two branches
// that both touched `.seeds/*.jsonl`.
//
// seeds rewrites rows in place (close, update, plan edit, tpl step add), so a
// line-level `merge=union` keeps BOTH copies of a row edited on both sides and
// reports a clean merge. Here each row is merged field by field against the
// common ancestor instead:
//   - a field changed on one side only takes that side;
//   - arrays of primitives (blockedBy, labels, children) apply both sides'
//     additions and removals relative to the ancestor;
//   - nested plain objects (extensions, sections) merge recursively;
//   - timestamps / revision changed on both sides take the larger value;
//   - anything else changed differently on both sides is a conflict, reported
//     (never silently resolved) and emitted between git-style markers.

export interface JsonlMergeResult {
	content: string;
	/** `id` or `id.field.path` for every unresolved conflict; empty on a clean merge. */
	conflicts: string[];
}

type Row = Record<string, unknown>;

interface Side {
	order: string[];
	rows: Map<string, Row>;
	lines: Map<string, string>;
}

const ABSENT: unique symbol = Symbol("absent");
type Val = unknown;

/** Fields that only move forward; on a both-sides change the larger value wins. */
const MONOTONIC_KEYS = new Set(["updatedAt", "closedAt", "revision"]);

function isPlainObject(v: Val): v is Row {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isPrimitiveArray(v: Val): v is Array<string | number | boolean | null> {
	return Array.isArray(v) && v.every((x) => x === null || typeof x !== "object");
}

function isOrdered(v: Val): v is string | number {
	return typeof v === "string" || typeof v === "number";
}

/** JSON with sorted keys, so key order never makes equal values look different. */
function canonical(v: Val): string {
	if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
	if (isPlainObject(v)) {
		const keys = Object.keys(v).sort();
		return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
	}
	return JSON.stringify(v);
}

function eq(a: Val, b: Val): boolean {
	if (a === ABSENT || b === ABSENT) return a === b;
	return a === b || canonical(a) === canonical(b);
}

function parseSide(text: string, label: string): Side {
	const side: Side = { order: [], rows: new Map(), lines: new Map() };
	for (const [i, raw] of text.split("\n").entries()) {
		const line = raw.trim();
		if (!line) continue;
		let parsed: unknown;
		try {
			parsed = JSON.parse(line);
		} catch {
			throw new Error(`${label}: line ${i + 1} is not valid JSON`);
		}
		if (!isPlainObject(parsed) || typeof parsed.id !== "string") {
			throw new Error(`${label}: line ${i + 1} has no string "id"`);
		}
		// Dedup-on-read, last occurrence wins (same rule as store.ts).
		if (!side.rows.has(parsed.id)) side.order.push(parsed.id);
		side.rows.set(parsed.id, parsed);
		side.lines.set(parsed.id, line);
	}
	return side;
}

function mergeSet(base: readonly Val[], ours: readonly Val[], theirs: readonly Val[]): Val[] {
	const has = (arr: readonly Val[], x: Val) => arr.some((y) => eq(x, y));
	const removedByTheirs = base.filter((x) => !has(theirs, x));
	const result = ours.filter((x) => !has(removedByTheirs, x));
	for (const x of theirs) {
		if (!has(base, x) && !has(result, x)) result.push(x);
	}
	return result;
}

function mergeObject(base: Row, ours: Row, theirs: Row, where: string, conflicts: string[]): Row {
	const keys = [...new Set([...Object.keys(ours), ...Object.keys(theirs), ...Object.keys(base)])];
	const out: Row = {};
	for (const key of keys) {
		const at = (r: Row): Val => (Object.hasOwn(r, key) ? r[key] : ABSENT);
		const v = mergeValue(key, at(base), at(ours), at(theirs), `${where}.${key}`, conflicts);
		if (v !== ABSENT) out[key] = v;
	}
	return out;
}

function mergeValue(
	key: string,
	base: Val,
	ours: Val,
	theirs: Val,
	where: string,
	conflicts: string[],
): Val {
	if (eq(ours, theirs)) return ours;
	if (eq(base, ours)) return theirs;
	if (eq(base, theirs)) return ours;
	return mergeBothChanged(key, base, ours, theirs, where, conflicts);
}

/** Both sides changed the value, differently: combine it if its shape allows, else conflict. */
function mergeBothChanged(
	key: string,
	base: Val,
	ours: Val,
	theirs: Val,
	where: string,
	conflicts: string[],
): Val {
	if (MONOTONIC_KEYS.has(key) && isOrdered(ours) && typeof ours === typeof theirs) {
		return ours > (theirs as typeof ours) ? ours : theirs;
	}
	if (isPlainObject(ours) && isPlainObject(theirs) && (base === ABSENT || isPlainObject(base))) {
		return mergeObject(base === ABSENT ? {} : base, ours, theirs, where, conflicts);
	}
	if (
		isPrimitiveArray(ours) &&
		isPrimitiveArray(theirs) &&
		(base === ABSENT || Array.isArray(base))
	) {
		return mergeSet(base === ABSENT ? [] : base, ours, theirs);
	}
	conflicts.push(where);
	return ours;
}

function conflictBlock(ours: string | undefined, theirs: string | undefined): string[] {
	const opt = (l: string | undefined) => (l === undefined ? [] : [l]);
	return ["<<<<<<< ours", ...opt(ours), "=======", ...opt(theirs), ">>>>>>> theirs"];
}

/** Output lines for one row id: the merged row, nothing (deleted), or a conflict block. */
function mergeRow(id: string, b: Side, o: Side, t: Side, conflicts: string[]): string[] {
	const ov = o.rows.get(id) ?? ABSENT;
	const tv = t.rows.get(id) ?? ABSENT;
	const before = conflicts.length;
	const merged = mergeValue("", b.rows.get(id) ?? ABSENT, ov, tv, id, conflicts);
	if (conflicts.length > before) {
		// Leave the whole row for a human: markers make the file fail to
		// parse, so nothing downstream can mistake it for a resolved store.
		return conflictBlock(o.lines.get(id), t.lines.get(id));
	}
	if (merged === ABSENT) return [];
	// An untouched side's row is emitted verbatim to keep the diff minimal.
	const verbatim = merged === ov ? o.lines.get(id) : merged === tv ? t.lines.get(id) : undefined;
	return [verbatim ?? JSON.stringify(merged)];
}

/** Three-way merge of JSONL store contents. Throws when a side is not valid seeds JSONL. */
export function mergeJsonl(base: string, ours: string, theirs: string): JsonlMergeResult {
	const b = parseSide(base, "ancestor");
	const o = parseSide(ours, "ours");
	const t = parseSide(theirs, "theirs");
	const conflicts: string[] = [];
	const out = [...new Set([...o.order, ...t.order])].flatMap((id) =>
		mergeRow(id, b, o, t, conflicts),
	);
	return { content: out.length === 0 ? "" : `${out.join("\n")}\n`, conflicts };
}
