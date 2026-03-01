---
name: seeds:migrate-from-beads-to-seeds
description: Migrate a repository from Beads (bd) issue tracking to Seeds (sd). Initializes seeds, migrates issues, updates config files, and removes .beads/.
---

### 1. Verify Prerequisites

Check that the current directory is a git repository:
```bash
git rev-parse --is-inside-work-tree 2>/dev/null && echo "GIT_OK" || echo "NO_GIT"
```

If not a git repo, inform the user and stop:
> This directory is not a git repository. Seeds requires git.

Check that `.beads/` exists (nothing to migrate otherwise):
```bash
test -d .beads && echo "BEADS_EXISTS" || echo "NO_BEADS"
```

If `.beads/` does not exist, inform the user and stop:
> No `.beads/` directory found. Nothing to migrate. Use `/dev:setup-seeds` to initialize seeds from scratch.

Check that `.seeds/` does NOT already exist:
```bash
test -d .seeds && echo "SEEDS_EXISTS" || echo "NO_SEEDS"
```

If `.seeds/` already exists, inform the user and stop:
> Seeds is already initialized. Use `sd list` to see existing issues.

Check that the `sd` CLI is available:
```bash
sd --version 2>/dev/null || echo "SD_NOT_FOUND"
```

If `sd` is not found, inform the user and stop:
> Seeds CLI (`sd`) is not installed. Install it with:
> ```
> npm install -g @os-eco/seeds-cli
> ```
> Note: Seeds requires the bun runtime. Install bun with `curl -fsSL https://bun.sh/install | bash` if needed.
>
> Then run `/seeds:migrate-from-beads-to-seeds` again.

### 2. Initialize Seeds

**IMPORTANT:** Seeds MUST be initialized before running the migration command. `sd migrate-from-beads` will fail without this step.

```bash
sd init
```

### 3. Migrate Issues

Run the built-in migration command:
```bash
sd migrate-from-beads
```

This reads `.beads/issues.jsonl` and imports all issues into `.seeds/issues.jsonl`.

### 4. Verify Migration

Confirm issues were migrated:
```bash
sd list
```

Run health check:
```bash
sd doctor
```

If `sd doctor` reports any issues, fix them before proceeding. Re-run `sd doctor` until all checks pass.

### 5. Update Config Files

Run `sd onboard` to add the seeds section to CLAUDE.md:
```bash
sd onboard
```

Check if AGENTS.md exists and contains beads references:
```bash
test -f AGENTS.md && grep -l 'bd\|beads' AGENTS.md 2>/dev/null && echo "AGENTS_NEEDS_UPDATE" || echo "AGENTS_OK"
```

If AGENTS.md needs updating, use the Edit tool to replace all beads/bd references with seeds/sd equivalents:
- `bd` commands become `sd` commands (e.g., `bd ready` -> `sd ready`, `bd sync` -> `sd sync`, `bd close` -> `sd close`)
- "beads" becomes "seeds" in descriptions
- "Beads" becomes "Seeds" in titles
- `.beads/issues.jsonl` becomes `.seeds/issues.jsonl`

Check if `.gitattributes` contains a beads merge driver line:
```bash
test -f .gitattributes && grep -c 'beads' .gitattributes 2>/dev/null && echo "GITATTRIBUTES_NEEDS_UPDATE" || echo "GITATTRIBUTES_OK"
```

If `.gitattributes` needs updating, use the Edit tool to remove the beads merge driver line (e.g., `.beads/issues.jsonl merge=beads`). Seeds adds its own lines via `sd init`, so only remove the beads-specific entries.

### 6. Remove Beads

Remove `.beads/` from git tracking. Use the `-rf` flag — the `-f` is required because export-state files are often modified:
```bash
git rm -rf .beads/
```

Remove remaining gitignored runtime files (database, daemon, socket):
```bash
rm -rf .beads/
```

### 7. Remove Beads Git Hooks

Beads installs git hooks that delegate to `bd hook <name>`. These will block commits if `bd` finds no database. Check for and remove them:

```bash
grep -l 'bd hook\|bd hooks' .git/hooks/* 2>/dev/null
```

Remove every hook file that contains `bd hook` or `bd hooks`. Common ones are: `pre-commit`, `prepare-commit-msg`, `post-checkout`, `post-merge`, `pre-push`. Also remove any `.backup` files left by beads:

```bash
# Remove each beads hook found by the grep above, plus any .backup files
rm -f .git/hooks/pre-commit .git/hooks/prepare-commit-msg .git/hooks/post-checkout .git/hooks/post-merge .git/hooks/pre-push
rm -f .git/hooks/*.backup
```

**IMPORTANT:** Only remove hooks that contain `bd hook` or `bd hooks`. If a hook does NOT reference beads, leave it alone — it belongs to another tool.

### 8. Commit

Stage all changes and commit:
```bash
git add .seeds/ CLAUDE.md AGENTS.md .gitattributes
git commit -m "Migrate from beads to seeds issue tracking"
```

### 9. Report Results

Inform the user:

> Migration complete. Summary:
> - Issues migrated: [count from sd list]
> - Seeds initialized in `.seeds/`
> - CLAUDE.md updated with seeds onboard section
> - AGENTS.md updated (if applicable)
> - `.beads/` removed from repo
>
> You can now use:
> - `sd ready` to see available work
> - `sd create --title "..." --type task --priority 2` to create issues
> - `sd sync` to sync with git
