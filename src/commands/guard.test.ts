import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { guardDecision, guardOutput } from "./guard.ts";

const CWD = "/repo";

function edit(tool: string, path: string, cwd: string = CWD): unknown {
	const key = tool === "NotebookEdit" ? "notebook_path" : "file_path";
	return { tool_name: tool, tool_input: { [key]: path }, cwd };
}

describe("sd guard", () => {
	test("denies file edits to .seeds/*.jsonl, naming the sd command", () => {
		expect(guardDecision(edit("Edit", "/repo/.seeds/issues.jsonl"), CWD)).toContain("sd update");
		expect(guardDecision(edit("Write", ".seeds/plans.jsonl"), CWD)).toContain("sd plan");
		expect(guardDecision(edit("MultiEdit", "sub/../.seeds/templates.jsonl"), CWD)).toContain(
			"sd tpl",
		);
		expect(guardDecision(edit("Edit", ".seeds/other.jsonl"), CWD)).toContain("the sd CLI");
	});

	test("allows everything else", () => {
		expect(guardDecision(edit("Edit", ".seeds/config.yaml"), CWD)).toBeNull();
		expect(guardDecision(edit("Edit", "src/issues.jsonl"), CWD)).toBeNull();
		expect(guardDecision(edit("NotebookEdit", "nb.ipynb"), CWD)).toBeNull();
		expect(guardDecision({ tool_name: "Bash", tool_input: { command: "ls" } }, CWD)).toBeNull();
		expect(guardDecision({ tool_name: "Edit", tool_input: {} }, CWD)).toBeNull();
		expect(guardDecision(null, CWD)).toBeNull();
	});

	test("resolves relative paths against the fallback cwd when input has none", () => {
		const input = { tool_name: "Edit", tool_input: { file_path: "issues.jsonl" } };
		expect(guardDecision(input, "/repo/.seeds")).not.toBeNull();
	});

	test("folds case only where the filesystem does", () => {
		const upper = edit("Edit", ".SEEDS/issues.JSONL");
		expect(guardDecision(upper, CWD, true)).toContain("sd update");
		expect(guardDecision(edit("Write", ".Seeds/plans.jsonl"), CWD, true)).toContain("sd plan");
		expect(guardDecision(upper, CWD, false)).toBeNull();
	});

	test("resolves symlinked files and directories to the store", () => {
		const root = mkdtempSync(join(tmpdir(), "sd-guard-"));
		try {
			mkdirSync(join(root, ".seeds"));
			writeFileSync(join(root, ".seeds", "issues.jsonl"), "");
			symlinkSync(join(root, ".seeds", "issues.jsonl"), join(root, "link.jsonl"));
			symlinkSync(join(root, ".seeds"), join(root, "store"));
			expect(guardDecision(edit("Write", "link.jsonl", root), CWD)).toContain("sd update");
			expect(guardDecision(edit("Edit", "store/issues.jsonl", root), CWD)).toContain("sd update");
			// New file under a symlinked dir: parent resolves even though the file does not exist.
			expect(guardDecision(edit("Write", "store/new.jsonl", root), CWD)).toContain("sd CLI");
			expect(guardDecision(edit("Write", "store/config.yaml", root), CWD)).toBeNull();
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	test("guards MCP write tools on any path-ish key; MCP reads stay allowed", () => {
		const mcp = (tool: string, input: Record<string, string>) => ({
			tool_name: tool,
			tool_input: input,
			cwd: CWD,
		});
		const store = { path: ".seeds/issues.jsonl" };
		expect(guardDecision(mcp("mcp__fs__write_file", store), CWD)).toContain("sd update");
		expect(guardDecision(mcp("mcp__fs__edit_file", store), CWD)).not.toBeNull();
		expect(
			guardDecision(
				mcp("mcp__fs__move_file", { source: "a", destination: ".seeds/plans.jsonl" }),
				CWD,
			),
		).toContain("sd plan");
		expect(guardDecision(mcp("mcp__fs__read_file", store), CWD)).toBeNull();
		expect(guardDecision(mcp("mcp__fs__write_file", { path: "src/a.ts" }), CWD)).toBeNull();
		expect(guardDecision(mcp("Read", { file_path: ".seeds/issues.jsonl" }), CWD)).toBeNull();
	});

	test("emits the PreToolUse deny contract; unparsable input fails open", () => {
		const out = guardOutput(JSON.stringify(edit("Edit", ".seeds/issues.jsonl")), CWD);
		const parsed = JSON.parse(out) as { hookSpecificOutput: Record<string, string> };
		expect(parsed.hookSpecificOutput.hookEventName).toBe("PreToolUse");
		expect(parsed.hookSpecificOutput.permissionDecision).toBe("deny");
		expect(parsed.hookSpecificOutput.permissionDecisionReason).toContain("sd create");
		expect(guardOutput("not json", CWD)).toBe("");
		expect(guardOutput(JSON.stringify(edit("Edit", "src/a.ts")), CWD)).toBe("");
	});

	test("CLI reads hook JSON on stdin", async () => {
		const proc = Bun.spawn(["bun", "run", join(import.meta.dir, "../index.ts"), "guard"], {
			stdin: new Blob([JSON.stringify(edit("Write", "/x/.seeds/issues.jsonl"))]),
			stdout: "pipe",
			stderr: "pipe",
		});
		const [stdout, exitCode] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('"permissionDecision":"deny"');
	});
});
