import { join } from "node:path";
import type { Command } from "commander";
import { findSeedsDir } from "../config.ts";
import { outputJson } from "../output.ts";

const PRIME_FILE = "PRIME.md";

export interface PrimeCommand {
	command: string;
	description: string;
}

export interface PrimeCommandGroup {
	name: string;
	commands: PrimeCommand[];
	notes?: string[];
}

export interface PrimeWorkflow {
	name: string;
	commands: string[];
}

export interface PrimeSectionsFull {
	mode: "full";
	title: string;
	contextRecovery: string;
	closeProtocol: {
		warning: string;
		steps: string[];
		footer: string;
	};
	rules: string[];
	commandGroups: PrimeCommandGroup[];
	workflows: PrimeWorkflow[];
}

export interface PrimeSectionsCompact {
	mode: "compact";
	title: string;
	commands: PrimeCommand[];
	planningNote: string;
	closingNote: string;
}

export type PrimeSections = PrimeSectionsFull | PrimeSectionsCompact;

const FULL_SECTIONS: PrimeSectionsFull = {
	mode: "full",
	title: "Seeds Workflow Context",
	contextRecovery: "Run `sd prime` after compaction, clear, or new session",
	closeProtocol: {
		warning: 'Before saying "done" or "complete", you MUST run this checklist:',
		steps: [
			"Close completed issues:    sd close <id1> <id2> ...",
			'File issues for remaining:  sd create --title "..."',
			"Run quality gates:          bun test && bun run lint && bun run typecheck",
			"Sync and push:              sd sync && git push",
			'Verify:                     git status (must show "up to date with origin")',
		],
		footer: "**NEVER skip this.** Work is not done until pushed.",
	},
	rules: [
		"**Default**: Use seeds for ALL task tracking (`sd create`, `sd ready`, `sd close`)",
		"**Prohibited**: Do NOT use TodoWrite, TaskCreate, or markdown files for task tracking",
		"**Workflow**: Create issues BEFORE writing code, mark in_progress when starting",
		"Git workflow: run `sd sync` at session end",
	],
	commandGroups: [
		{
			name: "Finding Work",
			commands: [
				{ command: "sd ready", description: "Show issues ready to work (no blockers)" },
				{ command: "sd list --status=open", description: "All open issues" },
				{ command: "sd list --status=in_progress", description: "Your active work" },
				{
					command: "sd show <id> [<id2> ...]",
					description:
						"Detailed issue view; multi-id shows each separated by a divider (`--json` returns `issues: [...]`)",
				},
			],
		},
		{
			name: "Creating & Updating",
			commands: [
				{
					command: 'sd create --title="..." --type=task|bug|feature|epic --priority=2',
					description: "New issue\n  - Priority: 0-4 or P0-P4 (0=critical, 2=medium, 4=backlog)",
				},
				{ command: "sd update <id> --status=in_progress", description: "Claim work" },
				{ command: "sd update <id> --assignee=username", description: "Assign to someone" },
				{ command: "sd close <id>", description: "Mark complete" },
				{ command: "sd close <id1> <id2> ...", description: "Close multiple issues at once" },
			],
		},
		{
			name: "Dependencies & Blocking",
			commands: [
				{ command: "sd dep add <issue> <depends-on>", description: "Add dependency" },
				{ command: "sd dep remove <issue> <depends-on>", description: "Remove dependency" },
				{ command: "sd blocked", description: "Show all blocked issues" },
			],
		},
		{
			name: "Labels",
			commands: [
				{ command: "sd label add <id> bug ui", description: "Add labels to an issue" },
				{ command: "sd label remove <id> bug", description: "Remove labels" },
				{ command: "sd label list <id>", description: "List labels on an issue" },
				{ command: "sd label list-all", description: "Show all labels in project" },
				{
					command: "sd list --label=bug",
					description: "Filter by label (AND, comma-separated)",
				},
				{ command: "sd list --label-any=bug,ui", description: "Filter by label (OR)" },
				{ command: "sd list --unlabeled", description: "Issues with no labels" },
				{ command: 'sd create --title="..." --labels=bug,ui', description: "Create with labels" },
			],
		},
		{
			name: "Sync & Project Health",
			commands: [
				{ command: "sd sync", description: "Stage and commit .seeds/ changes" },
				{ command: "sd sync --status", description: "Check without committing" },
				{ command: "sd stats", description: "Project statistics" },
				{ command: "sd doctor", description: "Check for data integrity issues" },
			],
		},
		{
			name: "Planning",
			notes: [
				'Use `sd plan` when work is large or ambiguous enough to benefit from structured decomposition. The plan spawns one child seed per step; `step.blocks` uses forward semantics (step i with `blocks: [j]` means step i blocks step j). Each step accepts an optional `labels: string[]` field (normalized lowercase/trim/dedup) that flows to the spawned child or merges additively into an adopted seed — useful for tagging agent-spawned children (e.g. `"labels": ["nightwatch"]`) without follow-up `sd label add` calls. For small, well-scoped tasks, just `sd create` directly.',
			],
			commands: [
				{
					command: "sd plan templates",
					description: "List built-in templates (`feature`, `bug`, `refactor`) plus custom ones",
				},
				{
					command: "sd plan prompt <seed-id>",
					description: "Emit prompt JSON for the LLM to fill",
				},
				{
					command: "sd plan submit <seed-id> --plan <file>",
					description: "Validate + spawn children",
				},
				{ command: "sd plan show <pl-id>", description: "Sections, children, nested sub-plans" },
				{
					command:
						"sd plan edit <id> [--name|--section <n> <t>|--step <i> --title/--priority/--type]",
					description:
						"In-place field edits; bumps revision. Structural changes still need --overwrite.",
				},
				{
					command: "sd plan outcome <pl-id> --result success|partial|failure",
					description: "Storage-only outcome",
				},
				{
					command: "sd plan review <pl-id> --by <name>",
					description: "Optional reviewer (informational)",
				},
			],
		},
	],
	workflows: [
		{
			name: "Starting work",
			commands: [
				"sd ready                              # Find available work",
				"sd show <id>                          # Review issue details",
				"sd update <id> --status=in_progress   # Claim it",
			],
		},
		{
			name: "Completing work",
			commands: [
				"sd close <id1> <id2> ...    # Close all completed issues at once",
				"sd sync                     # Stage + commit .seeds/",
				"git push                    # Push to remote",
			],
		},
		{
			name: "Creating dependent work",
			commands: [
				'sd create --title="Implement feature X" --type=feature',
				'sd create --title="Write tests for X" --type=task',
				"sd dep add <test-id> <feature-id>   # Tests depend on feature",
			],
		},
	],
};

const COMPACT_SECTIONS: PrimeSectionsCompact = {
	mode: "compact",
	title: "Seeds Quick Reference",
	commands: [
		{ command: "sd ready", description: "Find unblocked work" },
		{ command: "sd show <id> [id...]", description: "View one or more issues" },
		{ command: 'sd create --title "..."', description: "Create issue (--type, --priority)" },
		{ command: "sd update <id> --status in_progress", description: "Claim work" },
		{ command: "sd close <id>", description: "Complete work" },
		{ command: "sd dep add <a> <b>", description: "a depends on b" },
		{ command: "sd blocked", description: "Show blocked issues" },
		{ command: "sd label add <id> <l...>", description: "Add labels" },
		{ command: "sd list --label=bug", description: "Filter by label" },
		{
			command: "sd plan prompt <seed>",
			description: "Plan large/ambiguous work; spawns child seeds",
		},
		{ command: "sd plan submit <seed> --plan <file>", description: "Submit + spawn children" },
		{ command: "sd sync", description: "Stage + commit .seeds/" },
	],
	planningNote:
		"**Planning:** Use `sd plan` for ambiguous or large work — built-in templates: `feature`, `bug`, `refactor`.",
	closingNote: "**Before finishing:** `sd close <ids> && sd sync && git push`",
};

function renderFull(s: PrimeSectionsFull): string {
	const lines: string[] = [];
	lines.push(`# ${s.title}`);
	lines.push("");
	lines.push(`> **Context Recovery**: ${s.contextRecovery}`);
	lines.push("");

	lines.push("# Session Close Protocol");
	lines.push("");
	lines.push(`**CRITICAL**: ${s.closeProtocol.warning}`);
	lines.push("");
	lines.push("```");
	s.closeProtocol.steps.forEach((step, i) => {
		lines.push(`[ ] ${i + 1}. ${step}`);
	});
	lines.push("```");
	lines.push("");
	lines.push(s.closeProtocol.footer);
	lines.push("");

	lines.push("## Core Rules");
	for (const rule of s.rules) {
		lines.push(`- ${rule}`);
	}
	lines.push("");

	lines.push("## Essential Commands");
	lines.push("");
	for (const group of s.commandGroups) {
		lines.push(`### ${group.name}`);
		if (group.notes) {
			for (const note of group.notes) {
				lines.push(note);
				lines.push("");
			}
		}
		for (const cmd of group.commands) {
			lines.push(`- \`${cmd.command}\` — ${cmd.description}`);
		}
		lines.push("");
	}

	lines.push("## Common Workflows");
	lines.push("");
	for (const wf of s.workflows) {
		lines.push(`**${wf.name}:**`);
		lines.push("```bash");
		for (const c of wf.commands) {
			lines.push(c);
		}
		lines.push("```");
		lines.push("");
	}

	return `${lines.join("\n")}`;
}

function renderCompact(s: PrimeSectionsCompact): string {
	const lines: string[] = [];
	lines.push(`# ${s.title}`);
	lines.push("");
	lines.push("```");
	// Align descriptions at a fixed column for readability.
	const pad = 26;
	for (const c of s.commands) {
		const cmd = c.command.length >= pad ? `${c.command} ` : c.command.padEnd(pad);
		lines.push(`${cmd}# ${c.description}`);
	}
	lines.push("```");
	lines.push("");
	lines.push(s.planningNote);
	lines.push("");
	lines.push(s.closingNote);
	lines.push("");
	return lines.join("\n");
}

export function buildFullSections(): PrimeSectionsFull {
	return FULL_SECTIONS;
}

export function buildCompactSections(): PrimeSectionsCompact {
	return COMPACT_SECTIONS;
}

export function renderPrimeSections(sections: PrimeSections): string {
	return sections.mode === "compact" ? renderCompact(sections) : renderFull(sections);
}

function defaultPrimeContent(compact: boolean): string {
	return renderPrimeSections(compact ? COMPACT_SECTIONS : FULL_SECTIONS);
}

export async function run(args: string[]): Promise<void> {
	const jsonMode = args.includes("--json");
	const compact = args.includes("--compact");
	const exportMode = args.includes("--export");

	// --export always outputs the default template
	if (exportMode) {
		const sections = compact ? COMPACT_SECTIONS : FULL_SECTIONS;
		const content = renderPrimeSections(sections);
		if (jsonMode) {
			await outputJson({ success: true, command: "prime", sections, content });
		} else {
			process.stdout.write(content);
		}
		return;
	}

	// Try to find seeds dir for custom PRIME.md
	let customContent: string | null = null;
	try {
		const seedsDir = await findSeedsDir();
		const customFile = Bun.file(join(seedsDir, PRIME_FILE));
		if (await customFile.exists()) {
			customContent = await customFile.text();
		}
	} catch {
		// No seeds dir — that's fine, use default
	}

	if (customContent !== null) {
		// Custom PRIME.md is opaque — we can't structurally parse it, so omit sections.
		if (jsonMode) {
			await outputJson({
				success: true,
				command: "prime",
				sections: null,
				content: customContent,
			});
		} else {
			process.stdout.write(customContent);
		}
		return;
	}

	const sections = compact ? COMPACT_SECTIONS : FULL_SECTIONS;
	const content = renderPrimeSections(sections);
	if (jsonMode) {
		await outputJson({ success: true, command: "prime", sections, content });
	} else {
		process.stdout.write(content);
	}
}

export function register(program: Command): void {
	program
		.command("prime")
		.description("Output AI agent context")
		.option("--compact", "Condensed quick-reference output")
		.option("--export", "Output the default template")
		.option("--json", "Output as JSON")
		.action(async (opts: { compact?: boolean; export?: boolean; json?: boolean }) => {
			const args: string[] = [];
			if (opts.compact) args.push("--compact");
			if (opts.export) args.push("--export");
			if (opts.json) args.push("--json");
			await run(args);
		});
}

// Internal exports for testing.
export const _internal = {
	defaultPrimeContent,
	FULL_SECTIONS,
	COMPACT_SECTIONS,
};
