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

Every command supports `--json` for structured output. `sd list`, `sd ready`, `sd search`, `sd show`, `sd blocked`, and `sd stats` also accept `--format <markdown|compact|plain|ids|json>`; `--json` is an alias for `--format json`. The `ids` mode prints issue IDs one per line for shell pipelines, e.g. `sd list --label bug --format ids | xargs sd close`. Global flags: `-v`/`--version`, `-q`/`--quiet`, `--verbose`, `--timing`. ANSI colors respect `NO_COLOR`.

### Issue Commands

| Command | Description |
|---------|-------------|
| `sd init` | Initialize `.seeds/` in current directory |
| `sd create --title <text>` | Create a new issue (`--type`, `--priority`, `--description`, `--assignee`) |
| `sd show <id> [<id2> ...]` | Show one or more issue details (each format separates entries: human uses a horizontal rule, plain uses blank lines, JSON returns an `issues` array) |
| `sd list` | List issues with filters (`--status`, `--type`, `--assignee`, `--label`, `--priority`, `--priority-max`, `--limit`, `--all`, `--sort`, `--format`) |
| `sd ready` | Open issues with no unresolved blockers (`--type`, `--assignee`, `--label`, `--label-any`, `--unlabeled`, `--priority`, `--priority-max`, `--limit`, `--sort`, `--format`, `--respect-schedule`) |
| `sd search <query>` | Case-insensitive substring search on title + description (`--status`, `--type`, `--assignee`, `--label`, `--label-any`, `--unlabeled`, `--priority`, `--priority-max`, `--limit`, `--sort`, `--format`) |
| `sd update <id>` | Update issue fields (`--status`, `--title`, `--priority`, `--assignee`, `--description`, `--extensions`, `--clear-extensions`) |
| `sd close <id> [<id2> ...]` | Close one or more issues (`--reason`) |
| `sd dep add <issue> <depends-on>` | Add dependency |
| `sd dep remove <issue> <depends-on>` | Remove dependency |
| `sd dep list <issue>` | Show deps for an issue |
| `sd block <id> --by <blocker-id>` | Mark issue as blocked by another |
| `sd unblock <id> --from <blocker-id>` | Remove a blocker (`--all` to clear all) |
| `sd blocked` | Show all blocked issues |
| `sd label add <id> <label>` | Add a label to an issue |
| `sd label remove <id> <label>` | Remove a label from an issue |
| `sd label list <id>` | List labels on an issue |
| `sd label list-all` | List all labels across issues |
| `sd stats` | Project statistics |
| `sd sync` | Stage and commit `.seeds/` changes (`--status`, `--dry-run`) |

### Plan Commands

| Command | Description |
|---------|-------------|
| `sd plan templates` | List available plan templates |
| `sd plan prompt <seed-id>` | Emit structured planning prompt JSON for a seed (`--template`, `--domain`) |
| `sd plan submit <seed-id> --plan <file>` | Validate a plan, spawn child seeds, write the plan row (`--overwrite`, `--record-decision`, `--domain`, `--name`) |
| `sd plan show <pl-id>` | Show a plan with sections, children, and status (recurses through nested sub-plans up to `max_plan_depth`) |
| `sd plan validate <pl-id>` | Re-run validation against the current template definition |
| `sd plan list` | List plans (`--seed`, `--status`, `--outcome`, `--template`) |
| `sd plan adopt <plan-id> <seed-id...>` | Adopt one or more already-open seeds into an existing plan (`--step <i>` to anchor at a blueprint step index; link-only, bumps revision) |
| `sd plan release <plan-id> <seed-id...>` | Detach one or more seeds from a plan without closing them (link-only; bumps revision) |
| `sd plan edit <id>` | Edit plan fields in place (`--name`, `--section <name> <text>`, `--step <i>` with `--title`/`--priority`/`--type`); accepts plan id or seed id; bumps revision |
| `sd plan outcome <pl-id> --result <success\|partial\|failure>` | Record a plan outcome (`--note`) |
| `sd plan review <pl-id> --by <name>` | Record a reviewer (informational; not a state transition) |

See [Planning](#planning) below for the end-to-end workflow.

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

### Config

| Command | Description |
|---------|-------------|
| `sd config schema` | Emit the JSON Schema for `.seeds/config.yaml` (`--json` for compact output) |
| `sd config show` | Print the current config or a value at `--path` (`--json`) |
| `sd config set <path> <value>` | Validate + write a value at a dot-path; `<value>` is YAML-parsed |
| `sd config unset <path>` | Remove the value at a dot-path |

### Agent Integration

| Command | Description |
|---------|-------------|
| `sd prime` | Output AI agent context (`--compact`, `--json` emits typed `sections`) |
| `sd onboard` | Add seeds section to CLAUDE.md / AGENTS.md (picks a pi-aware variant when `.pi/settings.json` lists `@os-eco/seeds-cli`) |
| `sd setup pi` | Wire the in-tree `@os-eco/pi-seeds` extension into a project's pi runtime (`--check`, `--remove`) |

For the full pi-coding-agent integration (auto-prime, status widget, custom `sd_*` tools, `#sd-*` autocomplete, `/sd*` slash commands), see [`extensions/pi/README.md`](./extensions/pi/README.md).

### Utility

| Command | Description |
|---------|-------------|
| `sd upgrade` | Upgrade seeds to latest version from npm (`--check`) |
| `sd completions <shell>` | Output shell completion script (bash, zsh, fish) |
| `sd migrate-from-beads` | Import `.beads/issues.jsonl` into `.seeds/` |

## Planning

`sd plan` adds structured planning that spawns child seeds. Use it when work is large or ambiguous enough that an LLM benefits from decomposing it before implementing — for small, well-scoped tasks just `sd create` directly.

The walkthrough is a three-step loop: **prompt → fill → submit**.

### 1. Emit a prompt

```bash
sd plan prompt seeds-9c4d --json
```

Returns a structured prompt request the LLM can fill in:

```json
{
  "plan_request": {
    "seed": "seeds-9c4d",
    "template": "feature",
    "instructions": "Fill every section. Required fields are marked.",
    "sections": [
      { "name": "context", "required": true, "kind": "text", "min_length": 50, "prompt": "Why does this work need to happen?", "prior_art": [] },
      { "name": "approach", "required": true, "kind": "text", "prompt": "What's the chosen approach, and why this over alternatives?", "prior_art": [] },
      { "name": "steps", "required": true, "kind": "steps", "min": 2, "prompt": "Decompose into ordered, independent implementation steps." },
      { "name": "acceptance", "required": true, "kind": "list", "min": 1, "prompt": "Concrete, verifiable conditions for plan completion." }
    ],
    "validation": { "all_required_present": true, "min_steps": 2, "min_acceptance": 1 }
  }
}
```

### 2. Submit the filled plan

The LLM produces a submission JSON in the same shape, with concrete content. Each `steps[]` entry becomes a child seed; `blocks: [step_index]` translates into seed-level `blockedBy` dependencies. Step indices in `blocks` are 1-based (step 1 is the first step). A step may also declare an optional `labels: string[]` array — values are normalized (lowercased, trimmed, deduped) and applied to the spawned child seed (or merged additively into the adopted seed's existing labels).

```json
{
  "template": "feature",
  "name": "Schema-driven plan validation",
  "sections": {
    "context": "...",
    "approach": "Use AJV to validate template-driven plans, mirroring mulch's custom_types pipeline.",
    "steps": [
      { "title": "Schema generator", "type": "task", "priority": 1, "blocks": [2, 3], "labels": ["nightwatch"] },
      { "title": "Submit command",   "type": "task", "priority": 1, "blocks": [] },
      { "title": "Show command",     "type": "task", "priority": 2, "blocks": [] },
      { "title": "Audit cookie flags", "type": "task", "priority": 2, "blocks": [], "existing_seed": "seeds-aa05" }
    ],
    "acceptance": ["End-to-end submit + show works"]
  }
}
```

A step with `existing_seed: "<seed-id>"` adopts an already-open seed at that index instead of spawning a fresh child — see [Adopting existing seeds](#adopting-existing-seeds). On adoption-only steps the `title` field may be omitted; the adopted seed's title is preserved either way. `existing_seed` and `plan_template` are mutually exclusive on the same step.

```bash
sd plan submit seeds-9c4d --plan plan.json
sd plan submit seeds-9c4d --plan plan.json --name "Schema-driven plan validation"
```

Validates against the template, spawns one child seed per step, wires `blockedBy` from `step.blocks`, and writes a `plans.jsonl` row with status `approved`. The optional `--name <text>` flag (or top-level `"name"` in the plan JSON) sets a short human-readable label surfaced in `sd plan list` and `sd plan show`; when neither is provided, `sd plan submit` derives the name from the parent seed's title. `--overwrite` keeps the existing name unless a new one is supplied.

### 3. Show, outcome, review

```bash
sd plan show pl-a1b2                   # sections, children, recursive sub-plans
sd plan outcome pl-a1b2 --result success
sd plan review pl-a1b2 --by alice      # optional, informational
```

Outcomes (`success | partial | failure`) are storage-only — aggregation and retros are out of scope and left to teams. Review is suggested but never gating: `sd plan show` prints a "review suggested" hint when the plan is `approved`/`active` and no reviewer is recorded.

### Built-in templates

| Template   | Default for      | Adds                                      |
|------------|------------------|-------------------------------------------|
| `feature`  | `task`, `feature`, `epic` | `context`, `approach`, `alternatives`, `steps`, `risks`, `acceptance` |
| `bug`      | `bug`            | `reproduction`, `root_cause`              |
| `refactor` | opt-in only      | `behavior_invariant` (must stay equal)    |

`refactor` is opt-in via `--template refactor` — it has no matching seed type so seeds does not auto-route to it. Custom templates declared under `plan_templates:` in `.seeds/config.yaml` override the built-ins.

### Nested plans

A step can declare `plan_template: <name>` to spawn a child seed that requires its own sub-plan. The child is created with `requires_plan: true` and is hidden from `sd ready` until its plan is submitted. `sd plan show` recursively renders nested plans up to `max_plan_depth` (default 3).

### Adopting existing seeds

A plan can link in already-open seeds instead of duplicating them as fresh children. Adoption is **link-only** — the seed's `status`, `assignee`, `labels`, `priority`, `type`, and `title` are never mutated; only the plan link is added. Release is the inverse: detach without closing.

Three surfaces stage adoptions:

```bash
# 1. Submit-time — set existing_seed on a step in the plan JSON
sd plan submit seeds-9c4d --plan plan.json   # step with "existing_seed": "seeds-aa05"

# 2. Post-submit adoption (loose, or anchored to a blueprint step index)
sd plan adopt pl-a1b2 seeds-aa05             # loose: no plan_step_index recorded
sd plan adopt pl-a1b2 seeds-aa05 --step 3    # anchored at 1-based blueprint step 3

# 3. Release — detach without closing
sd plan release pl-a1b2 seeds-aa05
```

End-to-end example: stage two ad-hoc bugs into a freshly approved auth plan, then drop one back out.

```bash
# Two open bugs and a feature seed for OAuth work
$ sd ready --format compact
seeds-aa05  bug   P2  Audit cookie flags
seeds-bb11  bug   P2  Fix CSRF token rotation
seeds-9c4d  feat  P1  OAuth login

# Plan the feature; submit a plan that adopts the cookie-flags bug at step 3
$ sd plan submit seeds-9c4d --plan oauth-plan.json
✓ plan pl-7f2a created (3 children spawned, 1 adopted)

$ sd plan show pl-7f2a
Plan: pl-7f2a [approved] rev 1
...
Children (4):
  seeds-1101  [open]  Add OAuth provider config
  seeds-1102  [open]  Wire callback handler
  seeds-aa05  [open]  Audit cookie flags (adopted)
  seeds-1103  [open]  Verify end-to-end login

# Later: pull the second bug in too (loose; no specific step anchor)
$ sd plan adopt pl-7f2a seeds-bb11
✓ plan pl-7f2a revision bumped to 2

# Realize the CSRF bug should ship separately — release it
$ sd plan release pl-7f2a seeds-bb11
✓ plan pl-7f2a revision bumped to 3
$ sd show seeds-bb11   # still open, plan link gone, backref block stripped
```

Adoption applies the `seeds:plan-backref` block to the adopted seed's description (manual notes wrapping the markers survive). Release strips only that marker block. `sd plan show` tags adopted children with a muted `(adopted)` suffix in human output; `--json` adds `adopted: true` to each child summary that's listed in `plan.adoptedChildren`.

### Editing a plan in place

Use `sd plan edit` for targeted, field-level fixes — typo in the approach section, rename a step, change a step's priority or type — without re-submitting the whole plan JSON via `--overwrite`. Each invocation bumps `plan.revision` once and updates `plan.updatedAt`; structural edits (add/remove/reorder steps) still require `--overwrite`.

```bash
# Rename the plan label
sd plan edit pl-a1b2 --name "OAuth login (v2)"

# Replace a text section. --section approach also refreshes the seeds:plan-backref
# block on every child seed so the snippet stays in sync with the live plan.
sd plan edit pl-a1b2 --section approach "Use the new provider SDK; ..."
sd plan edit pl-a1b2 --section context  "...updated rationale..."

# Step metadata edits propagate to the corresponding child seed
# (looked up via plan.children[i-1]; --step is 1-based, matching step.blocks).
sd plan edit pl-a1b2 --step 2 --title "Wire callback handler (PKCE)"
sd plan edit pl-a1b2 --step 2 --priority 1
sd plan edit pl-a1b2 --step 2 --type bug

# Multiple flags compose atomically in one invocation
sd plan edit pl-a1b2 --name "OAuth v2" --section approach "..." --step 2 --priority 1
```

`<id>` accepts either a plan id (`pl-*`) or the parent seed id. Out-of-range `--step` and unknown sections exit non-zero with both JSONL files untouched. Lock order matches the rest of the planning surface: outer `plans.jsonl`, inner `issues.jsonl`.

Rejections are fail-fast and pre-write (both `plans.jsonl` and `issues.jsonl` are untouched on any error):

- adopting a seed that's closed, missing, attached to a *different* plan, or equal to the plan's parent seed
- listing the same seed twice in one command, or twice across `steps[]` in one submit
- setting both `existing_seed` and `plan_template` on the same step
- releasing a seed that isn't attached to the named plan, or equals the plan's parent

Reassigning a seed across plans is two explicit steps: `sd plan release <other-pl> <seed>` first, then adopt.

Full spec: see [PLAN_SPEC.md](./PLAN_SPEC.md).

## Extensions

Issues carry an optional `extensions?: Record<string, unknown>` field for **runtime metadata** owned by downstream consumers — warren's scheduling state, greenhouse's dispatch pointers, overstory's run trail. Seeds itself treats the value as opaque JSON: no schema, no validation, round-trips byte-for-byte through `.seeds/issues.jsonl`.

```bash
# Set or merge extension keys (shallow merge, one level deep)
sd update seeds-a1b2 --extensions '{"warren_role":"refactor-bot","warren_scheduledFor":"2026-05-12T03:00:00Z"}'

# Subsequent updates merge into existing keys
sd update seeds-a1b2 --extensions '{"warren_lastRunId":"r-9c4d"}'
# → extensions: { warren_role, warren_scheduledFor, warren_lastRunId }

# Drop the field entirely
sd update seeds-a1b2 --clear-extensions
```

`sd show` renders an `Extensions: key=value ...` line when the field is present; values are JSON-encoded so strings stay quoted and nested objects/arrays/null are unambiguous. `sd list --format json`, `sd show --json`, and `sd ready --format json` already serialize the field as part of the issue payload — no extra flag.

### Conventions

- **Namespace your keys.** Each consumer owns a top-level prefix (`warren_*`, `greenhouse_*`) or a single namespaced sub-object — never bare keys like `role` or `lastRun` at the root of `extensions`. This avoids collisions across tools.
- **Keep keys flat for partial updates.** `--extensions` shallow-merges (`{...existing, ...incoming}`); a nested `lastRun: {id, at}` patch will overwrite the entire object. If you need partial updates of related fields, use sibling keys (`lastRunId`, `lastRunAt`).
- **Plain object only.** Top-level `extensions` must be a JSON object — arrays, `null`, and scalars are rejected by `sd update` and flagged by `sd doctor`. Nested values inside the object can be anything.
- **Concurrent writes follow the JSONL merge model.** Like every other field, two branches that update `extensions` on the same issue collapse via `merge=union` + dedup-on-read (last-occurrence wins). Consumers needing strict ordering should serialize through a single agent.

### Schedule-aware ready (opt-in)

`sd ready --respect-schedule` consumes two well-known keys so warren can park items without losing them:

```bash
sd ready --respect-schedule
```

Excludes issues where:
- `extensions.queued === true` (strict equality) — intentionally parked
- `extensions.scheduledFor` parses to a future ISO8601 timestamp — not due yet

Default `sd ready` (no flag) is unchanged — agents still see queued items unless they ask for the schedule-aware view. Malformed or past values fall through as if the keys weren't set.

### Health

`sd doctor` includes an `extensions-schema` check that flags non-object `extensions` values; `sd doctor --fix` drops them.

## Config

`.seeds/config.yaml` is a small structured surface — `project`, `version`, `max_plan_depth`, and the nested `plan_templates` editor for custom plan templates. Seeds publishes a JSON Schema for this file so external UIs (warren V2's per-tool config editor) can render forms automatically and write back via per-knob CLI commands.

```bash
# Emit the schema (warren reads this once, renders a form)
sd config schema --json

# Read whole config or a specific dot-path
sd config show
sd config show --path plan_templates.feature.sections.context

# Write a value (YAML-parsed; validated against the schema before write)
sd config set max_plan_depth 5
sd config set plan_templates.spike.sections.context \
  '{required: true, kind: text, prompt: "Why this spike?", min_length: 30}'

# Remove a value
sd config unset plan_templates.spike
```

Writes hold the `config.yaml` advisory lock and validate the post-write file as a whole — partial writes that would leave the file inconsistent are rejected. The schema's `additionalProperties: false` posture means unknown root keys are rejected; namespace-your-keys rules apply at the issue level (`Issue.extensions`), not in the project config.

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

<p align="center">
  <img src="https://raw.githubusercontent.com/jayminwest/os-eco/main/branding/logo.png" alt="os-eco" width="444" />
</p>

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
