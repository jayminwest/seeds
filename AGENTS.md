# AGENTS.md

This file is the canonical entry point for AI coding agents working in
the **seeds** repo, following the [agents.md](https://agents.md)
convention. It is intentionally short and command-focused: read it at
session start to know how to build, test, and ship. `CLAUDE.md` is the
long-form authoritative companion — when the two disagree, `CLAUDE.md`
wins and this file should be updated to match.

## What this project is

**Seeds** is a git-native issue tracker for AI agent workflows. The
JSONL file IS the database: there is no binary store, no export
pipeline, no separate sync daemon. All issues live in
`.seeds/issues.jsonl` (one JSON object per line), templates in
`.seeds/templates.jsonl`, plans in `.seeds/plans.jsonl`, and project
config in `.seeds/config.yaml`. Files are diffable, mergeable
(`merge=union` gitattribute + dedup-on-read), and edited only through
the `sd` CLI, which holds advisory file locks so parallel agents never
corrupt the store.

Seeds is part of the **os-eco** ecosystem alongside warren (control
plane), burrow (sandbox), plot (coordination), mulch (expertise), and
canopy (prompts). See `SPEC.md` for the V1 design record.

## Tech stack at a glance

- **Runtime:** Bun (runs TypeScript directly; no build step).
- **Language:** TypeScript, strict mode (`noUncheckedIndexedAccess`,
  no `any`).
- **Lint / format:** Biome (`biome.json`) — tab indentation, 100-char
  line width, errors fail CI.
- **Tests:** `bun test`, Jest-compatible API, real I/O over temp dirs
  (no mocks). Tests are `*.test.ts` co-located with the file under test.
- **Storage:** JSONL under `.seeds/`; minimal built-in YAML parser
  (`src/yaml.ts`) for config.
- **CLI:** `sd`, defined in `src/index.ts` and dispatched via
  [commander](https://github.com/tj/commander.js).

## Project layout

```
seeds/
├── src/
│   ├── index.ts            # sd CLI entry point + command router
│   ├── version.ts          # VERSION constant (import without CLI side-effects)
│   ├── types.ts            # Issue, Template, Config, shared constants
│   ├── store.ts            # JSONL read/write/lock/atomic-rename
│   ├── id.ts               # ID generation ({project}-{4hex})
│   ├── config.ts           # YAML config load/save
│   ├── output.ts           # JSON + human output helpers
│   ├── yaml.ts             # minimal flat YAML parser
│   └── commands/           # one file per subcommand (create, ready, plan, …)
├── scripts/                # quality-gate scripts + budgets
│   ├── validate-agents-md.ts   # validates this file's references
│   ├── check-file-sizes.ts
│   ├── check-debt-markers.ts
│   ├── check-coverage.ts
│   ├── report-test-timing.ts
│   ├── report-quality-metrics.ts
│   └── version-bump.ts
├── .seeds/                 # seeds dogfoods seeds (its own issue store)
├── .factory/skills/        # repo-local agent skills
├── .github/workflows/      # ci.yml + publish.yml + auto-merge.yml
├── CLAUDE.md               # authoritative long-form agent doc
├── RUNBOOK.md              # release / triage / rollback procedures
├── SPEC.md                 # V1 design record
├── README.md               # user-facing pitch
├── CHANGELOG.md            # release history
├── biome.json
├── tsconfig.json
└── package.json
```

## Commands

All commands run from the repo root with Bun on `PATH`.

```bash
bun install                       # install dependencies
bun test                          # run all tests
bun test src/store.test.ts        # run a single test file
bun run lint                      # biome check --error-on-warnings .
bun run lint:fix                  # biome check --write .
bun run typecheck                 # tsc --noEmit
bun run test:ci                   # bun test with coverage + junit reporters
```

Quality gates (the os-eco `check:all` standard — see
`docs/check-all-standard.md` at the os-eco root):

```bash
bun run check:all                 # scripts/check-all.ts — quiet runner over all 9 gates
bun run verify                    # alias for check:all (agent-facing entry point)
```

`check:all` resolves its gate manifest from package.json and runs, in
order: `lint`, `typecheck`, `check:agents`, `check:dups`, `check:deps`,
`check:size`, `check:debt`, `check:coverage`, `check:ci-parity`.
Individual gates:

```bash
bun run check:agents              # scripts/validate-agents-md.ts (this file)
bun run check:dups                # jscpd duplication budget (.jscpd.json)
bun run check:deps                # knip --dependencies (knip.json)
bun run check:size                # scripts/check-file-sizes.ts (ratchet down)
bun run check:debt                # scripts/check-debt-markers.ts (ratchet down)
bun run check:coverage            # scripts/check-coverage.ts (ratchet up)
bun run check:ci-parity           # scripts/check-ci-parity.ts (CI <-> check:all parity)
bun run report:test-timing        # slowest suites/tests from junit.xml
bun run report:quality            # consolidated quality summary
```

`scripts/check-all.ts` and `scripts/check-ci-parity.ts` are
byte-identical to `templates/l5-toolkit/scripts/` at the os-eco root —
never edit them in place; per-repo CI-parity escape hatches live in
`scripts/ci-parity-config.json`.

The ratchet scripts read JSON budgets co-located in `scripts/`
(`scripts/file-size-budgets.json`, `scripts/debt-markers-budget.json`,
`scripts/coverage-budgets.json`). Size and debt budgets only tighten
(move down); coverage floors only rise. Raise a budget only with a
justification in the commit body linking the tracker id.

User-facing `sd` reference:

```bash
bunx sd --help                    # top-level help
bunx sd <subcommand> --help       # per-command help
```

The full command surface (issue, plan, template, and config commands)
is documented in `CLAUDE.md` and `README.md`.

## Conventions

### TypeScript

- Strict mode with `noUncheckedIndexedAccess` — always handle a
  possible `undefined` from indexing.
- No `any`; use `unknown` and narrow, or define a proper type. All
  shared types go in `src/types.ts`.
- Tab indentation, 100-char line width — both enforced by Biome.
- Minimal runtime dependencies: only `chalk`, `commander`, and `ajv`.
  Prefer Bun built-ins (`Bun.file`, `Bun.write`, `node:fs`,
  `node:crypto`) over new packages.

### File organization

- Each CLI command gets its own file in `src/commands/`.
- Core modules live at the `src/` root (`src/store.ts`, `src/id.ts`,
  `src/config.ts`, `src/output.ts`, `src/yaml.ts`).
- Tests are `*.test.ts` co-located with the source they cover.

### Concurrency

- Mutations go through `src/store.ts`, which takes an advisory file
  lock (`O_CREAT | O_EXCL`, 30s stale window, 100ms retry, 30s
  timeout) and writes atomically (temp file + rename). Creates append
  under lock; updates rewrite the whole file under lock. Never
  hand-edit `.seeds/issues.jsonl` — bypassing the lock can corrupt the
  store on concurrent writes.

### Debt markers

Every `TODO` / `FIXME` / `HACK` / `XXX` on a source line must carry a
tracker reference on the same line. `bun run check:debt` fails CI on a
bare marker. Accepted prefixes:

- `sd-XXXX` / `seeds-XXXX` — repo-local seeds issue id.
- `mx-XXXX` — cross-repo mulch mission tracker.
- `#NNN` — GitHub issue.
- A URL (any http link) — external reference.

### Log sanitization

Two channels, kept distinct. **User output** flows through
`src/output.ts` (chalk-formatted prints and the `--json` contract).
**Diagnostics** flow through `src/log.ts` — a pino logger configured with
a `redact` pass (`remove: true`) covering `password`, `token`, `apiKey`,
`secret`, `authorization` (bare and one-level `*.` nested), plus
`headers.cookie` / `headers.authorization`. The logger is silent at the
default `info` level; set `SEEDS_DEBUG=1` (or `SEEDS_LOG_LEVEL=debug`) to
surface debug lines.

Sensitive values that may appear in arguments or environment (npm tokens,
GitHub PATs, API keys) must never be printed. Never `console.log` a raw
config object, token, or full environment from a command handler — route
user-facing output through `src/output.ts` and diagnostics through
`src/log.ts` so secrets stay scrubbed and the `--json` contract stays
consistent.

## Agent Workflow

Seeds dogfoods seeds: the work queue for this repo lives in
`.seeds/issues.jsonl` and is driven entirely through the `sd` CLI.

1. **Prime context.** At session start run `sd prime` (and `ml prime`
   if mulch is the active context). Read this file, `CLAUDE.md`, and
   the latest `CHANGELOG.md` entry.
2. **Find unblocked work.** `sd ready` lists open issues with no
   unresolved blockers. Use `sd search <query>` to locate related
   issues.
3. **Claim it.** `sd update <id> --claim` before you start; it is
   atomic, so parallel agents can't double-book.
4. **Decompose if large.** For ambiguous or multi-step work, use
   `sd plan prompt <seed-id>` → fill the emitted JSON →
   `sd plan submit <seed-id> --plan <file>` to spawn structured child
   seeds. Small, well-scoped tasks just `sd create` directly.
5. **Make focused changes.** One concern per commit. Adapt to existing
   conventions; do not overwrite them.
6. **Run the gates locally.** `bun run lint`, `bun run typecheck`, and
   `bun test` must all exit 0. Run `bun run check:agents` after editing
   this file or moving any path it references.
7. **Pin debt markers.** Any new `TODO` / `FIXME` references a tracker
   id on the same line (`seeds-XXXX`, `mx-XXXX`, `#NNN`, or a URL).
8. **Close & sync.** `sd close <id>` on completion; file follow-ups
   with `sd create`. Then `sd sync` stages and commits the `.seeds/`
   changes. Do **not** `git push` unless the user asks — leave commits
   local.
9. **Record insights.** If mulch is in use, `ml record <domain>` any
   convention discovered, pattern applied, or failure encountered.

There is a repo-local skill at
`.factory/skills/seeds-issue-workflow/SKILL.md` that walks an agent
through filing and decomposing work with explicit commands. Load it
when you need to turn a vague request into a tracked, ready unit of
work.

## Version management

Seeds' version lives in **two** places, kept in sync and verified by
CI:

- `package.json` — the `"version"` field.
- `src/version.ts` — `export const VERSION = "X.Y.Z"` (imported by
  `src/index.ts` without triggering CLI side-effects).

Bump both with `bun run version:bump <major|minor|patch>` (drives
`scripts/version-bump.ts`). Detailed release, triage, and rollback
procedures live in `RUNBOOK.md`.

## Further reading

- `CLAUDE.md` — authoritative long-form agent doc (full CLI reference).
- `SPEC.md` — V1 design record.
- `README.md` — user-facing pitch + install instructions.
- `RUNBOOK.md` — release / triage / rollback procedures.
- `CHANGELOG.md` — release history.
- `.factory/skills/seeds-issue-workflow/SKILL.md` — repo-local agent
  skill for filing and decomposing seeds work.
