// Shared title validation for every surface that writes an issue or template
// step title. Titles render on one line in list/ready/tree output, so control
// characters (newlines, tabs, ESC, ...) are rejected rather than stored.

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control chars is the point
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/** Trim `raw` and reject empty or multi-line/control-character titles. */
export function normalizeTitle(raw: string, flag = "--title"): string {
	const title = raw.trim();
	if (title === "") throw new Error(`${flag} must not be empty`);
	if (CONTROL_CHARS.test(title)) {
		throw new Error(`${flag} must be a single line (no newlines or control characters)`);
	}
	return title;
}
