import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";
import { syncSeedsHooks } from "./setup.ts";

let tmpDir: string;

function settingsFile(): string {
	return join(tmpDir, ".claude", "settings.json");
}

async function readSettings(): Promise<Record<string, unknown>> {
	return JSON.parse(await Bun.file(settingsFile()).text()) as Record<string, unknown>;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-setup-test-"));
	await runCli(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

const INSTALLED = {
	SessionStart: [{ hooks: [{ type: "command", command: "sd prime --compact" }] }],
	PreToolUse: [
		{
			matcher: "Write|Edit|MultiEdit|NotebookEdit",
			hooks: [{ type: "command", command: "sd guard" }],
		},
	],
};

describe("sd setup claude", () => {
	test("installs SessionStart prime and PreToolUse guard hooks", async () => {
		const { exitCode, stdout } = await runCli(["setup", "claude"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Installed seeds hooks");
		expect((await readSettings()).hooks).toEqual(INSTALLED);
	});

	test("is idempotent", async () => {
		await runCli(["setup", "claude"], tmpDir);
		const before = await Bun.file(settingsFile()).text();
		const { stdout } = await runCli(["setup", "claude", "--json"], tmpDir);
		const result = JSON.parse(stdout) as { changed: boolean; action: string };
		expect(result.changed).toBe(false);
		expect(result.action).toBe("install");
		expect(await Bun.file(settingsFile()).text()).toBe(before);
	});

	test("keeps unrelated settings and hooks; replaces a stale sd hook", async () => {
		await mkdir(join(tmpDir, ".claude"), { recursive: true });
		await Bun.write(
			settingsFile(),
			JSON.stringify({
				model: "opus",
				hooks: {
					SessionStart: [
						{ hooks: [{ type: "command", command: "ml prime" }] },
						{ hooks: [{ type: "command", command: "sd prime" }] },
					],
				},
			}),
		);
		await runCli(["setup", "claude"], tmpDir);
		const s = await readSettings();
		expect(s.model).toBe("opus");
		expect((s.hooks as Record<string, unknown>).SessionStart).toEqual([
			{ hooks: [{ type: "command", command: "ml prime" }] },
			{ hooks: [{ type: "command", command: "sd prime --compact" }] },
		]);
	});

	test("--remove strips only seeds hooks and drops empty events", async () => {
		await mkdir(join(tmpDir, ".claude"), { recursive: true });
		await Bun.write(
			settingsFile(),
			JSON.stringify({
				hooks: {
					...INSTALLED,
					SessionStart: [
						{
							hooks: [
								{ type: "command", command: "ml prime" },
								{ type: "command", command: "sd prime --compact" },
							],
						},
					],
				},
			}),
		);
		const { stdout } = await runCli(["setup", "claude", "--remove"], tmpDir);
		expect(stdout).toContain("Removed seeds hooks");
		expect((await readSettings()).hooks).toEqual({
			SessionStart: [{ hooks: [{ type: "command", command: "ml prime" }] }],
		});
		const again = await runCli(["setup", "claude", "--remove", "--json"], tmpDir);
		expect((JSON.parse(again.stdout) as { changed: boolean }).changed).toBe(false);
	});

	test("remove after install leaves no hooks key", () => {
		const installed = syncSeedsHooks({ a: 1 }, false);
		expect(installed.changed).toBe(true);
		const removed = syncSeedsHooks(installed.settings, true);
		expect(removed.settings).toEqual({ a: 1 });
	});

	test("refuses malformed settings without writing", async () => {
		await mkdir(join(tmpDir, ".claude"), { recursive: true });
		await Bun.write(settingsFile(), "{ not json");
		const { exitCode, stderr } = await runCli(["setup", "claude"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("nothing was written");
		expect(await Bun.file(settingsFile()).text()).toBe("{ not json");
		expect(() => syncSeedsHooks({ hooks: [] }, false)).toThrow("not an object");
		expect(() => syncSeedsHooks({ hooks: { PreToolUse: {} } }, false)).toThrow("not an array");
	});

	test("rejects unknown targets", async () => {
		const { exitCode, stderr } = await runCli(["setup", "cursor"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("supported: claude");
	});
});
