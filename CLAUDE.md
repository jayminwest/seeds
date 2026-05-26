# Seeds

Git-native issue tracker for AI agent workflows. Minimal dependencies, JSONL storage, Bun runtime. Replaces beads in the overstory/mulch ecosystem.

**The JSONL file IS the database.** No binary files, no export pipeline, no sync step. One file, diffable, mergeable.

## Tech Stack

- **Runtime:** Bun (runs TypeScript directly, no build step)
- **Language:** TypeScript with strict mode (`noUncheckedIndexedAccess`, no `any`)
- **Linting:** Biome (formatter + linter in one tool)
- **Runtime dependencies:** chalk, commander (plus Bun built-in APIs: `Bun.file`, `Bun.write`, `node:fs`, `node:crypto`)
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
      publish.yml             # CI publish: auto-tag + GitHub release + npm publish
  scripts/
    version-bump.ts           # Bump version in package.json + src/version.ts
  extensions/
    pi/                       # @os-eco/pi-seeds extension (pi-coding-agent runtime)
      index.ts                # entry: lifecycle hooks + tools + slash commands
      lib/                    # autocomplete, commands, config, prime, status, tools
      README.md
  src/
    index.ts                  # CLI entry + command router
    version.ts                # VERSION constant (importable without CLI side-effects)
    types.ts                  # Issue, Template, Config, constants
    store.ts                  # JSONL read/write/lock/atomic
    id.ts                     # ID generation
    config.ts                 # YAML config load/save
    config-schema.ts          # JSON Schema for .seeds/config.yaml (sd config schema)
    output.ts                 # JSON + human output helpers
    yaml.ts                   # Minimal YAML parser (flat key-value only)
    markers.ts                # Marker-delimited section helpers (onboard)
    filter.ts                 # Shared issue filter logic (list + ready)
    commands/
      init.ts                 # sd init
      create.ts               # sd create
      show.ts                 # sd show
      list.ts                 # sd list
      ready.ts                # sd ready
      search.ts               # sd search
      update.ts               # sd update
      close.ts                # sd close
      dep.ts                  # sd dep add/remove/list
      block.ts                # sd block
      unblock.ts              # sd unblock
      label.ts                # sd label add/remove/list/list-all
      sync.ts                 # sd sync
      blocked.ts              # sd blocked
      stats.ts                # sd stats
      tpl.ts                  # sd tpl create/step/list/show/pour/status
      migrate.ts              # sd migrate-from-beads
      doctor.ts               # sd doctor
      prime.ts                # sd prime
      onboard.ts              # sd onboard
      upgrade.ts              # sd upgrade
      completions.ts          # sd completions
      config.ts               # sd config schema/show/set/unset
      setup.ts                # sd setup pi (and future recipes)
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
      completions.test.ts
      label.test.ts
      unblock.test.ts
      sync.test.ts
      config.test.ts
      setup.test.ts
    suggestions.test.ts       # Typo suggestion tests
    timing.test.ts            # --timing flag tests
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

Every command supports `--json` for structured output. Global flags: `-v`, `-q`/`--quiet`, `--verbose`, `--timing`.

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
  --label <label>                      Filter by label
  --priority <levels>                  Exact priority match (e.g. 0,1 or P0,P1)
  --priority-max <n>                   Ceiling (e.g. --priority-max 1 = P0+P1)
  --all                                Include closed issues
sd ready                               Open issues with no unresolved blockers
  --type --assignee --limit
  --label --label-any --unlabeled
  --priority --priority-max
  --sort --format
  --respect-schedule                   Exclude extensions.queued===true or future extensions.scheduledFor
sd search <query>                      Substring search on title + description
  --status --type --assignee
  --label --label-any --unlabeled
  --priority --priority-max
  --limit --sort --format
sd update <id>                         Update issue fields
  --extensions <json>                  Shallow-merge JSON object into Issue.extensions
  --clear-extensions                   Remove the extensions field
sd close <id> [<id2> ...]              Close one or more issues
  --reason <text>
sd dep add <issue> <depends-on>        Add dependency
sd dep remove <issue> <depends-on>     Remove dependency
sd dep list <issue>                    Show deps for an issue
sd block <id> --by <blocker-id>        Mark issue as blocked
sd unblock <id> --from <blocker-id>    Remove blocker (--all to clear all)
sd blocked                             Show all blocked issues
sd label add <id> <label>              Add label to issue
sd label remove <id> <label>           Remove label from issue
sd label list <id>                     List labels on issue
sd label list-all                      List all labels across issues
sd stats                               Project statistics
sd sync                                Stage and commit .seeds/ changes
  --status                             Check without committing
  --dry-run                            Show what would be committed
sd doctor                              Check project health and data integrity
  --fix                                Fix auto-fixable issues
```

### Agent Integration Commands

```
sd prime                               Output AI agent context
  --compact                            Condensed quick-reference output
sd onboard                             Add seeds section to CLAUDE.md / AGENTS.md
sd upgrade                             Upgrade seeds to latest version from npm
  --check                              Check for updates without installing
sd completions <shell>                 Output shell completion script (bash, zsh, fish)
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

### Config Commands

```
sd config schema [--json]              Emit JSON Schema for .seeds/config.yaml
sd config show [--path <p>] [--json]   Print config or a value at dot-path
sd config set <path> <value>           Validate + write a value (YAML-parsed)
sd config unset <path>                 Remove the value at <path>
```

`sd config` is the wire surface for warren V2's schema-driven config editor (warren ROADMAP R-10). Writes hold the `config.yaml` advisory lock and validate the entire post-write file via AJV before persisting; partial writes that would violate `SectionSpec` required fields are rejected. The schema's `additionalProperties: false` posture rejects unknown root keys. Built-in template defaults appear in `examples` so warren's UI can offer "copy a built-in to start". `$schema` is stripped before AJV compilation (the shared `compileSchema` runs draft-07 by default; the URI is purely informational for downstream consumers).

### Plan Commands

```
sd plan templates                      List available plan templates (built-in: feature, bug, refactor)
sd plan prompt <seed-id>               Emit structured planning prompt JSON for a seed
  --template <name>                    Override the inferred template
  --domain <name>                      Force the mulch domain for prior_art enrichment
sd plan submit <seed-id> --plan <file> Validate, spawn child seeds, write plan row
  --overwrite                          Replace an existing non-draft plan; bumps revision
  --record-decision                    Best-effort: record approach as a mulch decision on success
  --domain <name>                      Force mulch domain for --record-decision
  --name <text>                        Set human-readable plan label (defaults to seed title)
sd plan show <pl-id>                   Show plan with sections, children, and nested sub-plans
sd plan validate <pl-id>               Re-run validation against the current template
sd plan list                           List plans
  --seed --status --outcome --template
sd plan adopt <pl-id> <seed-id...>     Adopt already-open seeds into a plan (link-only; bumps revision)
  --step <i>                           Anchor adopted seeds at a 1-based blueprint step index
sd plan release <pl-id> <seed-id...>   Detach seeds from a plan without closing them (link-only; bumps revision)
sd plan edit <id>                      Edit plan fields in place (accepts plan id or seed id); bumps revision
  --name <text>                        Set the plan's human-readable label
  --section <name> <text>              Replace a text section (V1: text sections only; --section approach refreshes child backrefs)
  --step <i>                           1-based step index to edit (combine with one or more of --title / --priority / --type)
  --title --priority --type            Step metadata; propagates to the corresponding child seed via plan.children[i-1]
sd plan outcome <pl-id> --result <v>   Record success | partial | failure (--note <text>)
sd plan review <pl-id> --by <name>     Record a reviewer (informational; not a state transition)
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

- **Minimal runtime dependencies.** Only chalk (output formatting) and commander (CLI parsing).
- Use Bun built-in APIs where possible: `Bun.file` for reads, `Bun.write` for writes, `node:fs` for locks, `node:crypto` for IDs
- Dev dependencies are limited to types and tooling

### Concurrency

- Advisory file locks (`O_CREAT | O_EXCL`, 30s stale, 50ms retry, 5s timeout)
- Atomic writes (temp file + rename) under lock
- Creates append under lock; mutations rewrite atomically

### File Organization

- Each CLI command gets its own file in `src/commands/`
- Tests colocated with source (e.g., `src/store.test.ts`)
- Core modules at `src/` root (types, store, id, config, output, yaml)

### Extensions

- `Issue.extensions?: Record<string, unknown>` is **opaque to seeds** — no schema, no validation in the storage layer. Consumers (warren, greenhouse, overstory) own namespaced keys (`warren_*`, `greenhouse_*`) and ship their own meaning.
- `sd update --extensions <json>` shallow-merges (`{...existing, ...incoming}`); `--clear-extensions` drops the field. Mutually exclusive. Arrays/null/scalars at the top level are rejected.
- Two well-known keys are read by `sd ready --respect-schedule` (opt-in): `extensions.queued` (strict `=== true`) and `extensions.scheduledFor` (ISO8601, future = parked). Default ready is byte-identical to pre-extensions behavior.
- `sd doctor` has an `extensions-schema` check (flags non-object values; `--fix` drops them). When adding more checks, remember to bump the hardcoded pass count in `doctor.test.ts` (mx-957e8f).
- Keep consumer keys flat (`lastRunId`, `lastRunAt`) — the merge contract is one level deep, so nested objects get clobbered on partial update.

### Planning

- Use `sd plan` when work is large or ambiguous enough that an LLM benefits from structured decomposition before implementing.
- For small, well-scoped tasks just `sd create` directly — planning has overhead.
- Built-in templates: `feature` (default for `task`/`feature`/`epic`), `bug` (default for `bug`), `refactor` (opt-in via `--template refactor`).
- The flow is `sd plan prompt <seed>` → fill the JSON → `sd plan submit <seed> --plan <file>`. Submit spawns one child seed per step and wires `step.blocks` into `blockedBy` dependencies.
- Steps accept an optional `labels: string[]` field that flows to the spawned/adopted child seed. Values are normalized (lowercased, trimmed, deduped) and merged additively on adoption — they never clobber labels the user added by hand. Use this to tag agent-spawned children (e.g. `"labels": ["nightwatch"]`) without post-hoc `sd label add` calls.
- Plan outcomes (`success | partial | failure`) and reviewers are storage-only — they never gate child progress.
- Use `sd plan edit` for targeted field-level fixes (typo in approach, rename a step, change a step's priority/type). Structural edits — adding, removing, or reordering steps — still require `sd plan submit --overwrite`. Editing `--section approach` refreshes the `seeds:plan-backref` block on every child seed; `--step <i> --title <text>` renames the corresponding child seed.

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
  extensions?: Record<string, unknown>;  // opaque runtime metadata (consumer-owned, namespaced)
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
- `src/version.ts` — `export const VERSION = "X.Y.Z"` (imported by `src/index.ts` and by extensions without triggering CLI side-effects)

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
<!-- mulch-onboard:v0.8.0 -->

This project uses [Mulch](https://github.com/jayminwest/mulch) v0.8.0 for structured expertise management.

**At the start of every session**, run:
```bash
ml prime
```

Injects project-specific conventions, patterns, decisions, failures, references, and guides into
your context. Run `ml prime --files src/foo.ts` before editing a file to load only records
relevant to that path (per-file framing, classification age, and confirmation scores included).

For monolith projects where dumping every record wastes context, set
`prime.default_mode: manifest` in `.mulch/mulch.config.yaml` (or pass `--manifest`) to emit a
quick reference + domain index. Agents then scope-load with `ml prime <domain>` or
`ml prime --files <path>`.

**Before completing your task**, record insights worth preserving — conventions discovered,
patterns applied, failures encountered, or decisions made:
```bash
ml record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
```

Evidence auto-populates from git (current commit + changed files). Link explicitly with
`--evidence-seeds <id>` / `--evidence-gh <id>` / `--evidence-linear <id>` / `--evidence-bead <id>`,
`--evidence-commit <sha>`, or `--relates-to <mx-id>`. Upserts of named records merge outcomes
instead of replacing them; validation failures print a copy-paste retry hint with missing fields
pre-filled.

Run `ml status` for domain health, `ml doctor` to check record integrity (add `--fix` to strip
broken file anchors), `ml --help` for the full command list. Write commands use file locking and
atomic writes, so multiple agents can record concurrently. Expertise survives `git worktree`
cleanup — `.mulch/` resolves to the main repo.

`ml prune` soft-archives stale records to `.mulch/archive/` instead of deleting them; pass
`--hard` for true deletion. Restore an archived record with `ml restore <id>`. Do not read
`.mulch/archive/` directly — those records are stale by definition. If you need historical
context, run `ml search --archived <query>`.

### Before You Finish

1. Discover what to record (shows changed files and suggests domains):
   ```bash
   ml learn
   ```
2. Store insights from this work session:
   ```bash
   ml record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
   ```
3. Validate and commit:
   ```bash
   ml sync
   ```
<!-- mulch:end -->

<!-- seeds:start -->
## Issue Tracking (Seeds)
<!-- seeds-onboard:v0.4.7 -->
<!-- seeds-onboard-schema:6 -->

This project uses [Seeds](https://github.com/jayminwest/seeds) v0.4.7 for git-native issue tracking.

**At the start of every session**, run:
```
sd prime
```

This injects session context: rules, command reference, and workflows. Pass `--format json|compact|markdown|plain|ids` on any command for agent-friendly output.

**Quick reference:**
- `sd ready` — Find unblocked work
- `sd search <query>` — Full-text search across titles + descriptions
- `sd create --title "..." --type task --priority 2` — Create issue
- `sd update <id> --status in_progress` — Claim work
- `sd close <id>` — Complete work
- `sd dep add <id> <depends-on>` — Add dependency between issues
- `sd sync` — Sync with git (run before pushing)

### Planning
Use `sd plan` when work is large or ambiguous enough that an LLM benefits from structured decomposition. Submit spawns one child seed per step; `step.blocks` uses forward semantics (step i with `blocks: [j]` means step i blocks step j, and step j gets step i's id in its `blockedBy`).

- `sd plan templates` — List built-ins (`feature`, `bug`, `refactor`) plus custom templates
- `sd plan prompt <seed-id>` — Emit a structured prompt the LLM fills in
- `sd plan submit <seed-id> --plan <file>` — Validate + spawn child seeds
- `sd plan show <pl-id>` — View sections, children, sub-plans
- `sd plan edit <id> [--name | --section <name> <text> | --step <i> --title/--priority/--type]` — In-place field edits; bumps revision
- `sd plan outcome <pl-id> --result success|partial|failure` — Record outcome (storage-only)
- `sd plan review <pl-id> --by <name>` — Record reviewer (informational)

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
