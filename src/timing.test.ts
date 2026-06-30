import { beforeAll, describe, expect, test } from "bun:test";
import chalk from "chalk";
import { Command } from "commander";
import { formatElapsed, installTimingHook } from "./timing.ts";

// The previous version of this file spawned `bun run src/index.ts stats
// --timing` against a temp .seeds store. The hook is now exported as a small
// pure-ish helper; we test the formatter directly and the hook against a
// stub commander Program in-process. The end-to-end stderr-routing behavior
// is still exercised by src/cli-smoke.test.ts.

beforeAll(() => {
	// Match the harness convention so muted() doesn't emit ANSI codes that
	// would confuse the regex assertions below.
	chalk.level = 0;
});

function captureStderr<T>(fn: () => Promise<T>): Promise<{ value: T; stderr: string }> {
	const chunks: string[] = [];
	const orig = process.stderr.write.bind(process.stderr);
	process.stderr.write = ((chunk: unknown, cb1?: unknown, cb2?: unknown): boolean => {
		const s =
			typeof chunk === "string"
				? chunk
				: chunk instanceof Uint8Array
					? Buffer.from(chunk).toString()
					: String(chunk);
		chunks.push(s);
		const cb = typeof cb1 === "function" ? cb1 : typeof cb2 === "function" ? cb2 : undefined;
		if (cb) (cb as () => void)();
		return true;
	}) as typeof process.stderr.write;
	return fn()
		.then((value) => ({ value, stderr: chunks.join("") }))
		.finally(() => {
			process.stderr.write = orig;
		});
}

function buildProgram(): Command {
	const program = new Command();
	program.exitOverride();
	program.option("--timing", "Show command execution time");
	program.option("--json", "Emit JSON");
	installTimingHook(program);
	program.command("noop").action(() => {
		// no-op action
	});
	program.command("emit-json").action(() => {
		process.stdout.write(`${JSON.stringify({ success: true })}\n`);
	});
	return program;
}

describe("formatElapsed", () => {
	test("sub-second values render as whole ms", () => {
		expect(formatElapsed(0)).toBe("0ms");
		expect(formatElapsed(12.3)).toBe("12ms");
		expect(formatElapsed(999)).toBe("999ms");
	});

	test("≥ 1000ms renders as seconds with 2 decimals", () => {
		expect(formatElapsed(1000)).toBe("1.00s");
		expect(formatElapsed(1500)).toBe("1.50s");
		expect(formatElapsed(12_345)).toBe("12.35s");
	});
});

describe("--timing hook", () => {
	test("with --timing, postAction prints '⏱ <elapsed>' to stderr", async () => {
		const program = buildProgram();
		const { stderr } = await captureStderr(async () => {
			await program.parseAsync(["bun", "sd", "--timing", "noop"]);
		});
		expect(stderr).toMatch(/⏱ \d+(\.\d+)?(ms|s)/);
	});

	test("without --timing, no timing line is emitted", async () => {
		const program = buildProgram();
		const { stderr } = await captureStderr(async () => {
			await program.parseAsync(["bun", "sd", "noop"]);
		});
		expect(stderr).not.toContain("⏱");
	});

	test("--json --timing keeps stdout clean: timing goes only to stderr", async () => {
		const program = buildProgram();
		const stdoutChunks: string[] = [];
		const origStdout = process.stdout.write.bind(process.stdout);
		process.stdout.write = ((chunk: unknown, cb1?: unknown, cb2?: unknown): boolean => {
			stdoutChunks.push(typeof chunk === "string" ? chunk : String(chunk));
			const cb = typeof cb1 === "function" ? cb1 : typeof cb2 === "function" ? cb2 : undefined;
			if (cb) (cb as () => void)();
			return true;
		}) as typeof process.stdout.write;
		try {
			const { stderr } = await captureStderr(async () => {
				await program.parseAsync(["bun", "sd", "--timing", "--json", "emit-json"]);
			});
			const stdout = stdoutChunks.join("");
			const parsed = JSON.parse(stdout) as { success: boolean };
			expect(parsed.success).toBe(true);
			expect(stdout).not.toContain("⏱");
			expect(stderr).toMatch(/⏱ \d+(\.\d+)?(ms|s)/);
		} finally {
			process.stdout.write = origStdout;
		}
	});
});
