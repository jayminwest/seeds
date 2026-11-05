import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Command, CommanderError } from "commander";
import { handleTopLevelError, routeCommanderErrors } from "./error-handler.ts";

describe("handleTopLevelError", () => {
	beforeEach(() => {
		process.exitCode = 0;
	});
	afterEach(() => {
		// Always clear: bun test inherits process.exitCode as its own exit status,
		// so leaving a non-zero value here would fail the entire test run even
		// with all assertions passing.
		process.exitCode = 0;
	});

	test("emits --json error line with success:false / command / error", async () => {
		const writes: string[] = [];
		await handleTopLevelError(new Error("boom"), {
			jsonMode: true,
			cmd: "show",
			write: (s) => {
				writes.push(s);
			},
			writeStderr: () => {},
		});
		expect(process.exitCode).toBe(1);
		expect(writes).toHaveLength(1);
		const parsed = JSON.parse(writes[0] ?? "") as {
			success: boolean;
			command: string;
			error: string;
		};
		expect(parsed).toEqual({ success: false, command: "show", error: "boom" });
	});

	test("stderr path writes a red Error: line", async () => {
		const stderr: string[] = [];
		await handleTopLevelError(new Error("real command failure"), {
			jsonMode: false,
			cmd: "create",
			debug: false,
			write: () => {},
			writeStderr: (s) => {
				stderr.push(s);
			},
		});
		expect(process.exitCode).toBe(1);
		expect(stderr).toHaveLength(1);
		expect(stderr.join("")).toContain("Error: real command failure");
	});

	test("non-Error throwables are stringified", async () => {
		const writes: string[] = [];
		await handleTopLevelError("string boom", {
			jsonMode: true,
			cmd: undefined,
			write: (s) => {
				writes.push(s);
			},
			writeStderr: () => {},
		});
		const parsed = JSON.parse(writes[0] ?? "") as { error: string };
		expect(parsed.error).toBe("string boom");
	});

	test("debug writes the stack to stderr and keeps stdout pure JSON", async () => {
		const writes: string[] = [];
		const stderr: string[] = [];
		const err = new Error("xyz");
		await handleTopLevelError(err, {
			jsonMode: true,
			cmd: "list",
			debug: true,
			write: (s) => {
				writes.push(s);
			},
			writeStderr: (s) => {
				stderr.push(s);
			},
		});
		expect(stderr.join("")).toContain(err.stack ?? "missing stack");
		expect(writes).toHaveLength(1);
		expect(JSON.parse(writes[0] ?? "")).toEqual({ success: false, command: "list", error: "xyz" });
	});

	test("debug defaults to SEEDS_DEBUG=1", async () => {
		const prev = process.env.SEEDS_DEBUG;
		const stderr: string[] = [];
		const run = () =>
			handleTopLevelError(new Error("xyz"), {
				jsonMode: true,
				cmd: "list",
				write: () => {},
				writeStderr: (s) => {
					stderr.push(s);
				},
			});
		try {
			delete process.env.SEEDS_DEBUG;
			await run();
			expect(stderr).toHaveLength(0);
			process.env.SEEDS_DEBUG = "1";
			await run();
			expect(stderr.join("")).toContain("xyz");
		} finally {
			if (prev === undefined) delete process.env.SEEDS_DEBUG;
			else process.env.SEEDS_DEBUG = prev;
		}
	});
});

describe("commander errors (seeds-cb18)", () => {
	beforeEach(() => {
		process.exitCode = 0;
	});
	afterEach(() => {
		process.exitCode = 0;
	});

	const quiet = {
		debug: false,
		writeStderr: () => {},
	};

	async function jsonFor(err: unknown, cmd: string | undefined): Promise<Record<string, unknown>> {
		const writes: string[] = [];
		await handleTopLevelError(err, {
			jsonMode: true,
			cmd,
			...quiet,
			write: (s) => {
				writes.push(s);
			},
		});
		return JSON.parse(writes[0] ?? "") as Record<string, unknown>;
	}

	test("strips commander's 'error: ' prefix", async () => {
		const err = new CommanderError(1, "commander.unknownOption", "error: unknown option '--x'");
		expect(await jsonFor(err, "create")).toEqual({
			success: false,
			command: "create",
			error: "unknown option '--x'",
		});
		expect(process.exitCode).toBe(1);
	});

	test("missing subcommand help maps to a readable message", async () => {
		const err = new CommanderError(1, "commander.help", "(outputHelp)");
		expect((await jsonFor(err, "dep")).error).toBe(
			"missing subcommand. Run 'sd dep --help' for usage.",
		);
		expect((await jsonFor(err, "--json")).error).toBe(
			"missing command. Run 'sd --help' for usage.",
		);
	});

	test("exit-0 commander errors (--help/--version) are silent successes", async () => {
		const writes: string[] = [];
		process.exitCode = 1;
		await handleTopLevelError(new CommanderError(0, "commander.helpDisplayed", "(outputHelp)"), {
			jsonMode: true,
			cmd: "create",
			...quiet,
			write: (s) => {
				writes.push(s);
			},
		});
		expect(writes).toHaveLength(0);
		expect(process.exitCode).toBe(0);
	});

	test("routeCommanderErrors makes nested subcommands throw without writing", async () => {
		const program = new Command();
		const errOut: string[] = [];
		program.configureOutput({ writeErr: (s) => errOut.push(s) });
		const parent = program.command("plan");
		parent
			.command("show")
			.argument("<id>")
			.action(() => {});
		routeCommanderErrors(program);
		let thrown: unknown;
		try {
			await program.parseAsync(["bun", "sd", "plan", "show"]);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toBeInstanceOf(CommanderError);
		expect((thrown as CommanderError).message).toBe("error: missing required argument 'id'");
		expect(errOut).toHaveLength(0);
	});
});
