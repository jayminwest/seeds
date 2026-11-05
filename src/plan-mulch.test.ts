import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { enrichPriorArt, type PriorArtEntry, typesForSection } from "./plan-mulch.ts";

let tmpDir: string;
let binDir: string;
let originalPath: string | undefined;

// The fake `ml` script reads its own argv and emits the canned response keyed
// by `<domain>/<type>`, letting the test assert the shape of every shell-out
// without depending on a real mulch install. It is written once per file
// (macOS pays a ~120ms first-exec penalty per new executable, seeds-056d);
// each test stages its responses via writeFakeMl.
beforeAll(async () => {
	binDir = await mkdtemp(join(tmpdir(), "seeds-plan-mulch-bin-"));
	const responsesFile = join(binDir, "responses.json");
	const body = `#!/usr/bin/env bun
const fs = require("node:fs");
const responses = JSON.parse(fs.readFileSync("${responsesFile}", "utf8"));
const args = process.argv.slice(2);
// Expected: [--json, query, <domain>, --type, <type>]
const typeIdx = args.indexOf("--type");
const domain = args[2];
const type = typeIdx >= 0 ? args[typeIdx + 1] : "";
const key = domain + "/" + type;
const r = responses[key];
if (!r) {
	process.stderr.write("no canned response for " + key + "\\n");
	process.exit(0);
}
if (r.exit && r.exit !== 0) {
	process.stderr.write("canned exit " + r.exit + "\\n");
	process.exit(r.exit);
}
process.stdout.write(JSON.stringify(r.json ?? {}));
`;
	const scriptPath = join(binDir, "ml");
	await writeFile(scriptPath, body);
	await chmod(scriptPath, 0o755);
});

afterAll(async () => {
	await rm(binDir, { recursive: true, force: true });
});

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "seeds-plan-mulch-"));
	await writeFakeMl({ responses: {} });
	originalPath = process.env.PATH;
	process.env.PATH = `${binDir}:${process.env.PATH ?? ""}`;
});

afterEach(async () => {
	if (originalPath !== undefined) process.env.PATH = originalPath;
	else delete process.env.PATH;
	await rm(tmpDir, { recursive: true, force: true });
});

async function writeFakeMl(opts: {
	responses: Record<string, { json?: unknown; exit?: number }>;
}): Promise<void> {
	await writeFile(join(binDir, "responses.json"), JSON.stringify(opts.responses));
}

function makeRecord(
	over: Partial<{ id: string; type: string; name: string; description: string }>,
): {
	id: string;
	type: string;
	name: string;
	description: string;
} {
	return {
		id: over.id ?? "mx-aaa",
		type: over.type ?? "pattern",
		name: over.name ?? "rec-name",
		description: over.description ?? "rec description body",
	};
}

describe("typesForSection", () => {
	test("explicit hint wins over well-known names", () => {
		expect(typesForSection("approach", "convention")).toEqual(["convention"]);
	});

	test("approach defaults to pattern + decision", () => {
		expect(typesForSection("approach")).toEqual(["pattern", "decision"]);
	});

	test("risks defaults to failure", () => {
		expect(typesForSection("risks")).toEqual(["failure"]);
	});

	test("acceptance defaults to guide", () => {
		expect(typesForSection("acceptance")).toEqual(["guide"]);
	});

	test("unknown section without hint -> empty (skipped)", () => {
		expect(typesForSection("context")).toEqual([]);
	});
});

describe("enrichPriorArt", () => {
	test("populates prior_art across sections with ml stub on PATH", async () => {
		await writeFakeMl({
			responses: {
				"commands/pattern": {
					json: {
						domains: [
							{ domain: "commands", records: [makeRecord({ id: "mx-p1", type: "pattern" })] },
						],
					},
				},
				"commands/decision": {
					json: {
						domains: [
							{ domain: "commands", records: [makeRecord({ id: "mx-d1", type: "decision" })] },
						],
					},
				},
				"commands/failure": {
					json: {
						domains: [
							{ domain: "commands", records: [makeRecord({ id: "mx-f1", type: "failure" })] },
						],
					},
				},
				"commands/guide": {
					json: {
						domains: [
							{ domain: "commands", records: [makeRecord({ id: "mx-g1", type: "guide" })] },
						],
					},
				},
			},
		});

		const result = enrichPriorArt({
			domain: "commands",
			sections: [
				{ name: "context" }, // no enrichment
				{ name: "approach" },
				{ name: "risks" },
				{ name: "acceptance" },
				{ name: "extras", mulchSource: "convention" }, // explicit hint
			],
			cwd: tmpDir,
		});

		const context = result.context ?? [];
		const approach = result.approach ?? [];
		const risks = result.risks ?? [];
		const acceptance = result.acceptance ?? [];
		const extras = result.extras ?? [];
		expect(context).toEqual([]);
		expect(approach.map((e: PriorArtEntry) => e.id)).toEqual(["mx-p1", "mx-d1"]);
		expect(risks.map((e: PriorArtEntry) => e.id)).toEqual(["mx-f1"]);
		expect(acceptance.map((e: PriorArtEntry) => e.id)).toEqual(["mx-g1"]);
		// "extras" had no canned response (commands/convention) → empty.
		expect(extras).toEqual([]);
	});

	test("entry shape matches PLAN_SPEC.md:222-225 + relevance", async () => {
		await writeFakeMl({
			responses: {
				"commands/failure": {
					json: {
						domains: [
							{
								domain: "commands",
								records: [
									makeRecord({
										id: "mx-902",
										type: "failure",
										name: "oauth-refresh-race",
										description: "OAuth token refresh race in concurrent sessions",
									}),
								],
							},
						],
					},
				},
			},
		});
		const result = enrichPriorArt({
			domain: "commands",
			sections: [{ name: "risks" }],
			cwd: tmpDir,
		});
		const risks = result.risks ?? [];
		expect(risks).toHaveLength(1);
		const entry = risks[0];
		expect(entry?.id).toBe("mx-902");
		expect(entry?.type).toBe("failure");
		expect(entry?.summary).toContain("OAuth token refresh race");
		expect(typeof entry?.relevance).toBe("number");
		expect(entry?.relevance).toBeGreaterThan(0);
	});

	test("ml absent -> all sections empty, no throw", () => {
		// Override PATH so even the fake bin isn't found.
		const saved = process.env.PATH;
		process.env.PATH = "/nonexistent-bin-only";
		try {
			const result = enrichPriorArt({
				domain: "commands",
				sections: [{ name: "approach" }, { name: "risks" }, { name: "acceptance" }],
				cwd: tmpDir,
			});
			expect(result.approach ?? []).toEqual([]);
			expect(result.risks ?? []).toEqual([]);
			expect(result.acceptance ?? []).toEqual([]);
		} finally {
			process.env.PATH = saved;
		}
	});

	test("non-zero ml query exit for one section -> that section empty, others populated", async () => {
		await writeFakeMl({
			responses: {
				"commands/pattern": { exit: 1 },
				"commands/decision": { exit: 1 },
				"commands/failure": {
					json: {
						domains: [
							{ domain: "commands", records: [makeRecord({ id: "mx-f1", type: "failure" })] },
						],
					},
				},
			},
		});
		const result = enrichPriorArt({
			domain: "commands",
			sections: [{ name: "approach" }, { name: "risks" }],
			cwd: tmpDir,
		});
		expect(result.approach ?? []).toEqual([]);
		expect((result.risks ?? []).map((e: PriorArtEntry) => e.id)).toEqual(["mx-f1"]);
	});

	test("null domain -> empty arrays for every section, no shell-out", () => {
		// No fake ml needed: should not be invoked when domain is null.
		const result = enrichPriorArt({
			domain: null,
			sections: [{ name: "approach" }, { name: "risks" }, { name: "acceptance" }],
			cwd: tmpDir,
		});
		expect(result.approach ?? []).toEqual([]);
		expect(result.risks ?? []).toEqual([]);
		expect(result.acceptance ?? []).toEqual([]);
	});

	test("malformed ml output -> section silently skipped", async () => {
		await writeFakeMl({
			responses: {
				"commands/failure": { json: "not an object" },
			},
		});
		const result = enrichPriorArt({
			domain: "commands",
			sections: [{ name: "risks" }],
			cwd: tmpDir,
		});
		expect(result.risks ?? []).toEqual([]);
	});

	test("caps to top 5 entries per section", async () => {
		const records = Array.from({ length: 10 }, (_, i) =>
			makeRecord({ id: `mx-r${i}`, type: "failure" }),
		);
		await writeFakeMl({
			responses: {
				"commands/failure": {
					json: { domains: [{ domain: "commands", records }] },
				},
			},
		});
		const result = enrichPriorArt({
			domain: "commands",
			sections: [{ name: "risks" }],
			cwd: tmpDir,
		});
		const risks = result.risks ?? [];
		expect(risks).toHaveLength(5);
		expect(risks[0]?.id).toBe("mx-r0");
		expect(risks[4]?.id).toBe("mx-r4");
	});

	test("relevance decays with rank (top entry > later entry)", async () => {
		const records = Array.from({ length: 3 }, (_, i) =>
			makeRecord({ id: `mx-r${i}`, type: "failure" }),
		);
		await writeFakeMl({
			responses: {
				"commands/failure": {
					json: { domains: [{ domain: "commands", records }] },
				},
			},
		});
		const result = enrichPriorArt({
			domain: "commands",
			sections: [{ name: "risks" }],
			cwd: tmpDir,
		});
		const r = result.risks ?? [];
		expect(r).toHaveLength(3);
		expect((r[0]?.relevance ?? 0) > (r[1]?.relevance ?? 0)).toBe(true);
		expect((r[1]?.relevance ?? 0) > (r[2]?.relevance ?? 0)).toBe(true);
	});
});
