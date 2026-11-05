// Shared helper that registers every CLI subcommand on a given commander
// Program. Extracted from src/index.ts so tests (and any in-process tools
// that need a fully-populated command tree, e.g. `sd completions`) can
// construct a Program without spawning a subprocess.

import type { Command } from "commander";

interface CommandModule {
	register: (program: Command) => void;
}

// Top-level command name → module loader, in `sd --help` order. The single
// list of commands: src/index.ts, completions and the test harness all derive
// from it, so a new command file only needs an entry here.
export const COMMAND_LOADERS: Record<string, () => Promise<CommandModule>> = {
	init: () => import("./commands/init.ts"),
	create: () => import("./commands/create.ts"),
	show: () => import("./commands/show.ts"),
	list: () => import("./commands/list.ts"),
	ready: () => import("./commands/ready.ts"),
	search: () => import("./commands/search.ts"),
	update: () => import("./commands/update.ts"),
	close: () => import("./commands/close.ts"),
	dep: () => import("./commands/dep.ts"),
	label: () => import("./commands/label.ts"),
	blocked: () => import("./commands/blocked.ts"),
	stats: () => import("./commands/stats.ts"),
	sync: () => import("./commands/sync.ts"),
	doctor: () => import("./commands/doctor.ts"),
	tpl: () => import("./commands/tpl.ts"),
	"migrate-from-beads": () => import("./commands/migrate.ts"),
	prime: () => import("./commands/prime.ts"),
	onboard: () => import("./commands/onboard.ts"),
	upgrade: () => import("./commands/upgrade.ts"),
	completions: () => import("./commands/completions.ts"),
	block: () => import("./commands/block.ts"),
	unblock: () => import("./commands/unblock.ts"),
	plan: () => import("./commands/plan.ts"),
	config: () => import("./commands/config.ts"),
	setup: () => import("./commands/setup.ts"),
	guard: () => import("./commands/guard.ts"),
	"merge-driver": () => import("./commands/merge-driver.ts"),
};

export async function registerAll(program: Command): Promise<void> {
	const mods = await Promise.all(Object.values(COMMAND_LOADERS).map((load) => load()));
	for (const mod of mods) {
		mod.register(program);
	}
}

/**
 * Register only the command argv invokes (seeds-2ba4): importing all command
 * modules (ajv included) dominated cold start. The full tree is still built
 * when it is the subject — no command (`sd --help`), an unknown one (typo
 * suggestions), or `sd completions` (walks every command).
 */
export async function registerForArgv(program: Command, argv: string[]): Promise<void> {
	const name = argv.slice(2).find((a) => !a.startsWith("-"));
	const load = name !== undefined && name !== "completions" ? COMMAND_LOADERS[name] : undefined;
	if (load) {
		(await load()).register(program);
	} else {
		await registerAll(program);
	}
}
