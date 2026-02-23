import { join } from "node:path";
import { findSeedsDir } from "../config.ts";
import { outputJson } from "../output.ts";

const PRIME_FILE = "PRIME.md";

function defaultPrimeContent(compact: boolean): string {
	if (compact) {
		return compactContent();
	}
	return fullContent();
}

function compactContent(): string {
	return `# Seeds Quick Reference

\`\`\`
sd ready                  # Find unblocked work
sd show <id>              # View issue details
sd create --title "..."   # Create issue (--type, --priority)
sd update <id> --status in_progress  # Claim work
sd close <id>             # Complete work
sd dep add <a> <b>        # a depends on b
sd blocked                # Show blocked issues
sd sync                   # Stage + commit .seeds/
\`\`\`

**Before finishing:** \`sd close <ids> && sd sync && git push\`
`;
}

function fullContent(): string {
	return `# Seeds Workflow Context

> **Context Recovery**: Run \`sd prime\` after compaction, clear, or new session

# Session Close Protocol

**CRITICAL**: Before saying "done" or "complete", you MUST run this checklist:

\`\`\`
[ ] 1. Close completed issues:    sd close <id1> <id2> ...
[ ] 2. File issues for remaining:  sd create --title "..."
[ ] 3. Run quality gates:          bun test && bun run lint && bun run typecheck
[ ] 4. Sync and push:              sd sync && git push
[ ] 5. Verify:                     git status (must show "up to date with origin")
\`\`\`

**NEVER skip this.** Work is not done until pushed.

## Core Rules
- **Default**: Use seeds for ALL task tracking (\`sd create\`, \`sd ready\`, \`sd close\`)
- **Prohibited**: Do NOT use TodoWrite, TaskCreate, or markdown files for task tracking
- **Workflow**: Create issues BEFORE writing code, mark in_progress when starting
- Git workflow: run \`sd sync\` at session end

## Essential Commands

### Finding Work
- \`sd ready\` — Show issues ready to work (no blockers)
- \`sd list --status=open\` — All open issues
- \`sd list --status=in_progress\` — Your active work
- \`sd show <id>\` — Detailed issue view with dependencies

### Creating & Updating
- \`sd create --title="..." --type=task|bug|feature|epic --priority=2\` — New issue
  - Priority: 0-4 or P0-P4 (0=critical, 2=medium, 4=backlog)
- \`sd update <id> --status=in_progress\` — Claim work
- \`sd update <id> --assignee=username\` — Assign to someone
- \`sd close <id>\` — Mark complete
- \`sd close <id1> <id2> ...\` — Close multiple issues at once

### Dependencies & Blocking
- \`sd dep add <issue> <depends-on>\` — Add dependency
- \`sd dep remove <issue> <depends-on>\` — Remove dependency
- \`sd blocked\` — Show all blocked issues

### Sync & Project Health
- \`sd sync\` — Stage and commit .seeds/ changes
- \`sd sync --status\` — Check without committing
- \`sd stats\` — Project statistics
- \`sd doctor\` — Check for data integrity issues

## Common Workflows

**Starting work:**
\`\`\`bash
sd ready                              # Find available work
sd show <id>                          # Review issue details
sd update <id> --status=in_progress   # Claim it
\`\`\`

**Completing work:**
\`\`\`bash
sd close <id1> <id2> ...    # Close all completed issues at once
sd sync                     # Stage + commit .seeds/
git push                    # Push to remote
\`\`\`

**Creating dependent work:**
\`\`\`bash
sd create --title="Implement feature X" --type=feature
sd create --title="Write tests for X" --type=task
sd dep add <test-id> <feature-id>   # Tests depend on feature
\`\`\`
`;
}

export async function run(args: string[]): Promise<void> {
	const jsonMode = args.includes("--json");
	const compact = args.includes("--compact");
	const exportMode = args.includes("--export");

	// --export always outputs the default template
	if (exportMode) {
		const content = defaultPrimeContent(false);
		if (jsonMode) {
			outputJson({ success: true, command: "prime", content });
		} else {
			process.stdout.write(content);
		}
		return;
	}

	// Try to find seeds dir for custom PRIME.md
	let content: string | null = null;
	try {
		const seedsDir = await findSeedsDir();
		const customFile = Bun.file(join(seedsDir, PRIME_FILE));
		if (await customFile.exists()) {
			content = await customFile.text();
		}
	} catch {
		// No seeds dir — that's fine, use default
	}

	if (!content) {
		content = defaultPrimeContent(compact);
	}

	if (jsonMode) {
		outputJson({ success: true, command: "prime", content });
	} else {
		process.stdout.write(content);
	}
}
