# Seeds

Git-native issue tracker for AI agent workflows. Zero dependencies, JSONL storage, Bun runtime.

Replaces [beads](https://github.com/steveyegge/beads) in the overstory/mulch ecosystem with something purpose-built: no Dolt, no daemon, no binary DB files. The JSONL file IS the database.

## Why

Beads works but carries baggage overstory doesn't need:

- **2.8MB binary `beads.db`** (Dolt-embedded) that can't diff or merge in git
- **286 export-state tracking files** to keep JSONL in sync with the binary DB
- **Pre-commit hook failures** (`bd sync --flush-only` is a no-op post-Dolt migration)
- **Concurrent access contention** — multiple agents fighting over `beads.db` lock
- **Dual source of truth** — binary DB + JSONL export, manually kept in sync

Overstory uses ~7 beads operations on a simple data model. Seeds covers exactly that surface.

## Design Principles

1. **JSONL is the database.** No binary files, no export pipeline, no sync step. One file, diffable, mergeable.
2. **Zero runtime dependencies.** Bun built-ins only (`Bun.file`, `Bun.write`, `node:fs`, `node:crypto`).
3. **Concurrent-safe by default.** Advisory file locks + atomic writes. Multiple agents in worktrees can read/write safely.
4. **Git-native.** `merge=union` gitattribute handles parallel branch merges. No custom merge driver needed.
5. **Ecosystem fit.** Same stack as overstory (Bun/TS), same patterns as mulch (JSONL + locks), same CLI conventions (`--json` flag on everything).

## On-Disk Format

```
.seeds/
  config.yaml          # Project config (YAML, matches overstory/mulch convention)
  issues.jsonl         # All issues, one JSON object per line
  templates.jsonl      # Molecule/template definitions
  .gitignore           # Ignores lock files
```

### config.yaml

```yaml
project: overstory
version: "1"
```

The `project` field is used as the ID prefix (e.g., `overstory-a1b2`).

YAML parsed by a minimal built-in subset parser (~50 LOC) that handles the flat key-value format seeds needs. No external dependency.

### issues.jsonl

One issue per line, append-only by default. Mutations (update, close) rewrite the file atomically (temp file + rename) under an advisory lock.

```jsonl
{"id":"overstory-a1b2","title":"Add retry logic to mail client","status":"open","type":"task","priority":2,"createdAt":"2026-02-21T10:00:00Z","updatedAt":"2026-02-21T10:00:00Z"}
{"id":"overstory-c3d4","title":"Dashboard crashes on empty run","status":"in_progress","type":"bug","priority":1,"assignee":"builder-1","createdAt":"2026-02-21T10:05:00Z","updatedAt":"2026-02-21T10:30:00Z"}
```

### templates.jsonl

Molecule/template definitions, one per line:

```jsonl
{"id":"tpl-a1b2","name":"scout-build-review","steps":[{"title":"Scout: {prefix}","type":"task","priority":2},{"title":"Build: {prefix}","type":"task","priority":1},{"title":"Review: {prefix}","type":"task","priority":3}]}
```

### .gitignore

```
*.lock
```

### .gitattributes (appended to project root)

```
.seeds/issues.jsonl merge=union
.seeds/templates.jsonl merge=union
```

Union merge strategy: on branch merge, git takes lines from both sides. Since each issue is one line with a unique ID, this produces correct results for parallel agent work. Duplicate lines (same issue modified on both branches) are handled by seeds' dedup-on-read — last occurrence wins.

## Data Model

### Issue

```typescript
interface Issue {
  // Identity
  id: string;                  // "{project}-{4hex}", e.g. "overstory-a1b2"

  // Core
  title: string;
  status: "open" | "in_progress" | "closed";
  type: "task" | "bug" | "feature" | "epic";
  priority: number;            // 0=critical, 1=high, 2=medium, 3=low, 4=backlog

  // Optional
  assignee?: string;           // Agent name or user
  description?: string;        // Longer description
  closeReason?: string;        // Summary when closed

  // Dependencies
  blocks?: string[];           // Issue IDs this blocks
  blockedBy?: string[];        // Issue IDs blocking this

  // Timestamps
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
  closedAt?: string;           // ISO 8601, set on close
}
```

### Template (Molecule)

```typescript
interface TemplateStep {
  title: string;               // Supports {prefix} interpolation
  type?: string;               // Default: "task"
  priority?: number;           // Default: 2
}

interface Template {
  id: string;                  // "tpl-{4hex}"
  name: string;                // Human-readable name
  steps: TemplateStep[];       // Ordered steps
}
```

### Convoy (Poured Template Instance)

When a template is "poured", it creates real issues with wired dependencies (step N+1 blocked by step N). The convoy is tracked by a shared tag on the created issues, not a separate data structure.

```typescript
interface ConvoyStatus {
  templateId: string;
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  issues: string[];            // IDs of created issues, in step order
}
```

### ID Generation

- Issues: `{project}-{4 random hex chars}` (e.g., `overstory-e7f3`)
- Templates: `tpl-{4 random hex chars}` (e.g., `tpl-b2c9`)
- Collision-checked against existing entries on create
- Falls back to 8 hex chars after 100 collisions (won't happen in practice)
- Matches beads' format for familiarity, eases migration

### Status Lifecycle

```
open ──> in_progress ──> closed
  ^          │
  └──────────┘  (reopen via update --status=open)
```

### Priority Scale

| Value | Label    | Use                        |
|-------|----------|----------------------------|
| 0     | Critical | System-breaking, drop everything |
| 1     | High     | Core functionality          |
| 2     | Medium   | Default, important but not urgent |
| 3     | Low      | Nice-to-have               |
| 4     | Backlog  | Future consideration        |

Accepts both numeric (`--priority=2`) and shorthand (`--priority=P2`).

## CLI

Binary name: `sd` (like `bd` for beads, `mulch` for mulch).

Every command supports `--json` for structured output. Non-JSON output is human-readable with ANSI colors (respects `NO_COLOR`).

### Issue Commands

```
sd init                                Initialize .seeds/ in current directory

sd create                              Create a new issue
  --title <text>       (required)
  --type <type>        task|bug|feature|epic (default: task)
  --priority <n>       0-4 or P0-P4 (default: 2)
  --description <text>
  --assignee <name>

sd show <id>                           Show issue details

sd list                                List issues with filters
  --status <status>    open|in_progress|closed
  --type <type>        task|bug|feature|epic
  --assignee <name>
  --limit <n>          Max results (default: 50)

sd ready                               Show open issues with no unresolved blockers

sd update <id>                         Update issue fields
  --status <status>
  --title <text>
  --priority <n>
  --assignee <name>
  --description <text>

sd close <id> [<id2> ...]              Close one or more issues
  --reason <text>      Closure summary

sd dep add <issue> <depends-on>        Add dependency (issue depends on depends-on)
sd dep remove <issue> <depends-on>     Remove dependency
sd dep list <issue>                    Show deps for an issue

sd blocked                             Show all blocked issues

sd stats                               Project statistics (open/closed/blocked counts)

sd sync                                Stage and commit .seeds/ changes
  --status             Check for uncommitted changes without committing
```

### Template (Molecule) Commands

```
sd tpl create                          Create a template
  --name <text>        (required)      Human-readable name

sd tpl step add <template-id>          Add a step to a template
  --title <text>       (required)      Step title (supports {prefix} interpolation)
  --type <type>        task|bug|feature|epic (default: task)
  --priority <n>       0-4 (default: 2)

sd tpl list                            List all templates

sd tpl show <template-id>              Show template with steps

sd tpl pour <template-id>              Instantiate template into real issues
  --prefix <text>      Replaces {prefix} in step titles

sd tpl status <template-id>            Show convoy status (completion of poured issues)
```

### JSON Output Format

Success:
```json
{ "success": true, "command": "create", "id": "overstory-a1b2" }
```

Error:
```json
{ "success": false, "command": "create", "error": "Title is required" }
```

List results:
```json
{ "success": true, "command": "list", "issues": [...], "count": 12 }
```

Template pour:
```json
{ "success": true, "command": "tpl pour", "ids": ["overstory-a1b2", "overstory-c3d4", "overstory-e5f6"] }
```

## Concurrency Model

Stolen from mulch (which handles multi-agent writes in production today).

### Advisory File Locking

```
Lock file:    .seeds/issues.jsonl.lock
Stale after:  30 seconds
Retry:        50ms polling
Timeout:      5 seconds
```

Implementation:
1. Create lock file with `O_CREAT | O_EXCL` (atomic, fails if exists)
2. If `EEXIST`: check mtime, delete if stale (>30s), retry
3. Timeout after 5s with error
4. Execute operation under lock
5. Remove lock file in `finally` block (best-effort)

### Atomic Writes

All mutations (update, close, dep add/remove) follow this pattern:
1. Acquire lock
2. Read `issues.jsonl` into memory
3. Apply mutation
4. Write to `issues.jsonl.tmp.{random}`
5. Rename temp file over `issues.jsonl` (atomic on POSIX)
6. Release lock

Creates (appends) are simpler: acquire lock, append line, release lock.

### Dedup on Read

After a `merge=union` git merge, `issues.jsonl` may contain duplicate lines for the same issue ID (both branches modified it). On read, seeds deduplicates by ID — last occurrence wins (later line = later mutation).

This means:
- No custom merge driver needed
- Parallel branch work just works
- File may grow with duplicates between compactions
- `sd compact` (future) can remove duplicate lines when needed

## Migration from Beads

One-time migration script: `sd migrate-from-beads`

1. Read `.beads/issues.jsonl` (the JSONL export beads already maintains)
2. Map fields: `issue_type` → `type`, `owner` → `assignee`, etc.
3. Write to `.seeds/issues.jsonl`
4. Preserve original IDs (they already use `{project}-{hex}` format)

The beads JSONL export is the source — no need to touch `beads.db`.

## Integration with Overstory

### Client Interface

Overstory wraps seeds the same way it wraps beads — via `Bun.spawn(["sd", ...])` with `--json` parsing. The `BeadsClient` interface maps 1:1:

| BeadsClient method | sd command |
|--------------------|------------|
| `ready()`          | `sd ready --json` |
| `show(id)`         | `sd show <id> --json` |
| `create(title, opts)` | `sd create --title "..." --json` |
| `claim(id)`        | `sd update <id> --status=in_progress --json` |
| `close(id, reason)` | `sd close <id> --reason "..." --json` |
| `list(opts)`       | `sd list --json` |

Rename the client file from `beads/client.ts` to `seeds/client.ts`, update the spawn command, done. The `BeadIssue` → `SeedIssue` type is structurally identical.

### Molecule Migration

| BeadsMolecule method | sd command |
|----------------------|------------|
| `createMoleculePrototype()` | `sd tpl create --name "..." --json` |
| `addStep()` | `sd tpl step add <id> --title "..." --json` |
| `pourMolecule()` | `sd tpl pour <id> --json` |
| `getConvoyStatus()` | `sd tpl status <id> --json` |
| `listPrototypes()` | `sd tpl list --json` |

### Agent-Facing Commands

Agents use the same commands they currently use with beads:

```bash
# Builder agents
sd show <task-id>                    # View assigned task
sd close <task-id> --reason "..."    # Report completion

# Lead agents
sd create --title="..." --type=task --priority=2
sd show <id>
sd ready
sd close <id> --reason "..."
sd sync
```

### Hooks Integration

Seeds hooks are simpler than beads' — there's no daemon to manage and no export pipeline. The only hook seeds needs is optional:

```json
{
  "hooks": {
    "PreCommit": [{
      "command": "sd sync --status",
      "description": "Warn if seeds changes are unstaged"
    }]
  }
}
```

## What Seeds Does NOT Do

Explicitly out of scope (keep it minimal):

- **No daemon.** No background process, no socket, no PID files.
- **No binary database.** JSONL only. No SQLite, no Dolt.
- **No audit trail / version history.** Git IS the audit trail. Use `git log .seeds/issues.jsonl`.
- **No custom merge driver.** `merge=union` handles everything. Dedup on read handles edge cases.
- **No user management.** Assignee is a free-text string. No authentication, no permissions.
- **No remote sync.** `sd sync` commits locally. `git push` handles the rest.
- **No compact command (yet).** Dedup on read is sufficient. Ship `sd compact` when file bloat becomes a real problem.

## Tech Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Runtime | Bun | Matches overstory, runs TS directly |
| Language | TypeScript (strict) | Matches overstory/mulch |
| Dependencies | Zero runtime | Matches overstory's hard rule |
| Config | YAML (minimal built-in parser) | Matches overstory/mulch convention |
| Storage | JSONL | Git-native, diffable, mergeable |
| Locking | Advisory file locks | Proven in mulch for multi-agent |
| Formatting | Biome (tabs, 100 char width) | Matches overstory |
| Testing | `bun test` (colocated) | Real I/O, no mocks |
| Distribution | `bun link` locally | No npm publish for now |

## Project Infrastructure

### Directory Structure

```
seeds/
  package.json
  tsconfig.json
  biome.json
  .gitignore
  CHANGELOG.md
  README.md
  CLAUDE.md
  scripts/
    version-bump.ts           # Bump version in package.json + src/index.ts
  .claude/
    commands/
      release.md              # /release slash command
  .github/
    workflows/
      ci.yml                  # lint + typecheck + test on push/PR
      auto-tag.yml            # Auto-tag + GitHub release on version bump
  src/
    index.ts                  # CLI entry + command router + VERSION constant
    types.ts                  # Issue, Template, Config, constants
    store.ts                  # JSONL read/write/lock/atomic
    id.ts                     # ID generation
    config.ts                 # YAML config load/save
    output.ts                 # JSON + human output helpers
    yaml.ts                   # Minimal YAML parser (flat key-value only)
    commands/
      init.ts                 # sd init
      create.ts               # sd create
      show.ts                 # sd show
      list.ts                 # sd list
      ready.ts                # sd ready
      update.ts               # sd update
      close.ts                # sd close
      dep.ts                  # sd dep add/remove/list
      sync.ts                 # sd sync
      blocked.ts              # sd blocked
      stats.ts                # sd stats
      tpl.ts                  # sd tpl create/step/list/show/pour/status
      migrate.ts              # sd migrate-from-beads
    store.test.ts             # Core data layer tests
    id.test.ts                # ID generation tests
    yaml.test.ts              # YAML parser tests
    commands/
      init.test.ts            # Init integration tests
      create.test.ts          # Create + show tests
      dep.test.ts             # Dependency tests
      tpl.test.ts             # Template/molecule tests
```

### Version Management

Version lives in two locations (verified in sync by CI):
- `package.json` — `"version"` field
- `src/index.ts` — `const VERSION = "X.Y.Z"`

Bump via: `bun run version:bump <major|minor|patch>`

Script updates both files atomically and prints next steps.

### CHANGELOG.md

[Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

## [Unreleased]

## [0.1.0] - YYYY-MM-DD

### Added
- Initial release
- Issue CRUD (create, show, list, update, close)
- Dependency tracking (dep add/remove/list, blocked, ready)
- Templates/molecules (tpl create/step/list/show/pour/status)
- Advisory file locking for concurrent agent access
- Atomic writes with dedup-on-read
- YAML config, JSONL storage
- --json flag on all commands
- Migration from beads (sd migrate-from-beads)
```

### /release Slash Command

`.claude/commands/release.md` — identical workflow to overstory:

1. Analyze changes since last release (`git log`, `git diff`)
2. Determine version bump (major/minor/patch, default: patch)
3. Bump version in `package.json` and `src/index.ts`
4. Update `CHANGELOG.md` with categorized changes
5. Update `CLAUDE.md` if command counts or structure changed
6. Update `README.md` if CLI reference or stats changed
7. Present summary — do NOT commit or push

### CI Workflow (`.github/workflows/ci.yml`)

Runs on push to main and PRs:

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck
      - run: bun test
```

### Auto-Tag Workflow (`.github/workflows/auto-tag.yml`)

Runs on push to main. After CI passes:

1. Read version from `package.json`
2. Verify `package.json` and `src/index.ts` versions match
3. Check if git tag `vX.Y.Z` already exists (idempotent)
4. If new version: create tag, push tag, create GitHub release with auto-generated notes

### CLAUDE.md

Project instructions for Claude Code sessions. Covers:

- Tech stack and conventions (Bun, zero deps, Biome, strict TS)
- Directory structure
- CLI command reference
- Testing philosophy (real I/O, no mocks, temp dirs)
- Quality gates (`bun test && bun run lint && bun run typecheck`)
- Coding conventions (tabs, 100 char width, `noUncheckedIndexedAccess`, no `any`)

### package.json Scripts

```json
{
  "scripts": {
    "test": "bun test",
    "lint": "bunx biome check .",
    "typecheck": "tsc --noEmit",
    "version:bump": "bun run scripts/version-bump.ts"
  }
}
```

## Estimated Size

| Area | Files | LOC |
|------|-------|-----|
| Core (types, store, id, config, yaml, output) | 6 | ~400 |
| Commands (12 command files) | 12 | ~700 |
| CLI entry point | 1 | ~80 |
| Tests | 6 | ~500 |
| Scripts | 1 | ~75 |
| Infrastructure (CLAUDE.md, release.md, workflows) | 5 | ~300 |
| **Total** | **31** | **~2,050** |
