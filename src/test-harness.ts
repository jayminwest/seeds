// In-process test harness for capturing seeds CLI output.
//
// Instead of spawning `bun run src/index.ts <args>` for every assertion (which
// pays full Bun startup + module resolution + commander parsing overhead per
// call), tests can import this module and invoke the command's exported `run`
// function directly while we capture stdout/stderr/exit-code in memory.
//
// Captures all four output channels:
//   - console.log / console.warn / console.error
//   - process.stdout.write / process.stderr.write
//   - Bun.write(Bun.stdout, …) / Bun.write(Bun.stderr, …)
//
// Snapshots and restores `process.exitCode` and `process.cwd()` around each
// call so tests stay isolated. Chalk's color level is forced to 0 at module
// load time so output matches subprocess behavior (where chalk auto-detects a
// pipe and disables ANSI).
//
// Bun test runs all files in a single process serially by default, so the
// chdir/console swap is safe; do not enable `--concurrent` for harness-using
// tests.

import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";

// Force ANSI off so in-process output matches the subprocess baseline.
chalk.level = 0;

export interface RunResult {
	stdout: string;
	stderr: string;
	exitCode: number;
}

type CommandRun = (args: string[], seedsDir?: string) => Promise<void>;
type RegisterFn = (program: Command) => void;
interface CommandModule {
	run?: CommandRun;
	register?: RegisterFn;
}

const loaders: Record<string, () => Promise<CommandModule>> = {
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
	migrate: () => import("./commands/migrate.ts"),
	prime: () => import("./commands/prime.ts"),
	onboard: () => import("./commands/onboard.ts"),
	upgrade: () => import("./commands/upgrade.ts"),
	completions: () => import("./commands/completions.ts"),
	block: () => import("./commands/block.ts"),
	unblock: () => import("./commands/unblock.ts"),
	config: () => import("./commands/config.ts"),
	setup: () => import("./commands/setup.ts"),
	plan: () => import("./commands/plan.ts"),
};

function formatConsoleArgs(parts: unknown[]): string {
	return parts
		.map((p) => {
			if (typeof p === "string") return p;
			if (p === undefined) return "undefined";
			if (p === null) return "null";
			if (typeof p === "object") {
				try {
					return JSON.stringify(p);
				} catch {
					return String(p);
				}
			}
			return String(p);
		})
		.join(" ");
}

function toText(chunk: unknown): string {
	if (typeof chunk === "string") return chunk;
	if (chunk instanceof Uint8Array) return Buffer.from(chunk).toString();
	if (chunk instanceof ArrayBuffer) return Buffer.from(new Uint8Array(chunk)).toString();
	return String(chunk);
}

/**
 * Run a seeds CLI command in-process and capture its output.
 *
 * @param args  CLI args including the command name, e.g. ["list", "--json"].
 * @param cwd   Working directory to run from. The harness chdirs here, runs
 *              the command, and restores the previous cwd.
 *
 * @returns stdout, stderr, and the resolved exit code (0 unless the command
 *          set process.exitCode or threw).
 */
export async function runCli(args: string[], cwd: string): Promise<RunResult> {
	const cmd = args[0];
	if (!cmd) throw new Error("runCli: missing command name");
	const loader = loaders[cmd];
	if (!loader) throw new Error(`runCli: unknown command "${cmd}"`);
	const mod = await loader();

	const stdoutChunks: string[] = [];
	const stderrChunks: string[] = [];

	const origLog = console.log;
	const origWarn = console.warn;
	const origInfo = console.info;
	const origError = console.error;
	const origStdoutWrite = process.stdout.write.bind(process.stdout);
	const origStderrWrite = process.stderr.write.bind(process.stderr);
	const origBunWrite = Bun.write;
	const origCwd = process.cwd();
	const origExitCode = process.exitCode;
	process.exitCode = 0;
	process.chdir(cwd);

	console.log = (...a: unknown[]) => {
		stdoutChunks.push(`${formatConsoleArgs(a)}\n`);
	};
	console.info = console.log;
	console.warn = (...a: unknown[]) => {
		stderrChunks.push(`${formatConsoleArgs(a)}\n`);
	};
	console.error = (...a: unknown[]) => {
		stderrChunks.push(`${formatConsoleArgs(a)}\n`);
	};

	const makeWrite =
		(sink: string[]) =>
		(chunk: unknown, encodingOrCb?: unknown, maybeCb?: unknown): boolean => {
			sink.push(toText(chunk));
			const cb =
				typeof encodingOrCb === "function"
					? (encodingOrCb as () => void)
					: typeof maybeCb === "function"
						? (maybeCb as () => void)
						: undefined;
			if (cb) cb();
			return true;
		};
	process.stdout.write = makeWrite(stdoutChunks) as typeof process.stdout.write;
	process.stderr.write = makeWrite(stderrChunks) as typeof process.stderr.write;

	// biome-ignore lint/suspicious/noExplicitAny: intercepting Bun.write signature
	(Bun as any).write = (dest: unknown, data: unknown, ...rest: unknown[]) => {
		if (dest === Bun.stdout) {
			const text = toText(data);
			stdoutChunks.push(text);
			return Promise.resolve(text.length);
		}
		if (dest === Bun.stderr) {
			const text = toText(data);
			stderrChunks.push(text);
			return Promise.resolve(text.length);
		}
		// biome-ignore lint/suspicious/noExplicitAny: passthrough
		return (origBunWrite as any)(dest, data, ...rest);
	};

	let thrown: unknown;
	try {
		const seedsDir = join(cwd, ".seeds");
		if (typeof mod.run === "function") {
			// Commands that don't accept a seedsDir parameter (init, prime,
			// onboard, upgrade, migrate) ignore the extra arg; chdir above
			// handles their cwd-based resolution.
			await mod.run(args.slice(1), seedsDir);
		} else if (typeof mod.register === "function") {
			// Commands like plan, config, setup, and completions don't expose a
			// flat run(args) entry point — they wire subcommands directly via
			// commander. Build a fresh program, register, and dispatch through
			// parseAsync to mirror the production CLI path.
			const program = new Command();
			program.exitOverride();
			mod.register(program);
			// Propagate exitOverride to subcommands recursively. Commander does
			// NOT inherit the override down the tree, so `sd plan --help` (or
			// any nested `--help`) would otherwise call process.exit(0) and
			// kill the bun:test runner mid-suite.
			const applyOverride = (c: Command): void => {
				c.exitOverride();
				for (const child of c.commands) applyOverride(child);
			};
			for (const child of program.commands) applyOverride(child);
			await program.parseAsync(["bun", "sd", cmd, ...args.slice(1)]);
		} else {
			throw new Error(`runCli: command "${cmd}" exports neither run nor register`);
		}
	} catch (e) {
		thrown = e;
	} finally {
		console.log = origLog;
		console.info = origInfo;
		console.warn = origWarn;
		console.error = origError;
		process.stdout.write = origStdoutWrite;
		process.stderr.write = origStderrWrite;
		// biome-ignore lint/suspicious/noExplicitAny: restoring original
		(Bun as any).write = origBunWrite;
		process.chdir(origCwd);
	}

	const exitCode = process.exitCode ?? 0;
	process.exitCode = origExitCode;

	if (thrown !== undefined) {
		// Commander signals successful --help / --version termination by
		// throwing CommanderError with a `commander.helpDisplayed` /
		// `commander.version` code under exitOverride. Treat those as exit 0
		// (matches subprocess behavior where commander calls process.exit(0)).
		const code = (thrown as { code?: string }).code;
		if (code === "commander.helpDisplayed" || code === "commander.version") {
			return {
				stdout: stdoutChunks.join(""),
				stderr: stderrChunks.join(""),
				exitCode: 0,
			};
		}
		// Mirror src/index.ts main().catch: emit error to stderr (or to stdout
		// as JSON when --json was passed), and exit 1.
		const msg = thrown instanceof Error ? thrown.message : String(thrown);
		if (args.includes("--json")) {
			stdoutChunks.push(`${JSON.stringify({ success: false, command: cmd, error: msg })}\n`);
		} else {
			stderrChunks.push(`Error: ${msg}\n`);
		}
		return {
			stdout: stdoutChunks.join(""),
			stderr: stderrChunks.join(""),
			exitCode: 1,
		};
	}

	return {
		stdout: stdoutChunks.join(""),
		stderr: stderrChunks.join(""),
		exitCode,
	};
}

/**
 * Convenience wrapper that appends --json, parses stdout as JSON, and returns
 * the typed result. Throws if the command exits non-zero or stdout is not
 * valid JSON.
 */
export async function runCliJson<T = unknown>(args: string[], cwd: string): Promise<T> {
	const { stdout, stderr, exitCode } = await runCli([...args, "--json"], cwd);
	if (exitCode !== 0) {
		throw new Error(
			`runCliJson: command "${args.join(" ")}" exited ${exitCode}\nstdout: ${stdout}\nstderr: ${stderr}`,
		);
	}
	try {
		return JSON.parse(stdout) as T;
	} catch (e) {
		throw new Error(
			`runCliJson: failed to parse JSON from "${args.join(" ")}": ${(e as Error).message}\nstdout: ${stdout}`,
		);
	}
}
