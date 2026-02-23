import { join } from "node:path";
import type { Config } from "./types.ts";
import { parseYaml, stringifyYaml } from "./yaml.ts";

export function defaultConfig(): Config {
	return { project: "myproject", version: "1" };
}

export async function loadConfig(seedsDir: string): Promise<Config> {
	const filePath = join(seedsDir, "config.yaml");
	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		throw new Error("No .seeds/config.yaml found. Run 'sd init' to initialize.");
	}
	const text = await file.text();
	const parsed = parseYaml(text);
	return {
		project: parsed.project ?? "myproject",
		version: parsed.version ?? "1",
	};
}

export async function saveConfig(seedsDir: string, config: Config): Promise<void> {
	const filePath = join(seedsDir, "config.yaml");
	await Bun.write(filePath, stringifyYaml({ project: config.project, version: config.version }));
}
