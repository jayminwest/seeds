/**
 * Output helpers for JSON + human-readable output.
 * Respects NO_COLOR environment variable and non-TTY detection.
 */

const NO_COLOR =
	process.env.NO_COLOR !== undefined || process.env.TERM === "dumb" || !process.stdout.isTTY;

export function color(text: string, code: number): string {
	if (NO_COLOR) return text;
	return `\x1b[${code}m${text}\x1b[0m`;
}

export const bold = (s: string): string => color(s, 1);
export const dim = (s: string): string => color(s, 2);
export const red = (s: string): string => color(s, 31);
export const green = (s: string): string => color(s, 32);
export const yellow = (s: string): string => color(s, 33);
export const blue = (s: string): string => color(s, 34);
export const cyan = (s: string): string => color(s, 36);
export const magenta = (s: string): string => color(s, 35);

// --- JSON output ---

type JsonResult = Record<string, unknown>;

export function printJson(data: JsonResult): void {
	console.log(JSON.stringify(data, null, 2));
}

export function jsonSuccess(command: string, extra?: Record<string, unknown>): JsonResult {
	return { success: true, command, ...extra };
}

export function jsonError(command: string, error: string): JsonResult {
	return { success: false, command, error };
}

export function printSuccess(command: string, extra?: Record<string, unknown>): void {
	printJson(jsonSuccess(command, extra));
}

export function printError(command: string, error: string): void {
	process.stderr.write(`${JSON.stringify(jsonError(command, error), null, 2)}\n`);
}

// --- Human output helpers ---

export function hr(): string {
	return dim("─".repeat(60));
}

/** Format a priority number as a colored label */
export function formatPriority(priority: number): string {
	const labels: Record<number, string> = {
		0: red("P0 Critical"),
		1: yellow("P1 High"),
		2: blue("P2 Medium"),
		3: dim("P3 Low"),
		4: dim("P4 Backlog"),
	};
	return labels[priority] ?? `P${priority}`;
}

/** Format a status as a colored label */
export function formatStatus(status: string): string {
	switch (status) {
		case "open":
			return green("open");
		case "in_progress":
			return yellow("in_progress");
		case "closed":
			return dim("closed");
		default:
			return status;
	}
}
