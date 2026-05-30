# Changelog

All notable changes to Seeds will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.7] - 2026-05-30

Nightwatch patrol fixes (plan pl-ee1e): four narrow correctness and hygiene fixes from a nightwatch sweep.

### Fixed
- `sd update --title` now trims whitespace before storing, matching `sd create`. (seeds-dfe7)
- `sd upgrade --check --json` now exits non-zero when an update is available, matching the non-JSON path. (seeds-15ae)

### Internal
- Cleaned stale `knip.json` hints — removed gitignored dirs (`dist`, `coverage`, `test-results`), the `.seeds` data dir, no-match `extensions/**/*.ts` patterns, and the redundant `src/index.ts` entry. `bunx knip` now reports zero configuration hints. (seeds-c437)
- Removed unused exports (`writeConfig`, `isFormatMode`, `formatExtensionsLine`) and types (`DomainSource`, `SectionRequest`, `PlanOutcome`, `ConvoyStatus`) flagged by knip. (seeds-faab)

## [0.5.6] - 2026-05-29

Nightwatch patrol fixes (plan pl-b42c): two narrow correctness fixes from a nightwatch sweep.

### Fixed
- Top-level error handler no longer masks the original failure when the lazy `pino` import throws (e.g. module missing). Extracted to `src/error-handler.ts` with unit coverage for the missing-module path. (seeds-3287)
- `--json` output is now consistently 2-space indented at every CLI exit point in `src/index.ts` and `src/error-handler.ts`, matching `outputJson()`. (seeds-49dd)

## [0.5.5] - 2026-05-28

### Added
- `sd plan create <seed-id>` creates a first-class adopt-only plan: zero spawned children and an empty steps blueprint, intended to be populated via `sd plan adopt`. Removes the placeholder-step dance (submit throwaway steps → release → close) the release-train use case previously required. Supports `--name` and `--template`. (seeds-3dd1)
- `sd plan reorder <plan-id> <seed-id...>` sets the exact `plan.children` order in one call (ids must be a permutation of current children). warren's plan-run consumes `plan.children` order verbatim, so this pins a release seed last. (seeds-3dd1)
- `sd plan adopt` gains `--at <i>` / `--before <seed>` / `--after <seed>` (mutually exclusive) to control the children insertion position; omitting all three appends as before. (seeds-3dd1)
- `sd prime` documents the adopt-only plan commands (`sd plan create` / `adopt` / `reorder`) in the Planning command group. (seeds-3dd1)

### Internal
- **L5 agent-readiness uplift** — ported the os-eco L5 toolkit into seeds: ratchet scripts (`check:size`, `check:debt`, `check:coverage`) with seeds-specific budgets, quality reporters (`report:test-timing`, `report:quality`), and the AGENTS.md validator (`check:agents`), each with co-located tests. A `check:all` aggregator wires them together and `ci.yml` runs the full gate. (VAL-SEEDS-007/009/011/012/018/FINAL)
- **Governance scaffolding** — added `.github/` baseline (`dependabot.yml`, issue/PR templates, `labels.yml`, `sync-labels.yml` workflow), drop-in tool configs (Biome, knip, jscpd, bunfig), `.devcontainer/`, `.env.example`, and a `.gitignore` baseline. (VAL-SEEDS-004/005/006/008/010/015/016/017/020/021/024, seeds-f749)
- **Structured logging** — added `src/log.ts` (pino logger with redaction); the top-level error handler now routes failures through `log.debug` for observability, silent at the default level and surfaced under `SEEDS_DEBUG=1`. (VAL-SEEDS-016/017)
- **Docs** — authored `AGENTS.md` and `RUNBOOK.md`, plus a `.factory/skills/seeds-issue-workflow` skill; a `prepare` script points `core.hooksPath` at a pre-commit hook. (VAL-SEEDS-013/014/019/023)

## [0.5.4] - 2026-05-28

Nightwatch patrol fixes (plan pl-ca00): a second batch of small correctness and consistency fixes from a nightwatch sweep.

### Added
- `sd blocked --json` annotates results with `plan_status` and `plan_children`, matching `sd list|ready|search --json`. (seeds-5f5c)

### Changed
- `sd upgrade` reads the current version from the `VERSION` constant in `src/version.ts` instead of re-reading `package.json` at runtime, removing a redundant filesystem lookup. (seeds-a665)
- `sd upgrade` output now uses the shared `brand` / `printSuccess` / `printWarning` helpers for consistency with the rest of the CLI. (seeds-c9cc)
- `sd init` appends any missing `merge=union` `.gitattributes` lines per-file instead of skipping the whole block when the file already exists. (seeds-545e)

### Fixed
- Unknown-command branch in `src/index.ts` now emits a structured JSON error when `--json` is present, instead of human-readable text. (seeds-8aa5)

### Internal
- Extracted duplicated `issueJsonWithPlan` helper into `src/plan-context.ts` and reused it across `list`, `ready`, `search`, and `blocked` JSON output paths. (seeds-455c)

## [0.5.3] - 2026-05-27

### Added
- `sd create` accepts `--label <labels>` as a hidden alias for `--labels`, matching the pattern used elsewhere in the CLI. Comma-separated values are supported; the option is omitted from `--help` output to keep the surface clean. (seeds-76cf / plan pl-f4dc)

## [0.5.2] - 2026-05-27

Nightwatch patrol fixes (plan pl-09b0): a batch of small correctness and consistency fixes discovered during a nightwatch sweep.

### Fixed
- `stripAnsi` regex in `src/format.ts` now matches the ESC byte (`\x1b`), so ANSI escape sequences are actually stripped from non-TTY output. (seeds-d6dd)
- `printWarning` routes to stderr and honors `--quiet`, matching `printError` semantics. Scripts piping stdout no longer see warning noise interleaved with structured output. (seeds-c273)
- `sd update <id> --title` now rejects empty/whitespace titles instead of silently clearing the field. (seeds-7000)
- `sd block <id> --by <id>` and `sd dep add <a> <b>` reject self-references with a clear error. (seeds-fd19)
- `sd onboard` surfaces a descriptive error when `replaceMarkerSection` returns falsy (e.g. an outdated marker block); the previous behavior was a silent no-op. (seeds-206f)

### Changed
- `sd search --json` annotates results with `plan_status` and `plan_children`, matching `sd list --json` and `sd ready --json`. (seeds-92ef)
- `sd list|ready|search --limit` validates input — non-integer or non-positive values are rejected up front instead of silently coercing. (seeds-9d2a)

### Docs
- CLAUDE.md lock-constants section reconciled with the actual values in `src/types.ts` (30s stale, 100ms retry, 30s timeout). (seeds-b1d2)

## [0.5.1] - 2026-05-26

### Removed
- **`@os-eco/pi-seeds` extension reverted** — the entire `extensions/pi/` directory, `sd setup pi` command, pi-aware `sd onboard` variant, and `pi` config schema section have been removed. Optional peer dependencies on `@earendil-works/pi-coding-agent` and `typebox` dropped. `package.json` no longer declares `pi.extensions` or ships the `extensions/` directory. The experiment shipped in v0.5.0 and was reverted before any downstream adoption. (seeds-2f21)

### Changed
- `sd onboard` snippet simplified — pi-variant detection removed; onboard schema bumped from 6 to 7. Existing snippets will auto-upgrade on next `sd onboard` run.
- `tsconfig.json` no longer includes `extensions/**/*` or sets `skipLibCheck`.

## [0.5.0] - 2026-05-26

### Added
- **`sd plan edit <id>`** — targeted, field-level edits to an existing plan without re-submitting the whole plan JSON via `--overwrite`. Accepts a plan id (`pl-*`) or the parent seed id. Every invocation bumps `plan.revision` once and refreshes `plan.updatedAt`. Structural changes (add/remove/reorder steps) still require `--overwrite`. (seeds-a2de / plan pl-dee8)
  - `--name <text>` sets the plan's human-readable label. (seeds-9b12)
  - `--section <name> <text>` replaces a text section; `--section approach` refreshes the `seeds:plan-backref` block on every child seed. (seeds-21f2)
  - `--step <i> [--title] [--priority] [--type]` edits step metadata and propagates to the corresponding child seed. 1-based indexing, matching `step.blocks`. (seeds-64cf)
- **Plan step labels** — steps accept an optional `labels: string[]` field that flows to the spawned (or adopted) child seed. Values are normalized (lowercased, trimmed, deduped) and merged **additively** on adoption so labels users added by hand are never clobbered. Lets warren patrol agents (nightwatch, bugwatch) declare provenance labels declaratively in the plan JSON. (seeds-576c / pl-e5a8)
- Docs updated: README "Editing a plan in place" section, PLAN_SPEC.md "In-Place Editing" section, CLAUDE.md plan command reference + planning notes, `sd prime` Planning command group, `sd onboard` planning bullets (snippet schema bumped to 6). (seeds-d457)

### Changed
- **Test suite runs ~5.5x faster** (~99s → ~18s for 882 tests). Command tests now invoke exported `run`/`register` entry points in-process via `src/test-harness.ts` instead of spawning `bun run src/index.ts` per assertion. Subprocess spawns remain only where justified: `cli-smoke.test.ts` (real binary boot path), `completions.test.ts` / `suggestions.test.ts` / `timing.test.ts` (root-level commander surfaces), `plan-submit-record-decision.test.ts` (fake `ml` on PATH), `sync.test.ts` (real git). (seeds-a3bd, pl-86aa)

## [0.4.7] - 2026-05-18

### Added
- `sd plan submit` accepts adoption-only steps that omit `title`. A step that supplies `existing_seed` no longer needs a `title` field — the adopted seed's title is preserved verbatim either way, so requiring a duplicate value forced callers to look up titles they didn't otherwise need. Fresh-spawn steps still require `title`; the post-AJV pass in `plan-schema.ts` enforces "title XOR existing_seed" per step and emits a path-anchored error when neither is set. Unlocks the warren §11.Q synthesis flow, where a Plot's already-attached seeds are bound to a new parent plan with no fresh spawns: warren can submit `{ existing_seed: "<id>" }` per child without fabricating titles. Plan-row output (`plans.jsonl`) is byte-compatible with prior adoption submits — `children` is still the projected id list, and `adoptedChildren` is still tracked. (seeds-5583, warren §11.Q upstream blocker)

## [0.4.6] - 2026-05-15

### Added
- **`@os-eco/pi-seeds` extension shipped in-tree** under `extensions/pi/`. A [pi-coding-agent](https://github.com/earendil-works/pi-coding-agent) extension that hard-wires the seeds session rituals into pi lifecycle events. The CLI and the extension always agree on JSON shapes because they live in the same repo and the extension imports the typed section shape (`PrimeSectionsFull`) from `src/commands/prime.ts` directly — the contract is in-process, not over a JSON wire. `package.json` declares `"pi": { "extensions": ["./extensions/pi/index.ts"] }` so pi auto-loads the extension from any project that lists `@os-eco/seeds-cli` in `.pi/settings.json` → `packages`. Inert when pi is not the active runtime. Capabilities below are gated by `pi:` keys in `.seeds/config.yaml`. (seeds-foundation)
  - **Auto-prime on `before_agent_start`** — selected `sd prime --json` sections are injected into the system prompt. Configurable via `pi.prime.sections` (default `[closeProtocol, rules]`; full set: `closeProtocol`, `rules`, `commandGroups`, `workflows`). Disable globally with `pi.auto_prime: false`, or per-session with an empty `sections` list.
  - **Status widget** on `agent_end` — renders `sd: <n> ready / <n> in-progress / <n> blocked` in pi's status line; refreshed only when `.seeds/issues.jsonl` mtime changes (catches local writes, hand-edits, and merges from sibling worktrees) so idle sessions don't re-shell out. Gated by `pi.status_widget` and `pi.cache.invalidate_on_write`.
  - **Custom tools** — `sd_create`, `sd_ready`, `sd_show`, `sd_update`, `sd_close`, `sd_dep`, `sd_search`. Thin shims over `sd <cmd> --json` so the LLM stops re-parsing human output. `sd_close` returns structured `{success:false, error, exitCode, stderr}` on failure instead of throwing. All tools shell out via `pi.exec("sd", [...args, "--json"], { cwd: ctx.cwd })` so `.seeds/` resolves correctly inside `git worktree`-linked checkouts.
  - **`#sd-*` autocomplete** in pi's input — typing `#sd-` opens a completion list of cached ready ids (priority-then-id sort, filtered by substring after the dash); selecting one inserts the full `#sd-<id>` token. Cache refreshes on `session_start` and on `agent_end` (only when issues.jsonl mtime changed).
  - **Reference expansion** on user-message send — `#sd-<id>` tokens in a message inline `sd show <id> --json` as a hidden `<seeds-context>` block (deduped, capped at `pi.reference_expansion.max_refs`, default 5; `0` disables expansion entirely).
  - **Slash commands** — `/sd <args>`, `/sd:ready`, `/sd:create <title>`, `/sd:show <id>`, `/sd:close <id>`, `/sd:claim <id>`. `/sd:claim` runs `sd update <id> --status in_progress` and pins `working: <id>` onto the status widget; the prefix survives `/reload` via persisted `currentIssueId` state. `/sd:close` clears the prefix when the closed id matches `currentIssueId`. Gated by `pi.commands`. (seeds-5103)
- `sd setup pi` recipe wires the in-tree extension into a project's pi-coding-agent runtime: adds `@os-eco/seeds-cli` to `.pi/settings.json` → `packages` (so pi auto-loads the extension on every session), and refreshes the CLAUDE.md / AGENTS.md seeds section to a short pi-aware variant pointing at the manual CLI escape hatches instead of repeating the prime/close ritual the extension now handles on lifecycle events. Both legs are idempotent and reversible (`--check` reports `installed | outdated | not_installed`, `--remove` reverts both). The recipe is the first built-in shipped by `sd setup`, mirroring `ml setup pi`. (seeds-89d2)
- `sd onboard` now picks a pi-aware snippet variant when `.pi/settings.json` lists `@os-eco/seeds-cli`. The schema marker bumps from `4` → `5` and gains a `:pi` suffix when the variant is active (`<!-- seeds-onboard-schema:5 -->` vs `<!-- seeds-onboard-schema:5:pi -->`), so install-state detection rides on the same outdated-snippet check rather than a parallel marker scheme. Existing seeds-onboarded projects will read as `outdated` until they re-run `sd onboard`; this is the intended migration path. `runOnboard({ variant, silent })` is exported so the `setup pi` recipe can flip the variant without double-logging. (seeds-89d2)
- `sd prime --json` now exposes a typed `sections` field alongside the existing `content` blob, so TUIs, slash-command palettes, and config-UI surfaces can render rules/commands/workflows structurally instead of dumping the entire markdown into context. The shape mirrors the markdown headings: `closeProtocol.steps[]`, `rules[]`, `commandGroups[]` (each with `name`, `commands[]`, optional `notes[]`), and `workflows[]` (each with `name` + shell `commands[]`). `--compact --json` returns a smaller compact-mode payload with the quick-reference command list, planning note, and closing note. The structured data is now the source of truth — markdown is rendered from it, so the two stay in sync. Backwards compatible: `content` is still emitted, and existing non-`--json` output is byte-identical. When a project-local `.seeds/PRIME.md` overrides the default, `sections` is `null` since custom markdown is opaque to seeds. (seeds-e445)
- `.seeds/config.yaml` schema gains a `pi` section covering `auto_prime`, `status_widget`, `prime.sections`, `cache.invalidate_on_write`, `reference_expansion.max_refs`, and `commands`. Validated by `sd config set` writes against the same JSON Schema the CLI surfaces via `sd config schema --json` for warren's UI.
- Optional peer dependencies on `@earendil-works/pi-coding-agent` and `typebox` (both `peerDependenciesMeta.optional: true`) so the CLI installs cleanly without pi. New `extensions` directory ships alongside `src` in the npm package; the `files` field is updated accordingly.

### Tests
- `extensions/pi/lib/{autocomplete,commands,config,prime,status,tools}.test.ts` — unit tests for the new extension surfaces.
- `src/commands/{setup,onboard,prime,config}.test.ts` — coverage for `sd setup pi`, the pi-aware onboard variant, the typed `sd prime --json sections`, and the `pi` config-schema additions. (seeds-17a8)

## [0.4.5] - 2026-05-14

### Added
- `sd plan` can adopt and release already-open seeds without duplicating them. Adoption and release are **link-only** — they never mutate the seed's `status`, `assignee`, `labels`, `priority`, `type`, or `title`; only the plan link, the `seeds:plan-backref` block in `description`, and parent↔child `blocks`/`blockedBy` edges are touched. Each command bumps `plan.revision` once. Lock order matches `sd plan submit`: outer `plans.jsonl`, inner `issues.jsonl` (mx-f29e43). All candidates are resolved in a pre-write pass — any rejection aborts the command with both JSONL files untouched. (seeds-3c89, plan pl-43ff)
  - `Step.existing_seed?: string` on the `sd plan submit` JSON schema — a step with `existing_seed: "<seed-id>"` adopts the named open seed at that index instead of spawning a fresh child. Mutually exclusive with `plan_template` on the same step. Title mismatch (`seed.title !== step.title`) emits a `⚠` warning to stderr and keeps the seed's title. (seeds-7002, seeds-24c6)
  - `sd plan adopt <plan-id> <seed-id...> [--step <i>]` — post-submit adoption. `--step` is the 1-based blueprint step index to anchor against; omit it for a loose adoption (no `plan_step_index` is recorded and the backref reads `Adopted into plan <pl-id>`). Adopting an in-progress seed is allowed and intentional. (seeds-2b93)
  - `sd plan release <plan-id> <seed-id...>` — detach one or more seeds without closing. `stripPlanBackref` removes only the marker block from the seed's description (returns the field as `undefined` when nothing else remained), `plan_id` + `plan_step_index` are cleared, the parent↔child edges are unwired, and the seed is dropped from `plan.children` (and `plan.adoptedChildren` if present). The seed itself remains open. (seeds-2b8a)
  - `applyOverwrite` matches existing plan children by `step.existing_seed` id first, then by `step.title` — id-first precedence keeps adopted children stable across overwrites and prevents title-match races with id-pinned steps. Pre-existing overwrite-by-title behavior is unchanged when no step uses `existing_seed`; the same-plan-adoption shortcut allows the overwrite path to refresh an already-attached child without tripping the cross-plan rejection. (seeds-99ae)
  - `Plan.adoptedChildren?: string[]` — adopted seed ids tracked on the plan row, persisted only when non-empty so plans that never use adoption produce byte-identical `plans.jsonl` output. `sd plan show` renders adopted entries with a trailing muted `(adopted)` tag in human output (top-level and nested sub-plans); `--json` adds `adopted: true` on each child summary listed in `plan.adoptedChildren`. (seeds-a3ab)
- Rejections (fail-fast, pre-write): adopting a seed that is closed, missing, attached to a *different* plan, or equal to the plan's parent seed; listing the same seed twice in one command or two `steps[]` in one submit; combining `existing_seed` with `plan_template`; releasing a seed that isn't attached to the named plan or equals the plan's parent; `--step <i>` out of range on `sd plan adopt`. Cross-plan reassignment is two explicit commands: `sd plan release <other-pl> <seed>` then `sd plan adopt <new-pl> <seed>` (a future `--reassign-from <pl>` flag is deferred).
- PLAN_SPEC.md gains an "Adoption and Release" section documenting the lifecycle (per-field add/remove on each side), validation tables, lock order, and edge cases (loose adoption, JSONL byte stability, manual notes around the backref markers).

## [0.4.4] - 2026-05-13

### Changed
- **BREAKING (plan submit wire format)**: `steps[].blocks` in `sd plan submit` payloads now uses **1-based** step indices (step 1 is the first step, step N is the last). Previously 0-based. LLMs — the primary authors of plan files — consistently produced 1-based blocks, so the wire format moves to match. Concretely: a two-step plan where step 1 blocks step 2 is now `[{ title: "...", blocks: [2] }, { title: "...", blocks: [] }]`. The validator rejects `0` and out-of-range values with `step indices are 1-based; valid range 1..N`; the self-reference check is now "step n cannot have `n` in its own blocks". The internal `Issue.plan_step_index` back-link stored on each spawned child stays 0-based — it's not author-facing. `sd plan show` renders stored 1-based values verbatim (no offset shift), so output is unchanged for plans submitted under the new format. Plans stored before this change (`.seeds/plans.jsonl` rows with the old 0-based values) are not migrated; the stored numbers are display-only after spawning since children already carry resolved seed-id `blocks`/`blockedBy` edges. PLAN_SPEC.md, the `sd plan prompt` INSTRUCTIONS string, and the README example all reflect 1-based indexing. (seeds-185f)

### Added
- `Plan.name?: string` — optional short human-readable label so `sd plan list` and `sd plan show` carry semantic signal beyond opaque `pl-*` ids. `sd plan submit` resolves the name in priority order: `--name <text>` flag > top-level `name` field in the plan JSON > parent seed's title (fallback). `sd plan show` renders a `Name:` header line; `sd plan list` shows the name (or `(unnamed)`) in a fixed-width column between `rev` and `template`, truncated with `…` at ~40 chars. `--json` payloads gain the field additively — existing plans without a `name` row continue to deserialize. `--overwrite` preserves the existing name unless `--name` or the plan JSON supplies a new one. (seeds-5640)

## [0.4.3] - 2026-05-10

### Added
- `sd show <id> [<id2> ...]` accepts multiple ids in one call; agents reviewing related issues (blockers, deps, plan children) no longer pay one shell-out per id. Each output format gets a per-format separator: default human uses a 60-char `─` divider between entries, `--format plain` uses a blank line, `--format compact` and `--format ids` print one entry per line, `--json` returns an `issues` array (with optional `errors` for unknown ids). Single-id behavior — including the `{issue, plan, plan_children}` JSON shape and the `pl-*` → `sd plan show` routing — is preserved exactly; plan ids in multi-id mode are reported as per-id errors pointing at `sd plan show`. Unknown ids do not abort the rest of the call (mirroring `sd close`); the command exits non-zero when any id fails. (seeds-4eba)
- `sd config` command tree — schema-driven read/write surface for `.seeds/config.yaml` aimed at warren V2's per-tool config UI (warren ROADMAP R-10). `sd config schema [--json]` emits the JSON Schema; `sd config show [--path <p>] [--json]` reads the whole config or a value at a dot-path; `sd config set <path> <value>` validates + writes atomically (`<value>` is YAML-parsed); `sd config unset <path>` removes a value. Writes hold the `config.yaml` advisory lock and validate the post-write file against the schema; partial writes that would leave the file inconsistent are rejected. The schema covers `project`, `version`, `max_plan_depth`, and the nested `plan_templates` editor (with built-in template defaults in `examples`). Locked with a golden test in `src/commands/config.test.ts` so any wire-format change is intentional. (seeds-ac83)
- `sd doctor` adds a `closed-fields-consistency` check (`--fix`-able): non-closed issues with stale `closedAt`/`closeReason` fail (fix clears both); closed issues missing `closedAt` warn (fix sets it to `updatedAt`). Doctor pass count bumped 11 → 12. (seeds-8526)

### Fixed
- `sd show <pl-id>` now shows the plan instead of erroring `Issue not found`. When the requested id starts with `pl-` and isn't in `issues.jsonl`, `sd show` routes to the same renderer as `sd plan show` for both default and `--json` output. `--format compact|plain|ids` on a plan id errors with a hint pointing to `sd plan show`. Issue lookup happens first, so projects literally named `pl` (whose issue ids share the `pl-XXXX` shape) still resolve normally. (seeds-66de)
- `sd update --status open` (or any non-closed status) now drops stale `closedAt` / `closeReason` from the record. Previously a close→reopen cycle left phantom close metadata so `sd show` displayed a "closed at" timestamp on an open issue. (seeds-8526)

## [0.4.2] - 2026-05-10

### Added
- `Issue.extensions?: Record<string, unknown>` — optional, opaque-to-seeds field for runtime metadata that consumers (warren, greenhouse, overstory) own under namespaced keys. Seeds performs no schema validation on the value; it round-trips byte-for-byte through `.seeds/issues.jsonl`. (seeds-f35a, plan pl-c195)
- `sd show` renders an `Extensions: key=value ...` line when the field is present and non-empty; each value is JSON-encoded so strings stay quoted and nested objects/arrays/null are unambiguous. JSON output is unchanged — extensions already serialized as part of the issue payload. (seeds-e7ea)
- `sd update --extensions <json>` shallow-merges (`{...existing, ...incoming}`) a JSON object into `Issue.extensions`. `--clear-extensions` removes the field. The two flags are mutually exclusive; arrays, `null`, scalars, and malformed JSON are rejected with a clear error. Merge is one level deep — consumers needing nested structure should keep keys flat (e.g. `lastRunId`, `lastRunAt`) rather than nesting under `lastRun`. (seeds-be14)
- `sd ready --respect-schedule` (opt-in) excludes issues where `extensions.queued === true` (strict equality) or `extensions.scheduledFor` parses to a future ISO8601 timestamp. Default `sd ready` behavior is unchanged — agents still see queued items unless they ask for the schedule-aware view. Designed for warren's cron-driven dispatch. (seeds-614b)
- `sd doctor` adds an `extensions-schema` check that flags non-object `extensions` values (null, arrays, scalars). `sd doctor --fix` drops malformed values. (seeds-56ff)

### Convention
- **Extension namespacing.** Each consumer owns a top-level prefix on `Issue.extensions` (e.g. `extensions.warren_*`, `extensions.greenhouse_*`) or a single namespaced sub-object. The two well-known keys consumed by `sd ready --respect-schedule` are `extensions.queued` (boolean) and `extensions.scheduledFor` (ISO8601 string). Other keys are opaque to seeds.

## [0.4.1] - 2026-05-08

### Added
- `sd plan show|validate|outcome|review` now accept a seed ID in addition to a `pl-*` plan ID — resolves via `seed.plan_id`, removing the round-trip through `sd plan list` when an agent already has the seed in hand. (seeds-51bc)
- `sd plan submit` prints a Next-action block to stderr on success (`sd plan show`, `sd ready`, conditionally `sd plan review`) and surfaces the recorded mulch decision id on the `--record-decision` success path. JSON output is untouched: `--json` mode suppresses the Next block so stdout stays parseable. (seeds-d6cb)
- Child seeds spawned by `sd plan submit` carry a marker-delimited "plan backref" block in their description with the step number, plan id, parent seed id+title, template, an excerpt of `sections.approach`, and a `sd plan show <pl-id>` link. `--overwrite` refreshes just the marker section in place; assignee, labels, and any manual notes outside the markers survive the rewrite. (seeds-76af)
- `sd onboard` snippet surfaces the installed seeds version as both a `<!-- seeds-onboard:v$VERSION -->` marker and inline body text. A separate `<!-- seeds-onboard-schema:N -->` marker drives outdated-snippet detection so patch releases don't mark every existing snippet as outdated; legacy `seeds-onboard-v:N` markers auto-upgrade on next run. `VERSION` extracted to `src/version.ts` so it can be imported without triggering `index.ts` CLI side-effects. (seeds-3da2)

### Fixed
- `sd plan submit`: `step.blocks=[j]` now correctly means "this step blocks step `j`" (matching the PLAN_SPEC.md natural-language example). Previously the indices were written into each child's `blockedBy`, inverting the chain so `sd ready` surfaced trailing steps first. Both fresh-submit and overwrite paths now wire bidirectional edges (`source.blocks += target`, `target.blockedBy += source`) with dedupe; overwrite handles matched-source as well as matched-target, fixing a pre-existing case where edges added in a revision didn't update existing children. Inverted plans submitted before this fix are not auto-corrected (tracked separately in seeds-1c38). (seeds-4a54)
- `sd plan show` no longer `JSON.stringify`s structured list entries into the user-facing review surface for `steps` and `alternatives`. Dispatch on the section spec: `kind=steps` formats step titles with indented `blocks`/`requires_plan`/`plan_template` sub-lines, `kind=list` with an object item schema renders each named field per line, and plans whose template is no longer registered fall back to a JSON dump rather than crash. (seeds-7d17)
- `sd show <child-seed>`: the plan block now labels the step list "Plan steps" rather than "Children (N)" — the list is the seed's siblings, not its descendants. `sd plan show` keeps "Children" since the heading is correct from the plan's perspective. (seeds-b2d7)

## [0.4.0] - 2026-05-06

### Added
- `sd plan` command tree — structured planning facilitation that decomposes a seed into child seeds via an LLM-driven walkthrough. Designed for work that's large or ambiguous enough to benefit from upfront decomposition; for small, well-scoped tasks just `sd create` directly. Full design in [PLAN_SPEC.md](./PLAN_SPEC.md).
  - `sd plan templates` — list available plan templates
  - `sd plan prompt <seed-id> [--template <name>] [--domain <name>]` — emit structured `plan_request` JSON the LLM fills out; default template inferred from seed type. `instructions` and `--help` document the submit reply shape so the prompt → submit transformation is explicit. `prior_art` is enriched from mulch (`approach` ↔ pattern+decision, `risks` ↔ failure, `acceptance` ↔ guide) when mulch is on PATH.
  - `sd plan submit <seed-id> --plan <file|->` — validate via AJV + structural `steps[].blocks` index check, spawn one child seed per step with `blockedBy` id remap, append the plan row to `.seeds/plans.jsonl`, and update the parent seed (`plan_id` back-pointer + `blockedBy = [children]`). `-` reads from stdin. Validation failures emit a partial-state diff JSON to stderr. `--overwrite` replaces an existing non-draft plan, matches steps by title, preserves child IDs, and prints obsolete-child close suggestions to stderr (never auto-closes). `--record-decision` writes the approach to mulch as a decision record after success (best-effort, never rolls back the plan). `--domain` forces the mulch domain.
  - `sd plan show <pl-id>` — display sections, child summaries, status, and a "review suggested" hint when status is `approved`/`active` and no reviewer is recorded. Recurses through nested sub-plans up to `max_plan_depth` (default 3, configurable).
  - `sd plan list [--seed --status --outcome --template]` — query plans with combinable filters; default sort `createdAt` desc.
  - `sd plan validate <pl-id>` — re-run validation against the current template definition.
  - `sd plan outcome <pl-id> --result success|partial|failure [--note <text>]` — record a plan outcome (storage-only; never gates child progress).
  - `sd plan review <pl-id> --by <name>` — record a reviewer (informational; not a state transition).
- **Config-driven plan templates.** Custom templates under `plan_templates:` in `.seeds/config.yaml` override the built-ins. Built-in templates: `feature` (default for `task`/`feature`/`epic`; sections: `context`, `approach`, `alternatives`, `steps`, `risks`, `acceptance`), `bug` (default for `bug`; adds `reproduction`, `root_cause`), `refactor` (opt-in via `--template refactor`; adds `behavior_invariant`).
- **Plan lifecycle auto-transitions.** `draft` → `approved` → `active` → `done` driven by child seed status changes (hooked from `update.ts` and `close.ts` under outer plans-lock + inner issues-lock); `done` → `active` reopen path supported. `Plan.revision` increments on `--overwrite`.
- **Nested sub-plans.** A template step can declare `plan_template: <name>` to spawn a child seed that requires its own sub-plan. The child gets `requires_plan: true` and is hidden from `sd ready` until its plan reaches `approved+`. `sd plan prompt` on the spawned child inherits the parent step's `plan_template` unless `--template` overrides. Submit-time validation rejects unknown `plan_template` names.
- `Plan` type and plan storage layer (`readPlans`/`writePlans`/`appendPlan`/`plansPath`) mirroring the issue/template helpers and lock model. `.seeds/plans.jsonl` is created on `sd init` and added to `.gitattributes` with `merge=union`.
- `Issue.plan_id`, `Issue.plan_step_index`, `Issue.requires_plan` (additive optional fields; existing rows remain valid).
- Plan-awareness in `sd ready`, `sd show`, and `sd list`: ready surfaces seeds whose plan is in `draft` even if otherwise blocked, and excludes seeds with `requires_plan` until their sub-plan is approved+; show inlines child seeds for approved/active/done plans; list adds a `[plan <status>]` indicator. `--json` parity (`plan_status`, `plan_children`).
- `src/validation.ts` AJV-based validation foundation (sole AJV-importing module): `compileSchema` returns a `ValidatorFn`; `formatErrors` maps AJV `ErrorObject` to the documented `PartialStateDiff` shape.
- Extended in-tree YAML parser (`src/yaml.ts`) supporting nested maps, block sequences, inline flow maps/seqs, and typed scalars — keeps the minimal-runtime-deps posture (no new YAML dep).
- `sd onboard` snippet refresh — added `sd search`, the global `--format` flag, and the full `sd plan` surface (templates, prompt, submit, show, validate, list, outcome, review). Snippet version bumped to `v:3` so existing CLAUDE.md installs auto-update via the marker.
- `sd prime` includes plan-aware quick reference.

### Fixed
- `sd list` / `sd ready` / `sd blocked` / `sd show` (compact) / `sd search` / `sd dep` / `sd tpl` no longer render `[blocked]` when all of an issue's blockers are closed. Formatters now accept an optional `closedBlockerIds` set; callers compute it once from the unfiltered issue list and thread it through.

## [0.3.0] - 2026-05-04

### Added
- `sd search <query>` command — case-insensitive substring search on issue title + description, with the same filters as `sd list` (`--status`, `--type`, `--assignee`, `--label`, `--label-any`, `--unlabeled`, `--priority`, `--priority-max`) and shared `--limit`/`--sort`/`--format`/`--json` output flags. Includes closed issues by default; pass `--status open` to restrict.
- `--sort <mode>` flag on `sd list` and `sd ready` (`priority|created|updated|id`)
- `--format <mode>` flag on `sd list`, `sd ready`, `sd show`, `sd blocked`, and `sd stats` (`markdown|compact|plain|ids|json`). `--json` is preserved as an alias for `--format json`. The `ids` mode emits issue IDs one per line for shell pipelines: `sd list --label bug --format ids | xargs sd close`.
- `sd ready` now accepts the same filters as `sd list`: `--type`, `--assignee`, `--label`, `--label-any`, `--unlabeled`, `--limit`. Shared filter logic lives in `src/filter.ts`.
- `--priority <levels>` and `--priority-max <n>` filters on `sd list` and `sd ready`. `--priority` matches an exact comma-separated set (e.g. `--priority 0,1` or `--priority P0,P1`); `--priority-max` keeps issues at or below a ceiling (e.g. `--priority-max 1` = P0+P1). Both accept numeric (0-4) and P-prefixed (P0-P4) forms consistent with `sd create` / `sd update`.
- `--body` as alias for `--description` on `sd create` and `sd update`

### Changed
- `sd list` and `sd ready` now sort by priority ascending (P0 first) by default, tie-broken by `createdAt` desc, instead of JSONL file order
- Tightened lint and typecheck strictness (Biome `noNonNullAssertion=error`)

### Fixed
- `isInsideWorktree` submodule false positive — now compares resolved git-dir vs git-common-dir instead of path heuristics
- `process.exit()` replaced with `process.exitCode` in version-json handler

## [0.2.5] - 2026-03-04

### Added
- `sd block <id> --by <blocker-id>` command — mark an issue as blocked by another
- `sd unblock <id> --from <blocker-id>` command — remove a specific blocker (`--all` to clear all)
- `sd label` subcommand group — `add`, `remove`, `list`, `list-all` for issue labels
- Labels field on issues — optional `string[]` for categorization and filtering
- `sd list --label <label>` filter — list issues by label
- `--all` flag on `sd list` — show all issues including closed (default now filters to open/in_progress)

### Changed
- `sd list` now defaults to showing only open and in_progress issues (use `--all` for previous behavior)

## [0.2.4] - 2026-02-25

### Added
- `sd completions <shell>` command — output shell completion scripts for bash, zsh, and fish
- `--timing` global flag — show command execution time on stderr
- Typo suggestion tests for misspelled command names
- Tests for `--timing` flag and shell completions

### Fixed
- `sd init` now derives project name from directory name instead of hardcoding "seeds"

## [0.2.3] - 2026-02-24

### Added
- Worktree root resolution — `findSeedsDir()` resolves to the main repo's `.seeds/` when running inside a git worktree
- `isInsideWorktree()` helper in `config.ts` for worktree detection
- Worktree guard in `sd sync` — skips commit with warning when running from a worktree (supports `--json`)
- Tests for worktree resolution (`config.test.ts`) and sync worktree guard (`sync.test.ts`)
- Custom branded help formatting for `sd --help` — colored commands, aligned options, branded header

### Changed
- Lock retry interval increased from 50ms to 100ms with random jitter to reduce contention
- Lock timeout increased from 5s to 30s for better multi-agent reliability

## [0.2.2] - 2026-02-24

### Added
- `sd upgrade` command — check for and install latest version from npm (`--check` for version check only)
- `--quiet` / `-q` global flag — suppress non-error output
- `--verbose` global flag — extra diagnostic output
- `--dry-run` flag on `sd sync` — preview what would be committed without committing
- `printWarning()` helper in `output.ts`

### Changed
- Applied os-eco forest branding palette: `brand` (green), `accent` (amber), `muted` (gray) replace raw chalk colors across all commands
- Status icons updated to ASCII-safe set: `✓` (pass), `!` (warn), `✗` (fail), `>` (in-progress), `-` (open), `x` (closed)
- Version flag changed from `-V` to `-v` (standard convention)
- `--version --json` now returns structured `{name, version, runtime, platform}` object
- npm publish workflow: switched from `--provenance` to token-based auth via `NPM_TOKEN` secret

## [0.2.1] - 2026-02-24

### Changed
- Migrated CLI parsing from manual switch/case to Commander.js — proper subcommands, built-in help, and option validation
- Replaced manual ANSI escape codes with chalk for output formatting
- Use `process.exitCode = 1` instead of `process.exit(1)` for graceful shutdown
- Replaced auto-tag workflow with unified publish workflow for npm

### Fixed
- `--desc` flag silently dropped descriptions in `create` and `update` commands

### Added
- chalk and commander as runtime dependencies
- `--desc` as explicit alias for `--description` in `create` and `update`

### Removed
- `.beads/` directory — seeds is now the sole issue tracker
- Manual ANSI color helpers (`c.red`, `c.green`, etc.) in `output.ts`

## [0.2.0] - 2026-02-23

### Added
- `sd doctor` command — validates project health: config, JSONL integrity, field validation, dependency consistency, stale locks, gitattributes, and `.gitignore`. Supports `--fix` for auto-fixable issues
- `sd prime` command — outputs AI agent context (PRIME.md or built-in reference). Supports `--compact` for condensed output
- `sd onboard` command — adds seeds section to CLAUDE.md/AGENTS.md with marker-delimited sections for idempotent updates
- `src/markers.ts` utility for marker-delimited section management (used by `onboard`)
- CODEOWNERS file for branch protection

## [0.1.0] - 2026-02-23

### Added
- Initial release
- Issue CRUD: `sd create`, `sd show`, `sd list`, `sd update`, `sd close`
- Dependency tracking: `sd dep add/remove/list`, `sd blocked`, `sd ready`
- Templates/molecules: `sd tpl create/step/list/show/pour/status`
- Advisory file locking for concurrent multi-agent access
- Atomic writes (temp file + rename) with dedup-on-read
- YAML config (`config.yaml`), JSONL storage (`issues.jsonl`, `templates.jsonl`)
- `--json` flag on all commands for structured output
- Migration from beads: `sd migrate-from-beads`
- `sd sync` to stage and commit `.seeds/` changes
- `sd stats` for project statistics
- Zero runtime dependencies — Bun built-ins only
- `merge=union` gitattribute for git-native parallel branch merges

[Unreleased]: https://github.com/jayminwest/seeds/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/jayminwest/seeds/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/jayminwest/seeds/compare/v0.4.7...v0.5.0
[0.4.7]: https://github.com/jayminwest/seeds/compare/v0.4.6...v0.4.7
[0.4.6]: https://github.com/jayminwest/seeds/compare/v0.4.5...v0.4.6
[0.4.5]: https://github.com/jayminwest/seeds/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/jayminwest/seeds/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/jayminwest/seeds/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/jayminwest/seeds/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/jayminwest/seeds/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/jayminwest/seeds/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/jayminwest/seeds/compare/v0.2.5...v0.3.0
[0.2.5]: https://github.com/jayminwest/seeds/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/jayminwest/seeds/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/jayminwest/seeds/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/jayminwest/seeds/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/jayminwest/seeds/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/jayminwest/seeds/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jayminwest/seeds/releases/tag/v0.1.0
