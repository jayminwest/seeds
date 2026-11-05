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
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
			success: boolean;
			command: string;
			name: string;
			version: string;
			runtime: string;
			platform: string;
		};
		expect(parsed.success).toBe(true);
		expect(parsed.command).toBe("version");
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

	test("commander-level errors with --json emit the envelope on stdout (seeds-cb18)", async () => {
		// Missing required option is raised by commander itself, before any
		// action runs; without exitOverride it would print plain text to stderr.
		const cwd = await mkdtemp(join(tmpdir(), "seeds-smoke-"));
		try {
			await run(["init"], cwd);
			const { stdout, stderr, exitCode } = await run(["create", "--json"], cwd);
			expect(exitCode).toBe(1);
			expect(stderr).toBe("");
			const parsed = JSON.parse(stdout) as { success: boolean; command: string; error: string };
			expect(parsed).toEqual({
				success: false,
				command: "create",
				error: "required option '--title <text>' not specified",
			});
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

	test("large --json output to an early-closing reader exits promptly (EPIPE, seeds-3024)", async () => {
		const cwd = await mkdtemp(join(tmpdir(), "seeds-epipe-"));
		try {
			const init = await run(["init"], cwd);
			expect(init.exitCode).toBe(0);

			// Inflate the store so `list --json` far exceeds the OS pipe buffer
			// (~64KB), guaranteeing sd still has data buffered when `head` closes
			// the read end.
			const dbPath = join(cwd, ".seeds", "issues.jsonl");
			const lines: string[] = [];
			for (let i = 0; i < 500; i++) {
				lines.push(
					JSON.stringify({
						id: `seeds-${i.toString(16).padStart(4, "0")}`,
						title: "x".repeat(400),
						status: "open",
						type: "task",
						priority: 2,
						createdAt: "2026-06-16T00:00:00.000Z",
						updatedAt: "2026-06-16T00:00:00.000Z",
					}),
				);
			}
			await writeFile(dbPath, `${lines.join("\n")}\n`);

			// Faithful reproduction of the incident: pipe a large `--json` payload
			// into a reader (`head`) that drains a little and exits, closing the
			// pipe early. Before the EPIPE fix this hung forever (busy-spin on
			// Linux). sd's own stderr is captured so we can assert it exited
			// cleanly rather than crashing with an EPIPE stack.
			const errPath = join(cwd, "sd-stderr.log");
			const proc = Bun.spawn(
				[
					"bash",
					"-c",
					`bun run ${JSON.stringify(CLI)} list --json 2>${JSON.stringify(errPath)} | head -c 50 >/dev/null`,
				],
				{ cwd, stdout: "ignore", stderr: "ignore", env: { ...process.env, NO_COLOR: "1" } },
			);

			const timeout = new Promise<"timeout">((resolve) =>
				setTimeout(() => resolve("timeout"), 10_000),
			);
			const result = await Promise.race([proc.exited, timeout]);
			if (result === "timeout") {
				proc.kill(9);
				throw new Error("sd hung on a broken pipe (EPIPE) instead of exiting");
			}

			const errLog = await Bun.file(errPath)
				.text()
				.catch(() => "");
			expect(errLog).not.toContain("EPIPE");
		} finally {
			await rm(cwd, { recursive: true, force: true });
		}
	}, 15_000);

	test("large --json output to a fully-draining reader exits promptly (backpressure, seeds-18dc)", async () => {
		const cwd = await mkdtemp(join(tmpdir(), "seeds-drain-"));
		try {
			const init = await run(["init"], cwd);
			expect(init.exitCode).toBe(0);

			// Inflate the store so `list --json` far exceeds the OS pipe buffer
			// (~64KB). seeds-3024 only covered an early-closing reader (`| head`);
			// this covers a reader that stays OPEN and fully drains. The one-shot
			// Bun.write busy-spun at 100% CPU on Linux here (no EPIPE, reader open)
			// until backpressure-aware chunked writes landed.
			const dbPath = join(cwd, ".seeds", "issues.jsonl");
			const lines: string[] = [];
			for (let i = 0; i < 1000; i++) {
				lines.push(
					JSON.stringify({
						id: `seeds-${i.toString(16).padStart(4, "0")}`,
						title: "x".repeat(400),
						status: "open",
						type: "task",
						priority: 2,
						createdAt: "2026-06-16T00:00:00.000Z",
						updatedAt: "2026-06-16T00:00:00.000Z",
					}),
				);
			}
			await writeFile(dbPath, `${lines.join("\n")}\n`);

			// `cat` keeps the read end open and drains everything; the payload is
			// piped through to a byte count so we can assert the full output made
			// it across without truncation. --limit 1000 is explicit for clarity;
			// --json is uncapped by default.
			const proc = Bun.spawn(
				["bash", "-c", `bun run ${JSON.stringify(CLI)} list --json --limit 1000 | cat | wc -c`],
				{ cwd, stdout: "pipe", stderr: "ignore", env: { ...process.env, NO_COLOR: "1" } },
			);

			const timeout = new Promise<"timeout">((resolve) =>
				setTimeout(() => resolve("timeout"), 10_000),
			);
			const result = await Promise.race([proc.exited, timeout]);
			if (result === "timeout") {
				proc.kill(9);
				throw new Error("sd busy-spun on a full pipe (backpressure) instead of exiting");
			}
			expect(result).toBe(0);

			const byteCount = Number((await new Response(proc.stdout).text()).trim());
			// Sanity: the payload genuinely exceeded the pipe buffer, so the
			// backpressure path was actually exercised.
			expect(byteCount).toBeGreaterThan(64 * 1024);
		} finally {
			await rm(cwd, { recursive: true, force: true });
		}
	}, 15_000);
});
