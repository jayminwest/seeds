import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Command } from "commander";
import { findSeedsDir, projectRootFromSeedsDir } from "../config.ts";
import { hasMarkerSection, replaceMarkerSection, wrapInMarkers } from "../markers.ts";
import { outputJson, printSuccess } from "../output.ts";
import { VERSION } from "../version.ts";

// Schema version drives outdated-snippet detection. Bump when the snippet body changes
// in a way agents should re-render. Independent of the package version so patch releases
// don't mark every existing snippet as outdated. Bumped to 5 when the pi-aware variant
// landed (seeds-89d2) — the `:pi` suffix on the schema marker doubles as install-state
// detection so `sd onboard` after `sd setup pi` keeps the short pi variant. Bumped to
// 6 when `sd plan edit` was added to the planning bullets (seeds-d457 / pl-dee8 step 4).
const ONBOARD_SCHEMA = 6;

// `@os-eco/seeds-cli` listed under `.pi/settings.json` → packages tells pi to
// auto-load the extension on every session. Used by isPiInstalled() to pick the
// pi-aware snippet variant when the recipe is installed.
export const PI_PACKAGE_NAME = "@os-eco/seeds-cli";

export type OnboardVariant = "pi" | undefined;

const VERSION_MARKER = `<!-- seeds-onboard:v${VERSION} -->`;
const LEGACY_VERSION_MARKER_PREFIX = "<!-- seeds-onboard-v:";

const CANDIDATE_FILES = ["CLAUDE.md", ".claude/CLAUDE.md", "AGENTS.md"] as const;

export function getSchemaMarker(variant?: OnboardVariant): string {
	const suffix = variant === "pi" ? ":pi" : "";
	return `<!-- seeds-onboard-schema:${String(ONBOARD_SCHEMA)}${suffix} -->`;
}

function buildStandardSnippet(): string {
	return `## Issue Tracking (Seeds)
${VERSION_MARKER}
${getSchemaMarker()}

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

// Short pi-aware snippet — shipped when `sd setup pi` is installed. The pi
// extension handles prime / status widget / sd_* tools / autocomplete /
// reference expansion / commands on lifecycle events, so the prose only needs
// to point at the manual CLI escape hatches and config knobs.
function buildPiSnippet(): string {
	return `## Issue Tracking (Seeds)
${VERSION_MARKER}
${getSchemaMarker("pi")}

This project uses [Seeds](https://github.com/jayminwest/seeds) v${VERSION} via the in-tree
\`@os-eco/pi-seeds\` pi-coding-agent extension. The extension auto-primes on \`session_start\`,
renders a \`sd: <n> ready / <n> in-progress / <n> blocked\` status widget, registers
\`sd_create\` / \`sd_ready\` / \`sd_show\` / \`sd_update\` / \`sd_close\` / \`sd_dep\` / \`sd_search\`
custom tools, expands \`#sd-<id>\` references on send, and ships \`/sd\`, \`/sd:ready\`,
\`/sd:create\`, \`/sd:show\`, \`/sd:close\`, \`/sd:claim\` slash commands.

**Manual escape hatches** (rarely needed — the extension handles the rituals):

- \`sd ready\` — Find unblocked work from the shell.
- \`sd create --title "..."\` / \`sd close <id>\` — Create or close from the shell.
- \`sd sync\` — Stage and commit \`.seeds/\` changes before \`git push\`.

Configuration lives under \`pi.*\` in \`.seeds/config.yaml\`. Run \`sd setup pi --check\` to verify
the install state; \`sd setup pi --remove\` reverts to the standalone CLI snippet.

### Before You Finish
1. Close completed issues: \`sd close <id>\`
2. File issues for remaining work: \`sd create --title "..."\`
3. Sync and push: \`sd sync && git push\``;
}

function getSnippet(variant?: OnboardVariant): string {
	return variant === "pi" ? buildPiSnippet() : buildStandardSnippet();
}

// True when `.pi/settings.json` lists `@os-eco/seeds-cli` in its `packages`
// array (either as a bare string or as an object form with `source`). Lets
// `sd onboard` keep the pi-aware variant after `sd setup pi` without forcing
// callers to thread the flag through every call site.
export async function isPiInstalled(cwd: string): Promise<boolean> {
	const settingsPath = join(cwd, ".pi", "settings.json");
	if (!existsSync(settingsPath)) return false;
	try {
		const raw = await readFile(settingsPath, "utf-8");
		const trimmed = raw.trim();
		if (trimmed.length === 0) return false;
		const parsed = JSON.parse(raw) as { packages?: unknown };
		if (!Array.isArray(parsed.packages)) return false;
		return parsed.packages.some(
			(p) =>
				p === PI_PACKAGE_NAME ||
				(typeof p === "object" &&
					p !== null &&
					(p as { source?: unknown }).source === PI_PACKAGE_NAME),
		);
	} catch {
		return false;
	}
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

function detectStatus(
	content: string,
	variant?: OnboardVariant,
): "missing" | "current" | "outdated" {
	if (!hasMarkerSection(content)) return "missing";
	// Legacy snippets used `seeds-onboard-v:N`. Always treat them as outdated so
	// the next run upgrades them to the new schema/version markers.
	if (content.includes(LEGACY_VERSION_MARKER_PREFIX)) return "outdated";
	// A snippet is "current" iff the schema marker matches the requested variant
	// exactly. A bare snippet in a pi-installed project (or vice versa) is
	// outdated so the next onboard run flips the variant.
	if (content.includes(getSchemaMarker(variant))) return "current";
	return "outdated";
}

export interface RunOnboardOptions {
	cwd?: string;
	stdoutMode?: boolean;
	checkMode?: boolean;
	jsonMode?: boolean;
	// Force the snippet variant. Unset = auto-detect via isPiInstalled() so
	// repeat `sd onboard` runs after `sd setup pi` keep the pi-aware copy.
	variant?: OnboardVariant;
	// Suppress stdout/stderr. Used when `sd setup pi` calls runOnboard
	// internally to refresh the snippet — the recipe owns the user-facing
	// message and runOnboard should not double-log.
	silent?: boolean;
}

export type OnboardAction = "created" | "updated" | "unchanged" | "appended";

export interface OnboardResult {
	action: OnboardAction | "checked";
	file: string | null;
	status?: "missing" | "current" | "outdated";
}

export async function runOnboard(options: RunOnboardOptions = {}): Promise<OnboardResult> {
	const cwd = options.cwd ?? process.cwd();
	const seedsDir = await findSeedsDir(cwd);
	const projectRoot = projectRootFromSeedsDir(seedsDir);

	const variant = options.variant ?? ((await isPiInstalled(projectRoot)) ? "pi" : undefined);
	const snippet = getSnippet(variant);

	const targetPath = findTargetFile(projectRoot);

	// --check mode: report status only
	if (options.checkMode) {
		if (!targetPath) {
			if (!options.silent) {
				if (options.jsonMode) {
					await outputJson({ success: true, command: "onboard", status: "missing", file: null });
				} else {
					console.log("Status: missing (no CLAUDE.md found)");
				}
			}
			return { action: "checked", file: null, status: "missing" };
		}
		const content = await Bun.file(targetPath).text();
		const status = detectStatus(content, variant);
		if (!options.silent) {
			if (options.jsonMode) {
				await outputJson({ success: true, command: "onboard", status, file: targetPath });
			} else {
				console.log(`Status: ${status} (${targetPath})`);
			}
		}
		return { action: "checked", file: targetPath, status };
	}

	// --stdout mode: print what would be written
	if (options.stdoutMode) {
		if (!options.silent) {
			process.stdout.write(wrapInMarkers(snippet));
			process.stdout.write("\n");
		}
		return { action: "unchanged", file: null };
	}

	// Default mode: write to file
	const filePath = targetPath ?? join(projectRoot, "CLAUDE.md");
	const fileExists = existsSync(filePath);
	const wrappedSnippet = wrapInMarkers(snippet);

	if (!fileExists) {
		await Bun.write(filePath, `${wrappedSnippet}\n`);
		if (!options.silent) {
			if (options.jsonMode) {
				await outputJson({ success: true, command: "onboard", action: "created", file: filePath });
			} else {
				printSuccess(`Created ${filePath} with seeds section`);
			}
		}
		return { action: "created", file: filePath };
	}

	const content = await Bun.file(filePath).text();
	const status = detectStatus(content, variant);

	if (status === "current") {
		if (!options.silent) {
			if (options.jsonMode) {
				await outputJson({
					success: true,
					command: "onboard",
					action: "unchanged",
					file: filePath,
				});
			} else {
				printSuccess("Seeds section is already up to date");
			}
		}
		return { action: "unchanged", file: filePath };
	}

	if (status === "outdated") {
		const updated = replaceMarkerSection(content, snippet);
		if (updated) {
			await Bun.write(filePath, updated);
			if (!options.silent) {
				if (options.jsonMode) {
					await outputJson({
						success: true,
						command: "onboard",
						action: "updated",
						file: filePath,
					});
				} else {
					printSuccess(`Updated seeds section in ${filePath}`);
				}
			}
		}
		return { action: "updated", file: filePath };
	}

	// status === "missing": append
	const separator = content.endsWith("\n") ? "\n" : "\n\n";
	await Bun.write(filePath, `${content}${separator}${wrappedSnippet}\n`);
	if (!options.silent) {
		if (options.jsonMode) {
			await outputJson({ success: true, command: "onboard", action: "appended", file: filePath });
		} else {
			printSuccess(`Added seeds section to ${filePath}`);
		}
	}
	return { action: "appended", file: filePath };
}

export async function run(args: string[]): Promise<void> {
	const jsonMode = args.includes("--json");
	const stdoutMode = args.includes("--stdout");
	const checkMode = args.includes("--check");
	await runOnboard({ jsonMode, stdoutMode, checkMode });
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
