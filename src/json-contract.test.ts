// --json envelope contract (seeds-7f39).
//
// Every command's --json output is `{success, command, ...payload}` where
// `command` is the space-joined subcommand path (`"dep add"`, `"tpl step add"`)
// and is the same string on success and failure. Consumers (warren, overstory,
// greenhouse) read the payload keys pinned here; renaming one is a breaking
// change. Key case mirrors the stored record a key describes: Issue fields and
// dep/label ids are camelCase, plan-row references are snake_case
// (`plan_id`, `parent_seed`) like Issue.plan_id. Add keys; never rename them.
//
// The success cases run in-process and share one store, so they run in order.
// The failure cases spawn the real binary: only src/index.ts wraps thrown and
// commander-level errors into the envelope.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "./test-harness.ts";

type Envelope = Record<string, unknown> & { success: boolean; command: string };

let dir: string;
const ids: Record<string, string> = {};

async function json(args: string[]): Promise<Envelope> {
	const { stdout } = await runCli([...args, "--json"], dir);
	return JSON.parse(stdout) as Envelope;
}

function expectEnvelope(out: Envelope, command: string, keys: string[]): void {
	expect(out.command).toBe(command);
	expect(out.success).toBe(true);
	for (const key of keys) expect(out).toHaveProperty(key);
}

beforeAll(async () => {
	dir = await mkdtemp(join(tmpdir(), "seeds-json-contract-"));
	await runCli(["init"], dir);
});

afterAll(async () => {
	await rm(dir, { recursive: true, force: true });
});

describe("--json success envelopes", () => {
	test("create returns id and the full issue", async () => {
		const out = await json(["create", "--title", "Alpha", "--labels", "x"]);
		expectEnvelope(out, "create", ["id", "issue"]);
		const issue = out.issue as { id: string; title: string; status: string; labels: string[] };
		expect(issue.id).toBe(out.id as string);
		expect(issue.title).toBe("Alpha");
		expect(issue.status).toBe("open");
		expect(issue.labels).toEqual(["x"]);
		ids.a = issue.id;
		ids.b = (await json(["create", "--title", "Beta"])).id as string;
		ids.seed = (await json(["create", "--title", "Plan seed", "--type", "feature"])).id as string;
	});

	test("issue reads", async () => {
		expectEnvelope(await json(["show", ids.a ?? ""]), "show", ["issue"]);
		expectEnvelope(await json(["show", ids.a ?? "", ids.b ?? ""]), "show", ["issues", "results"]);
		expectEnvelope(await json(["list"]), "list", ["issues", "count", "total", "truncated"]);
		expectEnvelope(await json(["ready"]), "ready", ["issues", "count"]);
		expectEnvelope(await json(["search", "Alpha"]), "search", ["issues", "count"]);
		expectEnvelope(await json(["blocked"]), "blocked", ["issues", "count"]);
		expectEnvelope(await json(["stats"]), "stats", ["stats"]);
		expectEnvelope(await json(["prime"]), "prime", []);
		expect((await json(["doctor"])).command).toBe("doctor");
	});

	test("issue writes", async () => {
		const a = ids.a ?? "";
		const b = ids.b ?? "";
		expectEnvelope(await json(["update", a, "--priority", "1"]), "update", ["issue"]);
		expectEnvelope(await json(["dep", "add", a, b]), "dep add", ["issueId", "dependsOnId"]);
		expectEnvelope(await json(["dep", "list", a]), "dep list", ["issueId", "blockedBy", "blocks"]);
		expectEnvelope(await json(["dep", "remove", a, b]), "dep remove", ["issueId", "dependsOnId"]);
		expectEnvelope(await json(["block", a, "--by", b]), "block", []);
		expectEnvelope(await json(["unblock", a, "--from", b]), "unblock", []);
		expectEnvelope(await json(["label", "add", a, "y"]), "label add", ["issueId"]);
		expectEnvelope(await json(["label", "list", a]), "label list", ["issueId", "labels"]);
		expectEnvelope(await json(["label", "list-all"]), "label list-all", ["labels"]);
		expectEnvelope(await json(["label", "remove", a, "y"]), "label remove", ["issueId"]);
	});

	test("templates", async () => {
		const tpl = await json(["tpl", "create", "--name", "flow"]);
		expectEnvelope(tpl, "tpl create", ["id"]);
		const id = tpl.id as string;
		expectEnvelope(await json(["tpl", "step", "add", id, "--title", "S1"]), "tpl step add", []);
		expectEnvelope(await json(["tpl", "list"]), "tpl list", []);
		expectEnvelope(await json(["tpl", "show", id]), "tpl show", []);
		expectEnvelope(await json(["tpl", "pour", id, "--prefix", "p"]), "tpl pour", []);
		expectEnvelope(await json(["tpl", "status", id]), "tpl status", []);
	});

	test("config", async () => {
		expectEnvelope(await json(["config", "show"]), "config show", ["config"]);
		expectEnvelope(await json(["config", "set", "max_plan_depth", "4"]), "config set", ["path"]);
		expectEnvelope(await json(["config", "unset", "max_plan_depth"]), "config unset", ["path"]);
	});

	test("plans", async () => {
		const seed = ids.seed ?? "";
		expectEnvelope(await json(["plan", "templates"]), "plan templates", ["templates", "count"]);
		expectEnvelope(await json(["plan", "prompt", seed]), "plan prompt", ["plan_request"]);
		const planFile = join(dir, "plan.json");
		await Bun.write(
			planFile,
			JSON.stringify({
				template: "feature",
				sections: {
					context: "This work matters because the --json contract must stay stable for consumers.",
					approach: "Pin every envelope in one contract test.",
					alternatives: [],
					steps: [
						{ title: "Step A", type: "task", priority: 2, blocks: [] },
						{ title: "Step B", type: "task", priority: 2, blocks: [] },
					],
					risks: [],
					acceptance: ["Contract test passes"],
				},
			}),
		);
		const submit = await json(["plan", "submit", seed, "--plan", planFile]);
		expectEnvelope(submit, "plan submit", ["plan_id", "children", "parent_seed", "revision"]);
		const planId = submit.plan_id as string;
		expectEnvelope(await json(["plan", "show", planId]), "plan show", ["plan"]);
		expectEnvelope(await json(["plan", "list"]), "plan list", ["plans", "count"]);
		expectEnvelope(await json(["plan", "validate", planId]), "plan validate", ["plan_id"]);
		expectEnvelope(await json(["plan", "review", planId, "--by", "me"]), "plan review", [
			"plan_id",
		]);
		expectEnvelope(await json(["plan", "edit", planId, "--name", "N"]), "plan edit", ["plan_id"]);
		const b = ids.b ?? "";
		expectEnvelope(await json(["plan", "adopt", planId, b]), "plan adopt", ["plan_id", "adopted"]);
		const children = (submit.children as string[]).concat(b).reverse();
		expectEnvelope(await json(["plan", "reorder", planId, ...children]), "plan reorder", [
			"plan_id",
			"children",
		]);
		expectEnvelope(await json(["plan", "release", planId, b]), "plan release", ["plan_id"]);
		expectEnvelope(await json(["plan", "outcome", planId, "--result", "success"]), "plan outcome", [
			"plan_id",
		]);
		const other = (await json(["create", "--title", "Adopt-only seed"])).id as string;
		expectEnvelope(await json(["plan", "create", other]), "plan create", [
			"plan_id",
			"parent_seed",
		]);
	});

	test("close", async () => {
		expectEnvelope(await json(["close", ids.a ?? ""]), "close", []);
	});
});

describe("--json failure envelopes name the same command path", () => {
	const CLI = join(import.meta.dir, "index.ts");

	async function fail(args: string[]): Promise<Envelope> {
		const proc = Bun.spawn(["bun", "run", CLI, ...args, "--json"], {
			cwd: dir,
			stdout: "pipe",
			stderr: "pipe",
			env: { ...process.env, NO_COLOR: "1" },
		});
		const [stdout, exitCode] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
		expect(exitCode).toBe(1);
		return JSON.parse(stdout) as Envelope;
	}

	test("thrown error inside a subcommand", async () => {
		const out = await fail(["dep", "add", "nope-0000", "nope-0001"]);
		expect(out).toMatchObject({ success: false, command: "dep add" });
		expect(out.error).toContain("Issue not found");
	});

	test("commander-level error in a nested subcommand", async () => {
		const out = await fail(["tpl", "step", "add"]);
		expect(out).toMatchObject({ success: false, command: "tpl step add" });
		expect(out.error).toContain("--title");
	});
});
