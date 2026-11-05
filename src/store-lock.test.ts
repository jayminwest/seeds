import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { hostname, tmpdir } from "node:os";
import { join } from "node:path";
import { isLockStale, withLock } from "./store";

// Lock ownership (seeds-a34c): the lock file records its holder so a lock left
// by a crashed process on this host is reclaimed at once instead of after 30s.

let tmpDir: string;
let seedsDir: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-lock-test-"));
	seedsDir = join(tmpDir, ".seeds");
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("withLock owner record", () => {
	test("writes pid, host and startedAt into the lock while held", async () => {
		const lockPath = `${seedsDir}.lock`;
		const owner = await withLock(seedsDir, async () => JSON.parse(readFileSync(lockPath, "utf8")));
		expect(owner.pid).toBe(process.pid);
		expect(owner.host).toBe(hostname());
		expect(Number.isNaN(Date.parse(owner.startedAt))).toBe(false);
	});

	test("reclaims a fresh lock immediately when its same-host owner is dead", async () => {
		const child = Bun.spawn(["true"]);
		await child.exited;
		const lockPath = `${seedsDir}.lock`;
		writeFileSync(
			lockPath,
			JSON.stringify({ pid: child.pid, host: hostname(), startedAt: new Date().toISOString() }),
		);

		const start = Date.now();
		const result = await withLock(seedsDir, async () => "claimed");
		expect(result).toBe("claimed");
		expect(Date.now() - start).toBeLessThan(1_000);
		expect(readdirSync(tmpDir).filter((name) => name.includes(".lock"))).toEqual([]);
	});

	test("isLockStale: fresh locks held live, cross-host, or ownerless are not stale", () => {
		const lockPath = `${seedsDir}.lock`;
		const now = { mtimeMs: Date.now() };
		const write = (owner: unknown) => writeFileSync(lockPath, JSON.stringify(owner));

		write({ pid: process.pid, host: hostname(), startedAt: "" });
		expect(isLockStale(lockPath, now)).toBe(false);

		// Another host's pid cannot be probed; only the mtime fallback applies.
		write({ pid: 999_999_999, host: `${hostname()}-other`, startedAt: "" });
		expect(isLockStale(lockPath, now)).toBe(false);

		// Legacy empty lock / malformed owner: mtime fallback only.
		writeFileSync(lockPath, "");
		expect(isLockStale(lockPath, now)).toBe(false);
		write({ pid: "nope", host: hostname() });
		expect(isLockStale(lockPath, now)).toBe(false);

		// Any lock older than LOCK_STALE_MS is stale regardless of owner.
		write({ pid: process.pid, host: hostname(), startedAt: "" });
		expect(isLockStale(lockPath, { mtimeMs: Date.now() - 10 * 60_000 })).toBe(true);
	});
});
