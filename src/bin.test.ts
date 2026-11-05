// src/bin.ts is the published entrypoint (seeds-bde5). Each test copies it
// next to a stub index.ts in a temp dir so the dependency-resolution path can
// be exercised without touching the real node_modules.

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { copyFile, mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let root: string;

beforeEach(async () => {
	root = await realpath(await mkdtemp(join(tmpdir(), "seeds-bin-test-")));
	await mkdir(join(root, "src"));
	await copyFile(join(import.meta.dir, "bin.ts"), join(root, "src", "bin.ts"));
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

async function runBin(stub: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	await writeFile(join(root, "src", "index.ts"), stub);
	const proc = Bun.spawn(["bun", join(root, "src", "bin.ts")], {
		cwd: root,
		stdout: "pipe",
		stderr: "pipe",
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	return { stdout, stderr, exitCode };
}

describe("sd bin entrypoint", () => {
	test("runs the CLI module", async () => {
		const res = await runBin('console.log("cli ran");\n');
		expect(res.exitCode).toBe(0);
		expect(res.stdout).toBe("cli ran\n");
	});

	test("missing dependency prints a bun install hint", async () => {
		const res = await runBin('import "seeds-no-such-package";\n');
		expect(res.exitCode).toBe(1);
		expect(res.stderr).toContain("seeds: missing dependency");
		expect(res.stderr).toContain("seeds-no-such-package");
		expect(res.stderr).toContain(`Run 'bun install' in ${root}`);
	});

	test("other load errors are not swallowed", async () => {
		const res = await runBin('throw new Error("boom at load");\n');
		expect(res.exitCode).not.toBe(0);
		expect(res.stderr).toContain("boom at load");
		expect(res.stderr).not.toContain("bun install");
	});
});
