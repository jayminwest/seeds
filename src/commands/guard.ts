// sd guard: Claude Code PreToolUse hook handler (installed by `sd setup claude`).
//
// Reads the hook JSON ({tool_name, tool_input, cwd}) on stdin and denies
// Write/Edit/MultiEdit/NotebookEdit, and MCP tools whose name says they write
// (mcp__*__write_file, ...), on `.seeds/*.jsonl`: hand edits skip the lock,
// validation, and dedup that `sd` commands do. Targets are matched after
// resolving symlinks, and case-insensitively where the filesystem usually is
// (darwin, win32), so `.SEEDS/issues.JSONL` or a link to the store is caught.
// A denial prints
//   {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny",
//    "permissionDecisionReason":"..."}}
// and exits 0; an allow prints nothing (normal permission flow continues).
// Unparsable input fails open: a broken hook must not block every tool call.

import { realpathSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import type { Command } from "commander";

const FILE_KEYS: Record<string, string> = {
	Write: "file_path",
	Edit: "file_path",
	MultiEdit: "file_path",
	NotebookEdit: "notebook_path",
};

const USE_INSTEAD: Record<string, string> = {
	"issues.jsonl": "sd create / sd update / sd close / sd dep / sd label",
	"plans.jsonl": "sd plan (submit / edit / adopt / reorder)",
	"templates.jsonl": "sd tpl",
};

/** Path-ish input keys checked on MCP tools (filesystem servers vary in naming). */
const MCP_PATH_KEYS = [
	"file_path",
	"filePath",
	"path",
	"notebook_path",
	"source",
	"destination",
	"target",
];

/** MCP tool names that mutate files; read-only tools (read_file, ...) stay allowed. */
const MCP_WRITE_RE =
	/write|edit|create|move|rename|delete|remove|replace|append|patch|insert|save|update/i;

const CASE_INSENSITIVE_FS = process.platform === "darwin" || process.platform === "win32";

function field(obj: unknown, key: string): unknown {
	return typeof obj === "object" && obj !== null
		? (obj as Record<string, unknown>)[key]
		: undefined;
}

/** The input keys holding target paths for this tool, or [] when it is not guarded. */
function pathKeys(tool: unknown): readonly string[] {
	if (typeof tool !== "string") return [];
	const builtin = FILE_KEYS[tool];
	if (builtin) return [builtin];
	if (!tool.startsWith("mcp__")) return [];
	return MCP_WRITE_RE.test(tool.slice(tool.lastIndexOf("__") + 2)) ? MCP_PATH_KEYS : [];
}

/** `abs` with symlinks resolved: the deepest existing ancestor is realpath'd, the rest kept. */
function realpathLoose(abs: string): string {
	const parent = dirname(abs);
	try {
		return realpathSync(abs);
	} catch {
		return parent === abs ? abs : resolve(realpathLoose(parent), basename(abs));
	}
}

/** The store file name (`issues.jsonl`, ...) when `abs` is `.seeds/*.jsonl`, else null. */
function storeFile(abs: string, caseInsensitive: boolean): string | null {
	const fold = (s: string) => (caseInsensitive ? s.toLowerCase() : s);
	const file = fold(basename(abs));
	return fold(basename(dirname(abs))) === ".seeds" && file.endsWith(".jsonl") ? file : null;
}

/** The deny reason for this hook input, or null to allow. */
export function guardDecision(
	input: unknown,
	fallbackCwd: string,
	caseInsensitive: boolean = CASE_INSENSITIVE_FS,
): string | null {
	const toolInput = field(input, "tool_input");
	const cwd = field(input, "cwd");
	const base = typeof cwd === "string" && cwd !== "" ? cwd : fallbackCwd;
	for (const key of pathKeys(field(input, "tool_name"))) {
		const target = field(toolInput, key);
		if (typeof target !== "string" || target === "") continue;
		const abs = resolve(base, target);
		const file = storeFile(abs, caseInsensitive) ?? storeFile(realpathLoose(abs), caseInsensitive);
		if (!file) continue;
		const cmd = USE_INSTEAD[file] ?? "the sd CLI";
		return `seeds: do not edit .seeds/${file} by hand; use ${cmd} (sd commands lock, validate, and dedup the store).`;
	}
	return null;
}

/** Hook stdout for raw stdin: the deny JSON, or "" to allow. */
export function guardOutput(raw: string, cwd: string): string {
	let input: unknown;
	try {
		input = JSON.parse(raw);
	} catch {
		return "";
	}
	const reason = guardDecision(input, cwd);
	if (!reason) return "";
	return `${JSON.stringify({
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "deny",
			permissionDecisionReason: reason,
		},
	})}\n`;
}

export function register(program: Command): void {
	program
		.command("guard")
		.description("PreToolUse hook: deny hand edits to .seeds/*.jsonl (reads hook JSON on stdin)")
		.action(async () => {
			const raw = process.stdin.isTTY ? "" : await Bun.stdin.text();
			process.stdout.write(guardOutput(raw, process.cwd()));
		});
}
