// sd merge-driver: git merge driver for .seeds/*.jsonl (registered by `sd init`
// as merge.seeds-jsonl.driver = "sd merge-driver %O %A %B %P").
//
// Git passes the ancestor (%O), ours (%A) and theirs (%B) as temp files and
// reads the result back from %A. Exit 0 = clean merge; non-zero = conflict,
// with the conflicting rows left between markers in %A for a human.

import { readFileSync, writeFileSync } from "node:fs";
import type { Command } from "commander";
import { mergeJsonl } from "../jsonl-merge.ts";

export async function run(args: string[]): Promise<void> {
	const [basePath, oursPath, theirsPath, label = oursPath] = args;
	if (!basePath || !oursPath || !theirsPath) {
		throw new Error("Usage: sd merge-driver <ancestor> <ours> <theirs> [path]");
	}
	const read = (p: string) => readFileSync(p, "utf8");
	let result: ReturnType<typeof mergeJsonl>;
	try {
		result = mergeJsonl(read(basePath), read(oursPath), read(theirsPath));
	} catch (err: unknown) {
		// Unparsable input: leave %A untouched and let git report the conflict.
		const msg = err instanceof Error ? err.message : String(err);
		console.error(`sd merge-driver: ${label}: cannot merge (${msg})`);
		process.exitCode = 1;
		return;
	}
	writeFileSync(oursPath, result.content);
	if (result.conflicts.length > 0) {
		console.error(
			`sd merge-driver: ${label}: ${result.conflicts.length} conflicting field(s): ${result.conflicts.join(", ")}`,
		);
		process.exitCode = 1;
	}
}

export function register(program: Command): void {
	program
		.command("merge-driver <ancestor> <ours> <theirs> [path]")
		.description("Git merge driver for .seeds/*.jsonl: 3-way merge by row id (used by git)")
		.action(async (ancestor: string, ours: string, theirs: string, path?: string) => {
			await run(path ? [ancestor, ours, theirs, path] : [ancestor, ours, theirs]);
		});
}
