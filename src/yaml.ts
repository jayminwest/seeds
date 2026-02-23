/**
 * Minimal YAML parser for flat key-value format.
 *
 * Handles:
 *   key: value
 *   key: "quoted value"
 *   key: 'single quoted'
 *   # comments
 *   blank lines
 *
 * Does NOT handle nested objects, arrays, or multiline values.
 * ~50 LOC, zero dependencies.
 */
export function parseYaml(text: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const line of text.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const colonIdx = trimmed.indexOf(":");
		if (colonIdx === -1) continue;
		const key = trimmed.slice(0, colonIdx).trim();
		let value = trimmed.slice(colonIdx + 1).trim();
		// Strip quotes
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		result[key] = value;
	}
	return result;
}

export function stringifyYaml(data: Record<string, string>): string {
	return `${Object.entries(data)
		.map(([k, v]) => {
			// Quote if value contains special YAML characters or leading/trailing whitespace
			const needsQuotes =
				/[:#\[\]{}|>&*!,]/.test(v) || v.includes('"') || v.trim() !== v || v === "";
			const escaped = v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
			const quoted = needsQuotes ? `"${escaped}"` : v;
			return `${k}: ${quoted}`;
		})
		.join("\n")}\n`;
}
