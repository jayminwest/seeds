import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const CLI = join(import.meta.dir, "../src/index.ts");

async function run(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(["bun", "run", CLI, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	return { stdout, stderr, exitCode };
}

describe("typo suggestions", () => {
	test("misspelled 'creat' suggests 'create'", async () => {
		const { stderr, exitCode } = await run(["creat"]);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Did you mean create");
	});

	test("misspelled 'lis' suggests 'list'", async () => {
		const { stderr, exitCode } = await run(["lis"]);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Did you mean list");
	});

	test("completely unrelated string does not suggest", async () => {
		const { stderr, exitCode } = await run(["zzzznotacommand"]);
		expect(exitCode).toBe(1);
		expect(stderr).not.toContain("Did you mean");
	});

	test("--json emits JSON error to stdout, stderr empty", async () => {
		const { stdout, stderr, exitCode } = await run(["nosuchcmd", "--json"]);
		expect(exitCode).toBe(1);
		expect(stderr).toBe("");
		const payload = JSON.parse(stdout);
		expect(payload.success).toBe(false);
		expect(payload.command).toBe("nosuchcmd");
		expect(payload.error).toContain("Unknown command: nosuchcmd");
	});

	test("--json includes suggestion when within distance", async () => {
		const { stdout, exitCode } = await run(["creat", "--json"]);
		expect(exitCode).toBe(1);
		const payload = JSON.parse(stdout);
		expect(payload.suggestion).toBe("create");
		expect(payload.error).toContain("Did you mean create");
	});
});
