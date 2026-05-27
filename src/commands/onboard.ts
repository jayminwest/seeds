import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";
import { findSeedsDir, projectRootFromSeedsDir } from "../config.ts";
import { hasMarkerSection, replaceMarkerSection, wrapInMarkers } from "../markers.ts";
import { outputJson, printError, printSuccess } from "../output.ts";
import { VERSION } from "../version.ts";

// Schema version drives outdated-snippet detection. Bump when the snippet body changes
// in a way agents should re-render. Independent of the package version so patch releases
// don't mark every existing snippet as outdated.
const ONBOARD_SCHEMA = 7;
const SCHEMA_MARKER = `<!-- seeds-onboard-schema:${String(ONBOARD_SCHEMA)} -->`;
const VERSION_MARKER = `<!-- seeds-onboard:v${VERSION} -->`;
const LEGACY_VERSION_MARKER_PREFIX = "<!-- seeds-onboard-v:";

const CANDIDATE_FILES = ["CLAUDE.md", ".claude/CLAUDE.md", "AGENTS.md"] as const;

function onboardSnippet(): string {
	return `## Issue Tracking (Seeds)
${VERSION_MARKER}
${SCHEMA_MARKER}

This project uses [Seeds](https://github.com/jayminwest/seeds) v${VERSION} for git-native issue tracking.

**At the start of every session**, run:
\`\`\`
sd prime
\`\`\`

This injects session context: rules, command reference, and workflows. Pass \`--format json|compact|markdown|plain|ids\` on any command for agent-friendly output.

**Quick reference:**
- \`sd ready\` — Find unblocked work
- \`sd search <query>\` — Full-text search across titles + descriptions
- \`sd create --title "..." --type task --priority 2\` — Create issue
- \`sd update <id> --status in_progress\` — Claim work
- \`sd close <id>\` — Complete work
- \`sd dep add <id> <depends-on>\` — Add dependency between issues
- \`sd sync\` — Sync with git (run before pushing)

### Planning
Use \`sd plan\` when work is large or ambiguous enough that an LLM benefits from structured decomposition. Submit spawns one child seed per step; \`step.blocks\` uses forward semantics (step i with \`blocks: [j]\` means step i blocks step j, and step j gets step i's id in its \`blockedBy\`).

- \`sd plan templates\` — List built-ins (\`feature\`, \`bug\`, \`refactor\`) plus custom templates
- \`sd plan prompt <seed-id>\` — Emit a structured prompt the LLM fills in
- \`sd plan submit <seed-id> --plan <file>\` — Validate + spawn child seeds
- \`sd plan show <pl-id>\` — View sections, children, sub-plans
- \`sd plan edit <id> [--name | --section <name> <text> | --step <i> --title/--priority/--type]\` — In-place field edits; bumps revision
- \`sd plan outcome <pl-id> --result success|partial|failure\` — Record outcome (storage-only)
- \`sd plan review <pl-id> --by <name>\` — Record reviewer (informational)

### Before You Finish
1. Close completed issues: \`sd close <id>\`
2. File issues for remaining work: \`sd create --title "..."\`
3. Sync and push: \`sd sync && git push\``;
}

function findTargetFile(projectRoot: string): string | null {
	for (const candidate of CANDIDATE_FILES) {
		const fullPath = join(projectRoot, candidate);
		if (existsSync(fullPath)) {
			return fullPath;
		}
	}
	return null;
}

function detectStatus(content: string): "missing" | "current" | "outdated" {
	if (!hasMarkerSection(content)) return "missing";
	// Legacy snippets used `seeds-onboard-v:N`. Always treat them as outdated so
	// the next run upgrades them to the new schema/version markers.
	if (content.includes(LEGACY_VERSION_MARKER_PREFIX)) return "outdated";
	if (content.includes(SCHEMA_MARKER)) return "current";
	return "outdated";
}

export async function run(args: string[]): Promise<void> {
	const jsonMode = args.includes("--json");
	const stdoutMode = args.includes("--stdout");
	const checkMode = args.includes("--check");

	const seedsDir = await findSeedsDir();
	const projectRoot = projectRootFromSeedsDir(seedsDir);

	const targetPath = findTargetFile(projectRoot);
	const snippet = onboardSnippet();

	// --check mode: report status only
	if (checkMode) {
		if (!targetPath) {
			if (jsonMode) {
				await outputJson({ success: true, command: "onboard", status: "missing", file: null });
			} else {
				console.log("Status: missing (no CLAUDE.md found)");
			}
			return;
		}
		const content = await Bun.file(targetPath).text();
		const status = detectStatus(content);
		if (jsonMode) {
			await outputJson({ success: true, command: "onboard", status, file: targetPath });
		} else {
			console.log(`Status: ${status} (${targetPath})`);
		}
		return;
	}

	// --stdout mode: print what would be written
	if (stdoutMode) {
		process.stdout.write(wrapInMarkers(snippet));
		process.stdout.write("\n");
		return;
	}

	// Default mode: write to file
	const filePath = targetPath ?? join(projectRoot, "CLAUDE.md");
	const fileExists = existsSync(filePath);
	const wrappedSnippet = wrapInMarkers(snippet);

	if (!fileExists) {
		await Bun.write(filePath, `${wrappedSnippet}\n`);
		if (jsonMode) {
			await outputJson({ success: true, command: "onboard", action: "created", file: filePath });
		} else {
			printSuccess(`Created ${filePath} with seeds section`);
		}
		return;
	}

	const content = await Bun.file(filePath).text();
	const status = detectStatus(content);

	if (status === "current") {
		if (jsonMode) {
			await outputJson({
				success: true,
				command: "onboard",
				action: "unchanged",
				file: filePath,
			});
		} else {
			printSuccess("Seeds section is already up to date");
		}
		return;
	}

	if (status === "outdated") {
		const updated = replaceMarkerSection(content, snippet);
		if (!updated) {
			// Defensive: detectStatus saw markers but replaceMarkerSection refused
			// (e.g. markers out of order, truncated, or duplicated). Surface this
			// instead of silently no-op'ing — agents need to know their snippet is stale.
			const msg = `Found seeds markers in ${filePath} but could not replace the section (markers may be malformed, out of order, or duplicated). Fix the file manually or remove the seeds:start/seeds:end block and re-run.`;
			if (jsonMode) {
				await outputJson({
					success: false,
					command: "onboard",
					action: "failed",
					file: filePath,
					error: msg,
				});
			} else {
				printError(msg);
			}
			process.exitCode = 1;
			return;
		}
		await Bun.write(filePath, updated);
		if (jsonMode) {
			await outputJson({
				success: true,
				command: "onboard",
				action: "updated",
				file: filePath,
			});
		} else {
			printSuccess(`Updated seeds section in ${filePath}`);
		}
		return;
	}

	// status === "missing": append
	const separator = content.endsWith("\n") ? "\n" : "\n\n";
	await Bun.write(filePath, `${content}${separator}${wrappedSnippet}\n`);
	if (jsonMode) {
		await outputJson({ success: true, command: "onboard", action: "appended", file: filePath });
	} else {
		printSuccess(`Added seeds section to ${filePath}`);
	}
}

export function register(program: Command): void {
	program
		.command("onboard")
		.description("Add seeds section to CLAUDE.md / AGENTS.md")
		.option("--stdout", "Print what would be written to stdout")
		.option("--check", "Check status without modifying files")
		.option("--json", "Output as JSON")
		.action(async (opts: { stdout?: boolean; check?: boolean; json?: boolean }) => {
			const args: string[] = [];
			if (opts.stdout) args.push("--stdout");
			if (opts.check) args.push("--check");
			if (opts.json) args.push("--json");
			await run(args);
		});
}
