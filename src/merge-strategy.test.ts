import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "./test-harness.ts";

// `sd doctor` gitattributes check (backed by merge-strategy.ts), split out of
// commands/doctor.test.ts to keep that file under its size budget.

let tmpDir: string;

const run = (args: string[], cwd: string) => runCli(args, cwd);

interface GitattrsCheck {
	status: "pass" | "warn" | "fail";
	details: string[];
	fixable: boolean;
}
interface DoctorResult {
	checks: Array<GitattrsCheck & { name: string }>;
	fixed?: string[];
}

async function runJson<T>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-merge-strategy-test-"));
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("doctor: gitattributes check", () => {
	test("warns when .gitattributes is missing", async () => {
		await run(["init"], tmpDir);
		// Remove the .gitattributes created by init
		const gitattrsPath = join(tmpDir, ".gitattributes");
		if (existsSync(gitattrsPath)) {
			const { unlinkSync } = await import("node:fs");
			unlinkSync(gitattrsPath);
		}

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "gitattributes");
		expect(check?.status).toBe("warn");
	});

	test("passes when entries are present", async () => {
		await run(["init"], tmpDir);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "gitattributes");
		expect(check?.status).toBe("pass");
	});

	test("warns on legacy merge=union and --fix migrates it to the driver", async () => {
		await run(["init"], tmpDir);
		const gitattrsPath = join(tmpDir, ".gitattributes");
		writeFileSync(
			gitattrsPath,
			"# keep\n.seeds/issues.jsonl merge=union\n.seeds/templates.jsonl merge=union\n",
		);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "gitattributes");
		expect(check?.status).toBe("warn");
		expect(check?.fixable).toBe(true);
		expect(check?.details.join("\n")).toContain(".seeds/issues.jsonl: merge=union");
		expect(check?.details.join("\n")).toContain(".seeds/plans.jsonl: no merge strategy");

		const after = await runJson<DoctorResult>(["doctor", "--fix"], tmpDir);
		expect(after.checks.find((ch) => ch.name === "gitattributes")?.status).toBe("pass");
		const content = readFileSync(gitattrsPath, "utf8");
		expect(content).not.toContain("merge=union");
		expect(content).toBe(
			"# keep\n.seeds/issues.jsonl merge=seeds-jsonl\n.seeds/templates.jsonl merge=seeds-jsonl\n" +
				".seeds/plans.jsonl merge=seeds-jsonl\n",
		);
	});

	test("validates the resolved strategy: a custom driver passes and --fix keeps it", async () => {
		Bun.spawnSync(["git", "init", "-q"], { cwd: tmpDir });
		Bun.spawnSync(["git", "config", "merge.mine.driver", "true"], { cwd: tmpDir });
		await run(["init"], tmpDir);
		const gitattrsPath = join(tmpDir, ".gitattributes");
		// Last match wins: this overrides init's line, as a downstream workaround would.
		writeFileSync(gitattrsPath, `${readFileSync(gitattrsPath, "utf8")}.seeds/*.jsonl merge=mine\n`);
		const before = readFileSync(gitattrsPath, "utf8");

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		expect(result.checks.find((ch) => ch.name === "gitattributes")?.status).toBe("pass");
		await run(["doctor", "--fix"], tmpDir);
		expect(readFileSync(gitattrsPath, "utf8")).toBe(before);
	});

	test("warns on an undefined driver and on an unregistered seeds-jsonl driver", async () => {
		Bun.spawnSync(["git", "init", "-q"], { cwd: tmpDir });
		await run(["init"], tmpDir);
		Bun.spawnSync(["git", "config", "--remove-section", "merge.seeds-jsonl"], { cwd: tmpDir });
		const gitattrsPath = join(tmpDir, ".gitattributes");
		writeFileSync(
			gitattrsPath,
			`${readFileSync(gitattrsPath, "utf8")}.seeds/plans.jsonl merge=nope\n`,
		);

		const result = await runJson<DoctorResult>(["doctor"], tmpDir);
		const check = result.checks.find((ch) => ch.name === "gitattributes");
		expect(check?.status).toBe("warn");
		expect(check?.details).toContain(
			".seeds/issues.jsonl: merge driver seeds-jsonl is not registered in git config",
		);
		expect(check?.details).toContain(
			".seeds/plans.jsonl: merge driver nope is not defined in git config",
		);

		const after = await runJson<DoctorResult>(["doctor", "--fix"], tmpDir);
		const fixedCheck = after.checks.find((ch) => ch.name === "gitattributes");
		expect(fixedCheck?.details).toEqual([
			".seeds/plans.jsonl: merge driver nope is not defined in git config",
		]);
		expect(after.fixed).toContain("Registered merge driver seeds-jsonl in git config");
	});
});
