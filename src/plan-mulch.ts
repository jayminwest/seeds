// Per-section prior_art enrichment via `ml query` shell-out.
// PLAN_SPEC.md:344-352. Soft coupling: any failure (ml absent, query failure,
// malformed output) produces empty prior_art arrays — never throws, never logs
// to stderr.

export interface PriorArtEntry {
	id: string;
	type: string;
	summary: string;
	relevance: number;
}

interface SectionRequest {
	name: string;
	mulchSource?: string;
}

const PRIOR_ART_LIMIT = 5;

// PLAN_SPEC.md:349 — well-known section names map to record types when no
// `mulch_source:` hint is present on the section spec.
const WELL_KNOWN_SECTION_TYPES: Record<string, string[]> = {
	approach: ["pattern", "decision"],
	risks: ["failure"],
	acceptance: ["guide"],
};

export function typesForSection(name: string, hint?: string): string[] {
	if (hint && hint.length > 0) return [hint];
	return WELL_KNOWN_SECTION_TYPES[name] ?? [];
}

export interface EnrichOptions {
	domain: string | null;
	sections: SectionRequest[];
	cwd?: string;
}

// Returns prior_art entries keyed by section name. Sections that do not opt
// into mulch enrichment still appear in the map with an empty array, so the
// caller can do a flat lookup without checking presence.
export function enrichPriorArt(opts: EnrichOptions): Record<string, PriorArtEntry[]> {
	const out: Record<string, PriorArtEntry[]> = {};
	for (const s of opts.sections) out[s.name] = [];

	if (!opts.domain) return out;

	const cwd = opts.cwd ?? process.cwd();
	const ml = Bun.which("ml", { PATH: process.env.PATH });
	if (!ml) return out;

	for (const s of opts.sections) {
		const types = typesForSection(s.name, s.mulchSource);
		if (types.length === 0) continue;
		const collected: PriorArtEntry[] = [];
		for (const t of types) {
			const entries = queryMulchRecords({ ml, domain: opts.domain, type: t, cwd });
			collected.push(...entries);
		}
		out[s.name] = collected.slice(0, PRIOR_ART_LIMIT);
	}
	return out;
}

interface QueryArgs {
	ml: string;
	domain: string;
	type: string;
	cwd: string;
}

function queryMulchRecords(args: QueryArgs): PriorArtEntry[] {
	try {
		// The actual mulch CLI takes domain positionally and lifts --json to the
		// top-level (`ml --json query <domain>`), not `ml query --domain` as the
		// spec text describes. Parse what mulch actually emits.
		const result = Bun.spawnSync([args.ml, "--json", "query", args.domain, "--type", args.type], {
			cwd: args.cwd,
			stdout: "pipe",
			stderr: "pipe",
		});
		if ((result.exitCode ?? 0) !== 0) return [];
		const stdout = new TextDecoder().decode(result.stdout);
		return parseQueryOutput(stdout, args.type);
	} catch {
		return [];
	}
}

function parseQueryOutput(stdout: string, type: string): PriorArtEntry[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(stdout);
	} catch {
		return [];
	}
	if (!parsed || typeof parsed !== "object") return [];
	const domains = (parsed as { domains?: unknown }).domains;
	if (!Array.isArray(domains)) return [];

	const records: unknown[] = [];
	for (const d of domains) {
		if (!d || typeof d !== "object") continue;
		const r = (d as { records?: unknown }).records;
		if (Array.isArray(r)) records.push(...r);
	}

	const top = records.slice(0, PRIOR_ART_LIMIT);
	const out: PriorArtEntry[] = [];
	for (let i = 0; i < top.length; i++) {
		const rec = top[i];
		if (!rec || typeof rec !== "object") continue;
		const id = stringField(rec, "id");
		if (!id) continue;
		const recType = stringField(rec, "type") ?? type;
		const summary = summarize(rec);
		// Relevance synthesized from rank: ml's CLI surface doesn't expose a
		// score, so we rank by emit order (top hit = highest relevance).
		const relevance = Number(((PRIOR_ART_LIMIT - i) / PRIOR_ART_LIMIT).toFixed(2));
		out.push({ id, type: recType, summary, relevance });
	}
	return out;
}

function stringField(rec: object, key: string): string | undefined {
	const v = (rec as Record<string, unknown>)[key];
	return typeof v === "string" && v.length > 0 ? v : undefined;
}

// PLAN_SPEC.md:354-356 — opt-in outbound write. Best-effort: never throws;
// the caller renders `reason` to stderr on `ok: false` but does NOT roll back
// the plan write or change the submit exit code.

export interface RecordDecisionOptions {
	domain: string;
	planId: string;
	title: string;
	approach: string;
	cwd?: string;
}

export interface RecordDecisionResult {
	ok: boolean;
	reason?: string;
	mulchId?: string;
}

export function recordDecision(opts: RecordDecisionOptions): RecordDecisionResult {
	const cwd = opts.cwd ?? process.cwd();
	const ml = Bun.which("ml", { PATH: process.env.PATH });
	if (!ml) {
		return { ok: false, reason: "ml not found on PATH; skipping --record-decision" };
	}
	try {
		// `ml record decision` requires --title in addition to the spec args; pass
		// the seed title so the recorded decision has a meaningful name. --json
		// is appended (not prepended) so existing fixture parsers that key off
		// argv[0] === "record" keep working.
		const result = Bun.spawnSync(
			[
				ml,
				"record",
				opts.domain,
				"--type",
				"decision",
				"--title",
				opts.title,
				"--rationale",
				opts.approach,
				"--evidence-seeds",
				opts.planId,
				"--json",
			],
			{ cwd, stdout: "pipe", stderr: "pipe" },
		);
		if ((result.exitCode ?? 0) !== 0) {
			const stderr = new TextDecoder().decode(result.stderr).trim();
			const detail = stderr ? `: ${stderr.split("\n")[0]}` : "";
			return { ok: false, reason: `ml record failed${detail}` };
		}
		const stdout = new TextDecoder().decode(result.stdout).trim();
		let mulchId: string | undefined;
		if (stdout.length > 0) {
			try {
				const parsed = JSON.parse(stdout) as { record?: { id?: unknown } };
				const id = parsed?.record?.id;
				if (typeof id === "string" && id.length > 0) mulchId = id;
			} catch {
				// Older mulch versions or non-JSON output: still success, just
				// no id to surface.
			}
		}
		return mulchId ? { ok: true, mulchId } : { ok: true };
	} catch (e) {
		return { ok: false, reason: `ml record threw: ${(e as Error).message}` };
	}
}

const SUMMARY_MAX = 240;

function summarize(rec: object): string {
	const name = stringField(rec, "name");
	const desc = stringField(rec, "description");
	const base = name && desc ? `${name}: ${desc}` : (desc ?? name ?? "");
	if (base.length <= SUMMARY_MAX) return base;
	return `${base.slice(0, SUMMARY_MAX - 1).trimEnd()}…`;
}
