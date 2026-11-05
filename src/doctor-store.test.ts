import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { hostname, tmpdir } from "node:os";
import { join } from "node:path";
import { rewriteJsonl } from "./doctor-store.ts";
import { withLock } from "./store.ts";
import { runCli } from "./test-harness.ts";

// seeds-499f: doctor covers plans.jsonl and config.yaml.lock, classifies locks with
// isLockStale(), and every --fix rewrite is locked, atomic, and backed up when it
// deletes rows. Split from commands/doctor.test.ts to keep that file under budget.

let tmpDir: string;

interface DoctorResult {
	checks: Array<{ name: string; status: "pass" | "warn" | "fail"; details: string[] }>;
	fixed?: string[];
}

async function doctor(cwd: string, fix = false): Promise<DoctorResult> {
	const { stdout } = await runCli(["doctor", ...(fix ? ["--fix"] : []), "--json"], cwd);
	return JSON.parse(stdout) as DoctorResult;
}

function check(result: DoctorResult, name: string) {
	return result.checks.find((ch) => ch.name === name);
}

const seeds = (file: string) => join(tmpDir, ".seeds", file);

function plan(id: string, createdAt = "2026-01-01T00:00:00.000Z"): string {
	return JSON.stringify({
		id,
		seed: "test-0001",
		template: "feature",
		status: "draft",
		revision: 1,
		sections: {},
		children: [],
		createdAt,
		updatedAt: createdAt,
	});
}

function deadPid(): number {
	return Bun.spawnSync(["true"]).pid;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-doctor-store-test-"));
	await runCli(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("doctor: plans.jsonl coverage", () => {
	test("flags malformed plans.jsonl lines and --fix drops them with a .bak", async () => {
		const original = `${plan("pl-0001")}\nNOT JSON\n`;
		writeFileSync(seeds("plans.jsonl"), original);

		const before = check(await doctor(tmpDir), "jsonl-integrity");
		expect(before?.status).toBe("fail");
		expect(before?.details[0]).toContain("plans.jsonl line 2");

		const after = await doctor(tmpDir, true);
		expect(check(after, "jsonl-integrity")?.status).toBe("pass");
		expect(after.fixed).toContain(
			"Removed 1 malformed line(s) from plans.jsonl (backup: plans.jsonl.bak)",
		);
		expect(readFileSync(seeds("plans.jsonl"), "utf8")).toBe(`${plan("pl-0001")}\n`);
		expect(readFileSync(seeds("plans.jsonl.bak"), "utf8")).toBe(original);
	});

	test("dedups repeated plan rows and keeps colliding plans", async () => {
		writeFileSync(seeds("plans.jsonl"), `${plan("pl-0001")}\n${plan("pl-0001")}\n`);
		const dup = check(await doctor(tmpDir), "duplicate-ids");
		expect(dup?.status).toBe("warn");
		expect(dup?.details).toContain("pl-0001 appears 2 times in plans.jsonl");

		const after = await doctor(tmpDir, true);
		expect(after.fixed).toContain("Deduplicated plans.jsonl (backup: plans.jsonl.bak)");
		expect(readFileSync(seeds("plans.jsonl"), "utf8")).toBe(`${plan("pl-0001")}\n`);

		const collided = `${plan("pl-0002")}\n${plan("pl-0002", "2026-02-02T00:00:00.000Z")}\n`;
		writeFileSync(seeds("plans.jsonl"), collided);
		expect(check(await doctor(tmpDir), "duplicate-ids")?.status).toBe("fail");
		await doctor(tmpDir, true);
		expect(readFileSync(seeds("plans.jsonl"), "utf8")).toBe(collided);
	});
});

describe("doctor: stale-locks via isLockStale", () => {
	test("a fresh lock held by a dead pid on this host is stale and --fix removes it", async () => {
		const owner = { pid: deadPid(), host: hostname(), startedAt: new Date().toISOString() };
		writeFileSync(seeds("plans.jsonl.lock"), JSON.stringify(owner));

		const before = check(await doctor(tmpDir), "stale-locks");
		expect(before?.details[0]).toMatch(/^plans\.jsonl\.lock is stale/);

		const after = await doctor(tmpDir, true);
		expect(after.fixed).toContain("Removed stale plans.jsonl.lock");
		expect(existsSync(seeds("plans.jsonl.lock"))).toBe(false);
	});

	test("a fresh lock held by a live pid is reported as active and kept", async () => {
		const owner = { pid: process.pid, host: hostname(), startedAt: new Date().toISOString() };
		writeFileSync(seeds("config.yaml.lock"), JSON.stringify(owner));

		const result = check(await doctor(tmpDir, true), "stale-locks");
		expect(result?.status).toBe("warn");
		expect(result?.details[0]).toMatch(/^config\.yaml\.lock exists .*may be active/);
		expect(existsSync(seeds("config.yaml.lock"))).toBe(true);
	});
});

describe("rewriteJsonl", () => {
	test("waits for the store lock and edits what the holder wrote", async () => {
		const path = seeds("issues.jsonl");
		writeFileSync(path, '{"id":"a"}\n{"id":"a"}\n');
		let rewrite: Promise<boolean> | undefined;
		await withLock(path, async () => {
			rewrite = rewriteJsonl(join(tmpDir, ".seeds"), "issues.jsonl", (lines) =>
				lines.slice(1).map((l) => l.text),
			);
			await Bun.sleep(150);
			writeFileSync(path, '{"id":"a"}\n{"id":"a"}\n{"id":"b"}\n'); // concurrent writer
		});
		expect(await rewrite).toBe(true);
		expect(readFileSync(path, "utf8")).toBe('{"id":"a"}\n{"id":"b"}\n');
		expect(existsSync(`${path}.bak`)).toBe(false);
	});

	test("leaves the file untouched when the edit returns null", async () => {
		const path = seeds("templates.jsonl");
		writeFileSync(path, "KEEP ME\n");
		const changed = await rewriteJsonl(join(tmpDir, ".seeds"), "templates.jsonl", () => null, {
			backup: true,
		});
		expect(changed).toBe(false);
		expect(readFileSync(path, "utf8")).toBe("KEEP ME\n");
		expect(existsSync(`${path}.bak`)).toBe(false);
	});
});
