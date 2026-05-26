import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { configSchema } from "../config-schema.ts";
import { runCli } from "../test-harness.ts";
import { compileSchema } from "../validation.ts";

let tmpDir: string;

interface ProcResult {
	stdout: string;
	stderr: string;
	exitCode: number;
}

async function run(args: string[], cwd: string): Promise<ProcResult> {
	return runCli(args, cwd);
}

async function runJson<T = unknown>(args: string[], cwd: string): Promise<T> {
	const { stdout } = await run([...args, "--json"], cwd);
	return JSON.parse(stdout) as T;
}

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-config-test-"));
	const init = await run(["init"], tmpDir);
	expect(init.exitCode).toBe(0);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("sd config schema", () => {
	test("emits valid JSON Schema with the expected top-level shape", () => {
		const schema = configSchema();
		expect(schema.$id).toBe("https://github.com/jayminwest/seeds/config.schema.json");
		expect(schema.type).toBe("object");
		expect(schema.required).toEqual(["project", "version"]);
		expect(schema.additionalProperties).toBe(false);
		const props = schema.properties as Record<string, unknown>;
		expect(Object.keys(props).sort()).toEqual(
			["max_plan_depth", "pi", "plan_templates", "project", "version"].sort(),
		);
		const defs = schema.$defs as Record<string, unknown>;
		expect(Object.keys(defs).sort()).toEqual(["PlanTemplate", "SectionSpec"].sort());
	});

	test("golden: schema property keys are stable (warren wire format)", () => {
		const schema = configSchema();
		const props = schema.properties as Record<string, Record<string, unknown>>;

		expect(Object.keys(props.project ?? {}).sort()).toEqual(
			["description", "minLength", "title", "type"].sort(),
		);
		expect(Object.keys(props.version ?? {}).sort()).toEqual(
			["default", "description", "title", "type"].sort(),
		);
		expect(Object.keys(props.max_plan_depth ?? {}).sort()).toEqual(
			["default", "description", "minimum", "title", "type"].sort(),
		);
		expect(Object.keys(props.plan_templates ?? {}).sort()).toEqual(
			["additionalProperties", "description", "examples", "title", "type"].sort(),
		);

		const defs = schema.$defs as Record<string, Record<string, unknown>>;
		const sectionSpec = defs.SectionSpec as Record<string, unknown>;
		const sectionProps = sectionSpec.properties as Record<string, unknown>;
		expect(Object.keys(sectionProps).sort()).toEqual(
			["item", "kind", "min", "min_length", "mulch_source", "prompt", "required"].sort(),
		);
		expect(sectionSpec.required).toEqual(["required", "kind", "prompt"]);
	});

	test("golden: pi block has expected properties (warren wire format)", () => {
		const schema = configSchema();
		const props = schema.properties as Record<string, Record<string, unknown>>;
		const pi = props.pi;
		expect(pi).toBeDefined();
		const piProps = pi?.properties as Record<string, unknown>;
		expect(Object.keys(piProps).sort()).toEqual(
			["auto_prime", "cache", "commands", "prime", "reference_expansion", "status_widget"].sort(),
		);
		expect(pi?.additionalProperties).toBe(false);

		const primeProps = (piProps.prime as Record<string, unknown>).properties as Record<
			string,
			unknown
		>;
		expect(Object.keys(primeProps)).toEqual(["sections"]);

		const cacheProps = (piProps.cache as Record<string, unknown>).properties as Record<
			string,
			unknown
		>;
		expect(Object.keys(cacheProps)).toEqual(["invalidate_on_write"]);

		const refExpProps = (piProps.reference_expansion as Record<string, unknown>)
			.properties as Record<string, unknown>;
		expect(Object.keys(refExpProps)).toEqual(["max_refs"]);
	});

	test("pi block: a valid pi config passes AJV", () => {
		const { $schema: _meta, ...schema } = configSchema();
		const validate = compileSchema(schema);
		const result = validate({
			project: "demo",
			version: "1",
			pi: {
				auto_prime: true,
				status_widget: false,
				prime: { sections: ["rules", "closeProtocol"] },
				cache: { invalidate_on_write: true },
				reference_expansion: { max_refs: 10 },
			},
		});
		expect(result).toEqual({ valid: true });
	});

	test("pi block: unknown nested key is rejected (additionalProperties: false)", () => {
		const { $schema: _meta, ...schema } = configSchema();
		const validate = compileSchema(schema);
		const result = validate({
			project: "demo",
			version: "1",
			pi: { bogus: true },
		});
		expect(result.valid).toBe(false);
	});

	test("pi block: invalid section name is rejected", () => {
		const { $schema: _meta, ...schema } = configSchema();
		const validate = compileSchema(schema);
		const result = validate({
			project: "demo",
			version: "1",
			pi: { prime: { sections: ["not_a_section"] } },
		});
		expect(result.valid).toBe(false);
	});

	test("compiles via AJV (after stripping $schema URI)", () => {
		const { $schema: _meta, ...schema } = configSchema();
		expect(() => compileSchema(schema)).not.toThrow();
	});

	test("validates a minimal real config", () => {
		const { $schema: _meta, ...schema } = configSchema();
		const validate = compileSchema(schema);
		const ok = validate({ project: "demo", version: "1" });
		expect(ok).toEqual({ valid: true });
	});

	test("rejects unknown root keys (additionalProperties: false)", () => {
		const { $schema: _meta, ...schema } = configSchema();
		const validate = compileSchema(schema);
		const result = validate({ project: "demo", version: "1", bogus: 1 });
		expect(result.valid).toBe(false);
	});

	test("CLI emits valid JSON to stdout", async () => {
		const { stdout, exitCode } = await run(["config", "schema"], tmpDir);
		expect(exitCode).toBe(0);
		const parsed = JSON.parse(stdout) as Record<string, unknown>;
		expect(parsed.title).toBe("Seeds project config");
	});
});

describe("sd config show", () => {
	test("shows full config as YAML by default", async () => {
		const { stdout, exitCode } = await run(["config", "show"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("project:");
		expect(stdout).toContain("version:");
	});

	test("shows full config as JSON with --json", async () => {
		const result = await runJson<{ success: boolean; config: Record<string, unknown> }>(
			["config", "show"],
			tmpDir,
		);
		expect(result.success).toBe(true);
		expect(result.config.version).toBe("1");
	});

	test("shows scalar at --path without quotes", async () => {
		const { stdout, exitCode } = await run(["config", "show", "--path", "version"], tmpDir);
		expect(exitCode).toBe(0);
		expect(stdout.trim()).toBe("1");
	});

	test("shows scalar at --path as JSON value with --json", async () => {
		const result = await runJson<{ value: unknown }>(
			["config", "show", "--path", "version"],
			tmpDir,
		);
		expect(result.value).toBe("1");
	});

	test("errors on missing path", async () => {
		const { stderr, exitCode } = await run(["config", "show", "--path", "nope.gone"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Path not found");
	});
});

describe("sd config set", () => {
	test("sets max_plan_depth (integer)", async () => {
		const { exitCode } = await run(["config", "set", "max_plan_depth", "5"], tmpDir);
		expect(exitCode).toBe(0);
		const result = await runJson<{ value: unknown }>(
			["config", "show", "--path", "max_plan_depth"],
			tmpDir,
		);
		expect(result.value).toBe(5);
	});

	test("rejects values that violate the schema", async () => {
		const { stderr, exitCode } = await run(["config", "set", "max_plan_depth", "0"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Config validation failed");
	});

	test("rejects unknown root keys", async () => {
		const { stderr, exitCode } = await run(["config", "set", "unknown_root", "1"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Config validation failed");
	});

	test("creates intermediate maps for nested plan_templates writes", async () => {
		const { exitCode } = await run(
			[
				"config",
				"set",
				"plan_templates.spike.sections.context",
				'{required: true, kind: text, prompt: "Why this spike?", min_length: 30}',
			],
			tmpDir,
		);
		expect(exitCode).toBe(0);

		const result = await runJson<{
			value: { required: boolean; kind: string; prompt: string; min_length: number };
		}>(["config", "show", "--path", "plan_templates.spike.sections.context"], tmpDir);
		expect(result.value.required).toBe(true);
		expect(result.value.kind).toBe("text");
		expect(result.value.min_length).toBe(30);
	});

	test("nested field-level write works after the section is established", async () => {
		await run(
			[
				"config",
				"set",
				"plan_templates.spike.sections.context",
				'{required: true, kind: text, prompt: "Why this spike?"}',
			],
			tmpDir,
		);

		const { exitCode } = await run(
			["config", "set", "plan_templates.spike.sections.context.min_length", "75"],
			tmpDir,
		);
		expect(exitCode).toBe(0);

		const result = await runJson<{ value: number }>(
			["config", "show", "--path", "plan_templates.spike.sections.context.min_length"],
			tmpDir,
		);
		expect(result.value).toBe(75);
	});

	test("rejects partial section writes that fail SectionSpec required fields", async () => {
		// Setting just `kind` on a fresh section is missing `required` + `prompt`.
		const { stderr, exitCode } = await run(
			["config", "set", "plan_templates.spike.sections.context.kind", "text"],
			tmpDir,
		);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Config validation failed");
	});

	test("persists changes to disk in YAML form", async () => {
		await run(["config", "set", "max_plan_depth", "7"], tmpDir);
		const onDisk = await readFile(join(tmpDir, ".seeds", "config.yaml"), "utf8");
		expect(onDisk).toContain("max_plan_depth: 7");
	});
});

describe("sd config unset", () => {
	test("removes a top-level optional key", async () => {
		await run(["config", "set", "max_plan_depth", "5"], tmpDir);
		const { exitCode } = await run(["config", "unset", "max_plan_depth"], tmpDir);
		expect(exitCode).toBe(0);
		const onDisk = await readFile(join(tmpDir, ".seeds", "config.yaml"), "utf8");
		expect(onDisk).not.toContain("max_plan_depth");
	});

	test("noop on missing path with --json reports removed: false", async () => {
		const result = await runJson<{ removed: boolean }>(["config", "unset", "missing.path"], tmpDir);
		expect(result.removed).toBe(false);
	});

	test("rejects unset of a required key (project)", async () => {
		const { stderr, exitCode } = await run(["config", "unset", "project"], tmpDir);
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Config validation failed");
	});
});
