// sd setup claude [--remove]: wire seeds into Claude Code hooks in
// <project>/.claude/settings.json.
//
//   SessionStart  sd prime --compact   (quick reference + live issue state)
//   PreToolUse    sd guard             (Write|Edit|MultiEdit|NotebookEdit)
//
// Claude Code nests handlers in matcher groups:
//   {"hooks": {"<Event>": [{"matcher": "...", "hooks": [{"type": "command", "command": "..."}]}]}}
// Seeds owns exactly the handlers whose command is `sd prime|guard`; install
// strips those and appends one fresh group per event, leaving everything else
// as it was. Re-running is a no-op. --remove strips seeds handlers and drops
// groups and events they leave empty. Mirrors roots/mulch `setup claude`.

import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Command } from "commander";
import { findSeedsDir, projectRootFromSeedsDir } from "../config.ts";
import { outputJson, printSuccess } from "../output.ts";

type Json = Record<string, unknown>;

interface HookSpec {
	event: "SessionStart" | "PreToolUse";
	matcher?: string;
	command: string;
}

const HOOKS: readonly HookSpec[] = [
	{ event: "SessionStart", command: "sd prime --compact" },
	{ event: "PreToolUse", matcher: "Write|Edit|MultiEdit|NotebookEdit", command: "sd guard" },
];

const SD_COMMAND_RE = /^\s*sd\s+(prime|guard)(\s|$)/;

function isObject(v: unknown): v is Json {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isSeedsHandler(h: unknown): boolean {
	return isObject(h) && typeof h.command === "string" && SD_COMMAND_RE.test(h.command);
}

function groupHooks(g: unknown): unknown[] {
	return isObject(g) && Array.isArray(g.hooks) ? g.hooks : [];
}

function makeGroup(spec: HookSpec): Json {
	const hooks = [{ type: "command", command: spec.command }];
	return spec.matcher === undefined ? { hooks } : { matcher: spec.matcher, hooks };
}

function stripSeeds(groups: readonly unknown[]): unknown[] {
	const out: unknown[] = [];
	for (const g of groups) {
		const hooks = groupHooks(g);
		const kept = hooks.filter((h) => !isSeedsHandler(h));
		if (kept.length === hooks.length) out.push(g);
		else if (kept.length > 0) out.push({ ...(g as Json), hooks: kept });
	}
	return out;
}

/** The event holds exactly one seeds handler, in a group shaped as we write it. */
function isInstalled(groups: readonly unknown[], spec: HookSpec): boolean {
	const ours = groups.filter((g) => groupHooks(g).some(isSeedsHandler));
	if (ours.length !== 1) return false;
	return JSON.stringify(ours[0]) === JSON.stringify(makeGroup(spec));
}

/** The event's groups after install/remove, or null when nothing changes. */
function syncEvent(current: unknown, spec: HookSpec, remove: boolean): unknown[] | null {
	if (current !== undefined && !Array.isArray(current)) {
		throw new Error(`\`hooks.${spec.event}\` in Claude settings is not an array`);
	}
	const groups: unknown[] = current ?? [];
	if (!remove && isInstalled(groups, spec)) return null;
	const updated = remove ? stripSeeds(groups) : [...stripSeeds(groups), makeGroup(spec)];
	return JSON.stringify(updated) === JSON.stringify(groups) ? null : updated;
}

/** Install (or with remove, strip) the seeds hooks. Does not mutate `settings`. */
export function syncSeedsHooks(
	settings: Json,
	remove: boolean,
): { settings: Json; changed: boolean } {
	const next = structuredClone(settings);
	if (next.hooks !== undefined && !isObject(next.hooks)) {
		throw new Error("`hooks` in Claude settings is not an object; nothing was written");
	}
	const hooks: Json = next.hooks ?? {};
	let changed = false;
	for (const spec of HOOKS) {
		const updated = syncEvent(hooks[spec.event], spec, remove);
		if (!updated) continue;
		changed = true;
		if (updated.length === 0) delete hooks[spec.event];
		else hooks[spec.event] = updated;
	}
	if (!changed) return { settings, changed: false };
	if (Object.keys(hooks).length === 0) delete next.hooks;
	else next.hooks = hooks;
	return { settings: next, changed: true };
}

async function readSettings(file: string): Promise<Json> {
	if (!existsSync(file)) return {};
	const raw = await Bun.file(file).text();
	if (raw.trim() === "") return {};
	let v: unknown;
	try {
		v = JSON.parse(raw);
	} catch (err) {
		const why = err instanceof Error ? err.message : String(err);
		throw new Error(`Cannot parse ${file} (${why}); fix it by hand, nothing was written`);
	}
	if (!isObject(v)) throw new Error(`${file} is not a JSON object; nothing was written`);
	return v;
}

export async function run(args: string[]): Promise<void> {
	const jsonMode = args.includes("--json");
	const remove = args.includes("--remove");
	const target = args.find((a) => !a.startsWith("--"));
	if (target !== "claude") {
		throw new Error(`Unknown setup target "${target ?? ""}"; supported: claude`);
	}

	const root = projectRootFromSeedsDir(await findSeedsDir());
	const file = join(root, ".claude", "settings.json");
	const result = syncSeedsHooks(await readSettings(file), remove);
	if (result.changed) {
		mkdirSync(dirname(file), { recursive: true });
		await Bun.write(file, `${JSON.stringify(result.settings, null, 2)}\n`);
	}

	const action = remove ? "remove" : "install";
	if (jsonMode) {
		await outputJson({
			success: true,
			command: "setup",
			target,
			action,
			changed: result.changed,
			file,
		});
	} else if (!result.changed) {
		printSuccess(`${file}: already up to date`);
	} else {
		printSuccess(`${remove ? "Removed seeds hooks from" : "Installed seeds hooks in"} ${file}`);
	}
}

export function register(program: Command): void {
	program
		.command("setup")
		.argument("<target>", "Harness to wire up (claude)")
		.description("Install Claude Code hooks: prime on session start, guard .seeds/*.jsonl edits")
		.option("--remove", "Remove seeds hooks")
		.option("--json", "Output as JSON")
		.action(async (target: string, opts: { remove?: boolean; json?: boolean }) => {
			const args: string[] = [target];
			if (opts.remove) args.push("--remove");
			if (opts.json) args.push("--json");
			await run(args);
		});
}
