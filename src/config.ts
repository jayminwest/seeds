import { dirname, join } from "node:path";
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

export async function findSeedsDir(startDir?: string): Promise<string> {
	let dir = startDir ?? process.cwd();
	while (true) {
		const configPath = join(dir, SEEDS_DIR_NAME, CONFIG_FILE);
		const file = Bun.file(configPath);
		if (await file.exists()) {
			return join(dir, SEEDS_DIR_NAME);
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
