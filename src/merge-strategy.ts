// Git merge strategy for the `.seeds/*.jsonl` stores: one module that both
// `sd init` (ensure) and `sd doctor` (inspect / --fix) use.
//
// Every store is rewritten in place, so none of them may use `merge=union`
// (it keeps both copies of a row edited on two branches and reports a clean
// merge). Each is routed to the `seeds-jsonl` driver (`sd merge-driver`), a
// 3-way merge keyed by row id. The check validates the strategy git actually
// RESOLVES (`git check-attr`, last match wins) instead of substring-matching
// .gitattributes, so a repo that routes a store to its own driver is accepted
// as-is and never has a union line appended over it.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ISSUES_FILE, PLANS_FILE, SEEDS_DIR_NAME, TEMPLATES_FILE } from "./types.ts";

export const MERGE_DRIVER_NAME = "seeds-jsonl";
export const MERGE_DRIVER_COMMAND = "sd merge-driver %O %A %B %P";

export const STORE_PATHS = [ISSUES_FILE, TEMPLATES_FILE, PLANS_FILE].map(
	(f) => `${SEEDS_DIR_NAME}/${f}`,
);

export const MERGE_DRIVER_LINES = STORE_PATHS.map((p) => `${p} merge=${MERGE_DRIVER_NAME}`);

export type MergeProblemKind = "union" | "missing" | "unregistered" | "undefined-driver";

export interface MergeProblem {
	path: string;
	kind: MergeProblemKind;
	message: string;
	fixable: boolean;
}

/** Built-in merge attribute states that are deliberate choices, not drivers. */
const BUILTIN_STRATEGIES = new Set(["set", "unset", "text", "binary"]);

function git(root: string, args: string[]): { ok: boolean; out: string } {
	try {
		const r = Bun.spawnSync(["git", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
		return { ok: r.exitCode === 0, out: r.stdout.toString() };
	} catch {
		return { ok: false, out: "" };
	}
}

/** The resolved `merge` attribute per store path via git, or null outside a git repo. */
function resolveWithGit(root: string): Map<string, string> | null {
	const r = git(root, ["check-attr", "merge", "--", ...STORE_PATHS]);
	if (!r.ok) return null;
	const out = new Map<string, string>();
	for (const line of r.out.split("\n")) {
		const m = /^(.*): merge: (.*)$/.exec(line);
		if (m?.[1] && m[2] !== undefined) out.set(m[1], m[2]);
	}
	return out;
}

function attrValue(token: string): string | null {
	if (token === "merge") return "set";
	if (token === "-merge") return "unset";
	if (token === "!merge") return "unspecified";
	return token.startsWith("merge=") ? token.slice("merge=".length) : null;
}

function patternMatches(pattern: string, path: string): boolean {
	const p = pattern.startsWith("/") ? pattern.slice(1) : pattern;
	if (p === path) return true;
	const target = p.includes("/") ? path : (path.split("/").pop() ?? path);
	return new Bun.Glob(p).match(target);
}

/** The merge value a .gitattributes line sets for `path`, or null when it does not apply. */
function lineMergeValue(raw: string, path: string): string | null {
	const [pattern, ...attrs] = raw.trim().split(/\s+/);
	if (!pattern || pattern.startsWith("#") || !patternMatches(pattern, path)) return null;
	let value: string | null = null;
	for (const a of attrs) value = attrValue(a) ?? value;
	return value;
}

/** Outside a git repo: last matching line of the root .gitattributes wins. */
function resolveFromFile(root: string): Map<string, string> {
	const gitattrsPath = join(root, ".gitattributes");
	const lines = existsSync(gitattrsPath) ? readFileSync(gitattrsPath, "utf8").split("\n") : [];
	const out = new Map<string, string>();
	for (const raw of lines) {
		for (const path of STORE_PATHS) {
			const v = lineMergeValue(raw, path);
			if (v !== null) out.set(path, v);
		}
	}
	return out;
}

/** Names of merge drivers defined in git config (`merge.<name>.driver`). */
function definedDrivers(root: string): Set<string> {
	const r = git(root, ["config", "--get-regexp", "^merge\\..*\\.driver$"]);
	const names = new Set<string>();
	for (const line of r.out.split("\n")) {
		const key = line.split(/\s/, 1)[0] ?? "";
		if (key.startsWith("merge.") && key.endsWith(".driver")) {
			names.add(key.slice("merge.".length, -".driver".length));
		}
	}
	return names;
}

function problemFor(path: string, s: string, drivers: Set<string> | null): MergeProblem | null {
	if (s === "union") {
		return {
			path,
			kind: "union",
			message: `${path}: merge=union duplicates rows edited on both branches (use merge=${MERGE_DRIVER_NAME})`,
			fixable: true,
		};
	}
	if (s === "unspecified") {
		return {
			path,
			kind: "missing",
			message: `${path}: no merge strategy (expected merge=${MERGE_DRIVER_NAME})`,
			fixable: true,
		};
	}
	if (!drivers || BUILTIN_STRATEGIES.has(s) || drivers.has(s)) return null;
	const ours = s === MERGE_DRIVER_NAME;
	return {
		path,
		kind: ours ? "unregistered" : "undefined-driver",
		message: `${path}: merge driver ${s} is not ${ours ? "registered" : "defined"} in git config`,
		fixable: ours,
	};
}

/** Problems with how git would merge each store; empty when every store merges safely. */
export function inspectMergeStrategy(root: string): MergeProblem[] {
	const viaGit = resolveWithGit(root);
	const resolved = viaGit ?? resolveFromFile(root);
	// Outside a repo there is no git config to check drivers against.
	const drivers = viaGit ? definedDrivers(root) : null;
	const problems: MergeProblem[] = [];
	for (const path of STORE_PATHS) {
		const problem = problemFor(path, resolved.get(path) ?? "unspecified", drivers);
		if (problem) problems.push(problem);
	}
	return problems;
}

function rewriteGitattributes(root: string, paths: string[]): void {
	const gitattrsPath = join(root, ".gitattributes");
	const existing = existsSync(gitattrsPath) ? readFileSync(gitattrsPath, "utf8") : "";
	// Drop seeds' own lines for these paths (legacy union, or a driver line that
	// a later line overrides), then append ours last so it wins.
	const owned = new Set(
		paths.flatMap((p) => [`${p} merge=union`, `${p} merge=${MERGE_DRIVER_NAME}`]),
	);
	const kept = existing.split("\n").filter((l) => !owned.has(l.trim().replace(/\s+/g, " ")));
	while (kept.length > 0 && kept[kept.length - 1] === "") kept.pop();
	const added = paths.map((p) => `${p} merge=${MERGE_DRIVER_NAME}`);
	writeFileSync(gitattrsPath, `${[...kept, ...added].join("\n")}\n`);
}

/**
 * Route every store to the seeds-jsonl driver where it resolves to union or
 * nothing, and register the driver in git config when a store uses it.
 * Stores already on another driver or a built-in strategy are left alone.
 * Returns a description of each change made.
 */
export function ensureMergeStrategy(root: string): string[] {
	const changes: string[] = [];
	const needAttr = inspectMergeStrategy(root)
		.filter((p) => p.kind === "union" || p.kind === "missing")
		.map((p) => p.path);
	if (needAttr.length > 0) {
		rewriteGitattributes(root, needAttr);
		changes.push(`Set merge=${MERGE_DRIVER_NAME} in .gitattributes for ${needAttr.join(", ")}`);
	}
	if (inspectMergeStrategy(root).some((p) => p.kind === "unregistered")) {
		const section = `merge.${MERGE_DRIVER_NAME}`;
		git(root, ["config", `${section}.name`, "seeds JSONL 3-way merge by row id"]);
		git(root, ["config", `${section}.driver`, MERGE_DRIVER_COMMAND]);
		changes.push(`Registered merge driver ${MERGE_DRIVER_NAME} in git config`);
	}
	return changes;
}
