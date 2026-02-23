/**
 * Minimal YAML parser for flat key-value format.
 * Only handles: key: value (string values, no nesting or arrays).
 */
export function parseYaml(content: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const colonIdx = trimmed.indexOf(":");
		if (colonIdx === -1) continue;
		const key = trimmed.slice(0, colonIdx).trim();
		const raw = trimmed.slice(colonIdx + 1).trim();
		if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
			result[key] = raw.slice(1, -1);
		} else {
			result[key] = raw;
		}
	}
	return result;
}

export function stringifyYaml(data: Record<string, string>): string {
	return `${Object.entries(data)
		.map(([k, v]) => `${k}: "${v}"`)
		.join("\n")}\n`;
}
