import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Config, PlanTemplate, SectionSpec } from "./types.ts";
import { CONFIG_FILE, DEFAULT_MAX_PLAN_DEPTH, SECTION_KINDS, SEEDS_DIR_NAME } from "./types.ts";
import { parseYaml, type YamlValue } from "./yaml.ts";

export async function readConfig(seedsDir: string): Promise<Config> {
	const file = Bun.file(join(seedsDir, CONFIG_FILE));
	const content = await file.text();
	const data = parseYaml(content);
	const config: Config = {
		project: typeof data.project === "string" ? data.project : "seeds",
		version: typeof data.version === "string" ? data.version : "1",
	};
	if (typeof data.max_plan_depth === "number" && Number.isInteger(data.max_plan_depth)) {
		config.max_plan_depth = data.max_plan_depth;
	}
	return config;
}

export function maxPlanDepth(config: Config): number {
	return config.max_plan_depth ?? DEFAULT_MAX_PLAN_DEPTH;
}

function gitCommonDir(cwd: string): string | null {
	try {
		const result = Bun.spawnSync(["git", "rev-parse", "--git-common-dir"], {
			cwd,
			stdout: "pipe",
			stderr: "pipe",
		});
		if ((result.exitCode ?? 0) !== 0) return null;
		const raw = new TextDecoder().decode(result.stdout).trim();
		if (!raw) return null;
		return resolve(cwd, raw);
	} catch {
		return null;
	}
}

function gitDir(cwd: string): string | null {
	try {
		const result = Bun.spawnSync(["git", "rev-parse", "--git-dir"], {
			cwd,
			stdout: "pipe",
			stderr: "pipe",
		});
		if ((result.exitCode ?? 0) !== 0) return null;
		const raw = new TextDecoder().decode(result.stdout).trim();
		if (!raw) return null;
		return resolve(cwd, raw);
	} catch {
		return null;
	}
}

function resolveWorktreeRoot(candidateSeedsDir: string): string {
	const candidateRoot = dirname(candidateSeedsDir);
	const common = gitCommonDir(candidateRoot);
	if (!common) return candidateSeedsDir;

	// .git/worktrees/<name> → strip to repo root; .git → already main
	const mainRoot = common.endsWith(".git") ? dirname(common) : dirname(dirname(common));

	const mainResolved = resolve(mainRoot);
	if (mainResolved === resolve(candidateRoot)) return candidateSeedsDir;

	const mainSeedsDir = join(mainResolved, SEEDS_DIR_NAME);
	if (existsSync(join(mainSeedsDir, CONFIG_FILE))) {
		return mainSeedsDir;
	}

	return candidateSeedsDir;
}

export function isInsideWorktree(dir?: string): boolean {
	const cwd = dir ?? process.cwd();
	// In a linked worktree, --git-dir points to .git/worktrees/<name> while
	// --git-common-dir points to the main .git — they differ.
	// In the main repo and in submodules, both return the same path.
	const gd = gitDir(cwd);
	const common = gitCommonDir(cwd);
	if (!gd || !common) return false;
	return gd !== common;
}

export async function findSeedsDir(startDir?: string): Promise<string> {
	let dir = startDir ?? process.cwd();
	while (true) {
		const configPath = join(dir, SEEDS_DIR_NAME, CONFIG_FILE);
		const file = Bun.file(configPath);
		if (await file.exists()) {
			return resolveWorktreeRoot(join(dir, SEEDS_DIR_NAME));
		}
		const parent = dirname(dir);
		if (parent === dir) {
			throw new Error("Not in a seeds project. Run `sd init` first.");
		}
		dir = parent;
	}
}

export function projectRootFromSeedsDir(seedsDir: string): string {
	return dirname(seedsDir);
}

// Built-in `feature` template (PLAN_SPEC.md:36-78, 313-325). Loaded when
// config.yaml has no `plan_templates:` block, or as a fallback when the user
// declares other templates without redefining `feature`.
export const BUILTIN_FEATURE_TEMPLATE: PlanTemplate = {
	name: "feature",
	description: "New capability or significant change. Default for type: feature.",
	sections: {
		context: {
			required: true,
			kind: "text",
			min_length: 50,
			prompt: "Why does this work need to happen? What problem or opportunity drives it?",
		},
		approach: {
			required: true,
			kind: "text",
			prompt: "What's the chosen approach, and why this over alternatives?",
		},
		alternatives: {
			required: false,
			kind: "list",
			item: {
				name: { required: true, kind: "text", prompt: "" },
				rejected_because: { required: true, kind: "text", prompt: "" },
			},
			prompt: "What other approaches were considered and rejected?",
		},
		steps: {
			required: true,
			kind: "steps",
			min: 2,
			prompt:
				"Decompose into ordered, independent implementation steps. Each becomes a child seed.",
		},
		risks: {
			required: false,
			kind: "list",
			item: "text",
			mulch_source: "failure",
			prompt:
				"What could go wrong? Known failure modes from prior work are pre-filled when mulch is available.",
		},
		acceptance: {
			required: true,
			kind: "list",
			item: "text",
			min: 1,
			prompt: "Concrete, verifiable conditions for plan completion.",
		},
	},
};

// Built-in `bug` template (PLAN_SPEC.md:268). Defect-fix framing: requires
// reproduction + root_cause separately from the fix approach. Wired into the
// type → template mapping so seed.type=bug picks this template by default.
export const BUILTIN_BUG_TEMPLATE: PlanTemplate = {
	name: "bug",
	description: "Defect fix. Adds reproduction and root_cause sections. Default for type: bug.",
	sections: {
		context: {
			required: true,
			kind: "text",
			prompt: "Why does fixing this matter? Who is affected and how?",
		},
		reproduction: {
			required: true,
			kind: "text",
			min_length: 50,
			prompt: "Concrete steps to reproduce. Inputs, environment, observed vs. expected.",
		},
		root_cause: {
			required: true,
			kind: "text",
			min_length: 50,
			prompt: "What's actually broken? Trace the defect to its source, not just the symptom.",
		},
		approach: {
			required: true,
			kind: "text",
			prompt: "Chosen fix and the rationale for it over alternatives.",
		},
		steps: {
			required: true,
			kind: "steps",
			min: 1,
			prompt: "Ordered fix steps. Each becomes a child seed.",
		},
		acceptance: {
			required: true,
			kind: "list",
			item: "text",
			min: 1,
			prompt: "Verifiable conditions: regression test, behavior, etc.",
		},
	},
};

// Built-in `refactor` template (PLAN_SPEC.md:269). Internal restructuring with
// no observable behavior change; the invariant is the load-bearing field.
//
// Inference choice (PLAN_SPEC.md open question 4 / seeds-6730 decision):
// `refactor` is opt-in via `--template refactor` only. There is no `refactor`
// seed type in the wider seeds taxonomy, so seed.type → template mapping does
// not auto-route to this template. `bug` chose the opposite direction because
// `bug` is already a seed type.
export const BUILTIN_REFACTOR_TEMPLATE: PlanTemplate = {
	name: "refactor",
	description:
		"Internal restructuring. Adds behavior_invariant (must stay equal). Opt-in via --template refactor.",
	sections: {
		context: {
			required: true,
			kind: "text",
			prompt: "Why this refactor? What pain does it relieve?",
		},
		behavior_invariant: {
			required: true,
			kind: "text",
			min_length: 50,
			prompt:
				"The contract that MUST remain equal across the refactor. Be specific — this is what acceptance tests verify.",
		},
		approach: {
			required: true,
			kind: "text",
			prompt: "Chosen restructuring strategy.",
		},
		steps: {
			required: true,
			kind: "steps",
			min: 1,
			prompt: "Ordered restructuring steps. Each becomes a child seed.",
		},
		acceptance: {
			required: true,
			kind: "list",
			item: "text",
			min: 1,
			prompt: "How we'll verify the invariant is preserved.",
		},
	},
};

const BUILTIN_PLAN_TEMPLATES: Record<string, PlanTemplate> = {
	feature: BUILTIN_FEATURE_TEMPLATE,
	bug: BUILTIN_BUG_TEMPLATE,
	refactor: BUILTIN_REFACTOR_TEMPLATE,
};

export async function loadPlanTemplates(seedsDir: string): Promise<Record<string, PlanTemplate>> {
	const file = Bun.file(join(seedsDir, CONFIG_FILE));
	if (!(await file.exists())) {
		return { ...BUILTIN_PLAN_TEMPLATES };
	}
	const content = await file.text();
	const data = parseYaml(content);
	const userBlock = data.plan_templates;
	const builtins: Record<string, PlanTemplate> = { ...BUILTIN_PLAN_TEMPLATES };
	if (!isPlainObject(userBlock)) return builtins;

	const result: Record<string, PlanTemplate> = { ...builtins };
	for (const [name, raw] of Object.entries(userBlock)) {
		if (!isPlainObject(raw)) {
			throw new Error(`plan_templates.${name} must be a mapping`);
		}
		const sectionsRaw = raw.sections;
		if (!isPlainObject(sectionsRaw)) {
			throw new Error(`plan_templates.${name}.sections must be a mapping`);
		}
		const sections: Record<string, SectionSpec> = {};
		for (const [secName, secRaw] of Object.entries(sectionsRaw)) {
			sections[secName] = parseSectionSpec(secRaw, `plan_templates.${name}.sections.${secName}`);
		}
		const tpl: PlanTemplate = { name, sections };
		if (typeof raw.description === "string") tpl.description = raw.description;
		result[name] = tpl;
	}
	return result;
}

function isPlainObject(v: unknown): v is Record<string, YamlValue> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseSectionSpec(raw: YamlValue, path: string): SectionSpec {
	if (!isPlainObject(raw)) {
		throw new Error(`${path}: must be a mapping`);
	}
	if (typeof raw.required !== "boolean") {
		throw new Error(`${path}.required: must be a boolean (got: ${describe(raw.required)})`);
	}
	if (typeof raw.prompt !== "string") {
		throw new Error(`${path}.prompt: must be a string (got: ${describe(raw.prompt)})`);
	}
	const kind = parseKind(raw.kind, `${path}.kind`);
	const spec: SectionSpec = {
		required: raw.required,
		kind,
		prompt: raw.prompt,
	};
	if (typeof raw.min_length === "number") spec.min_length = raw.min_length;
	if (typeof raw.min === "number") spec.min = raw.min;
	if (raw.item !== undefined) spec.item = parseItem(raw.item, `${path}.item`);
	if (typeof raw.mulch_source === "string") spec.mulch_source = raw.mulch_source;
	return spec;
}

function parseKind(raw: YamlValue | undefined, path: string): SectionSpec["kind"] {
	if (typeof raw === "string") {
		if ((SECTION_KINDS as readonly string[]).includes(raw)) {
			return raw as SectionSpec["kind"];
		}
		throw new Error(`${path}: unknown kind '${raw}' (expected ${SECTION_KINDS.join("|")}|object)`);
	}
	if (isPlainObject(raw)) {
		const fields: Record<string, SectionSpec> = {};
		for (const [k, v] of Object.entries(raw)) {
			fields[k] = parseSectionSpec(v, `${path}.${k}`);
		}
		return fields;
	}
	throw new Error(
		`${path}: unknown kind '${describe(raw)}' (expected ${SECTION_KINDS.join("|")}|object)`,
	);
}

function parseItem(raw: YamlValue, path: string): "text" | Record<string, SectionSpec> {
	if (raw === "text") return "text";
	if (isPlainObject(raw)) {
		const fields: Record<string, SectionSpec> = {};
		for (const [k, v] of Object.entries(raw)) {
			fields[k] = parseSectionSpec(v, `${path}.${k}`);
		}
		return fields;
	}
	throw new Error(`${path}: must be 'text' or an object spec (got: ${describe(raw)})`);
}

function describe(v: unknown): string {
	if (v === null || v === undefined) return "null";
	if (Array.isArray(v)) return "array";
	return typeof v;
}
