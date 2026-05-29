import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { handleTopLevelError } from "./error-handler.ts";

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
			loadLogger: async () => ({ log: { debug: () => {} } }),
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

	test("missing pino module does not eclipse original error (--json path)", async () => {
		// Simulate `import("./log.ts")` failing because pino is not installed:
		// the catch must swallow the import error and still emit the real one.
		const writes: string[] = [];
		await handleTopLevelError(new Error("real command failure"), {
			jsonMode: true,
			cmd: "create",
			loadLogger: async () => {
				throw new Error("Cannot find module 'pino'");
			},
			write: (s) => {
				writes.push(s);
			},
			writeStderr: () => {},
		});
		expect(process.exitCode).toBe(1);
		const parsed = JSON.parse(writes[0] ?? "") as { error: string; command: string };
		expect(parsed.error).toBe("real command failure");
		expect(parsed.command).toBe("create");
	});

	test("missing pino module does not eclipse original error (stderr path)", async () => {
		const stderr: string[] = [];
		await handleTopLevelError(new Error("real command failure"), {
			jsonMode: false,
			cmd: "create",
			loadLogger: async () => {
				throw new Error("Cannot find module 'pino'");
			},
			write: () => {},
			writeStderr: (s) => {
				stderr.push(s);
			},
		});
		expect(process.exitCode).toBe(1);
		expect(stderr.join("")).toContain("real command failure");
	});

	test("non-Error throwables are stringified", async () => {
		const writes: string[] = [];
		await handleTopLevelError("string boom", {
			jsonMode: true,
			cmd: undefined,
			loadLogger: async () => ({ log: { debug: () => {} } }),
			write: (s) => {
				writes.push(s);
			},
			writeStderr: () => {},
		});
		const parsed = JSON.parse(writes[0] ?? "") as { error: string };
		expect(parsed.error).toBe("string boom");
	});

	test("logger is called with err + cmd when available", async () => {
		const calls: Array<{ obj: unknown; msg?: string }> = [];
		const err = new Error("xyz");
		await handleTopLevelError(err, {
			jsonMode: true,
			cmd: "list",
			loadLogger: async () => ({
				log: {
					debug: (obj: unknown, msg?: string) => {
						calls.push({ obj, msg });
					},
				},
			}),
			write: () => {},
			writeStderr: () => {},
		});
		expect(calls).toHaveLength(1);
		expect(calls[0]?.msg).toBe("command failed");
		expect((calls[0]?.obj as { err: unknown; cmd: string }).cmd).toBe("list");
		expect((calls[0]?.obj as { err: unknown; cmd: string }).err).toBe(err);
	});
});
