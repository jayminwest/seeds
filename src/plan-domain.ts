import type { Issue } from "./types.ts";

// Soft-coupling helper: infers the mulch domain to query for a given seed.
// PLAN_SPEC.md:344-352. Returns null when no signal matches or ml is absent —
// callers must treat null as "skip mulch enrichment", not as an error.

export interface InferDomainOptions {
	seed: Issue;
	explicitDomain?: string;
	cwd?: string;
}

type DomainSource = "explicit" | "labels" | "files" | "none";

export interface InferDomainResult {
	domain: string | null;
	source: DomainSource;
}

export function inferDomain(opts: InferDomainOptions): InferDomainResult {
	if (opts.explicitDomain && opts.explicitDomain.length > 0) {
		return { domain: opts.explicitDomain, source: "explicit" };
	}

	const cwd = opts.cwd ?? process.cwd();

	// Pass PATH explicitly: Bun.which resolves against a snapshot taken at
	// process start otherwise, which makes the helper untestable when callers
	// mutate process.env.PATH (e.g. tests prepending a fake-ml bin/).
	const ml = Bun.which("ml", { PATH: process.env.PATH });
	if (!ml) return { domain: null, source: "none" };

	const domains = listMulchDomains(ml, cwd);
	if (!domains || domains.length === 0) return { domain: null, source: "none" };
	const domainSet = new Set(domains);

	for (const label of opts.seed.labels ?? []) {
		if (domainSet.has(label)) {
			return { domain: label, source: "labels" };
		}
	}

	const candidates = collectFileCandidates(opts.seed.description ?? "", cwd);
	for (const path of candidates) {
		for (const seg of path.split("/")) {
			if (domainSet.has(seg)) {
				return { domain: seg, source: "files" };
			}
		}
	}

	return { domain: null, source: "none" };
}

function listMulchDomains(ml: string, cwd: string): string[] | null {
	try {
		const result = Bun.spawnSync([ml, "--json", "status"], {
			cwd,
			stdout: "pipe",
			stderr: "pipe",
		});
		if ((result.exitCode ?? 0) !== 0) return null;
		const stdout = new TextDecoder().decode(result.stdout);
		const parsed = JSON.parse(stdout) as unknown;
		if (!parsed || typeof parsed !== "object") return null;
		const domainsRaw = (parsed as { domains?: unknown }).domains;
		if (!Array.isArray(domainsRaw)) return null;
		const out: string[] = [];
		for (const entry of domainsRaw) {
			if (
				entry &&
				typeof entry === "object" &&
				typeof (entry as { domain?: unknown }).domain === "string"
			) {
				out.push((entry as { domain: string }).domain);
			}
		}
		return out;
	} catch {
		return null;
	}
}

// Find file paths to map to domains. Combines two sources:
// 1. Path-like tokens in the seed description (e.g. "src/commands/plan.ts").
// 2. Files currently changed in the working tree (`git diff --name-only`),
//    intersected with the description references — this prefers files the
//    user is actively working on, which best signal the right domain.
// Falls back to all description references if no diff intersection exists.
function collectFileCandidates(description: string, cwd: string): string[] {
	const refs = extractPathRefs(description);
	if (refs.length === 0) return [];

	const changed = gitChangedFiles(cwd);
	if (changed && changed.length > 0) {
		const changedSet = new Set(changed);
		const intersect = refs.filter((r) => changedSet.has(r));
		if (intersect.length > 0) return intersect;
	}
	return refs;
}

// Match path-shaped tokens: at least one slash, ending in .ext, no spaces.
// Avoids false positives like "v1.0" or bare filenames without directory anchors.
const PATH_REGEX = /[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+\.[A-Za-z0-9]+/g;

function extractPathRefs(text: string): string[] {
	if (!text) return [];
	const out: string[] = [];
	const seen = new Set<string>();
	const matches = text.match(PATH_REGEX);
	if (!matches) return [];
	for (const m of matches) {
		const cleaned = m.replace(/[.,;:)\]]+$/, "");
		if (!seen.has(cleaned)) {
			seen.add(cleaned);
			out.push(cleaned);
		}
	}
	return out;
}

function gitChangedFiles(cwd: string): string[] | null {
	try {
		const result = Bun.spawnSync(["git", "diff", "--name-only", "HEAD"], {
			cwd,
			stdout: "pipe",
			stderr: "pipe",
		});
		if ((result.exitCode ?? 0) !== 0) return null;
		const stdout = new TextDecoder().decode(result.stdout);
		return stdout
			.split("\n")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
	} catch {
		return null;
	}
}
