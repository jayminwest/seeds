import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;

const CLI = join(import.meta.dir, "../../src/index.ts");

async function run(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
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

async function runJson<T = unknown>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-tpl-test-"));
	await run(["init"], tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd tpl create", () => {
	test("creates a template with --name", async () => {
		const result = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "scout-build-review"],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.id).toMatch(/^tpl-[0-9a-f]{4}$/);
	});

	test("requires --name", async () => {
		const { exitCode } = await run(["tpl", "create"], tmpDir);
		expect(exitCode).not.toBe(0);
	});
});

describe("sd tpl step add", () => {
	test("adds a step to a template", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "my-template"],
			tmpDir,
		);
		const result = await runJson<{ success: boolean }>(
			["tpl", "step", "add", create.id, "--title", "Step 1"],
			tmpDir,
		);
		expect(result.success).toBe(true);
	});

	test("added step appears in tpl show", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "my-template"],
			tmpDir,
		);
		await run(["tpl", "step", "add", create.id, "--title", "Scout: {prefix}"], tmpDir);
		await run(["tpl", "step", "add", create.id, "--title", "Build: {prefix}"], tmpDir);

		const show = await runJson<{
			success: boolean;
			template: { steps: Array<{ title: string }> };
		}>(["tpl", "show", create.id], tmpDir);

		expect(show.template.steps).toHaveLength(2);
		expect(show.template.steps[0]?.title).toBe("Scout: {prefix}");
		expect(show.template.steps[1]?.title).toBe("Build: {prefix}");
	});

	test("accepts --type and --priority for step", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "typed-template"],
			tmpDir,
		);
		await run(
			["tpl", "step", "add", create.id, "--title", "Bug step", "--type", "bug", "--priority", "1"],
			tmpDir,
		);
		const show = await runJson<{
			success: boolean;
			template: { steps: Array<{ title: string; type?: string; priority?: number }> };
		}>(["tpl", "show", create.id], tmpDir);

		const step = show.template.steps[0];
		expect(step?.type).toBe("bug");
		expect(step?.priority).toBe(1);
	});

	test("step defaults to type=task priority=2", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "default-template"],
			tmpDir,
		);
		await run(["tpl", "step", "add", create.id, "--title", "Default step"], tmpDir);
		const show = await runJson<{
			success: boolean;
			template: { steps: Array<{ title: string; type?: string; priority?: number }> };
		}>(["tpl", "show", create.id], tmpDir);

		const step = show.template.steps[0];
		expect(step?.type ?? "task").toBe("task");
		expect(step?.priority ?? 2).toBe(2);
	});
});

describe("sd tpl list", () => {
	test("lists all templates", async () => {
		await run(["tpl", "create", "--name", "template-1"], tmpDir);
		await run(["tpl", "create", "--name", "template-2"], tmpDir);

		const result = await runJson<{ success: boolean; templates: unknown[]; count: number }>(
			["tpl", "list"],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.count).toBe(2);
		expect(result.templates).toHaveLength(2);
	});

	test("returns empty list when no templates", async () => {
		const result = await runJson<{ success: boolean; templates: unknown[]; count: number }>(
			["tpl", "list"],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.count).toBe(0);
	});
});

describe("sd tpl show", () => {
	test("shows template with its steps", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "show-test"],
			tmpDir,
		);
		await run(["tpl", "step", "add", create.id, "--title", "Step A"], tmpDir);

		const show = await runJson<{
			success: boolean;
			template: { id: string; name: string; steps: unknown[] };
		}>(["tpl", "show", create.id], tmpDir);

		expect(show.success).toBe(true);
		expect(show.template.id).toBe(create.id);
		expect(show.template.name).toBe("show-test");
		expect(show.template.steps).toHaveLength(1);
	});

	test("fails for unknown template id", async () => {
		const result = await runJson<{ success: boolean; error: string }>(
			["tpl", "show", "tpl-ffff"],
			tmpDir,
		);
		expect(result.success).toBe(false);
		expect(result.error).toBeTruthy();
	});
});

describe("sd tpl pour", () => {
	test("pours template into issues", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "scout-build"],
			tmpDir,
		);
		await run(["tpl", "step", "add", create.id, "--title", "Scout: {prefix}"], tmpDir);
		await run(["tpl", "step", "add", create.id, "--title", "Build: {prefix}"], tmpDir);

		const result = await runJson<{ success: boolean; ids: string[] }>(
			["tpl", "pour", create.id, "--prefix", "auth"],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.ids).toHaveLength(2);
	});

	test("created issues have interpolated titles", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "single-step"],
			tmpDir,
		);
		await run(["tpl", "step", "add", create.id, "--title", "Build: {prefix}"], tmpDir);

		const pour = await runJson<{ success: boolean; ids: string[] }>(
			["tpl", "pour", create.id, "--prefix", "oauth"],
			tmpDir,
		);

		const show = await runJson<{ success: boolean; issue: { title: string } }>(
			["show", pour.ids[0] ?? ""],
			tmpDir,
		);
		expect(show.issue.title).toBe("Build: oauth");
	});

	test("step N+1 is blocked by step N (convoy dependency chain)", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "convoy"],
			tmpDir,
		);
		await run(["tpl", "step", "add", create.id, "--title", "Step 1"], tmpDir);
		await run(["tpl", "step", "add", create.id, "--title", "Step 2"], tmpDir);
		await run(["tpl", "step", "add", create.id, "--title", "Step 3"], tmpDir);

		const pour = await runJson<{ success: boolean; ids: string[] }>(
			["tpl", "pour", create.id, "--prefix", "test"],
			tmpDir,
		);

		// Step 2 blocked by Step 1
		const s2 = await runJson<{ success: boolean; issue: { blockedBy?: string[] } }>(
			["show", pour.ids[1] ?? ""],
			tmpDir,
		);
		expect(s2.issue.blockedBy).toContain(pour.ids[0]);

		// Step 3 blocked by Step 2
		const s3 = await runJson<{ success: boolean; issue: { blockedBy?: string[] } }>(
			["show", pour.ids[2] ?? ""],
			tmpDir,
		);
		expect(s3.issue.blockedBy).toContain(pour.ids[1]);
	});

	test("first step is ready (not blocked)", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "convoy-ready"],
			tmpDir,
		);
		await run(["tpl", "step", "add", create.id, "--title", "First step"], tmpDir);
		await run(["tpl", "step", "add", create.id, "--title", "Second step"], tmpDir);

		const pour = await runJson<{ success: boolean; ids: string[] }>(
			["tpl", "pour", create.id, "--prefix", "x"],
			tmpDir,
		);

		const ready = await runJson<{ success: boolean; issues: Array<{ id: string }> }>(
			["ready"],
			tmpDir,
		);
		const ids = ready.issues.map((i) => i.id);
		expect(ids).toContain(pour.ids[0]);
		expect(ids).not.toContain(pour.ids[1]);
	});

	test("requires --prefix", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "prefix-required"],
			tmpDir,
		);
		await run(["tpl", "step", "add", create.id, "--title", "Step"], tmpDir);

		const { exitCode } = await run(["tpl", "pour", create.id], tmpDir);
		expect(exitCode).not.toBe(0);
	});
});

describe("sd tpl status", () => {
	test("returns convoy completion status", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "status-test"],
			tmpDir,
		);
		await run(["tpl", "step", "add", create.id, "--title", "Step 1"], tmpDir);
		await run(["tpl", "step", "add", create.id, "--title", "Step 2"], tmpDir);

		const pour = await runJson<{ success: boolean; ids: string[] }>(
			["tpl", "pour", create.id, "--prefix", "feature"],
			tmpDir,
		);

		const status = await runJson<{
			success: boolean;
			status: {
				templateId: string;
				total: number;
				completed: number;
				inProgress: number;
				issues: string[];
			};
		}>(["tpl", "status", create.id], tmpDir);

		expect(status.success).toBe(true);
		expect(status.status.templateId).toBe(create.id);
		expect(status.status.total).toBe(2);
		expect(status.status.completed).toBe(0);
		expect(status.status.issues).toHaveLength(2);
	});

	test("tracks completion after closing convoy issues", async () => {
		const create = await runJson<{ success: boolean; id: string }>(
			["tpl", "create", "--name", "track-completion"],
			tmpDir,
		);
		await run(["tpl", "step", "add", create.id, "--title", "Step 1"], tmpDir);
		await run(["tpl", "step", "add", create.id, "--title", "Step 2"], tmpDir);

		const pour = await runJson<{ success: boolean; ids: string[] }>(
			["tpl", "pour", create.id, "--prefix", "work"],
			tmpDir,
		);

		// Close first step
		await run(["close", pour.ids[0] ?? ""], tmpDir);

		const status = await runJson<{
			success: boolean;
			status: { completed: number; total: number };
		}>(["tpl", "status", create.id], tmpDir);

		expect(status.status.completed).toBe(1);
		expect(status.status.total).toBe(2);
	});
});
