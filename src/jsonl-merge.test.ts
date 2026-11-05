import { describe, expect, test } from "bun:test";
import { mergeJsonl } from "./jsonl-merge.ts";

const jsonl = (...rows: object[]) => rows.map((r) => `${JSON.stringify(r)}\n`).join("");
const rows = (content: string) =>
	content
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((l) => JSON.parse(l) as Record<string, unknown>);

const T0 = "2026-01-01T00:00:00.000Z";
const T1 = "2026-01-02T00:00:00.000Z";
const T2 = "2026-01-03T00:00:00.000Z";

describe("mergeJsonl", () => {
	test("each side closing a different sibling merges to one row per id", () => {
		// The pl-d1c9 shape: both branches rewrote the umbrella's blockedBy.
		const base = jsonl(
			{ id: "a", status: "open", updatedAt: T0 },
			{ id: "b", status: "open", updatedAt: T0 },
			{ id: "u", status: "open", blockedBy: ["a", "b"], updatedAt: T0 },
		);
		const ours = jsonl(
			{ id: "a", status: "closed", updatedAt: T1 },
			{ id: "b", status: "open", updatedAt: T0 },
			{ id: "u", status: "open", blockedBy: ["b"], updatedAt: T1 },
		);
		const theirs = jsonl(
			{ id: "a", status: "open", updatedAt: T0 },
			{ id: "b", status: "closed", updatedAt: T2 },
			{ id: "u", status: "open", blockedBy: ["a"], updatedAt: T2 },
		);
		const { content, conflicts } = mergeJsonl(base, ours, theirs);
		expect(conflicts).toEqual([]);
		const out = rows(content);
		expect(out.map((r) => r.id)).toEqual(["a", "b", "u"]);
		expect(out[0]?.status).toBe("closed");
		expect(out[1]?.status).toBe("closed");
		// Neither satisfied blocker is resurrected; the later timestamp wins.
		expect(out[2]?.blockedBy).toEqual([]);
		expect(out[2]?.updatedAt).toBe(T2);
	});

	test("array additions from both sides are kept", () => {
		const base = jsonl({ id: "a", labels: ["x"] });
		const ours = jsonl({ id: "a", labels: ["x", "y"] });
		const theirs = jsonl({ id: "a", labels: ["z", "x"] });
		const { content, conflicts } = mergeJsonl(base, ours, theirs);
		expect(conflicts).toEqual([]);
		expect(rows(content)[0]?.labels).toEqual(["x", "y", "z"]);
	});

	test("rows added on either side are appended; untouched rows stay verbatim", () => {
		const keep = '{"id":"k","title":"keep",  "n":1}';
		const base = `${keep}\n`;
		const ours = `${keep}\n${JSON.stringify({ id: "o" })}\n`;
		const theirs = `${keep}\n${JSON.stringify({ id: "t" })}\n`;
		const { content, conflicts } = mergeJsonl(base, ours, theirs);
		expect(conflicts).toEqual([]);
		expect(content).toBe(`${keep}\n{"id":"o"}\n{"id":"t"}\n`);
	});

	test("different fields of the same row merge, nested objects recursively", () => {
		const base = jsonl({ id: "a", title: "t", extensions: { p: 1, q: 1 } });
		const ours = jsonl({ id: "a", title: "t2", extensions: { p: 2, q: 1 } });
		const theirs = jsonl({ id: "a", title: "t", priority: 1, extensions: { p: 1, q: 2 } });
		const { content, conflicts } = mergeJsonl(base, ours, theirs);
		expect(conflicts).toEqual([]);
		expect(rows(content)[0]).toEqual({
			id: "a",
			title: "t2",
			extensions: { p: 2, q: 2 },
			priority: 1,
		});
	});

	test("a field removed on one side and untouched on the other is removed", () => {
		const base = jsonl({ id: "a", assignee: "me", title: "t" });
		const ours = jsonl({ id: "a", title: "t" });
		const theirs = jsonl({ id: "a", assignee: "me", title: "t" });
		expect(rows(mergeJsonl(base, ours, theirs).content)[0]).toEqual({ id: "a", title: "t" });
	});

	test("a genuine field conflict is reported and left between markers", () => {
		const base = jsonl({ id: "a", title: "base" }, { id: "b", title: "ok" });
		const ours = jsonl({ id: "a", title: "ours" }, { id: "b", title: "ok" });
		const theirs = jsonl({ id: "a", title: "theirs" }, { id: "b", title: "ok" });
		const { content, conflicts } = mergeJsonl(base, ours, theirs);
		expect(conflicts).toEqual(["a.title"]);
		expect(content).toBe(
			[
				"<<<<<<< ours",
				'{"id":"a","title":"ours"}',
				"=======",
				'{"id":"a","title":"theirs"}',
				">>>>>>> theirs",
				'{"id":"b","title":"ok"}',
				"",
			].join("\n"),
		);
	});

	test("the same new id created differently on both sides conflicts", () => {
		const { conflicts } = mergeJsonl(
			"",
			jsonl({ id: "n", title: "one" }),
			jsonl({ id: "n", title: "two" }),
		);
		expect(conflicts).toEqual(["n.title"]);
	});

	test("deleted on one side and modified on the other conflicts", () => {
		const base = jsonl({ id: "a", title: "t" });
		const { content, conflicts } = mergeJsonl(base, "", jsonl({ id: "a", title: "t2" }));
		expect(conflicts).toEqual(["a"]);
		expect(content).toContain("<<<<<<< ours\n=======\n");
	});

	test("deleted on one side and untouched on the other is deleted", () => {
		const base = jsonl({ id: "a" }, { id: "b" });
		const { content } = mergeJsonl(base, jsonl({ id: "b" }), base);
		expect(rows(content).map((r) => r.id)).toEqual(["b"]);
	});

	test("arrays of objects changed on both sides conflict", () => {
		const base = jsonl({ id: "t", steps: [{ title: "1" }] });
		const ours = jsonl({ id: "t", steps: [{ title: "1" }, { title: "2" }] });
		const theirs = jsonl({ id: "t", steps: [{ title: "1" }, { title: "3" }] });
		expect(mergeJsonl(base, ours, theirs).conflicts).toEqual(["t.steps"]);
	});

	test("duplicate rows within a side dedupe last-wins; empty input stays empty", () => {
		const side = jsonl({ id: "a", v: 1 }, { id: "a", v: 2 });
		expect(rows(mergeJsonl("", side, side).content)).toEqual([{ id: "a", v: 2 }]);
		expect(mergeJsonl("", "", "")).toEqual({ content: "", conflicts: [] });
	});

	test("throws on rows that are not seeds JSONL", () => {
		expect(() => mergeJsonl("", "not json\n", "")).toThrow("ours: line 1 is not valid JSON");
		expect(() => mergeJsonl("", "", "[1]\n")).toThrow('theirs: line 1 has no string "id"');
	});
});
