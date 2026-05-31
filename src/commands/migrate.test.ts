import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

async function writeBeads(cwd: string, lines: string[]): Promise<void> {
	const dir = join(cwd, ".beads");
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "issues.jsonl"), `${lines.join("\n")}\n`);
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-migrate-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd migrate-from-beads", () => {
	test("happy path: maps beads issues into the seeds store and counts skips", async () => {
		await writeBeads(tmpDir, [
			JSON.stringify({
				id: "bd-1",
				title: "From beads",
				status: "in_progress",
				issue_type: "bug",
				priority: 1,
				owner: "alice",
				description: "Imported",
			}),
			// Missing title → mapped as null, counted as skipped.
			JSON.stringify({ id: "bd-2", status: "open" }),
			// Malformed JSON line → ignored entirely.
			"{not json}",
		]);

		const out = await runJson<{
			success: boolean;
			command: string;
			written: number;
			skipped: number;
		}>(["migrate"], tmpDir);
		expect(out.success).toBe(true);
		expect(out.command).toBe("migrate-from-beads");
		expect(out.written).toBe(1);
		expect(out.skipped).toBe(1);

		// Re-running on the same input writes nothing new (existing id dedupe).
		const out2 = await runJson<{ written: number }>(["migrate"], tmpDir);
		expect(out2.written).toBe(0);

		const list = await runJson<{ issues: Array<{ id: string; title: string; status: string }> }>(
			["list"],
			tmpDir,
		);
		const imported = list.issues.find((i) => i.id === "bd-1");
		expect(imported?.title).toBe("From beads");
		expect(imported?.status).toBe("in_progress");
	});

	test("errors when .beads/issues.jsonl is absent", async () => {
		const { exitCode, stderr } = await run(["migrate"], tmpDir);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Beads issues not found");
	});
});
