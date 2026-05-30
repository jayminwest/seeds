import type { Command } from "commander";
import { brand, outputJson, printSuccess, printWarning } from "../output.ts";
import { VERSION } from "../version.ts";

const PACKAGE_NAME = "@os-eco/seeds-cli";

async function fetchLatestVersion(): Promise<string> {
	const res = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`);
	if (!res.ok) throw new Error(`Failed to fetch npm registry: ${res.status} ${res.statusText}`);
	const data = (await res.json()) as { version: string };
	return data.version;
}

export async function run(args: string[]): Promise<void> {
	const jsonMode = args.includes("--json");
	const checkOnly = args.includes("--check");

	const current = VERSION;
	const latest = await fetchLatestVersion();
	const upToDate = current === latest;

	if (checkOnly) {
		if (jsonMode) {
			await outputJson({ success: true, command: "upgrade", current, latest, upToDate });
			if (!upToDate) process.exitCode = 1;
		} else {
			if (upToDate) {
				printSuccess(`Already up to date (${current})`);
			} else {
				printWarning(`Update available: ${current} → ${latest}`);
				process.exitCode = 1;
			}
		}
		return;
	}

	if (upToDate) {
		if (jsonMode) {
			await outputJson({
				success: true,
				command: "upgrade",
				current,
				latest,
				upToDate: true,
				updated: false,
			});
		} else {
			printSuccess(`Already up to date (${current})`);
		}
		return;
	}

	if (!jsonMode) {
		console.log(`Upgrading ${brand(PACKAGE_NAME)} from ${current} to ${latest}...`);
	}

	const result = Bun.spawnSync(["bun", "install", "-g", `${PACKAGE_NAME}@latest`], {
		stdout: "inherit",
		stderr: "inherit",
	});

	if (result.exitCode !== 0) {
		throw new Error(`bun install failed with exit code ${result.exitCode}`);
	}

	if (jsonMode) {
		await outputJson({
			success: true,
			command: "upgrade",
			current,
			latest,
			upToDate: false,
			updated: true,
		});
	} else {
		printSuccess(`Upgraded to ${latest}`);
	}
}

export function register(program: Command): void {
	program
		.command("upgrade")
		.description("Upgrade seeds to the latest version from npm")
		.option("--check", "Check for updates without installing")
		.option("--json", "Output as JSON")
		.action(async (opts: { check?: boolean; json?: boolean }) => {
			const args: string[] = [];
			if (opts.check) args.push("--check");
			if (opts.json) args.push("--json");
			await run(args);
		});
}
