import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { runCli } from "../test-harness.ts";

let tmpDir: string;

async function run(
	args: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return runCli(args, cwd);
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-init-test-"));
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd init", () => {
	test("creates .seeds directory", async () => {
		const { exitCode } = await run(["init"], tmpDir);
		expect(exitCode).toBe(0);
		const stat = await Bun.file(join(tmpDir, ".seeds", "config.yaml")).exists();
		expect(stat).toBe(true);
	});

	test("creates config.yaml with project name derived from directory", async () => {
		await run(["init"], tmpDir);
		const config = await Bun.file(join(tmpDir, ".seeds", "config.yaml")).text();
		const dirName = basename(tmpDir);
		expect(config).toContain(`project: "${dirName}"`);
		expect(config).toContain("version:");
	});

	test("creates empty issues.jsonl", async () => {
		await run(["init"], tmpDir);
		const exists = await Bun.file(join(tmpDir, ".seeds", "issues.jsonl")).exists();
		expect(exists).toBe(true);
	});

	test("creates empty templates.jsonl", async () => {
		await run(["init"], tmpDir);
		const exists = await Bun.file(join(tmpDir, ".seeds", "templates.jsonl")).exists();
		expect(exists).toBe(true);
	});

	test("creates .gitignore ignoring lock files", async () => {
		await run(["init"], tmpDir);
		const gitignore = await Bun.file(join(tmpDir, ".seeds", ".gitignore")).text();
		expect(gitignore).toContain("*.lock");
	});

	test(".gitignore covers crash leftovers (tmp files, stale-lock sidecars)", async () => {
		Bun.spawnSync(["git", "init", "-q"], { cwd: tmpDir });
		await run(["init"], tmpDir);
		const leftovers = [
			".seeds/issues.jsonl.lock",
			".seeds/issues.jsonl.tmp.0a1b2c3d",
			".seeds/plans.jsonl.lock.stale.0011223344556677",
			".seeds/issues.jsonl.bak",
		];
		const res = Bun.spawnSync(["git", "check-ignore", ...leftovers], { cwd: tmpDir });
		expect(res.stdout.toString().trim().split("\n")).toEqual(leftovers);
		const data = Bun.spawnSync(["git", "check-ignore", ".seeds/issues.jsonl"], { cwd: tmpDir });
		expect(data.exitCode).toBe(1);
	});

	test("routes every store to the seeds-jsonl merge driver, never merge=union", async () => {
		await run(["init"], tmpDir);
		const gitattributes = await Bun.file(join(tmpDir, ".gitattributes")).text();
		expect(gitattributes).toBe(
			".seeds/issues.jsonl merge=seeds-jsonl\n" +
				".seeds/templates.jsonl merge=seeds-jsonl\n" +
				".seeds/plans.jsonl merge=seeds-jsonl\n",
		);
		expect(gitattributes).not.toContain("merge=union");
	});

	test("registers the merge driver in git config inside a git repo", async () => {
		Bun.spawnSync(["git", "init", "-q"], { cwd: tmpDir });
		await run(["init"], tmpDir);
		const cfg = Bun.spawnSync(["git", "config", "--get", "merge.seeds-jsonl.driver"], {
			cwd: tmpDir,
		});
		expect(cfg.stdout.toString().trim()).toBe("sd merge-driver %O %A %B %P");
		const attr = Bun.spawnSync(["git", "check-attr", "merge", "--", ".seeds/issues.jsonl"], {
			cwd: tmpDir,
		});
		expect(attr.stdout.toString().trim()).toBe(".seeds/issues.jsonl: merge: seeds-jsonl");
	});

	test("re-run migrates legacy merge=union lines and keeps unrelated lines", async () => {
		await run(["init"], tmpDir);
		await writeFile(
			join(tmpDir, ".gitattributes"),
			"*.png binary\n.seeds/issues.jsonl merge=union\n.seeds/templates.jsonl merge=union\n",
		);
		const { exitCode } = await run(["init"], tmpDir);
		expect(exitCode).toBe(0);
		const gitattributes = await Bun.file(join(tmpDir, ".gitattributes")).text();
		expect(gitattributes).not.toContain("merge=union");
		expect(gitattributes).toContain("*.png binary\n");
		for (const f of ["issues", "templates", "plans"]) {
			expect(gitattributes.match(new RegExp(`\\.seeds/${f}\\.jsonl merge=`, "g"))?.length).toBe(1);
		}
	});

	test("re-run leaves a store routed to a custom driver alone", async () => {
		Bun.spawnSync(["git", "init", "-q"], { cwd: tmpDir });
		Bun.spawnSync(["git", "config", "merge.mine.driver", "true"], { cwd: tmpDir });
		await run(["init"], tmpDir);
		const custom = ".seeds/issues.jsonl merge=mine\n";
		const path = join(tmpDir, ".gitattributes");
		await writeFile(path, `${await Bun.file(path).text()}${custom}`);
		const before = await Bun.file(path).text();
		await run(["init"], tmpDir);
		const after = await Bun.file(path).text();
		expect(after).toBe(before);
		expect(after.endsWith(custom)).toBe(true);
	});

	test("re-run is a no-op when the merge strategy is already configured", async () => {
		await run(["init"], tmpDir);
		const before = await Bun.file(join(tmpDir, ".gitattributes")).text();
		await run(["init"], tmpDir);
		const after = await Bun.file(join(tmpDir, ".gitattributes")).text();
		expect(after).toBe(before);
	});

	test("is idempotent — second init does not fail", async () => {
		await run(["init"], tmpDir);
		const { exitCode } = await run(["init"], tmpDir);
		expect(exitCode).toBe(0);
	});

	test("--json flag returns success JSON", async () => {
		const { stdout, exitCode } = await run(["init", "--json"], tmpDir);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout) as { success: boolean };
		expect(result.success).toBe(true);
	});
});
