#!/usr/bin/env bun
import chalk from "chalk";
import { Command, Help } from "commander";
import { handleTopLevelError } from "./error-handler.ts";
import { brand, muted, setQuiet } from "./output.ts";
import { VERSION } from "./version.ts";

export { VERSION };

// Apply quiet mode early so it affects all output during command execution
const rawArgs = process.argv.slice(2);
if (rawArgs.includes("--quiet") || rawArgs.includes("-q")) {
	setQuiet(true);
}

const program = new Command();

program
	.name("sd")
	.description("seeds — git-native issue tracker")
	.version(VERSION, "-v, --version", "Print version")
	.option("-q, --quiet", "Suppress non-error output")
	.option("--verbose", "Extra diagnostic output")
	.option("--timing", "Show command execution time")
	.addHelpCommand(false)
	.configureHelp({
		formatHelp(cmd: Command, helper: Help): string {
			if (cmd.parent) {
				return Help.prototype.formatHelp.call(helper, cmd, helper);
			}
			const header = `${brand(chalk.bold("seeds"))} ${muted(`v${VERSION}`)} — Git-native issue tracking\n\nUsage: sd <command> [options]`;

			const cmdLines: string[] = ["\nCommands:"];
			for (const sub of cmd.commands) {
				const name = sub.name();
				const argStr = sub.registeredArguments
					.map((a) => (a.required ? `<${a.name()}>` : `[${a.name()}]`))
					.join(" ");
				const rawEntry = argStr ? `${name} ${argStr}` : name;
				const colored = argStr ? `${chalk.green(name)} ${chalk.dim(argStr)}` : chalk.green(name);
				const pad = " ".repeat(Math.max(18 - rawEntry.length, 2));
				cmdLines.push(`  ${colored}${pad}${sub.description()}`);
			}

			const opts: [string, string][] = [
				["-h, --help", "Show help"],
				["-v, --version", "Print version"],
				["--format <mode>", "Output format (markdown|compact|plain|ids|json)"],
				["--json", "Alias for --format json"],
				["-q, --quiet", "Suppress non-error output"],
				["--verbose", "Extra diagnostic output"],
				["--timing", "Show command execution time"],
			];
			const optLines: string[] = ["\nOptions:"];
			for (const [flag, desc] of opts) {
				const pad = " ".repeat(Math.max(18 - flag.length, 2));
				optLines.push(`  ${chalk.dim(flag)}${pad}${desc}`);
			}

			const footer = `\nRun '${chalk.dim("sd")} <command> --help' for command-specific help.`;

			return `${[header, ...cmdLines, ...optLines, footer].join("\n")}\n`;
		},
	});

// --timing: measure command execution time
let timingStart = 0;
program.hook("preAction", () => {
	if (program.opts().timing) {
		timingStart = performance.now();
	}
});
program.hook("postAction", () => {
	if (program.opts().timing) {
		const elapsed = performance.now() - timingStart;
		const formatted =
			elapsed < 1000 ? `${Math.round(elapsed)}ms` : `${(elapsed / 1000).toFixed(2)}s`;
		process.stderr.write(`${muted(`⏱ ${formatted}`)}\n`);
	}
});

// Lazy-load and register all commands
async function registerAll(): Promise<void> {
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

function levenshtein(a: string, b: string): number {
	const m = a.length;
	const n = b.length;
	if (m === 0) return n;
	if (n === 0) return m;
	let prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
	for (let i = 1; i <= m; i++) {
		const curr: number[] = [i];
		for (let j = 1; j <= n; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			const left = curr[j - 1] ?? 0;
			const up = prev[j] ?? 0;
			const diag = prev[j - 1] ?? 0;
			curr.push(Math.min(left + 1, up + 1, diag + cost));
		}
		prev = curr;
	}
	return prev[n] ?? 0;
}

async function main(): Promise<void> {
	// Handle --version --json before Commander processes the flag
	if ((rawArgs.includes("-v") || rawArgs.includes("--version")) && rawArgs.includes("--json")) {
		const platform = `${process.platform}-${process.arch}`;
		console.log(
			JSON.stringify(
				{ name: "@os-eco/seeds-cli", version: VERSION, runtime: "bun", platform },
				null,
				2,
			),
		);
		process.exitCode = 0;
		return;
	}

	await registerAll();

	// Check for unknown commands before parsing
	const firstArg = process.argv[2];
	if (firstArg && !firstArg.startsWith("-")) {
		const knownNames = program.commands.map((c) => c.name());
		if (!knownNames.includes(firstArg)) {
			let best = "";
			let bestDist = Number.POSITIVE_INFINITY;
			for (const name of knownNames) {
				const d = levenshtein(firstArg, name);
				if (d < bestDist) {
					bestDist = d;
					best = name;
				}
			}
			const suggestion = bestDist <= 2 ? best : "";
			const errMsg = suggestion
				? `Unknown command: ${firstArg}. Did you mean ${suggestion}?`
				: `Unknown command: ${firstArg}`;
			if (jsonMode) {
				const payload: Record<string, unknown> = {
					success: false,
					command: firstArg,
					error: errMsg,
				};
				if (suggestion) payload.suggestion = suggestion;
				await Bun.write(Bun.stdout, `${JSON.stringify(payload, null, 2)}\n`);
			} else {
				process.stderr.write(`${errMsg}\n`);
			}
			process.exitCode = 1;
			return;
		}
	}

	await program.parseAsync(process.argv);
}

const jsonMode = process.argv.includes("--json");

main().catch((err: unknown) => handleTopLevelError(err, { jsonMode, cmd: process.argv[2] }));
