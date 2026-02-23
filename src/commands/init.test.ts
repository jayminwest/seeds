import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;
let origCwd: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "seeds-init-test-"));
	origCwd = process.cwd();
	process.chdir(tmpDir);
});

afterEach(() => {
	process.chdir(origCwd);
	rmSync(tmpDir, { recursive: true, force: true });
});

describe("sd init", () => {
	test("creates .seeds/ directory", async () => {
		await import("../commands/init.ts").then((m) => m.run([]));
		expect(existsSync(join(tmpDir, ".seeds"))).toBe(true);
	});

	test("creates config.yaml", async () => {
		await import("../commands/init.ts").then((m) => m.run([]));
		expect(existsSync(join(tmpDir, ".seeds", "config.yaml"))).toBe(true);
	});

	test("creates issues.jsonl", async () => {
		await import("../commands/init.ts").then((m) => m.run([]));
		expect(existsSync(join(tmpDir, ".seeds", "issues.jsonl"))).toBe(true);
	});

	test("creates templates.jsonl", async () => {
		await import("../commands/init.ts").then((m) => m.run([]));
		expect(existsSync(join(tmpDir, ".seeds", "templates.jsonl"))).toBe(true);
	});

	test("creates .seeds/.gitignore with *.lock", async () => {
		await import("../commands/init.ts").then((m) => m.run([]));
		const file = Bun.file(join(tmpDir, ".seeds", ".gitignore"));
		const content = await file.text();
		expect(content).toContain("*.lock");
	});

	test("creates .gitattributes with merge=union", async () => {
		await import("../commands/init.ts").then((m) => m.run([]));
		const file = Bun.file(join(tmpDir, ".gitattributes"));
		const content = await file.text();
		expect(content).toContain("merge=union");
	});

	test("throws if already initialized", async () => {
		const mod = await import("../commands/init.ts");
		await mod.run([]);
		await expect(mod.run([])).rejects.toThrow("already initialized");
	});
});
