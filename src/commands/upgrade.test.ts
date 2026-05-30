import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { runCli } from "../test-harness.ts";
import { VERSION } from "../version.ts";

const origFetch = globalThis.fetch;

function stubFetch(latest: string): void {
	const stub = async (): Promise<Response> =>
		new Response(JSON.stringify({ version: latest }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	globalThis.fetch = stub as unknown as typeof fetch;
}

beforeEach(() => {
	// Reset before each test; cwd doesn't matter for upgrade.
});

afterEach(() => {
	globalThis.fetch = origFetch;
});

describe("sd upgrade --check", () => {
	test("non-json: exits 0 when up to date", async () => {
		stubFetch(VERSION);
		const { exitCode, stdout } = await runCli(["upgrade", "--check"], process.cwd());
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Already up to date");
	});

	test("non-json: exits 1 when update available", async () => {
		stubFetch("999.0.0");
		const { exitCode, stderr } = await runCli(["upgrade", "--check"], process.cwd());
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Update available");
	});

	test("--json: exits 0 when up to date", async () => {
		stubFetch(VERSION);
		const { exitCode, stdout } = await runCli(["upgrade", "--check", "--json"], process.cwd());
		expect(exitCode).toBe(0);
		const payload = JSON.parse(stdout) as {
			success: boolean;
			command: string;
			current: string;
			latest: string;
			upToDate: boolean;
		};
		expect(payload.success).toBe(true);
		expect(payload.command).toBe("upgrade");
		expect(payload.upToDate).toBe(true);
		expect(payload.current).toBe(VERSION);
		expect(payload.latest).toBe(VERSION);
	});

	test("--json: exits 1 when update available, payload still success:true", async () => {
		stubFetch("999.0.0");
		const { exitCode, stdout } = await runCli(["upgrade", "--check", "--json"], process.cwd());
		expect(exitCode).toBe(1);
		const payload = JSON.parse(stdout) as {
			success: boolean;
			command: string;
			current: string;
			latest: string;
			upToDate: boolean;
		};
		expect(payload.success).toBe(true);
		expect(payload.command).toBe("upgrade");
		expect(payload.upToDate).toBe(false);
		expect(payload.current).toBe(VERSION);
		expect(payload.latest).toBe("999.0.0");
	});
});
