import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";

let tmpDir: string;

async function run(
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return runCli(args, cwd);
}

async function initSeeds(cwd: string): Promise<void> {
	const { exitCode } = await run(["init"], cwd);
	expect(exitCode).toBe(0);
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-setup-test-"));
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd setup", () => {
	test("fails outside a seeds project", async () => {
		const { exitCode, stderr } = await run(["setup", "--list"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Not in a seeds project");
	});

	test("--list shows built-in pi recipe", async () => {
		await initSeeds(tmpDir);
		const { exitCode, stdout } = await run(["setup", "--list"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Available providers");
		expect(stdout).toContain("pi");
		expect(stdout).toContain("built-in");
	});

	test("--list --json emits structured providers array", async () => {
		await initSeeds(tmpDir);
		const { stdout, exitCode } = await run(["setup", "--list", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as {
			success: boolean;
			action: string;
			providers: { name: string; source: string }[];
		};
		expect(result.success).toBe(true);
		expect(result.action).toBe("list");
		expect(Array.isArray(result.providers)).toBe(true);
		expect(result.providers).toEqual(
			expect.arrayContaining([expect.objectContaining({ name: "pi", source: "builtin" })]),
		);
	});

	test("no provider and no flags exits non-zero", async () => {
		await initSeeds(tmpDir);
		const { exitCode, stderr } = await run(["setup"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Specify a provider");
	});

	test("unknown provider exits non-zero with hint", async () => {
		await initSeeds(tmpDir);
		const { exitCode, stderr } = await run(["setup", "nope"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Unknown provider");
		expect(stderr).toContain("--list");
	});

	test("unknown provider with --json returns structured error", async () => {
		await initSeeds(tmpDir);
		const { exitCode, stdout } = await run(["setup", "nope", "--json"], tmpDir);
		expect(exitCode).toBe(1);
		const result = JSON.parse(stdout) as { success: boolean; error: string };
		expect(result.success).toBe(false);
		expect(result.error).toContain("Unknown provider");
	});

	test("sd --help lists setup", async () => {
		// Top-level --help exercises the full commander program — run via
		// subprocess so every command (not just `setup`) is registered.
		const CLI = join(import.meta.dir, "../../src/index.ts");
		const proc = Bun.spawn(["bun", "run", CLI, "--help"], {
			cwd: tmpDir,
			stdout: "pipe",
			stderr: "pipe",
		});
		const stdout = await new Response(proc.stdout).text();
		const exitCode = await proc.exited;
		expect(exitCode).toBe(0);
		expect(stdout).toContain("setup");
	});
});

describe("sd setup pi", () => {
	test("install writes .pi/settings.json and flips marker to :pi", async () => {
		await initSeeds(tmpDir);
		const { exitCode, stdout } = await run(["setup", "pi"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Installed Pi integration");

		const settings = JSON.parse(await Bun.file(join(tmpDir, ".pi", "settings.json")).text()) as {
			packages: string[];
		};
		expect(settings.packages).toEqual(["@os-eco/seeds-cli"]);

		const claude = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(claude).toContain("<!-- seeds:start -->");
		expect(claude).toContain("seeds-onboard-schema:6:pi");
		// Short pi-aware variant should reference the extension, not the
		// `sd prime` ritual the bare snippet leads with.
		expect(claude).toContain("@os-eco/pi-seeds");
		expect(claude).not.toMatch(/At the start of every session/);
	});

	test("install is idempotent — second run is a no-op", async () => {
		await initSeeds(tmpDir);
		await run(["setup", "pi"], tmpDir);
		const firstSettings = await Bun.file(join(tmpDir, ".pi", "settings.json")).text();
		const firstClaude = await Bun.file(join(tmpDir, "CLAUDE.md")).text();

		const { exitCode, stdout } = await run(["setup", "pi"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("already installed");

		expect(await Bun.file(join(tmpDir, ".pi", "settings.json")).text()).toBe(firstSettings);
		expect(await Bun.file(join(tmpDir, "CLAUDE.md")).text()).toBe(firstClaude);
	});

	test("--check returns up_to_date after install", async () => {
		await initSeeds(tmpDir);
		await run(["setup", "pi"], tmpDir);
		const { exitCode, stdout } = await run(["setup", "pi", "--check", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { success: boolean; action: string; message: string };
		expect(result.success).toBe(true);
		expect(result.action).toBe("check");
		expect(result.message).toContain("Pi integration installed");
	});

	test("--check returns not_installed before install", async () => {
		await initSeeds(tmpDir);
		const { exitCode, stdout } = await run(["setup", "pi", "--check", "--json"], tmpDir);
		expect(exitCode).toBe(1);
		const result = JSON.parse(stdout) as { success: boolean; message: string };
		expect(result.success).toBe(false);
		expect(result.message).toContain(".pi/settings.json not found");
	});

	test("--remove reverts both legs", async () => {
		await initSeeds(tmpDir);
		await run(["setup", "pi"], tmpDir);
		const { exitCode, stdout } = await run(["setup", "pi", "--remove"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Removed pi integration");

		// Settings file deleted (was effectively empty after removing the package).
		const settingsExists = await Bun.file(join(tmpDir, ".pi", "settings.json")).exists();
		expect(settingsExists).toBe(false);

		// CLAUDE.md reverted to bare snippet — marker drops the :pi suffix.
		const claude = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(claude).toContain("seeds-onboard-schema:6");
		expect(claude).not.toContain("seeds-onboard-schema:6:pi");
		expect(claude).toContain("At the start of every session");

		const recheck = await run(["setup", "pi", "--check", "--json"], tmpDir);
		expect(recheck.exitCode).toBe(1);
	});

	test("install preserves unrelated keys in .pi/settings.json", async () => {
		await initSeeds(tmpDir);
		await Bun.write(
			join(tmpDir, ".pi", "settings.json"),
			`${JSON.stringify({ theme: "dark", packages: ["@other/pkg"] }, null, 2)}\n`,
		);

		const { exitCode } = await run(["setup", "pi"], tmpDir);
		expect(exitCode).toBe(0);

		const settings = JSON.parse(await Bun.file(join(tmpDir, ".pi", "settings.json")).text()) as {
			theme: string;
			packages: string[];
		};
		expect(settings.theme).toBe("dark");
		expect(settings.packages).toEqual(["@other/pkg", "@os-eco/seeds-cli"]);
	});

	test("install with no CLAUDE.md creates one with the pi variant", async () => {
		await initSeeds(tmpDir);
		const { exitCode } = await run(["setup", "pi"], tmpDir);
		expect(exitCode).toBe(0);
		const claude = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(claude).toContain("seeds-onboard-schema:6:pi");
	});

	test("install upgrades existing bare snippet to pi variant", async () => {
		await initSeeds(tmpDir);
		// Pre-existing bare onboard snippet.
		await run(["onboard"], tmpDir);
		const before = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(before).toContain("seeds-onboard-schema:6");
		expect(before).not.toContain("seeds-onboard-schema:6:pi");

		const { exitCode } = await run(["setup", "pi"], tmpDir);
		expect(exitCode).toBe(0);
		const after = await Bun.file(join(tmpDir, "CLAUDE.md")).text();
		expect(after).toContain("seeds-onboard-schema:6:pi");
		// Should not duplicate the section.
		const startCount = (after.match(/<!-- seeds:start -->/g) ?? []).length;
		expect(startCount).toBe(1);
	});

	test("remove without prior install reports nothing-to-remove", async () => {
		await initSeeds(tmpDir);
		const { exitCode, stdout } = await run(["setup", "pi", "--remove"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("No pi integration found");
	});
});
