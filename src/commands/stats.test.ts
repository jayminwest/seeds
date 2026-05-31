import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";

let tmpDir: string;

async function run(args: string[], cwd: string) {
	return runCli(args, cwd);
}

async function runJson<T>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-stats-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd stats", () => {
	test("empty store reports zeros via --json", async () => {
		const out = await runJson<{
			success: boolean;
			command: string;
			stats: {
				total: number;
				open: number;
				inProgress: number;
				closed: number;
				blocked: number;
				byType: Record<string, number>;
				byPriority: Record<string, number>;
				byLabel: Record<string, number>;
			};
		}>(["stats"], tmpDir);
		expect(out.success).toBe(true);
		expect(out.command).toBe("stats");
		expect(out.stats.total).toBe(0);
		expect(out.stats.open).toBe(0);
		expect(out.stats.closed).toBe(0);
		expect(out.stats.blocked).toBe(0);
	});

	test("counts open / closed / blocked / by-type / by-label correctly", async () => {
		const aOut = await runJson<{ id: string }>(
			["create", "--title", "A", "--type", "bug", "--label", "ui"],
			tmpDir,
		);
		const bOut = await runJson<{ id: string }>(
			["create", "--title", "B", "--type", "feature", "--label", "ui"],
			tmpDir,
		);
		const cOut = await runJson<{ id: string }>(["create", "--title", "C"], tmpDir);
		await run(["dep", "add", bOut.id, "--blocked-by", aOut.id], tmpDir);
		await run(["close", cOut.id], tmpDir);

		const out = await runJson<{
			stats: {
				total: number;
				open: number;
				closed: number;
				blocked: number;
				byType: Record<string, number>;
				byLabel: Record<string, number>;
			};
		}>(["stats"], tmpDir);
		expect(out.stats.total).toBe(3);
		expect(out.stats.open).toBe(2);
		expect(out.stats.closed).toBe(1);
		expect(out.stats.blocked).toBe(1);
		expect(out.stats.byType.bug).toBe(1);
		expect(out.stats.byType.feature).toBe(1);
		expect(out.stats.byType.task).toBe(1);
		expect(out.stats.byLabel.ui).toBe(2);
	});

	test("invalid --format errors out with non-zero exit", async () => {
		const { exitCode, stderr } = await run(["stats", "--format", "bogus"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr.length).toBeGreaterThan(0);
	});
});
