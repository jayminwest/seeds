import chalk from "chalk";
import type { Command } from "commander";
import { outputJson } from "../output.ts";

const PACKAGE_NAME = "@os-eco/seeds-cli";

async function getCurrentVersion(): Promise<string> {
	const pkgPath = new URL("../../package.json", import.meta.url);
	const pkg = JSON.parse(await Bun.file(pkgPath).text()) as { version: string };
	return pkg.version;
}

async function fetchLatestVersion(): Promise<string> {
	const res = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`);
	if (!res.ok) throw new Error(`Failed to fetch npm registry: ${res.status} ${res.statusText}`);
	const data = (await res.json()) as { version: string };
	return data.version;
}

export async function run(args: string[]): Promise<void> {
	const jsonMode = args.includes("--json");
	const checkOnly = args.includes("--check");

	const [current, latest] = await Promise.all([getCurrentVersion(), fetchLatestVersion()]);
	const upToDate = current === latest;

	if (checkOnly) {
		if (jsonMode) {
			outputJson({ success: true, command: "upgrade", current, latest, upToDate });
		} else {
			if (upToDate) {
				console.log(`${chalk.green("✔")} Already up to date (${current})`);
			} else {
				console.log(`${chalk.yellow("!")} Update available: ${current} → ${latest}`);
				process.exitCode = 1;
			}
		}
		return;
	}

	if (upToDate) {
		if (jsonMode) {
			outputJson({
				success: true,
				command: "upgrade",
				current,
				latest,
				upToDate: true,
				updated: false,
			});
		} else {
			console.log(`${chalk.green("✔")} Already up to date (${current})`);
		}
		return;
	}

	if (!jsonMode) {
		console.log(`Upgrading ${PACKAGE_NAME} from ${current} to ${latest}...`);
	}

	const result = Bun.spawnSync(["bun", "install", "-g", `${PACKAGE_NAME}@latest`], {
		stdout: "inherit",
		stderr: "inherit",
	});

	if (result.exitCode !== 0) {
		throw new Error(`bun install failed with exit code ${result.exitCode}`);
	}

	if (jsonMode) {
		outputJson({
			success: true,
			command: "upgrade",
			current,
			latest,
			upToDate: false,
			updated: true,
		});
	} else {
		console.log(`${chalk.green("✔")} Upgraded to ${latest}`);
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
