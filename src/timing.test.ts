import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI = join(import.meta.dir, "../src/index.ts");

async function run(
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(["bun", "run", CLI, ...args], {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
	});
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	return { stdout, stderr, exitCode };
}

describe("--timing flag", () => {
	let tmpDir: string;

	test("--timing prints elapsed time to stderr", async () => {
		tmpDir = await mkdtemp(join(tmpdir(), "seeds-timing-"));
		try {
			// init so stats has something to run against
			await run(["init"], tmpDir);
			const { stderr } = await run(["stats", "--timing"], tmpDir);
			expect(stderr).toMatch(/⏱ \d+(\.\d+)?(ms|s)/);
		} finally {
			await rm(tmpDir, { recursive: true, force: true });
		}
	});

	test("without --timing, no timing on stderr", async () => {
		tmpDir = await mkdtemp(join(tmpdir(), "seeds-timing-"));
		try {
			await run(["init"], tmpDir);
			const { stderr } = await run(["stats"], tmpDir);
			expect(stderr).not.toContain("⏱");
		} finally {
			await rm(tmpDir, { recursive: true, force: true });
		}
	});

	test("--json --timing keeps stdout as clean JSON, timing on stderr", async () => {
		tmpDir = await mkdtemp(join(tmpdir(), "seeds-timing-"));
		try {
			await run(["init"], tmpDir);
			const { stdout, stderr } = await run(["stats", "--json", "--timing"], tmpDir);
			// stdout should parse as valid JSON
			const parsed = JSON.parse(stdout) as { success: boolean };
			expect(parsed.success).toBe(true);
			// timing goes to stderr
			expect(stderr).toMatch(/⏱ \d+(\.\d+)?(ms|s)/);
		} finally {
			await rm(tmpDir, { recursive: true, force: true });
		}
	});
});
