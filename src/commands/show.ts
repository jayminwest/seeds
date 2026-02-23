import { findSeedsDir } from "../config.ts";
import { outputJson, printIssueFull } from "../output.ts";
import { readIssues } from "../store.ts";

export async function run(args: string[], seedsDir?: string): Promise<void> {
	const jsonMode = args.includes("--json");
	const id = args.find((a) => !a.startsWith("--"));
	if (!id) throw new Error("Usage: sd show <id>");

	const dir = seedsDir ?? (await findSeedsDir());
	const issues = await readIssues(dir);
	const issue = issues.find((i) => i.id === id);
	if (!issue) throw new Error(`Issue not found: ${id}`);

	if (jsonMode) {
		outputJson({ success: true, command: "show", issue });
	} else {
		printIssueFull(issue);
	}
}
