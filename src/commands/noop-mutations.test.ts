// No-op mutations (seeds-bde5): label/dep commands that change nothing must
// say so (changed: false, only the labels actually touched) and leave the row
// and its updatedAt alone; `sd update` with no field flags is a usage error.

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../test-harness.ts";
import type { Issue } from "../types.ts";

let tmpDir: string;
let a: string;
let b: string;

async function runJson<T = unknown>(args: string[]): Promise<T> {
	const { stdout } = await runCli([...args, "--json"], tmpDir);
	return JSON.parse(stdout) as T;
}

async function show(id: string): Promise<Issue> {
	return (await runJson<{ issue: Issue }>(["show", id])).issue;
}

interface Mutation {
	success: boolean;
	labels?: string[];
	changed: boolean;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-noop-test-"));
	await runCli(["init"], tmpDir);
	a = (await runJson<{ id: string }>(["create", "--title", "A"])).id;
	b = (await runJson<{ id: string }>(["create", "--title", "B"])).id;
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd label no-ops", () => {
	test("add reports only newly added labels", async () => {
		await runCli(["label", "add", a, "x"], tmpDir);
		const res = await runJson<Mutation>(["label", "add", a, "x", "y"]);
		expect(res.labels).toEqual(["y"]);
		expect(res.changed).toBe(true);
		expect((await show(a)).labels).toEqual(["x", "y"]);
	});

	test("add of an existing label is changed: false and keeps updatedAt", async () => {
		await runCli(["label", "add", a, "x"], tmpDir);
		const before = (await show(a)).updatedAt;
		const res = await runJson<Mutation>(["label", "add", a, "x"]);
		expect(res).toMatchObject({ success: true, labels: [], changed: false });
		expect((await show(a)).updatedAt).toBe(before);
		const human = await runCli(["label", "add", a, "x"], tmpDir);
		expect(human.stdout).toContain("no change");
	});

	test("remove of an absent label is changed: false and keeps updatedAt", async () => {
		const before = (await show(a)).updatedAt;
		const res = await runJson<Mutation>(["label", "remove", a, "nope"]);
		expect(res).toMatchObject({ success: true, labels: [], changed: false });
		expect((await show(a)).updatedAt).toBe(before);
		const human = await runCli(["label", "remove", a, "nope"], tmpDir);
		expect(human.stdout).toContain("no change");
	});

	test("remove reports only labels that were present", async () => {
		await runCli(["label", "add", a, "x"], tmpDir);
		const res = await runJson<Mutation>(["label", "remove", a, "x", "nope"]);
		expect(res).toMatchObject({ labels: ["x"], changed: true });
		expect((await show(a)).labels).toBeUndefined();
	});
});

describe("sd dep no-ops", () => {
	test("re-adding an existing dependency is changed: false", async () => {
		const first = await runJson<Mutation>(["dep", "add", a, b]);
		expect(first.changed).toBe(true);
		const before = (await show(a)).updatedAt;
		const again = await runJson<Mutation>(["dep", "add", a, b]);
		expect(again).toMatchObject({ success: true, changed: false });
		expect((await show(a)).updatedAt).toBe(before);
		const human = await runCli(["dep", "add", a, b], tmpDir);
		expect(human.stdout).toContain("already exists");
	});

	test("removing a missing dependency is changed: false", async () => {
		const before = (await show(a)).updatedAt;
		const res = await runJson<Mutation>(["dep", "remove", a, b]);
		expect(res).toMatchObject({ success: true, changed: false });
		expect((await show(a)).updatedAt).toBe(before);
	});
});

describe("sd update with no fields", () => {
	test("fails and leaves updatedAt alone", async () => {
		const before = (await show(a)).updatedAt;
		const res = await runCli(["update", a], tmpDir);
		expect(res.exitCode).not.toBe(0);
		expect(res.stderr).toContain("No fields to update");
		expect((await show(a)).updatedAt).toBe(before);
	});
});
