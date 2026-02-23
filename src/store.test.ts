import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	appendIssue,
	appendTemplate,
	findSeedsDir,
	readIssues,
	readTemplates,
	writeIssues,
	writeTemplates,
} from "./store.ts";
import type { Issue, Template } from "./types.ts";

async function makeTempDir(): Promise<string> {
	return await mkdtemp(join(tmpdir(), "seeds-test-"));
}

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: "test-a1b2",
		title: "Test issue",
		status: "open",
		type: "task",
		priority: 2,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...overrides,
	};
}

function makeTemplate(overrides: Partial<Template> = {}): Template {
	return {
		id: "tpl-c3d4",
		name: "Test template",
		steps: [{ title: "Step 1", type: "task", priority: 2 }],
		...overrides,
	};
}

// --- readIssues ---

describe("readIssues", () => {
	test("returns empty array for non-existent file", async () => {
		const dir = await makeTempDir();
		try {
			const issues = await readIssues(dir);
			expect(issues).toEqual([]);
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	test("reads a single issue from file", async () => {
		const dir = await makeTempDir();
		try {
			const issue = makeIssue();
			await Bun.write(join(dir, "issues.jsonl"), `${JSON.stringify(issue)}\n`);
			const issues = await readIssues(dir);
			expect(issues).toHaveLength(1);
			expect(issues[0]?.id).toBe("test-a1b2");
			expect(issues[0]?.title).toBe("Test issue");
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	test("reads multiple distinct issues", async () => {
		const dir = await makeTempDir();
		try {
			const i1 = makeIssue({ id: "test-0001", title: "First" });
			const i2 = makeIssue({ id: "test-0002", title: "Second" });
			await Bun.write(join(dir, "issues.jsonl"), `${JSON.stringify(i1)}\n${JSON.stringify(i2)}\n`);
			const issues = await readIssues(dir);
			expect(issues).toHaveLength(2);
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	test("deduplicates: last occurrence wins", async () => {
		const dir = await makeTempDir();
		try {
			const v1 = makeIssue({ title: "First version" });
			const v2 = makeIssue({ title: "Second version" });
			await Bun.write(join(dir, "issues.jsonl"), `${JSON.stringify(v1)}\n${JSON.stringify(v2)}\n`);
			const issues = await readIssues(dir);
			expect(issues).toHaveLength(1);
			expect(issues[0]?.title).toBe("Second version");
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	test("skips blank lines", async () => {
		const dir = await makeTempDir();
		try {
			const issue = makeIssue();
			await Bun.write(join(dir, "issues.jsonl"), `\n${JSON.stringify(issue)}\n\n`);
			const issues = await readIssues(dir);
			expect(issues).toHaveLength(1);
		} finally {
			await rm(dir, { recursive: true });
		}
	});
});

// --- appendIssue ---

describe("appendIssue", () => {
	test("creates file and appends issue", async () => {
		const dir = await makeTempDir();
		try {
			const issue = makeIssue();
			await appendIssue(dir, issue);
			const issues = await readIssues(dir);
			expect(issues).toHaveLength(1);
			expect(issues[0]?.id).toBe("test-a1b2");
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	test("appends to existing file", async () => {
		const dir = await makeTempDir();
		try {
			const i1 = makeIssue({ id: "test-0001" });
			const i2 = makeIssue({ id: "test-0002" });
			await appendIssue(dir, i1);
			await appendIssue(dir, i2);
			const issues = await readIssues(dir);
			expect(issues).toHaveLength(2);
		} finally {
			await rm(dir, { recursive: true });
		}
	});
});

// --- writeIssues ---

describe("writeIssues", () => {
	test("atomically rewrites all issues", async () => {
		const dir = await makeTempDir();
		try {
			const i1 = makeIssue({ id: "test-0001", title: "Issue 1" });
			const i2 = makeIssue({ id: "test-0002", title: "Issue 2" });
			await appendIssue(dir, i1);
			await appendIssue(dir, i2);

			// Update i1
			const updated = { ...i1, title: "Updated Issue 1" };
			const all = await readIssues(dir);
			const newAll = all.map((i) => (i.id === "test-0001" ? updated : i));
			await writeIssues(dir, newAll);

			const result = await readIssues(dir);
			expect(result).toHaveLength(2);
			const found = result.find((i) => i.id === "test-0001");
			expect(found?.title).toBe("Updated Issue 1");
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	test("write empty array produces empty file that reads back empty", async () => {
		const dir = await makeTempDir();
		try {
			const issue = makeIssue();
			await appendIssue(dir, issue);
			await writeIssues(dir, []);
			const issues = await readIssues(dir);
			expect(issues).toHaveLength(0);
		} finally {
			await rm(dir, { recursive: true });
		}
	});
});

// --- Templates ---

describe("readTemplates + appendTemplate + writeTemplates", () => {
	test("returns empty array for non-existent templates file", async () => {
		const dir = await makeTempDir();
		try {
			const templates = await readTemplates(dir);
			expect(templates).toEqual([]);
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	test("appends and reads template", async () => {
		const dir = await makeTempDir();
		try {
			const tpl = makeTemplate();
			await appendTemplate(dir, tpl);
			const templates = await readTemplates(dir);
			expect(templates).toHaveLength(1);
			expect(templates[0]?.id).toBe("tpl-c3d4");
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	test("deduplicates templates: last occurrence wins", async () => {
		const dir = await makeTempDir();
		try {
			const t1 = makeTemplate({ name: "First" });
			const t2 = makeTemplate({ name: "Second" });
			await Bun.write(
				join(dir, "templates.jsonl"),
				`${JSON.stringify(t1)}\n${JSON.stringify(t2)}\n`,
			);
			const templates = await readTemplates(dir);
			expect(templates).toHaveLength(1);
			expect(templates[0]?.name).toBe("Second");
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	test("writeTemplates atomically rewrites", async () => {
		const dir = await makeTempDir();
		try {
			const t1 = makeTemplate({ id: "tpl-0001", name: "Template 1" });
			const t2 = makeTemplate({ id: "tpl-0002", name: "Template 2" });
			await appendTemplate(dir, t1);
			await appendTemplate(dir, t2);

			const updated = { ...t1, name: "Updated Template 1" };
			const all = await readTemplates(dir);
			const newAll = all.map((t) => (t.id === "tpl-0001" ? updated : t));
			await writeTemplates(dir, newAll);

			const result = await readTemplates(dir);
			expect(result).toHaveLength(2);
			const found = result.find((t) => t.id === "tpl-0001");
			expect(found?.name).toBe("Updated Template 1");
		} finally {
			await rm(dir, { recursive: true });
		}
	});
});

// --- findSeedsDir ---

describe("findSeedsDir", () => {
	test("finds .seeds in the given directory", async () => {
		const dir = await makeTempDir();
		try {
			const seedsDir = join(dir, ".seeds");
			await Bun.write(join(seedsDir, "config.yaml"), "project: test\n");
			const found = findSeedsDir(dir);
			expect(found).toBe(seedsDir);
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	test("finds .seeds in parent directory", async () => {
		const dir = await makeTempDir();
		try {
			const seedsDir = join(dir, ".seeds");
			await Bun.write(join(seedsDir, "config.yaml"), "project: test\n");
			const subDir = join(dir, "subdir", "deeper");
			await Bun.write(join(subDir, ".gitkeep"), "");
			const found = findSeedsDir(subDir);
			expect(found).toBe(seedsDir);
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	test("returns null when .seeds not found", async () => {
		const found = findSeedsDir("/tmp/definitely-does-not-exist-seeds-test");
		expect(found).toBeNull();
	});
});
