// sd guard: Claude Code PreToolUse hook handler (installed by `sd setup claude`).
//
// Reads the hook JSON ({tool_name, tool_input, cwd}) on stdin and denies
// Write/Edit/MultiEdit/NotebookEdit on `.seeds/*.jsonl`: hand edits skip the
// lock, validation, and dedup that `sd` commands do. A denial prints
//   {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny",
//    "permissionDecisionReason":"..."}}
// and exits 0; an allow prints nothing (normal permission flow continues).
// Unparsable input fails open: a broken hook must not block every tool call.

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

function field(obj: unknown, key: string): unknown {
	return typeof obj === "object" && obj !== null
		? (obj as Record<string, unknown>)[key]
		: undefined;
}

/** The deny reason for this hook input, or null to allow. */
export function guardDecision(input: unknown, fallbackCwd: string): string | null {
	const tool = field(input, "tool_name");
	const key = typeof tool === "string" ? FILE_KEYS[tool] : undefined;
	if (!key) return null;
	const target = field(field(input, "tool_input"), key);
	if (typeof target !== "string" || target === "") return null;
	const cwd = field(input, "cwd");
	const abs = resolve(typeof cwd === "string" && cwd !== "" ? cwd : fallbackCwd, target);
	const file = basename(abs);
	if (basename(dirname(abs)) !== ".seeds" || !file.endsWith(".jsonl")) return null;
	const cmd = USE_INSTEAD[file] ?? "the sd CLI";
	return `seeds: do not edit .seeds/${file} by hand; use ${cmd} (sd commands lock, validate, and dedup the store).`;
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
