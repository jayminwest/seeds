// Shared helper that registers every CLI subcommand on a given commander
// Program. Extracted from src/index.ts so tests (and any in-process tools
// that need a fully-populated command tree, e.g. `sd completions`) can
// construct a Program without spawning a subprocess.

import type { Command } from "commander";

export async function registerAll(program: Command): Promise<void> {
	const mods = await Promise.all([
		import("./commands/init.ts"),
		import("./commands/create.ts"),
		import("./commands/show.ts"),
		import("./commands/list.ts"),
		import("./commands/ready.ts"),
		import("./commands/search.ts"),
		import("./commands/update.ts"),
		import("./commands/close.ts"),
		import("./commands/dep.ts"),
		import("./commands/label.ts"),
		import("./commands/blocked.ts"),
		import("./commands/stats.ts"),
		import("./commands/sync.ts"),
		import("./commands/doctor.ts"),
		import("./commands/tpl.ts"),
		import("./commands/migrate.ts"),
		import("./commands/prime.ts"),
		import("./commands/onboard.ts"),
		import("./commands/upgrade.ts"),
		import("./commands/completions.ts"),
		import("./commands/block.ts"),
		import("./commands/unblock.ts"),
		import("./commands/plan.ts"),
		import("./commands/config.ts"),
	]);

	for (const mod of mods) {
		mod.register(program);
	}
}
