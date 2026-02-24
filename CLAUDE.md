# Seeds

Git-native issue tracker for AI agent workflows. Zero dependencies, JSONL storage, Bun runtime. Replaces beads in the overstory/mulch ecosystem.

**The JSONL file IS the database.** No binary files, no export pipeline, no sync step. One file, diffable, mergeable.

## Tech Stack

- **Runtime:** Bun (runs TypeScript directly, no build step)
- **Language:** TypeScript with strict mode (`noUncheckedIndexedAccess`, no `any`)
- **Linting:** Biome (formatter + linter in one tool)
- **Runtime dependencies:** Zero. Only Bun built-in APIs (`Bun.file`, `Bun.write`, `node:fs`, `node:crypto`)
- **Dev dependencies:** `@types/bun`, `typescript`, `@biomejs/biome`
- **Storage:** JSONL (git-native, diffable, mergeable)
- **Config:** YAML (minimal built-in parser, ~50 LOC)
- **Locking:** Advisory file locks (proven in mulch for multi-agent)

## Directory Structure

```
seeds/
  package.json
  tsconfig.json
  biome.json
  CLAUDE.md
  CHANGELOG.md
  README.md
  .claude/
    commands/
      release.md              # /release slash command
  .github/
    workflows/
      ci.yml                  # lint + typecheck + test on push/PR
      auto-tag.yml            # Auto-tag + GitHub release on version bump
  scripts/
    version-bump.ts           # Bump version in package.json + src/index.ts
  src/
    index.ts                  # CLI entry + command router + VERSION constant
    types.ts                  # Issue, Template, Config, constants
    store.ts                  # JSONL read/write/lock/atomic
    id.ts                     # ID generation
    config.ts                 # YAML config load/save
    output.ts                 # JSON + human output helpers
    yaml.ts                   # Minimal YAML parser (flat key-value only)
    markers.ts                # Marker-delimited section helpers (onboard)
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
      doctor.ts               # sd doctor
      prime.ts                # sd prime
      onboard.ts              # sd onboard
    markers.test.ts           # Marker section tests
    store.test.ts             # Core data layer tests
    id.test.ts                # ID generation tests
    yaml.test.ts              # YAML parser tests
    commands/
      init.test.ts
      create.test.ts
      dep.test.ts
      tpl.test.ts
      doctor.test.ts
      prime.test.ts
      onboard.test.ts
```

## Build & Test Commands

```bash
bun test                      # Run all tests
bun test src/store.test.ts    # Run single test file
bun run lint                  # bunx biome check .
bun run typecheck             # tsc --noEmit
```

## Quality Gates

Run all three before committing:

```bash
bun test && bun run lint && bun run typecheck
```

## On-Disk Format (.seeds/)

```
.seeds/
  config.yaml          # Project config (YAML)
  issues.jsonl         # All issues, one JSON object per line
  templates.jsonl      # Molecule/template definitions
  .gitignore           # Ignores lock files
```

Git merge strategy: `merge=union` gitattribute on JSONL files. Dedup-on-read (last occurrence wins) handles duplicates from parallel branch merges.

## CLI Command Reference

Binary name: `sd`

Every command supports `--json` for structured output.

### Issue Commands

```
sd init                                Initialize .seeds/ in current directory
sd create --title <text>               Create a new issue
  --type task|bug|feature|epic         (default: task)
  --priority 0-4 or P0-P4             (default: 2)
  --description <text>
  --assignee <name>
sd show <id>                           Show issue details
sd list                                List issues with filters
  --status --type --assignee --limit
sd ready                               Open issues with no unresolved blockers
sd update <id>                         Update issue fields
sd close <id> [<id2> ...]              Close one or more issues
  --reason <text>
sd dep add <issue> <depends-on>        Add dependency
sd dep remove <issue> <depends-on>     Remove dependency
sd dep list <issue>                    Show deps for an issue
sd blocked                             Show all blocked issues
sd stats                               Project statistics
sd sync                                Stage and commit .seeds/ changes
  --status                             Check without committing
sd doctor                              Check project health and data integrity
  --fix                                Fix auto-fixable issues
```

### Agent Integration Commands

```
sd prime                               Output AI agent context
  --compact                            Condensed quick-reference output
sd onboard                             Add seeds section to CLAUDE.md / AGENTS.md
```

### Template (Molecule) Commands

```
sd tpl create --name <text>            Create a template
sd tpl step add <id> --title <text>    Add step to template
sd tpl list                            List all templates
sd tpl show <id>                       Show template with steps
sd tpl pour <id> --prefix <text>       Instantiate template into issues
sd tpl status <id>                     Show convoy status
```

## Coding Conventions

### Formatting

- **Tab indentation** (enforced by Biome)
- **100 character line width** (enforced by Biome)

### TypeScript

- Strict mode with `noUncheckedIndexedAccess` — always handle possible `undefined` from indexing
- No `any` — use `unknown` and narrow, or define proper types
- All shared types go in `src/types.ts`

### Dependencies

- **Zero runtime dependencies.** This is a hard rule.
- Use only Bun built-in APIs: `Bun.file` for reads, `Bun.write` for writes, `node:fs` for locks, `node:crypto` for IDs
- Dev dependencies are limited to types and tooling

### Concurrency

- Advisory file locks (`O_CREAT | O_EXCL`, 30s stale, 50ms retry, 5s timeout)
- Atomic writes (temp file + rename) under lock
- Creates append under lock; mutations rewrite atomically

### File Organization

- Each CLI command gets its own file in `src/commands/`
- Tests colocated with source (e.g., `src/store.test.ts`)
- Core modules at `src/` root (types, store, id, config, output, yaml)

## Testing

- **Framework:** `bun test` (built-in, Jest-compatible API)
- **Philosophy:** Real I/O, no mocks. Use temp directories (`mkdtemp`) for all tests.
- **Naming:** `{module}.test.ts` colocated with source

## Data Model

### Issue

```typescript
interface Issue {
  id: string;                  // "{project}-{4hex}"
  title: string;
  status: "open" | "in_progress" | "closed";
  type: "task" | "bug" | "feature" | "epic";
  priority: number;            // 0=critical, 1=high, 2=medium, 3=low, 4=backlog
  assignee?: string;
  description?: string;
  closeReason?: string;
  blocks?: string[];
  blockedBy?: string[];
  createdAt: string;           // ISO 8601
  updatedAt: string;
  closedAt?: string;
}
```

### Priority Scale

| Value | Label    |
|-------|----------|
| 0     | Critical |
| 1     | High     |
| 2     | Medium   |
| 3     | Low      |
| 4     | Backlog  |

## Version Management

Version lives in two locations (verified in sync by CI):
- `package.json` — `"version"` field
- `src/index.ts` — `const VERSION = "X.Y.Z"`

Bump via: `bun run version:bump <major|minor|patch>`

## Session Completion Protocol

When ending a work session, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

1. **File issues for remaining work** — Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed): `bun test && bun run lint && bun run typecheck`
3. **Update issue status** — Close finished work, update in-progress items
4. **Push to remote** (MANDATORY):
   ```bash
   git pull --rebase
   sd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Verify** — All changes committed AND pushed
6. **Hand off** — Provide context for next session

**Critical:** NEVER stop before pushing. If push fails, resolve and retry until it succeeds.

<!-- mulch:start -->
## Project Expertise (Mulch)

This project uses [Mulch](https://github.com/jayminwest/mulch) for structured expertise management.

**At the start of every session**, run:
```bash
mulch prime
```

This injects project-specific conventions, patterns, decisions, and other learnings into your context.

**Before completing your task**, review your work for insights worth preserving — conventions discovered,
patterns applied, failures encountered, or decisions made — and record them:
```bash
mulch record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
```

Run `mulch status` to check domain health and entry counts.
Run `mulch --help` for full usage.

### Before You Finish

1. Discover what to record:
   ```bash
   mulch learn
   ```
2. Store insights from this work session:
   ```bash
   mulch record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
   ```
3. Validate and commit:
   ```bash
   mulch sync
   ```
<!-- mulch:end -->

<!-- seeds:start -->
## Issue Tracking (Seeds)
<!-- seeds-onboard-v:1 -->

This project uses [Seeds](https://github.com/jayminwest/seeds) for git-native issue tracking.

**At the start of every session**, run:
```
sd prime
```

This injects session context: rules, command reference, and workflows.

**Quick reference:**
- `sd ready` — Find unblocked work
- `sd create --title "..." --type task --priority 2` — Create issue
- `sd update <id> --status in_progress` — Claim work
- `sd close <id>` — Complete work
- `sd sync` — Sync with git (run before pushing)

### Before You Finish
1. Close completed issues: `sd close <id>`
2. File issues for remaining work: `sd create --title "..."`
3. Sync and push: `sd sync && git push`
<!-- seeds:end -->

<!-- canopy:start -->
## Prompt Management (Canopy)
<!-- canopy-onboard-v:1 -->

This project uses [Canopy](https://github.com/jayminwest/canopy) for git-native prompt management.

**At the start of every session**, run:
```
cn prime
```

This injects prompt workflow context: commands, conventions, and common workflows.

**Quick reference:**
- `cn list` — List all prompts
- `cn render <name>` — View rendered prompt (resolves inheritance)
- `cn emit --all` — Render prompts to files
- `cn update <name>` — Update a prompt (creates new version)
- `cn sync` — Stage and commit .canopy/ changes

**Do not manually edit emitted files.** Use `cn update` to modify prompts, then `cn emit` to regenerate.
<!-- canopy:end -->
