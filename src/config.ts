import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Config } from "./types.ts";
import { CONFIG_FILE, SEEDS_DIR_NAME } from "./types.ts";
import { parseYaml, stringifyYaml } from "./yaml.ts";

export async function readConfig(seedsDir: string): Promise<Config> {
	const file = Bun.file(join(seedsDir, CONFIG_FILE));
	const content = await file.text();
	const data = parseYaml(content);
	return {
		project: data.project ?? "seeds",
		version: data.version ?? "1",
	};
}

export async function writeConfig(seedsDir: string, config: Config): Promise<void> {
	const content = stringifyYaml({ project: config.project, version: config.version });
	await Bun.write(join(seedsDir, CONFIG_FILE), content);
}

function gitCommonDir(cwd: string): string | null {
	try {
		const result = Bun.spawnSync(["git", "rev-parse", "--git-common-dir"], {
			cwd,
			stdout: "pipe",
			stderr: "pipe",
		});
		if ((result.exitCode ?? 0) !== 0) return null;
		const raw = new TextDecoder().decode(result.stdout).trim();
		if (!raw) return null;
		return resolve(cwd, raw);
	} catch {
		return null;
	}
}

function resolveWorktreeRoot(candidateSeedsDir: string): string {
	const candidateRoot = dirname(candidateSeedsDir);
	const common = gitCommonDir(candidateRoot);
	if (!common) return candidateSeedsDir;

	// .git/worktrees/<name> → strip to repo root; .git → already main
	const mainRoot = common.endsWith(".git") ? dirname(common) : dirname(dirname(common));

	const mainResolved = resolve(mainRoot);
	if (mainResolved === resolve(candidateRoot)) return candidateSeedsDir;

	const mainSeedsDir = join(mainResolved, SEEDS_DIR_NAME);
	if (existsSync(join(mainSeedsDir, CONFIG_FILE))) {
		return mainSeedsDir;
	}

	return candidateSeedsDir;
}

export function isInsideWorktree(dir?: string): boolean {
	const cwd = dir ?? process.cwd();
	const common = gitCommonDir(cwd);
	if (!common) return false;

	const mainRoot = common.endsWith(".git") ? dirname(common) : dirname(dirname(common));

	return resolve(mainRoot) !== resolve(cwd);
}

export async function findSeedsDir(startDir?: string): Promise<string> {
	let dir = startDir ?? process.cwd();
	while (true) {
		const configPath = join(dir, SEEDS_DIR_NAME, CONFIG_FILE);
		const file = Bun.file(configPath);
		if (await file.exists()) {
			return resolveWorktreeRoot(join(dir, SEEDS_DIR_NAME));
		}
		const parent = dirname(dir);
		if (parent === dir) {
			throw new Error("Not in a seeds project. Run `sd init` first.");
		}
		dir = parent;
	}
}

export function projectRootFromSeedsDir(seedsDir: string): string {
	return dirname(seedsDir);
}
