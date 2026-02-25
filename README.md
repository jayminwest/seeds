# Seeds

Git-native issue tracker for AI agent workflows.

[![npm](https://img.shields.io/npm/v/@os-eco/seeds-cli)](https://www.npmjs.com/package/@os-eco/seeds-cli)
[![CI](https://github.com/jayminwest/seeds/actions/workflows/ci.yml/badge.svg)](https://github.com/jayminwest/seeds/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Replaces [beads](https://github.com/steveyegge/beads) in the [overstory](https://github.com/jayminwest/overstory)/[mulch](https://github.com/jayminwest/mulch) ecosystem. No Dolt, no daemon, no binary DB files. **The JSONL file IS the database.**

## Install

```bash
bun install -g @os-eco/seeds-cli
```

Or try without installing:

```bash
npx @os-eco/seeds-cli --help
```

### Development

```bash
git clone https://github.com/jayminwest/seeds
cd seeds
bun install
bun link              # Makes 'sd' available globally

bun test              # Run all tests
bun run lint          # Biome check
bun run typecheck     # tsc --noEmit
```

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

## Commands

Every command supports `--json` for structured output. Global flags: `-v`/`--version`, `-q`/`--quiet`, `--verbose`, `--timing`. ANSI colors respect `NO_COLOR`.

### Issue Commands

| Command | Description |
|---------|-------------|
| `sd init` | Initialize `.seeds/` in current directory |
| `sd create --title <text>` | Create a new issue (`--type`, `--priority`, `--description`, `--assignee`) |
| `sd show <id>` | Show issue details |
| `sd list` | List issues with filters (`--status`, `--type`, `--assignee`, `--limit`) |
| `sd ready` | Open issues with no unresolved blockers |
| `sd update <id>` | Update issue fields (`--status`, `--title`, `--priority`, `--assignee`, `--description`) |
| `sd close <id> [<id2> ...]` | Close one or more issues (`--reason`) |
| `sd dep add <issue> <depends-on>` | Add dependency |
| `sd dep remove <issue> <depends-on>` | Remove dependency |
| `sd dep list <issue>` | Show deps for an issue |
| `sd blocked` | Show all blocked issues |
| `sd stats` | Project statistics |
| `sd sync` | Stage and commit `.seeds/` changes (`--status`, `--dry-run`) |

### Template Commands

| Command | Description |
|---------|-------------|
| `sd tpl create --name <text>` | Create a template |
| `sd tpl step add <id> --title <text>` | Add step (supports `{prefix}` interpolation) |
| `sd tpl list` | List all templates |
| `sd tpl show <id>` | Show template with steps |
| `sd tpl pour <id> --prefix <text>` | Instantiate template into issues |
| `sd tpl status <id>` | Show convoy completion status |

### Health

| Command | Description |
|---------|-------------|
| `sd doctor` | Check project health and data integrity (`--fix`) |

### Agent Integration

| Command | Description |
|---------|-------------|
| `sd prime` | Output AI agent context (`--compact`) |
| `sd onboard` | Add seeds section to CLAUDE.md / AGENTS.md |

### Utility

| Command | Description |
|---------|-------------|
| `sd upgrade` | Upgrade seeds to latest version from npm (`--check`) |
| `sd completions <shell>` | Output shell completion script (bash, zsh, fish) |
| `sd migrate-from-beads` | Import `.beads/issues.jsonl` into `.seeds/` |

## Architecture

Seeds stores all data in JSONL files inside a `.seeds/` directory — one JSON object per line, fully diffable and mergeable via git. Advisory file locks (`O_CREAT | O_EXCL`) and atomic writes (temp file + rename) ensure safe concurrent access from multiple agents. The `merge=union` gitattribute handles parallel branch merges; dedup-on-read (last occurrence wins) resolves any duplicates. See [CLAUDE.md](CLAUDE.md) for full technical details.

## Why

Beads works but carries baggage overstory doesn't need:

| Problem | Beads | Seeds |
|---------|-------|-------|
| Storage | 2.8MB binary `beads.db` (can't diff/merge) | JSONL (diffable, mergeable) |
| Sync | 286 export-state tracking files | No sync — file IS the DB |
| Concurrency | `beads.db` lock contention | Advisory locks + atomic writes |
| Dependencies | Dolt embedded | chalk + commander |

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

## Part of os-eco

Seeds is part of the [os-eco](https://github.com/jayminwest/os-eco) AI agent tooling ecosystem.

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  overstory   orchestration
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  canopy      prompts
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  seeds       issues
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  mulch       expertise
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
