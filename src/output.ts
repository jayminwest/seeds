import chalk from "chalk";
import { stripAnsi } from "./format.ts";
import type { Issue } from "./types.ts";
import { PRIORITY_LABELS } from "./types.ts";

// Forest palette
export const brand = chalk.rgb(124, 179, 66);
export const accent = chalk.rgb(255, 183, 77);
export const muted = chalk.rgb(120, 120, 110);

let _quiet = false;

export function setQuiet(v: boolean): void {
	_quiet = v;
}

function isEpipe(err: unknown): boolean {
	return typeof err === "object" && err !== null && (err as NodeJS.ErrnoException).code === "EPIPE";
}

// Write to stdout with backpressure, exiting cleanly when the reader closes
// the pipe early (the common `sd ... --json | head` idiom, or any consumer
// that exits before draining).
//
// We write through the Node stream (process.stdout) rather than a single
// `Bun.write(Bun.stdout, text)`: when the payload exceeds the OS pipe buffer
// (~64KB) and the reader is slow but stays OPEN (`| cat`, `| grep`, `| wc`),
// the one-shot Bun.write busy-spins at 100% CPU on Linux and never exits
// (seeds-18dc) — no EPIPE is raised because the reader hasn't closed.
// stream.write() returns false when the kernel buffer is full; awaiting
// 'drain' yields instead of spinning. The process-level "error" EPIPE handler
// in index.ts covers the early-close case (seeds-3024) since this path now
// flows through process.stdout; the local isEpipe guard is a belt-and-braces
// exit-0 for the write callback. A downstream reader hanging up is not an sd
// failure.
export async function writeStdout(text: string): Promise<void> {
	const stream = process.stdout;
	await new Promise<void>((resolve, reject) => {
		const flushed = stream.write(text, (err) => {
			if (err) {
				if (isEpipe(err)) process.exit(0);
				reject(err);
			}
		});
		if (flushed) {
			resolve();
		} else {
			stream.once("drain", resolve);
		}
	});
}

export async function outputJson(data: unknown): Promise<void> {
	await writeStdout(`${JSON.stringify(data, null, 2)}\n`);
}

export function printSuccess(msg: string): void {
	if (_quiet) return;
	console.log(`${brand("✓")} ${brand(msg)}`);
}

export function printError(msg: string): void {
	console.error(`${chalk.red("✗")} ${msg}`);
}

export function printWarning(msg: string): void {
	if (_quiet) return;
	console.error(`${chalk.yellow("!")} ${msg}`);
}

// An issue is *effectively* blocked when at least one entry in `blockedBy`
// references a still-open issue. When `closedBlockerIds` is omitted, fall back
// to the legacy length-based heuristic for callers that haven't threaded the
// set through yet.
function isEffectivelyBlocked(issue: Issue, closedBlockerIds?: Set<string>): boolean {
	const blockers = issue.blockedBy ?? [];
	if (blockers.length === 0) return false;
	if (!closedBlockerIds) return true;
	return blockers.some((bid) => !closedBlockerIds.has(bid));
}

export function formatIssueOneLine(issue: Issue, closedBlockerIds?: Set<string>): string {
	const isBlocked = isEffectivelyBlocked(issue, closedBlockerIds);
	const statusIcon =
		issue.status === "closed"
			? muted("x")
			: issue.status === "in_progress"
				? chalk.cyan(">")
				: isBlocked
					? chalk.yellow("!")
					: brand("-");
	const priorityLabel = PRIORITY_LABELS[issue.priority] ?? String(issue.priority);
	const assignee = issue.assignee ? ` · ${muted(`@${issue.assignee}`)}` : "";
	const blocked = isBlocked ? ` ${chalk.yellow("[blocked]")}` : "";
	const labelStr = issue.labels?.length ? ` ${muted(`{${issue.labels.join(", ")}}`)}` : "";
	return `${statusIcon} ${accent.bold(issue.id)} · ${issue.title}   ${muted(`[${priorityLabel} · ${issue.type}]`)}${assignee}${blocked}${labelStr}`;
}

export function formatIssueOneLineCompact(issue: Issue, closedBlockerIds?: Set<string>): string {
	const priorityLabel = PRIORITY_LABELS[issue.priority] ?? String(issue.priority);
	const isBlocked = isEffectivelyBlocked(issue, closedBlockerIds);
	const status = isBlocked ? "blocked" : issue.status;
	return `${issue.id} ${priorityLabel} ${status} ${issue.title}`;
}

export function printIssueOneLine(
	issue: Issue,
	closedBlockerIds?: Set<string>,
	suffix?: string,
): void {
	if (_quiet) return;
	const base = formatIssueOneLine(issue, closedBlockerIds);
	console.log(suffix ? `${base}${suffix}` : base);
}

// Render Issue.extensions as a single "Extensions: key=value ..." line.
// Each value is JSON-encoded so the rendering round-trips unambiguously
// (strings stay quoted; objects/arrays/null print as JSON literals).
// Returns null when extensions is missing or has no own keys.
function formatExtensionsLine(ext: Record<string, unknown> | undefined): string | null {
	if (!ext) return null;
	const keys = Object.keys(ext);
	if (keys.length === 0) return null;
	const pairs = keys.map((k) => `${accent(k)}=${muted(JSON.stringify(ext[k]))}`);
	return `Extensions: ${pairs.join(" ")}`;
}

// Render the non-blocking links: discoveredFrom provenance and roots intent.
function formatLinkLines(issue: Issue): string[] {
	const lines: string[] = [];
	if (issue.discoveredFrom) lines.push(`From:     ${accent(issue.discoveredFrom)}`);
	if (issue.intent) {
		const ids = Array.isArray(issue.intent) ? issue.intent : [issue.intent];
		lines.push(`Intent:   ${ids.map((id) => accent(id)).join(", ")}`);
	}
	return lines;
}

export function formatIssueFull(issue: Issue): string {
	const statusColor =
		issue.status === "closed" ? muted : issue.status === "in_progress" ? chalk.cyan : brand;
	const priorityLabel = PRIORITY_LABELS[issue.priority] ?? String(issue.priority);

	const lines: string[] = [];
	lines.push(`${accent.bold(issue.id)}  ${statusColor(issue.status)}`);
	lines.push(`Title:    ${issue.title}`);
	lines.push(`Type:     ${muted(issue.type)}   Priority: ${muted(priorityLabel)}`);
	if (issue.assignee) lines.push(`Assignee: ${issue.assignee}`);
	if (issue.labels?.length)
		lines.push(`Labels:   ${issue.labels.map((l) => accent(l)).join(", ")}`);
	lines.push(...formatLinkLines(issue));
	const extLine = formatExtensionsLine(issue.extensions);
	if (extLine) lines.push(extLine);
	if (issue.description) lines.push(`\n${issue.description}`);
	if (issue.blockedBy?.length)
		lines.push(`Blocked by: ${issue.blockedBy.map((id) => accent(id)).join(", ")}`);
	if (issue.blocks?.length)
		lines.push(`Blocks:     ${issue.blocks.map((id) => accent(id)).join(", ")}`);
	if (issue.convoy) lines.push(`Convoy:   ${muted(issue.convoy)}`);
	if (issue.closeReason) lines.push(`Reason:   ${issue.closeReason}`);
	lines.push(`Created:  ${muted(issue.createdAt)}`);
	lines.push(`Updated:  ${muted(issue.updatedAt)}`);
	if (issue.closedAt) lines.push(`Closed:   ${muted(issue.closedAt)}`);
	return lines.join("\n");
}

export function printIssueFull(issue: Issue): void {
	if (_quiet) return;
	console.log(formatIssueFull(issue));
}

export function plain(s: string): string {
	return stripAnsi(s);
}
