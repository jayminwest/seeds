import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readIssues, readTemplates } from "../store.ts";
import { run as runTpl } from "./tpl.ts";

let tmpDir: string;
let seedsDir: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "seeds-tpl-test-"));
	seedsDir = join(tmpDir, ".seeds");
	mkdirSync(seedsDir, { recursive: true });
	writeFileSync(join(seedsDir, "config.yaml"), 'project: "proj"\nversion: "1"\n');
	writeFileSync(join(seedsDir, "issues.jsonl"), "");
	writeFileSync(join(seedsDir, "templates.jsonl"), "");
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

async function createTemplate(name: string): Promise<string> {
	await runTpl(["create", "--name", name], seedsDir);
	const templates = await readTemplates(seedsDir);
	const tpl = templates.find((t) => t.name === name);
	if (!tpl) throw new Error(`Template not created: ${name}`);
	return tpl.id;
}

describe("sd tpl create", () => {
	test("creates a template", async () => {
		await runTpl(["create", "--name", "my-template"], seedsDir);
		const templates = await readTemplates(seedsDir);
		expect(templates).toHaveLength(1);
		expect(templates[0]?.name).toBe("my-template");
	});

	test("assigns tpl- prefix to id", async () => {
		await runTpl(["create", "--name", "test"], seedsDir);
		const templates = await readTemplates(seedsDir);
		expect(templates[0]?.id.startsWith("tpl-")).toBe(true);
	});

	test("throws if --name missing", async () => {
		await expect(runTpl(["create"], seedsDir)).rejects.toThrow("--name is required");
	});
});

describe("sd tpl step add", () => {
	test("adds steps to template", async () => {
		const tplId = await createTemplate("my-tpl");

		await runTpl(["step", "add", tplId, "--title", "Step 1"], seedsDir);
		await runTpl(["step", "add", tplId, "--title", "Step 2"], seedsDir);

		const updated = await readTemplates(seedsDir);
		const tpl = updated.find((t) => t.id === tplId);
		if (!tpl) throw new Error("template not found");
		expect(tpl.steps).toHaveLength(2);
		expect(tpl.steps[0]?.title).toBe("Step 1");
		expect(tpl.steps[1]?.title).toBe("Step 2");
	});

	test("throws if template not found", async () => {
		await expect(runTpl(["step", "add", "tpl-0000", "--title", "Step"], seedsDir)).rejects.toThrow(
			"not found",
		);
	});
});

describe("sd tpl list", () => {
	test("lists templates", async () => {
		await runTpl(["create", "--name", "alpha"], seedsDir);
		await runTpl(["create", "--name", "beta"], seedsDir);
		const templates = await readTemplates(seedsDir);
		expect(templates).toHaveLength(2);
	});
});

describe("sd tpl show", () => {
	test("shows template details", async () => {
		const tplId = await createTemplate("show-test");
		// Should not throw
		await expect(runTpl(["show", tplId], seedsDir)).resolves.toBeUndefined();
	});

	test("throws for unknown id", async () => {
		await expect(runTpl(["show", "tpl-0000"], seedsDir)).rejects.toThrow("not found");
	});
});

describe("sd tpl pour", () => {
	test("creates issues from template steps", async () => {
		const tplId = await createTemplate("three-step");

		await runTpl(["step", "add", tplId, "--title", "Scout: {prefix}"], seedsDir);
		await runTpl(["step", "add", tplId, "--title", "Build: {prefix}"], seedsDir);
		await runTpl(["step", "add", tplId, "--title", "Review: {prefix}"], seedsDir);

		await runTpl(["pour", tplId, "--prefix", "my-feature"], seedsDir);

		const issues = await readIssues(seedsDir);
		expect(issues).toHaveLength(3);
	});

	test("substitutes {prefix} in titles", async () => {
		const tplId = await createTemplate("tpl");
		await runTpl(["step", "add", tplId, "--title", "Do: {prefix}"], seedsDir);
		await runTpl(["pour", tplId, "--prefix", "hello"], seedsDir);

		const issues = await readIssues(seedsDir);
		expect(issues[0]?.title).toBe("Do: hello");
	});

	test("wires dependencies (step[i+1] blocked by step[i])", async () => {
		const tplId = await createTemplate("chain");
		await runTpl(["step", "add", tplId, "--title", "First"], seedsDir);
		await runTpl(["step", "add", tplId, "--title", "Second"], seedsDir);

		await runTpl(["pour", tplId, "--prefix", "test"], seedsDir);

		const issues = await readIssues(seedsDir);
		const first = issues.find((i) => i.title === "First");
		const second = issues.find((i) => i.title === "Second");
		if (!first || !second) throw new Error("issues not found");
		expect(second.blockedBy).toContain(first.id);
		expect(first.blocks).toContain(second.id);
	});

	test("assigns convoy field to created issues", async () => {
		const tplId = await createTemplate("convoy-tpl");
		await runTpl(["step", "add", tplId, "--title", "Step A"], seedsDir);
		await runTpl(["pour", tplId, "--prefix", "x"], seedsDir);

		const issues = await readIssues(seedsDir);
		expect(issues[0]?.convoy).toBe(tplId);
	});
});

describe("sd tpl status", () => {
	test("shows convoy status", async () => {
		const tplId = await createTemplate("status-tpl");
		await runTpl(["step", "add", tplId, "--title", "Step 1"], seedsDir);
		await runTpl(["step", "add", tplId, "--title", "Step 2"], seedsDir);
		await runTpl(["pour", tplId, "--prefix", "test"], seedsDir);

		// Should not throw
		await expect(runTpl(["status", tplId], seedsDir)).resolves.toBeUndefined();
	});

	test("reports 0 for unknown convoy", async () => {
		// Should not throw, just report empty
		await expect(runTpl(["status", "tpl-0000"], seedsDir)).resolves.toBeUndefined();
	});
});
