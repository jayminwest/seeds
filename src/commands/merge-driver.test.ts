import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { MERGE_DRIVER_NAME } from "../merge-strategy.ts";
import { runCli } from "../test-harness.ts";

let tmpDir: string;

const ENTRY = resolve(import.meta.dir, "..", "index.ts");

function git(...args: string[]): { exitCode: number; out: string } {
	const r = Bun.spawnSync(["git", ...args], { cwd: tmpDir, stdout: "pipe", stderr: "pipe" });
	return { exitCode: r.exitCode ?? 1, out: `${r.stdout.toString()}${r.stderr.toString()}` };
}

const line = (o: object) => `${JSON.stringify(o)}\n`;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-merge-driver-test-"));
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd merge-driver", () => {
	test("writes the merged result into <ours> and exits 0", async () => {
		const [o, a, b] = ["o", "a", "b"].map((n) => join(tmpDir, n)) as [string, string, string];
		writeFileSync(o, line({ id: "x", blockedBy: ["p", "q"] }));
		writeFileSync(a, line({ id: "x", blockedBy: ["q"] }));
		writeFileSync(b, line({ id: "x", blockedBy: ["p"] }));
		const { exitCode } = await runCli(["merge-driver", o, a, b, ".seeds/issues.jsonl"], tmpDir);
		expect(exitCode).toBe(0);
		expect(readFileSync(a, "utf8")).toBe(line({ id: "x", blockedBy: [] }));
	});

	test("exits non-zero on a field conflict", async () => {
		const [o, a, b] = ["o", "a", "b"].map((n) => join(tmpDir, n)) as [string, string, string];
		writeFileSync(o, line({ id: "x", title: "o" }));
		writeFileSync(a, line({ id: "x", title: "a" }));
		writeFileSync(b, line({ id: "x", title: "b" }));
		const { exitCode, stderr } = await runCli(["merge-driver", o, a, b], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("x.title");
		expect(readFileSync(a, "utf8")).toContain("<<<<<<< ours");
	});

	test("exits non-zero and leaves <ours> untouched on unparsable input", async () => {
		const [o, a, b] = ["o", "a", "b"].map((n) => join(tmpDir, n)) as [string, string, string];
		writeFileSync(o, "");
		writeFileSync(a, "garbage\n");
		writeFileSync(b, "");
		const { exitCode, stderr } = await runCli(["merge-driver", o, a, b], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("cannot merge");
		expect(readFileSync(a, "utf8")).toBe("garbage\n");
	});

	test("a real git merge of two branches closing different siblings is clean", async () => {
		git("init", "-q", "-b", "main");
		git("config", "user.email", "t@example.com");
		git("config", "user.name", "t");
		await runCli(["init"], tmpDir);
		// Point the registered driver at this checkout instead of a global `sd`.
		git("config", `merge.${MERGE_DRIVER_NAME}.driver`, `bun ${ENTRY} merge-driver %O %A %B %P`);

		const issues = join(tmpDir, ".seeds", "issues.jsonl");
		const a = { id: "s-a", status: "open" };
		const b = { id: "s-b", status: "open" };
		const u = { id: "s-u", status: "open", blockedBy: ["s-a", "s-b"] };
		writeFileSync(issues, line(a) + line(b) + line(u));
		git("add", "-A");
		git("commit", "-qm", "base");

		git("checkout", "-qb", "side");
		writeFileSync(
			issues,
			line(a) + line({ ...b, status: "closed" }) + line({ ...u, blockedBy: ["s-a"] }),
		);
		git("commit", "-qam", "close b");

		git("checkout", "-q", "main");
		writeFileSync(
			issues,
			line({ ...a, status: "closed" }) + line(b) + line({ ...u, blockedBy: ["s-b"] }),
		);
		git("commit", "-qam", "close a");

		const merge = git("merge", "-q", "--no-edit", "side");
		expect(merge.exitCode).toBe(0);
		expect(readFileSync(issues, "utf8")).toBe(
			line({ ...a, status: "closed" }) +
				line({ ...b, status: "closed" }) +
				line({ ...u, blockedBy: [] }),
		);
	});
});
