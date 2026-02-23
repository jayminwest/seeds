#!/usr/bin/env bun
export const VERSION = "0.2.0";

const USAGE = `seeds — git-native issue tracker

Usage: sd <command> [options]

Issue commands:
  init                    Initialize .seeds/ in current directory
  create                  Create a new issue
  show <id>               Show issue details
  list                    List issues with filters
  ready                   Show open issues with no unresolved blockers
  update <id>             Update issue fields
  close <id> [ids...]     Close one or more issues
  dep <add|remove|list>   Manage dependencies
  blocked                 Show all blocked issues
  stats                   Project statistics
  sync                    Stage and commit .seeds/ changes
  doctor                  Check project health and data integrity

Template commands:
  tpl create              Create a template
  tpl step add <id>       Add a step to a template
  tpl list                List all templates
  tpl show <id>           Show template with steps
  tpl pour <id>           Instantiate template into issues
  tpl status <id>         Show convoy status

Migration:
  migrate-from-beads      Migrate issues from beads

Agent integration:
  prime                   Output AI agent context
  onboard                 Add seeds section to CLAUDE.md

Global flags:
  --json                  Output as JSON
  --version               Show version
  --help                  Show this help
`;

const argv = process.argv;
const cmd = argv[2];

if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
	process.stdout.write(USAGE);
	process.exit(0);
}

if (cmd === "--version" || cmd === "-V") {
	console.log(VERSION);
	process.exit(0);
}

const args = argv.slice(3);
const jsonMode = args.includes("--json") || argv.slice(2).includes("--json");

async function main(): Promise<void> {
	switch (cmd) {
		case "init":
			await (await import("./commands/init.ts")).run(args);
			break;
		case "create":
			await (await import("./commands/create.ts")).run(args);
			break;
		case "show":
			await (await import("./commands/show.ts")).run(args);
			break;
		case "list":
			await (await import("./commands/list.ts")).run(args);
			break;
		case "ready":
			await (await import("./commands/ready.ts")).run(args);
			break;
		case "update":
			await (await import("./commands/update.ts")).run(args);
			break;
		case "close":
			await (await import("./commands/close.ts")).run(args);
			break;
		case "dep":
			await (await import("./commands/dep.ts")).run(args);
			break;
		case "blocked":
			await (await import("./commands/blocked.ts")).run(args);
			break;
		case "stats":
			await (await import("./commands/stats.ts")).run(args);
			break;
		case "sync":
			await (await import("./commands/sync.ts")).run(args);
			break;
		case "doctor":
			await (await import("./commands/doctor.ts")).run(args);
			break;
		case "tpl":
			await (await import("./commands/tpl.ts")).run(args);
			break;
		case "migrate-from-beads":
			await (await import("./commands/migrate.ts")).run(args);
			break;
		case "prime":
			await (await import("./commands/prime.ts")).run(args);
			break;
		case "onboard":
			await (await import("./commands/onboard.ts")).run(args);
			break;
		default:
			throw new Error(`Unknown command: ${cmd}. Run \`sd --help\` for usage.`);
	}
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	if (jsonMode) {
		console.log(JSON.stringify({ success: false, command: cmd, error: msg }));
	} else {
		console.error(`Error: ${msg}`);
	}
	process.exit(1);
});
