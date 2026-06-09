import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createLog, REDACT_PATHS } from "./log.ts";

// Collect each NDJSON line pino writes so we can parse and assert on it.
function capture(): { lines: string[]; stream: { write(s: string): void } } {
	const lines: string[] = [];
	return { lines, stream: { write: (s: string) => void lines.push(s) } };
}

describe("createLog redaction", () => {
	test("removes each documented sensitive path", () => {
		const { lines, stream } = capture();
		const log = createLog({ level: "info", pretty: false, destination: stream });
		log.info(
			{
				password: "pw",
				token: "tok",
				apiKey: "ak",
				secret: "sk",
				authorization: "Bearer x",
				req: {
					password: "pw2",
					token: "tok2",
					apiKey: "ak2",
					secret: "sk2",
					authorization: "Bearer y",
				},
				headers: { cookie: "session=abc", authorization: "Bearer z" },
				keep: "visible",
			},
			"with secrets",
		);
		const entry = JSON.parse(lines[0] ?? "{}");

		// Top-level keys removed.
		for (const key of ["password", "token", "apiKey", "secret", "authorization"]) {
			expect(entry[key]).toBeUndefined();
		}
		// One-level-nested keys removed via the `*.<key>` wildcards.
		for (const key of ["password", "token", "apiKey", "secret", "authorization"]) {
			expect(entry.req?.[key]).toBeUndefined();
		}
		// Explicit header paths removed.
		expect(entry.headers?.cookie).toBeUndefined();
		expect(entry.headers?.authorization).toBeUndefined();
		// Non-sensitive fields survive.
		expect(entry.keep).toBe("visible");
		expect(entry.msg).toBe("with secrets");
	});

	test("REDACT_PATHS enumerates every documented path", () => {
		expect(REDACT_PATHS).toContain("password");
		expect(REDACT_PATHS).toContain("*.token");
		expect(REDACT_PATHS).toContain("headers.cookie");
	});
});

describe("createLog level resolution", () => {
	const saved = {
		level: process.env.SEEDS_LOG_LEVEL,
		debug: process.env.SEEDS_DEBUG,
	};

	beforeEach(() => {
		delete process.env.SEEDS_LOG_LEVEL;
		delete process.env.SEEDS_DEBUG;
	});

	afterEach(() => {
		if (saved.level === undefined) delete process.env.SEEDS_LOG_LEVEL;
		else process.env.SEEDS_LOG_LEVEL = saved.level;
		if (saved.debug === undefined) delete process.env.SEEDS_DEBUG;
		else process.env.SEEDS_DEBUG = saved.debug;
	});

	test("defaults to info", () => {
		expect(createLog({ pretty: false }).level).toBe("info");
	});

	test("SEEDS_DEBUG=1 flips the default to debug", () => {
		process.env.SEEDS_DEBUG = "1";
		expect(createLog({ pretty: false }).level).toBe("debug");
	});

	test("explicit SEEDS_LOG_LEVEL wins over SEEDS_DEBUG", () => {
		process.env.SEEDS_DEBUG = "1";
		process.env.SEEDS_LOG_LEVEL = "warn";
		expect(createLog({ pretty: false }).level).toBe("warn");
	});

	test("unknown SEEDS_LOG_LEVEL falls back to info without throwing", () => {
		process.env.SEEDS_LOG_LEVEL = "chatty";
		expect(() => createLog({ pretty: false })).not.toThrow();
		expect(createLog({ pretty: false }).level).toBe("info");
	});

	test("unknown SEEDS_LOG_LEVEL falls back through SEEDS_DEBUG=1 to debug", () => {
		process.env.SEEDS_LOG_LEVEL = "verbose";
		process.env.SEEDS_DEBUG = "1";
		expect(createLog({ pretty: false }).level).toBe("debug");
	});

	test("each documented pino level is accepted", () => {
		for (const lvl of ["trace", "debug", "info", "warn", "error", "fatal", "silent"]) {
			process.env.SEEDS_LOG_LEVEL = lvl;
			expect(createLog({ pretty: false }).level).toBe(lvl);
		}
	});
});

describe("createLog output format", () => {
	test("emits parseable NDJSON in non-TTY mode", () => {
		const { lines, stream } = capture();
		const log = createLog({ level: "info", pretty: false, destination: stream });
		log.info({ run: 42 }, "hello");
		expect(lines).toHaveLength(1);
		const entry = JSON.parse(lines[0] ?? "{}");
		expect(entry.msg).toBe("hello");
		expect(entry.run).toBe(42);
		expect(typeof entry.level).toBe("number");
		expect(typeof entry.time).toBe("number");
	});
});
