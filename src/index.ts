#!/usr/bin/env bun
/**
 * seeds — git-native issue tracker for AI agent workflows
 *
 * CLI entry point and command router.
 */

export const VERSION = "0.1.0";

const args = process.argv.slice(2);
const command = args[0];

// --- Command router ---

async function main(): Promise<void> {
	if (!command || command === "--help" || command === "-h") {
		printHelp();
		process.exit(0);
	}

	if (command === "--version" || command === "-v") {
		console.log(VERSION);
		process.exit(0);
	}

	// Dynamically import command module to keep startup fast
	try {
		switch (command) {
			case "init": {
				const { run } = await import("./commands/init.ts");
				await run(args.slice(1));
				break;
			}
			case "create": {
				const { run } = await import("./commands/create.ts");
				await run(args.slice(1));
				break;
			}
			case "show": {
				const { run } = await import("./commands/show.ts");
				await run(args.slice(1));
				break;
			}
			case "list": {
				const { run } = await import("./commands/list.ts");
				await run(args.slice(1));
				break;
			}
			case "ready": {
				const { run } = await import("./commands/ready.ts");
				await run(args.slice(1));
				break;
			}
			case "update": {
				const { run } = await import("./commands/update.ts");
				await run(args.slice(1));
				break;
			}
			case "close": {
				const { run } = await import("./commands/close.ts");
				await run(args.slice(1));
				break;
			}
			case "dep": {
				const { run } = await import("./commands/dep.ts");
				await run(args.slice(1));
				break;
			}
			case "blocked": {
				const { run } = await import("./commands/blocked.ts");
				await run(args.slice(1));
				break;
			}
			case "stats": {
				const { run } = await import("./commands/stats.ts");
				await run(args.slice(1));
				break;
			}
			case "sync": {
				const { run } = await import("./commands/sync.ts");
				await run(args.slice(1));
				break;
			}
			case "tpl": {
				const { run } = await import("./commands/tpl.ts");
				await run(args.slice(1));
				break;
			}
			case "migrate-from-beads": {
				const { run } = await import("./commands/migrate.ts");
				await run(args.slice(1));
				break;
			}
			default: {
				console.error(`Unknown command: ${command}`);
				console.error("Run 'sd --help' for usage.");
				process.exit(1);
			}
		}
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		console.error(`Error: ${msg}`);
		process.exit(1);
	}
}

function printHelp(): void {
	console.log(`seeds v${VERSION} — git-native issue tracker

Usage: sd <command> [options]

Issue commands:
  init                    Initialize .seeds/ in current directory
  create --title <text>   Create a new issue
  show <id>               Show issue details
  list                    List issues
  ready                   Show unblocked open issues
  update <id>             Update an issue
  close <id> [<id2>...]   Close one or more issues
  dep <add|remove|list>   Manage dependencies
  blocked                 Show all blocked issues
  stats                   Project statistics
  sync                    Stage and commit .seeds/ changes

Template commands:
  tpl create --name <text>        Create a template
  tpl step add <id> --title <text> Add step to template
  tpl list                        List templates
  tpl show <id>                   Show template
  tpl pour <id> --prefix <text>   Instantiate template
  tpl status <id>                 Show convoy status

Migration:
  migrate-from-beads      Migrate from beads .beads/issues.jsonl

Options:
  --json    Output JSON instead of human-readable text
  --help    Show this help
  --version Show version
`);
}

await main();
