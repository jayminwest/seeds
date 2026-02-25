# Seeds

[![CI](https://github.com/jayminwest/seeds/actions/workflows/ci.yml/badge.svg)](https://github.com/jayminwest/seeds/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@os-eco/seeds-cli)](https://www.npmjs.com/package/@os-eco/seeds-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Git-native issue tracker for AI agent workflows. Minimal dependencies, JSONL storage, Bun runtime.

Replaces [beads](https://github.com/steveyegge/beads) in the [overstory](https://github.com/jayminwest/overstory)/[mulch](https://github.com/jayminwest/mulch) ecosystem. No Dolt, no daemon, no binary DB files. **The JSONL file IS the database.**

## Why

Beads works but carries baggage overstory doesn't need:

| Problem | Beads | Seeds |
|---------|-------|-------|
| Storage | 2.8MB binary `beads.db` (can't diff/merge) | JSONL (diffable, mergeable) |
| Sync | 286 export-state tracking files | No sync — file IS the DB |
| Concurrency | `beads.db` lock contention | Advisory locks + atomic writes |
| Dependencies | Dolt embedded | chalk + commander |

## Installation

```bash
git clone https://github.com/jayminwest/seeds
cd seeds
bun install
bun link   # Makes 'sd' available globally
```

Requires [Bun](https://bun.sh) v1.0+.

## Quick Start

```bash
# Initialize in your project
sd init

# Create an issue
sd create --title "Add retry logic to mail client" --type task --priority 1

# List open issues
sd list

# Find work (open, unblocked)
sd ready

# Claim and complete
sd update seeds-a1b2 --status in_progress
sd close seeds-a1b2 --reason "Implemented with exponential backoff"

# Commit .seeds/ changes to git
sd sync
```

## CLI Reference

Every command supports `--json` for structured output. Global flags: `-v`/`--version`, `-q`/`--quiet`, `--verbose`, `--timing`. ANSI colors respect `NO_COLOR`.

### Issue Commands

```
sd init                                Initialize .seeds/ in current directory

sd create                              Create a new issue
  --title <text>       (required)
  --type <type>        task|bug|feature|epic  (default: task)
  --priority <n>       0-4 or P0-P4          (default: 2)
  --description <text>
  --assignee <name>

sd show <id>                           Show issue details

sd list                                List issues with filters
  --status <status>    open|in_progress|closed
  --type <type>        task|bug|feature|epic
  --assignee <name>
  --limit <n>          Max results (default: 50)

sd ready                               Open issues with no unresolved blockers

sd update <id>                         Update issue fields
  --status --title --priority --assignee --description

sd close <id> [<id2> ...]              Close one or more issues
  --reason <text>      Closure summary

sd dep add <issue> <depends-on>        Add dependency
sd dep remove <issue> <depends-on>     Remove dependency
sd dep list <issue>                    Show deps for an issue

sd blocked                             Show all blocked issues

sd stats                               Project statistics

sd sync                                Stage and commit .seeds/ changes
  --status             Check without committing
  --dry-run            Show what would be committed without committing
```

### Template (Molecule) Commands

```
sd tpl create --name <text>            Create a template
sd tpl step add <id> --title <text>    Add step (supports {prefix} interpolation)
sd tpl list                            List all templates
sd tpl show <id>                       Show template with steps
sd tpl pour <id> --prefix <text>       Instantiate template into issues
sd tpl status <id>                     Show convoy completion status
```

### Project Health

```
sd doctor                              Check project health and data integrity
  --fix                Fix auto-fixable issues
```

### Agent Integration

```
sd prime                               Output AI agent context (PRIME.md or built-in)
  --compact            Condensed quick-reference output
sd onboard                             Add seeds section to CLAUDE.md / AGENTS.md
```

### Shell Completions

```
sd completions <shell>                 Output shell completion script
                                       Supported: bash, zsh, fish
```

### Self-Update

```
sd upgrade                             Upgrade seeds to latest version from npm
  --check              Check for updates without installing
```

### Migration

```bash
sd migrate-from-beads    # Import .beads/issues.jsonl → .seeds/issues.jsonl
```

## Priority Scale

| Value | Label    | Use |
|-------|----------|-----|
| 0     | Critical | System-breaking, drop everything |
| 1     | High     | Core functionality |
| 2     | Medium   | Default — important but not urgent |
| 3     | Low      | Nice-to-have |
| 4     | Backlog  | Future consideration |

## On-Disk Format

```
.seeds/
  config.yaml          # Project config: project name, version
  issues.jsonl         # All issues, one JSON object per line
  templates.jsonl      # Template definitions
  .gitignore           # Ignores *.lock files
```

Add to your `.gitattributes` (done automatically by `sd init`):

```
.seeds/issues.jsonl merge=union
.seeds/templates.jsonl merge=union
```

The `merge=union` strategy handles parallel agent branch merges. Seeds deduplicates by ID on read (last occurrence wins), so conflicts resolve automatically.

## JSON Output

Success:
```json
{ "success": true, "command": "create", "id": "myproject-a1b2" }
```

Error:
```json
{ "success": false, "command": "create", "error": "Title is required" }
```

## Concurrency

Seeds is safe for concurrent multi-agent use:

- **Advisory file locks** — `O_CREAT | O_EXCL`, 30s stale threshold, 100ms retry with jitter, 30s timeout
- **Atomic writes** — temp file + rename under lock
- **Dedup on read** — last occurrence wins after `merge=union` git merges

## Integration with Overstory

Overstory wraps `sd` via `Bun.spawn(["sd", ...])` with `--json` parsing, identical to how it wraps `bd`:

| BeadsClient method | sd command |
|--------------------|------------|
| `ready()` | `sd ready --json` |
| `show(id)` | `sd show <id> --json` |
| `create(title, opts)` | `sd create --title "..." --json` |
| `claim(id)` | `sd update <id> --status=in_progress --json` |
| `close(id, reason)` | `sd close <id> --reason "..." --json` |

## Development

```bash
bun test                      # Run all tests
bun test src/store.test.ts    # Single test file
bun run lint                  # Biome check
bun run typecheck             # tsc --noEmit

# Quality gates (run before committing)
bun test && bun run lint && bun run typecheck
```

## Version Bump

```bash
bun run version:bump patch    # 0.1.0 → 0.1.1
bun run version:bump minor    # 0.1.0 → 0.2.0
bun run version:bump major    # 0.1.0 → 1.0.0
```

Updates both `package.json` and `src/index.ts` atomically.

## Tech Stack

| Concern | Choice |
|---------|--------|
| Runtime | Bun (runs TS directly, no build) |
| Language | TypeScript strict (`noUncheckedIndexedAccess`, no `any`) |
| Storage | JSONL (git-native) |
| Config | YAML (minimal built-in parser) |
| Locking | Advisory file locks |
| Formatting | Biome (tabs, 100 char width) |
| Testing | `bun test` with real I/O, temp dirs |
| Dependencies | chalk, commander (minimal) |

## License

MIT
