#!/usr/bin/env bun
// Published `sd` / `seeds` entrypoint. Loads the CLI through a dynamic import
// so a checkout without node_modules gets a "run bun install" hint instead of
// Bun's bare "ENOENT while resolving package 'chalk'". Runtime errors inside
// the CLI never reach this catch: src/index.ts handles them in main().catch.
import { dirname } from "node:path";

try {
	await import("./index.ts");
} catch (err) {
	// Bun's ResolveMessage is not an Error instance, so read fields structurally.
	const { code, message = err } = (err ?? {}) as { code?: unknown; message?: unknown };
	if (code !== "ERR_MODULE_NOT_FOUND" && !String(message).includes("resolving package")) throw err;
	const root = dirname(import.meta.dir);
	process.stderr.write(
		`seeds: missing dependency (${message}).\nRun 'bun install' in ${root} and retry.\n`,
	);
	process.exitCode = 1;
}
