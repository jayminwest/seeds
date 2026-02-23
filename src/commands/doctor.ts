import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { findSeedsDir, projectRootFromSeedsDir, readConfig } from "../config.ts";
import { c, outputJson } from "../output.ts";
import { issuesPath, readIssues, templatesPath, writeIssues, writeTemplates } from "../store.ts";
import type { Issue, Template } from "../types.ts";
import {
	ISSUES_FILE,
	LOCK_STALE_MS,
	TEMPLATES_FILE,
	VALID_STATUSES,
	VALID_TYPES,
} from "../types.ts";

interface DoctorCheck {
	name: string;
	status: "pass" | "warn" | "fail";
	message: string;
	details: string[];
	fixable: boolean;
}

interface RawLine {
	lineNumber: number;
	text: string;
	parsed?: unknown;
	error?: string;
}

function readRawLines(filePath: string): RawLine[] {
	if (!existsSync(filePath)) return [];
	const content = readFileSync(filePath, "utf8");
	const lines: RawLine[] = [];
	for (const [i, raw] of content.split("\n").entries()) {
		const text = raw.trim();
		if (!text) continue;
		try {
			lines.push({ lineNumber: i + 1, text, parsed: JSON.parse(text) });
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			lines.push({ lineNumber: i + 1, text, error: msg });
		}
	}
	return lines;
}

function checkConfig(seedsDir: string, config: { project: string } | null): DoctorCheck {
	if (!existsSync(seedsDir)) {
		return {
			name: "config",
			status: "fail",
			message: ".seeds/ directory not found",
			details: [],
			fixable: false,
		};
	}
	if (!config) {
		return {
			name: "config",
			status: "fail",
			message: "config.yaml is missing or unparseable",
			details: [],
			fixable: false,
		};
	}
	if (!config.project) {
		return {
			name: "config",
			status: "fail",
			message: "config.yaml missing required 'project' field",
			details: [],
			fixable: false,
		};
	}
	return {
		name: "config",
		status: "pass",
		message: "Config is valid",
		details: [],
		fixable: false,
	};
}

function checkJsonlIntegrity(seedsDir: string): DoctorCheck {
	const details: string[] = [];
	for (const file of [ISSUES_FILE, TEMPLATES_FILE]) {
		const lines = readRawLines(join(seedsDir, file));
		for (const line of lines) {
			if (line.error) {
				details.push(`${file} line ${String(line.lineNumber)}: ${line.error}`);
			}
		}
	}
	if (details.length > 0) {
		return {
			name: "jsonl-integrity",
			status: "fail",
			message: `${String(details.length)} malformed line(s) in JSONL files`,
			details,
			fixable: true,
		};
	}
	return {
		name: "jsonl-integrity",
		status: "pass",
		message: "All JSONL lines parse correctly",
		details: [],
		fixable: false,
	};
}

function checkSchemaValidation(seedsDir: string): DoctorCheck {
	const details: string[] = [];
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Record<string, unknown>;
		const id = typeof issue.id === "string" ? issue.id : `line ${String(line.lineNumber)}`;
		if (!issue.id || typeof issue.id !== "string") {
			details.push(`${id}: missing or invalid 'id'`);
		}
		if (!issue.title || typeof issue.title !== "string") {
			details.push(`${id}: missing or invalid 'title'`);
		}
		if (!issue.createdAt || typeof issue.createdAt !== "string") {
			details.push(`${id}: missing or invalid 'createdAt'`);
		}
		if (!issue.updatedAt || typeof issue.updatedAt !== "string") {
			details.push(`${id}: missing or invalid 'updatedAt'`);
		}
		if (
			typeof issue.status === "string" &&
			!(VALID_STATUSES as readonly string[]).includes(issue.status)
		) {
			details.push(`${id}: invalid status '${issue.status}'`);
		}
		if (
			typeof issue.type === "string" &&
			!(VALID_TYPES as readonly string[]).includes(issue.type)
		) {
			details.push(`${id}: invalid type '${issue.type}'`);
		}
		if (typeof issue.priority === "number" && (issue.priority < 0 || issue.priority > 4)) {
			details.push(`${id}: invalid priority ${String(issue.priority)} (must be 0-4)`);
		}
	}
	if (details.length > 0) {
		return {
			name: "schema-validation",
			status: "fail",
			message: `${String(details.length)} schema violation(s)`,
			details,
			fixable: false,
		};
	}
	return {
		name: "schema-validation",
		status: "pass",
		message: "All issues have valid schema",
		details: [],
		fixable: false,
	};
}

function checkDuplicateIds(seedsDir: string): DoctorCheck {
	const details: string[] = [];
	for (const file of [ISSUES_FILE, TEMPLATES_FILE]) {
		const lines = readRawLines(join(seedsDir, file));
		const counts = new Map<string, number>();
		for (const line of lines) {
			if (!line.parsed) continue;
			const item = line.parsed as { id?: string };
			if (typeof item.id === "string") {
				counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
			}
		}
		for (const [id, count] of counts) {
			if (count > 1) {
				details.push(`${id} appears ${String(count)} times in ${file}`);
			}
		}
	}
	if (details.length > 0) {
		return {
			name: "duplicate-ids",
			status: "warn",
			message: `${String(details.length)} duplicate ID(s) found`,
			details,
			fixable: true,
		};
	}
	return {
		name: "duplicate-ids",
		status: "pass",
		message: "No duplicate IDs",
		details: [],
		fixable: false,
	};
}

function checkReferentialIntegrity(issues: Issue[]): DoctorCheck {
	const ids = new Set(issues.map((i) => i.id));
	const details: string[] = [];
	for (const issue of issues) {
		for (const ref of issue.blockedBy ?? []) {
			if (!ids.has(ref)) {
				details.push(`${issue.id}.blockedBy → ${ref} (not found)`);
			}
		}
		for (const ref of issue.blocks ?? []) {
			if (!ids.has(ref)) {
				details.push(`${issue.id}.blocks → ${ref} (not found)`);
			}
		}
	}
	if (details.length > 0) {
		return {
			name: "referential-integrity",
			status: "warn",
			message: `${String(details.length)} dangling dependency reference(s)`,
			details,
			fixable: true,
		};
	}
	return {
		name: "referential-integrity",
		status: "pass",
		message: "All dependency references are valid",
		details: [],
		fixable: false,
	};
}

function checkBidirectionalConsistency(issues: Issue[]): DoctorCheck {
	const byId = new Map<string, Issue>();
	for (const issue of issues) {
		byId.set(issue.id, issue);
	}
	const details: string[] = [];
	for (const issue of issues) {
		for (const ref of issue.blockedBy ?? []) {
			const target = byId.get(ref);
			if (target && !(target.blocks ?? []).includes(issue.id)) {
				details.push(`${issue.id}.blockedBy has ${ref}, but ${ref}.blocks missing ${issue.id}`);
			}
		}
		for (const ref of issue.blocks ?? []) {
			const target = byId.get(ref);
			if (target && !(target.blockedBy ?? []).includes(issue.id)) {
				details.push(`${issue.id}.blocks has ${ref}, but ${ref}.blockedBy missing ${issue.id}`);
			}
		}
	}
	if (details.length > 0) {
		return {
			name: "bidirectional-consistency",
			status: "warn",
			message: `${String(details.length)} bidirectional mismatch(es)`,
			details,
			fixable: true,
		};
	}
	return {
		name: "bidirectional-consistency",
		status: "pass",
		message: "All dependency links are bidirectional",
		details: [],
		fixable: false,
	};
}

function checkCircularDependencies(issues: Issue[]): DoctorCheck {
	const graph = new Map<string, string[]>();
	for (const issue of issues) {
		graph.set(issue.id, issue.blockedBy ?? []);
	}
	const visited = new Set<string>();
	const inStack = new Set<string>();
	const cycles: string[][] = [];

	function dfs(node: string, path: string[]): void {
		if (inStack.has(node)) {
			const cycleStart = path.indexOf(node);
			if (cycleStart >= 0) {
				cycles.push(path.slice(cycleStart).concat(node));
			}
			return;
		}
		if (visited.has(node)) return;
		visited.add(node);
		inStack.add(node);
		for (const dep of graph.get(node) ?? []) {
			dfs(dep, [...path, node]);
		}
		inStack.delete(node);
	}

	for (const id of graph.keys()) {
		dfs(id, []);
	}

	if (cycles.length > 0) {
		const details = cycles.map((cycle) => cycle.join(" → "));
		return {
			name: "circular-dependencies",
			status: "warn",
			message: `${String(cycles.length)} circular dependency chain(s) found`,
			details,
			fixable: false,
		};
	}
	return {
		name: "circular-dependencies",
		status: "pass",
		message: "No circular dependencies",
		details: [],
		fixable: false,
	};
}

function checkStaleLocks(seedsDir: string): DoctorCheck {
	const details: string[] = [];
	for (const file of [ISSUES_FILE, TEMPLATES_FILE]) {
		const lockPath = join(seedsDir, `${file}.lock`);
		if (existsSync(lockPath)) {
			try {
				const st = statSync(lockPath);
				const age = Date.now() - st.mtimeMs;
				if (age > LOCK_STALE_MS) {
					details.push(`${file}.lock is stale (${String(Math.round(age / 1000))}s old)`);
				} else {
					details.push(
						`${file}.lock exists (${String(Math.round(age / 1000))}s old, may be active)`,
					);
				}
			} catch {
				details.push(`${file}.lock exists but cannot stat`);
			}
		}
	}
	if (details.length > 0) {
		return {
			name: "stale-locks",
			status: "warn",
			message: `${String(details.length)} lock file(s) found`,
			details,
			fixable: true,
		};
	}
	return {
		name: "stale-locks",
		status: "pass",
		message: "No stale lock files",
		details: [],
		fixable: false,
	};
}

function checkGitattributes(seedsDir: string): DoctorCheck {
	const projectRoot = projectRootFromSeedsDir(seedsDir);
	const gitattrsPath = join(projectRoot, ".gitattributes");
	const details: string[] = [];

	if (!existsSync(gitattrsPath)) {
		details.push(".gitattributes file not found");
	} else {
		const content = readFileSync(gitattrsPath, "utf8");
		if (!content.includes(".seeds/issues.jsonl merge=union")) {
			details.push("Missing: .seeds/issues.jsonl merge=union");
		}
		if (!content.includes(".seeds/templates.jsonl merge=union")) {
			details.push("Missing: .seeds/templates.jsonl merge=union");
		}
	}

	if (details.length > 0) {
		return {
			name: "gitattributes",
			status: "warn",
			message: "Missing merge=union gitattributes entries",
			details,
			fixable: true,
		};
	}
	return {
		name: "gitattributes",
		status: "pass",
		message: "Gitattributes configured correctly",
		details: [],
		fixable: false,
	};
}

function applyFixes(seedsDir: string, checks: DoctorCheck[]): string[] {
	const fixed: string[] = [];

	for (const check of checks) {
		if (check.status === "pass" || !check.fixable) continue;

		switch (check.name) {
			case "jsonl-integrity": {
				for (const file of [ISSUES_FILE, TEMPLATES_FILE]) {
					const filePath = join(seedsDir, file);
					if (!existsSync(filePath)) continue;
					const lines = readRawLines(filePath);
					const validLines = lines.filter((l) => !l.error);
					if (validLines.length < lines.length) {
						const content =
							validLines.length > 0 ? `${validLines.map((l) => l.text).join("\n")}\n` : "";
						writeFileSync(filePath, content);
						fixed.push(
							`Removed ${String(lines.length - validLines.length)} malformed line(s) from ${file}`,
						);
					}
				}
				break;
			}
			case "duplicate-ids": {
				// Read, dedup (last wins), and rewrite via store functions
				fixDuplicates(seedsDir, fixed);
				break;
			}
			case "referential-integrity": {
				fixDanglingRefs(seedsDir, fixed);
				break;
			}
			case "bidirectional-consistency": {
				fixBidirectional(seedsDir, fixed);
				break;
			}
			case "stale-locks": {
				for (const file of [ISSUES_FILE, TEMPLATES_FILE]) {
					const lockPath = join(seedsDir, `${file}.lock`);
					if (existsSync(lockPath)) {
						try {
							const st = statSync(lockPath);
							if (Date.now() - st.mtimeMs > LOCK_STALE_MS) {
								unlinkSync(lockPath);
								fixed.push(`Removed stale ${file}.lock`);
							}
						} catch {
							// best-effort
						}
					}
				}
				break;
			}
			case "gitattributes": {
				fixGitattributes(seedsDir, fixed);
				break;
			}
		}
	}
	return fixed;
}

function fixDuplicates(seedsDir: string, fixed: string[]): void {
	// Issues
	const issueLines = readRawLines(join(seedsDir, ISSUES_FILE));
	const issueMap = new Map<string, Issue>();
	for (const line of issueLines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Issue;
		if (typeof issue.id === "string") {
			issueMap.set(issue.id, issue);
		}
	}
	if (issueMap.size < issueLines.filter((l) => l.parsed).length) {
		const content = `${Array.from(issueMap.values())
			.map((i) => JSON.stringify(i))
			.join("\n")}\n`;
		writeFileSync(join(seedsDir, ISSUES_FILE), content);
		fixed.push("Deduplicated issues.jsonl");
	}

	// Templates
	const tplLines = readRawLines(join(seedsDir, TEMPLATES_FILE));
	const tplMap = new Map<string, Template>();
	for (const line of tplLines) {
		if (!line.parsed) continue;
		const tpl = line.parsed as Template;
		if (typeof tpl.id === "string") {
			tplMap.set(tpl.id, tpl);
		}
	}
	if (tplMap.size < tplLines.filter((l) => l.parsed).length) {
		const content = `${Array.from(tplMap.values())
			.map((t) => JSON.stringify(t))
			.join("\n")}\n`;
		writeFileSync(join(seedsDir, TEMPLATES_FILE), content);
		fixed.push("Deduplicated templates.jsonl");
	}
}

function fixDanglingRefs(seedsDir: string, fixed: string[]): void {
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	const issues: Issue[] = [];
	const idMap = new Map<string, Issue>();
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Issue;
		if (typeof issue.id === "string") {
			idMap.set(issue.id, issue);
		}
	}
	// Dedup: last wins
	const deduped = Array.from(idMap.values());
	const ids = new Set(deduped.map((i) => i.id));
	let changed = false;
	for (const issue of deduped) {
		const origBlockedBy = issue.blockedBy?.length ?? 0;
		const origBlocks = issue.blocks?.length ?? 0;
		if (issue.blockedBy) {
			issue.blockedBy = issue.blockedBy.filter((ref) => ids.has(ref));
			if (issue.blockedBy.length === 0) issue.blockedBy = undefined;
		}
		if (issue.blocks) {
			issue.blocks = issue.blocks.filter((ref) => ids.has(ref));
			if (issue.blocks.length === 0) issue.blocks = undefined;
		}
		if (
			(issue.blockedBy?.length ?? 0) !== origBlockedBy ||
			(issue.blocks?.length ?? 0) !== origBlocks
		) {
			changed = true;
		}
		issues.push(issue);
	}
	if (changed) {
		const content = `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`;
		writeFileSync(join(seedsDir, ISSUES_FILE), content);
		fixed.push("Removed dangling dependency references");
	}
}

function fixBidirectional(seedsDir: string, fixed: string[]): void {
	const lines = readRawLines(join(seedsDir, ISSUES_FILE));
	const idMap = new Map<string, Issue>();
	for (const line of lines) {
		if (!line.parsed) continue;
		const issue = line.parsed as Issue;
		if (typeof issue.id === "string") {
			idMap.set(issue.id, issue);
		}
	}
	const issues = Array.from(idMap.values());
	let changed = false;

	for (const issue of issues) {
		for (const ref of issue.blockedBy ?? []) {
			const target = idMap.get(ref);
			if (target && !(target.blocks ?? []).includes(issue.id)) {
				target.blocks = [...(target.blocks ?? []), issue.id];
				changed = true;
			}
		}
		for (const ref of issue.blocks ?? []) {
			const target = idMap.get(ref);
			if (target && !(target.blockedBy ?? []).includes(issue.id)) {
				target.blockedBy = [...(target.blockedBy ?? []), issue.id];
				changed = true;
			}
		}
	}

	if (changed) {
		const content = `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`;
		writeFileSync(join(seedsDir, ISSUES_FILE), content);
		fixed.push("Added missing bidirectional dependency links");
	}
}

function fixGitattributes(seedsDir: string, fixed: string[]): void {
	const projectRoot = projectRootFromSeedsDir(seedsDir);
	const gitattrsPath = join(projectRoot, ".gitattributes");
	const issueEntry = ".seeds/issues.jsonl merge=union";
	const tplEntry = ".seeds/templates.jsonl merge=union";

	if (!existsSync(gitattrsPath)) {
		writeFileSync(gitattrsPath, `${issueEntry}\n${tplEntry}\n`);
		fixed.push("Created .gitattributes with merge=union entries");
		return;
	}

	const content = readFileSync(gitattrsPath, "utf8");
	const missing: string[] = [];
	if (!content.includes(issueEntry)) missing.push(issueEntry);
	if (!content.includes(tplEntry)) missing.push(tplEntry);

	if (missing.length > 0) {
		const suffix = missing.map((e) => `${e}\n`).join("");
		const separator = content.endsWith("\n") ? "" : "\n";
		writeFileSync(gitattrsPath, `${content}${separator}${suffix}`);
		fixed.push("Added missing merge=union entries to .gitattributes");
	}
}

function printCheck(check: DoctorCheck, verbose: boolean): void {
	if (check.status === "pass" && !verbose) return;

	const icon =
		check.status === "pass"
			? `${c.green}✓${c.reset}`
			: check.status === "warn"
				? `${c.yellow}⚠${c.reset}`
				: `${c.red}✗${c.reset}`;

	console.log(`  ${icon} ${check.message}`);
	for (const detail of check.details) {
		console.log(`      ${c.dim}${detail}${c.reset}`);
	}
}

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const fixMode = args.includes("--fix");
	const verbose = args.includes("--verbose");

	const dir = seedsDir ?? (await findSeedsDir());

	// Load config
	let config: { project: string } | null = null;
	try {
		config = await readConfig(dir);
	} catch {
		config = null;
	}

	// Run checks
	const checks: DoctorCheck[] = [];

	const configCheck = checkConfig(dir, config);
	checks.push(configCheck);

	// If config fails, skip remaining checks
	if (configCheck.status === "fail") {
		return reportResults(checks, jsonMode, verbose, fixMode, dir);
	}

	checks.push(checkJsonlIntegrity(dir));
	checks.push(checkSchemaValidation(dir));
	checks.push(checkDuplicateIds(dir));

	// Load deduped issues for dependency checks
	const issues = await readIssues(dir);
	checks.push(checkReferentialIntegrity(issues));
	checks.push(checkBidirectionalConsistency(issues));
	checks.push(checkCircularDependencies(issues));
	checks.push(checkStaleLocks(dir));
	checks.push(checkGitattributes(dir));

	// Apply fixes if requested
	if (fixMode) {
		const fixableFailures = checks.filter((ch) => ch.fixable && ch.status !== "pass");
		if (fixableFailures.length > 0) {
			const fixedItems = applyFixes(dir, checks);

			// Re-run all checks after fixes
			const reChecks: DoctorCheck[] = [];
			let reConfig: { project: string } | null = null;
			try {
				reConfig = await readConfig(dir);
			} catch {
				reConfig = null;
			}
			reChecks.push(checkConfig(dir, reConfig));
			if (reChecks[0]?.status !== "fail") {
				reChecks.push(checkJsonlIntegrity(dir));
				reChecks.push(checkSchemaValidation(dir));
				reChecks.push(checkDuplicateIds(dir));
				const reIssues = await readIssues(dir);
				reChecks.push(checkReferentialIntegrity(reIssues));
				reChecks.push(checkBidirectionalConsistency(reIssues));
				reChecks.push(checkCircularDependencies(reIssues));
				reChecks.push(checkStaleLocks(dir));
				reChecks.push(checkGitattributes(dir));
			}
			return reportResults(reChecks, jsonMode, verbose, fixMode, dir, fixedItems);
		}
	}

	return reportResults(checks, jsonMode, verbose, fixMode, dir);
}

function reportResults(
	checks: DoctorCheck[],
	jsonMode: boolean,
	verbose: boolean,
	fixMode: boolean,
	_seedsDir: string,
	fixedItems?: string[],
): void {
	const summary = {
		pass: checks.filter((ch) => ch.status === "pass").length,
		warn: checks.filter((ch) => ch.status === "warn").length,
		fail: checks.filter((ch) => ch.status === "fail").length,
	};

	if (jsonMode) {
		outputJson({
			success: summary.fail === 0,
			command: "doctor",
			checks: checks.map((ch) => ({
				name: ch.name,
				status: ch.status,
				message: ch.message,
				details: ch.details,
				fixable: ch.fixable,
			})),
			summary,
			...(fixedItems && fixedItems.length > 0 ? { fixed: fixedItems } : {}),
		});
	} else {
		console.log(`\n${c.bold}Seeds Doctor${c.reset}\n`);
		for (const check of checks) {
			printCheck(check, verbose);
		}
		console.log(
			`\n${String(summary.pass)} passed, ${String(summary.warn)} warning(s), ${String(summary.fail)} failure(s)`,
		);
		if (fixedItems && fixedItems.length > 0) {
			console.log(`\n${c.bold}Fixed:${c.reset}`);
			for (const item of fixedItems) {
				console.log(`  ${c.green}✓${c.reset} ${item}`);
			}
		}
	}

	if (summary.fail > 0) {
		process.exit(1);
	}
}
