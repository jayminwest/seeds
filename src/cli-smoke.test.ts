// Subprocess-level smoke tests for the seeds CLI entrypoint.
//
// Every other command test runs in-process via src/test-harness.ts (~25x
// faster). This file intentionally spawns `bun run src/index.ts` to cover the
// surfaces the in-process harness cannot touch:
//
//   - Top-level commander program boot (registerAll + version + help formatter)
//   - The custom root --help renderer in src/index.ts
//   - The `main().catch` JSON error wrapper at the bottom of src/index.ts
//   - The unknown-command branch (typo suggester + exit code 1)
//   - The early `--version --json` short-circuit before commander parses
//   - Real binary exit codes propagated through Bun's process layer
//
// Keep this file SMALL. Each subprocess spawn pays the full Bun + TypeScript
// startup cost (~250ms). Anything that can be tested in-process should live in
// the command's own *.test.ts file, not here.

import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VERSION } from "./version.ts";

const CLI = join(import.meta.dir, "../src/index.ts");

interface SpawnResult {
	stdout: string;
	stderr: string;
	exitCode: number;
}

async function run(args: string[], cwd?: string): Promise<SpawnResult> {
	const proc = Bun.spawn(["bun", "run", CLI, ...args], {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
		env: { ...process.env, NO_COLOR: "1" },
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	return { stdout, stderr, exitCode };
}

describe("sd CLI smoke", () => {
	test("--version prints the package version", async () => {
		const { stdout, exitCode } = await run(["--version"]);
		expect(exitCode).toBe(0);
		expect(stdout.trim()).toBe(VERSION);
	});

	test("-v is a working alias for --version", async () => {
		const { stdout, exitCode } = await run(["-v"]);
		expect(exitCode).toBe(0);
		expect(stdout.trim()).toBe(VERSION);
	});

	test("--version --json short-circuits with runtime metadata", async () => {
		const { stdout, exitCode } = await run(["--version", "--json"]);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as {
			name: string;
			version: string;
			runtime: string;
			platform: string;
		};
		expect(parsed.name).toBe("@os-eco/seeds-cli");
		expect(parsed.version).toBe(VERSION);
		expect(parsed.runtime).toBe("bun");
		expect(parsed.platform).toMatch(/^[a-z]+-[a-z0-9]+$/);
	});

	test("--help renders root usage with commands and options", async () => {
		const { stdout, exitCode } = await run(["--help"]);
		expect(exitCode).toBe(0);
		// Custom root help formatter contents (src/index.ts).
		expect(stdout).toContain(`seeds v${VERSION}`);
		expect(stdout).toContain("Usage: sd <command> [options]");
		expect(stdout).toContain("Commands:");
		// Spot-check that registerAll() wired up representative commands.
		for (const name of ["init", "create", "list", "ready", "plan", "config"]) {
			expect(stdout).toContain(name);
		}
		// Spot-check root flags.
		expect(stdout).toContain("--json");
		expect(stdout).toContain("--timing");
	});

	test("sd create --help hides the --label alias", async () => {
		const { stdout, exitCode } = await run(["create", "--help"]);
		expect(exitCode).toBe(0);
		// Canonical flag is documented.
		expect(stdout).toContain("--labels");
		// Hidden alias must not appear as its own option line.
		expect(stdout).not.toMatch(/--label\b(?!s)/);
	});

	test("unknown command exits 1 with a suggestion when close", async () => {
		const { stderr, exitCode } = await run(["creat"]);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Unknown command: creat");
		expect(stderr).toContain("Did you mean create");
	});

	test("unknown command with --json wraps the error on stdout", async () => {
		// `sd show <missing>` blows up inside the command, exercising the
		// main().catch JSON branch in src/index.ts.
		const cwd = await mkdtemp(join(tmpdir(), "seeds-smoke-"));
		try {
			await run(["init"], cwd);
			const { stdout, exitCode } = await run(["show", "seeds-deadbeef", "--json"], cwd);
			expect(exitCode).toBe(1);
			const parsed = JSON.parse(stdout) as {
				success: boolean;
				command: string;
				error: string;
			};
			expect(parsed.success).toBe(false);
			expect(parsed.command).toBe("show");
			expect(parsed.error.length).toBeGreaterThan(0);
		} finally {
			await rm(cwd, { recursive: true, force: true });
		}
	});

	test("end-to-end init → create → list works through the real binary", async () => {
		const cwd = await mkdtemp(join(tmpdir(), "seeds-smoke-"));
		try {
			const init = await run(["init"], cwd);
			expect(init.exitCode).toBe(0);

			const created = await run(["create", "--title", "smoke task", "--json"], cwd);
			expect(created.exitCode).toBe(0);
			const createdJson = JSON.parse(created.stdout) as {
				success: boolean;
				id: string;
			};
			expect(createdJson.success).toBe(true);
			expect(createdJson.id).toMatch(/-[0-9a-f]{4}$/);

			const listed = await run(["list", "--json"], cwd);
			expect(listed.exitCode).toBe(0);
			const listedJson = JSON.parse(listed.stdout) as {
				success: boolean;
				issues: Array<{ id: string; title: string }>;
			};
			expect(listedJson.success).toBe(true);
			const found = listedJson.issues.find((i) => i.id === createdJson.id);
			expect(found?.title).toBe("smoke task");
		} finally {
			await rm(cwd, { recursive: true, force: true });
		}
	});
});
