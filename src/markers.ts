export const START_MARKER = "<!-- seeds:start -->";
export const END_MARKER = "<!-- seeds:end -->";

export function hasMarkerSection(content: string): boolean {
	return content.includes(START_MARKER) && content.includes(END_MARKER);
}

export function replaceMarkerSection(content: string, newSection: string): string | null {
	const startIdx = content.indexOf(START_MARKER);
	const endIdx = content.indexOf(END_MARKER);
	if (startIdx === -1 || endIdx === -1) return null;
	// Markers present but out of order (END before START) means the file was
	// hand-edited into a broken state. Refuse rather than emit garbage.
	if (endIdx < startIdx) return null;
	const before = content.slice(0, startIdx);
	const after = content.slice(endIdx + END_MARKER.length);
	return before + wrapInMarkers(newSection) + after;
}

export function wrapInMarkers(section: string): string {
	return `${START_MARKER}\n${section}\n${END_MARKER}`;
}
