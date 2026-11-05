# Seeds audit — 2026-11

Branch `audit/2026-11-05`, seeds v0.6.0. All experiments ran in throwaway stores (`mktemp -d && git init && sd init`). The real store was used only to file and triage issues. Every finding with a repro was reproduced in this session unless marked **(sub-audit)**, meaning a delegated reviewer reproduced it and I did not re-run it, or **unverified**. New issues carry the label `audit-2026-11` and are sequenced in plan **pl-bf60** under epic **seeds-4425**.

## Executive summary — top 10 (impact × likelihood)

| # | Sev | Finding | Seed |
|---|---|---|---|
| 1 | P1 | `merge=union` + last-wins dedup silently reverts edits. A close on one branch plus an update of the same issue on another gives a **clean** merge, and the issue is reopened. `sd init`/`doctor --fix` re-append union over a correct driver. | seeds-6e2d (existing) |
| 2 | P1 | `sd close` and `sd doctor` contradict each other on `blocks`/`blockedBy`. Every close raises a doctor warning (190 in this repo's store), `--fix` undoes the close's edit, and reopening loses the dependency. The rewrite is redundant because `ready` already derives resolution. | seeds-9be5 (→P1), seeds-3f8d |
| 3 | P1 | **Any mutation silently deleted malformed rows.** **Fixed on this branch**: rewrites now refuse. | seeds-b52d ✅ |
| 4 | P1 | `--json` is ignored for commander errors (missing/unknown flag, extra arg) and plan submit validation, so agents get empty stdout or a payload with no envelope. | seeds-cb18 |
| 5 | P2 | The argv round-trip swallows values that start with `--` and ignores empty strings, so commands report success without applying the change. | seeds-0374 |
| 6 | P2 | 4-hex ids collide across branches. Union then dedup drops a whole issue without a trace. | seeds-44db |
| 7 | P2 | `sd list` caps at 50 silently and has no unlimited mode. Warren's `listSeedStatuses` is wrong in any project with >50 issues or closed children. | seeds-dd20 |
| 8 | P2 | A crashed lock holder stalls every command for 30s. The lock carries no owner. | seeds-a34c |
| 9 | P2 | `doctor --fix` writes without the lock and non-atomically, and never checks plans.jsonl. | seeds-499f |
| 10 | P2 | Dependency cycles are accepted, and both issues disappear from `ready` for good. | seeds-20c5 |

Also fixed on this branch: `sd close` idempotency (warren relies on it), `update --status closed` missing `closedAt`, crash leftovers getting committed, and one vacuous test. See [Fix commits](#fix-commits).

## Baseline (Phase 0)

- `bun run check:all`: **9/9 green**, 23.3s (coverage gate 18s).
- `bun test`: 1055 tests, **16.2s**. Slowest files:
  - `plan.test.ts`: 5.3s / 230 tests
  - `plan-submit-record-decision.test.ts`: 2.3s / 5 tests (~500ms each, spawns the CLI)
  - `plan-mulch.test.ts`: 1.6s
  - `plan-domain.test.ts`: 1.2s
  - `sync.test.ts`: 1.2s
- `PHILOSOPHY.md` is not at the scaffold path given in the brief. The lens was applied as described.

### Module map

| Module | LOC | Responsibility | Main callers |
|---|---|---|---|
| index.ts / register-all.ts | 134 / 41 | commander root; eagerly registers all 26 commands | bin |
| store.ts | ~270 | JSONL read/write/append, advisory lock, dedup, malformed guard | 21 commands, plan-context |
| types.ts | 115 | Issue/Plan/Template types + constants | ~30 files |
| config.ts / config-schema.ts / yaml.ts | 349 / 152 / 387 | findSeedsDir (+git spawn), config, plan templates; JSON Schema; YAML subset | nearly all |
| filter.ts / sort.ts / priority.ts | 107 / 31 / 27 | list/ready/search filters; sort; priority parse | list, ready, search, prime |
| output.ts / format.ts | 174 / 43 | chalk output, issue formatting, `--format` | all |
| validation.ts | 119 | sole AJV boundary | plan-schema, config |
| plan-schema / -context / -lifecycle / -backref / -mulch / -domain | 209 / 81 / 65 / 93 / 207 / 139 | template→schema; plan lookup for read paths; plan status derivation; description backref; `ml` shell-outs | plan, close, update, read commands |
| error-handler / suggestions / timing | 57 / 57 / 37 | top-level errors, typo hints, `--timing` | index |
| log.ts | 98 | pino logger. **Dead in production** (only its test imports it) | — |
| commands/plan.ts | 2549 | every `sd plan` subcommand except show | register-all |
| commands/doctor.ts | 975 | 12 checks + fixers | register-all |
| other commands/* | 64–439 | one file per command | register-all |

## Phase 1 — Data integrity and correctness

**Things that held up (reproduced):**
- 40 parallel `create` → 40 unique rows.
- 30 parallel `label add` on one issue → 30 labels, no lost update.
- 20 parallel `--claim` → exactly 1 winner.
- Unicode, RTL, tabs, U+2028, embedded JSON and a 200KB description all round-trip byte-exact.
- `close a nope` is atomic.
- Lock ordering is consistently plans → issues, so there is no deadlock path.

| Sev | Finding | Evidence / repro | Root cause | Fix | Effort | Consumer impact | Seed |
|---|---|---|---|---|---|---|---|
| P1 | Union merge reverts a close | Base X open. Branch A: `sd close X`. Branch B: `sd update X --description … --priority 0`. Merge → clean, X `status:"open"`, `closeReason:null`. | union keeps both rows; dedup keeps the physically later one | Ship a 3-way id-keyed `sd merge-driver`. init registers it; doctor validates with `git check-attr`, not substring. Warren's `scripts/merge-seeds-jsonl.ts` is a working reference. | L | overstory `merge/resolver.ts:213` string-matches `": merge: union"`; warren `check-merge-strategy.ts` must accept the new driver | seeds-6e2d |
| P1 | doctor reverts close | `dep add B A; close A; doctor` → "bidirectional mismatch". `doctor --fix` → B.blockedBy=[A] again. This repo: 190 warnings. | close.ts:84-95 rewrites siblings; doctor.ts:761 enforces symmetry | Stop rewriting siblings; keep edges, derive resolution (already done in ready.ts:61 / blocked.ts:40) | M | No consumer reads `blockedBy` from JSONL (sub-audit). JSON output must keep emitting it (decide: raw edges or only unresolved). | seeds-9be5, seeds-3f8d |
| P1 | Reopen loses deps | `dep add B A; close A; update A --status open; ready` → B listed | same | same | — | — | seeds-3f8d |
| P1 | Malformed rows deleted | Truncate a row; `sd update <other> --priority 1` → row gone. Reads gave no warning. | store.ts parseJsonl skipped silently; rewrites serialise only parsed rows | **Fixed** (6fe4d2f1): rewrites throw "Refusing to rewrite … run sd doctor". Follow-up: stderr warning on reads (seeds-9c2d). | S | Corrupt stores now fail loudly instead of losing data | seeds-b52d |
| P2 | Cross-branch id collision | id.ts: 4 hex, checked only against the local store. Merging two different issues with the same id → one dropped. | small id space + last-wins dedup | 6+ hex for new ids (readers already accept 4–8). doctor flags same-id rows whose `createdAt` differs. | S | mulch `active-work.ts` regex accepts 4–8 hex | seeds-44db |
| P2 | Crashed holder stalls 30s | `touch .seeds/issues.jsonl.lock; time sd create …` → 30.1s | lock has no owner; reclaim is mtime > 30s only | Write `{pid,host}`; reclaim at once if pid dead on the same host | M | — | seeds-a34c |
| P2 | Live holder can be robbed | The same 30s mtime rule steals the lock from a SIGSTOPped or sleeping holder (**unverified**, by code reading) | no heartbeat | heartbeat via utimes | S | — | seeds-a34c |
| P3 | Crash leftovers committed | `.seeds/issues.jsonl.tmp.*` and `*.lock.stale.*` show up in `git add -n .seeds` | init .gitignore only had `*.lock` | **Fixed for new projects** (11fe65b2). Backfill for existing projects in seeds-499f. | S | — | seeds-7cec ✅ |
| P2 | Cycles accepted | `dep add A B; dep add B A` → exit 0, `ready` empty | no cycle check on write | DFS under the lock in dep/block/plan wiring | S | — | seeds-20c5 |
| P2 | `update --status closed` | → no `closedAt`; doctor flags the row | update.ts only handled reopen | **Fixed** (2291f85a) | S | — | seeds-1d78 ✅ |
| P2 | Re-close rewrites history | Second `close` changes closedAt/updatedAt | no status check | **Fixed** (83bab5b8): no-op, still listed in `closed[]` | S | Fixes warren close-child-seed noop detection | seeds-f6eb ✅ |
| P2 | Rows trusted at the boundary | Rows with `priority:"high"`, `status:"done"` or no id render as `undefined · NoId` and a `Phigh` stats bucket **(sub-audit)**. migrate/tpl pour can write such rows. | `JSON.parse(...) as T` | one `validateIssue()` for reads (quarantine), writes and doctor | M | — | seeds-9c2d |
| P2 | plan_step_index stale | overwrite [S1,S2,S3]→[S2,S1,S4]; `plan edit --step 1` renames S1 **(sub-audit)** | overwrite/reorder don't recompute | recompute + doctor check | S | warren uses `children` order, not the index | seeds-fb42 |
| P2 | doctor `--fix` unsafe | `writeFileSync` at doctor.ts:530…793, no lock, not atomic. plans.jsonl absent from integrity/dup/lock checks (doctor.ts:89,170,444). | fixers bypass the store | route through store helpers under withLock | M | — | seeds-499f |

**Merge-strategy verdict:**
- Union cannot stay for issues.jsonl or plans.jsonl, because both rewrite rows in place. Dedup-on-read cannot recover the loss, since the ancestor is gone by then. That is why seeds-a493 (field-level dedup) is impossible as specified.
- Replace union with a 3-way driver (seeds-6e2d) and make close a one-row write (seeds-9be5) so conflicts become rare.
- Once the driver ships, seeds-a493 and seeds-6c8e (compact on sync) become small. I propose closing a493 as superseded by 6e2d. Not applied.

**YAML (fuzz, 20k random round-trips):** 15 failures.
- A key named `-` is emitted unquoted, parses as a sequence and drops the map plus all following keys.
- Values like `- dash` are emitted in a form standard YAML rejects.
- `config set` rejects compact JSON flow maps.

Low practical risk, since config keys are mostly fixed. seeds-6c98.

## Phase 2 — Agent UX

| Sev | Finding | Repro | Seed |
|---|---|---|---|
| P1 | `--json` ignored for commander errors and plan validation | `sd create --json` → `error: required option '--title'` on stderr, empty stdout | seeds-cb18 |
| P2 | argv round-trip drops values | `sd update X --title "--weird"` → "✓ Updated", unchanged. `sd close X --reason "--json"` → reason null. `--description ""` ignored. Filing this audit's own issue with a `--json…` title failed. | seeds-0374 |
| P2 | Envelope inconsistency | create→`{id}` vs update→`{issue}`. camelCase `issueId`/`hasChanges` vs snake_case `plan_id`/`plan_children`. Error `command` is the parent command ("dep") while success has "dep add". show N ids duplicates `issues`/`results`. | seeds-7f39 |
| P2 | sync: `.gitattributes` unstaged; fake success without git | `sd init; sd sync; git status` → `?? .gitattributes`. In a non-git dir → "✓ No changes" | seeds-7291 |
| P2 | Silent list truncation | default limit 50; `--limit 0` → 0 rows; no total | seeds-dd20 |
| P3 | NO_COLOR ignored on a PTY; prime never says `--json` | `NO_COLOR=1 script -q /dev/null sd ready \| cat -v` → escape codes | seeds-0f8c |
| P3 | guard bypasses beyond Bash | `.SEEDS/issues.jsonl` (case), symlinks, MCP write tools allowed. Edit/Write/MultiEdit/NotebookEdit and `..` paths correctly denied. | seeds-5b26, seeds-c2c0 |
| P3 | Papercuts | own-claim retry fails; no-op label/dep report success; `sd lsit` → "init?"; `sd plan ready` → "too many arguments"; `unblock --all` doc drift; no-node_modules error lacks a hint | seeds-bde5 |

**Known-report status:**
- Still true: f029, 1bdd, 6f43, efa0, c969 (also on the CLI: no-field update bumps `updatedAt`).
- Fixed and closed: 76cf, 19bd.

**`sd prime` size:**
- default ≈ 2.6–2.9KB (~700 tokens)
- `--compact` 754B (~190 tokens), which is what the setup hook installs
- `--json` 7.3KB, because `content` duplicates `sections`

Cut "Common Workflows" (it repeats Essentials) and the context-recovery line. Add `--json`.

**Missing primitives agents reached for:**
- comments (seeds-775c / 89cf)
- `--assignee me` (seeds-efa0)
- bulk update (only `close` takes multiple ids)
- changed-since (only `--sort updated` exists)
- reopen/delete verbs
- short-id lookup

**Environment:**
- Subdirectory and worktree use work: worktree writes go to the main `.seeds`.
- Outside a project, `prime` exits 0 with full text.
- Without node_modules → raw `ENOENT resolving chalk`.
- Setup hooks: `sd setup claude` is idempotent and `--remove` restores user hooks exactly.

## Phase 3 — Performance (sub-audit, measured)

**Cold start ≈ 56ms:**
- 10ms Bun
- 13ms commander + chalk
- ~25ms eager registration of 26 command modules (ajv ~8ms)
- 6.5ms `git rev-parse` spawn in `findSeedsDir`

A prototype with lazy registration and filesystem git resolution measured **27ms**. seeds-2ba4.

**Scale (ms):**

| cmd | 1k | 10k | 50k (39MB) |
|---|---|---|---|
| ready / list / show | 65 | 78–91 | 141–151 |
| create / update / dep add | 64–70 | 75–84 | 165–167 |
| close hub (500 dependents) | 67 | 96 | 235 |
| doctor | 74 | 153 | 501 |

Everything is linear, bounded by parsing at about 1ms per 1k issues. No command is truly O(n²). Hot spots:
- doctor parses the file 7 times
- `findIndex` inside loops in close/dep/plan (a Map would cut 54ms to 2.4ms)
- `appendIssue` rewrites the whole file to add one line

seeds-b79d.

**Tests:** seeds-a3bd's original cause (CLI spawn per test) is fixed, so I closed it. 16–18s remains:
- ~523 hidden git spawns (2.9s)
- `plan.test.ts` calls the host's real `ml` (machine-dependent)
- a fresh fake `ml` binary per test (~120ms macOS first-exec penalty each)

Estimated 9–11s after the fixes. seeds-056d.

## Phase 4 — Architecture and code health

**plan.ts (2549 LOC) is a tangle with a deep core:**
- The graph mutation (spawn/link/wire/reconcile) is copied across submit, overwrite, adopt and release:
  - child construction: 727–770 vs 1182–1218
  - edge wiring, twice: 775–795 vs 1229–1280
  - adopted-link mutation, four times
  - adopt/release/reorder share an identical preamble
  - `VALID_PLAN_OUTCOMES` and `VALID_OUTCOMES` are duplicates
- Proposed seams:
  - `plan-store.ts` `withPlanTxn(dir, fn(issues, plans))`, which owns lock order, write and status recompute. Lock order is re-stated in comments at 5 sites today.
  - Pure `plan-graph.ts`: `spawnChild`, `linkChild`/`unlinkChild`, `wireEdge`, `reconcile(plan, steps)`. Fresh submit becomes reconcile against an empty plan.
  - One thin `plan-cli/*.ts` file per subcommand.

**Shallow front-end layer:** commander parses → action re-serialises to argv → a hand-rolled `parseArgs` per command parses again (7 copies). This causes seeds-0374 and gives the codebase two front-end styles. It is the clearest "pass-through" smell: remove it.

**Other duplication:**
- priority parsing: 4 implementations (priority.ts, filter.ts, plan.ts:2147 `parseInt` so "2x" passes, the AJV schema)
- status/type checks inlined about 9 times
- label normalisation re-inlined 3 times
- `sd block` duplicates `dep add`

**Denormalized state:**

| Pair | Can disagree? | doctor? |
|---|---|---|
| blocks ↔ blockedBy | after every close (by design, see above); after overwrite of obsolete children | warns (noise) |
| plan.children ↔ plan_id / plan_step_index | after overwrite / reorder (index stale); `plan_template` children have no plan_id, so `release` rejects them | no plan checks at all |
| plan.status ↔ child statuses | recomputed only by close/update, not by adopt/release/overwrite (**unverified**) | no |
| status ↔ closedAt | `update --status closed` (fixed) | yes |
| step title ↔ child title | `sd update` on a child doesn't flow back. Overwrite matches by title, so a renamed child gets duplicated (**unverified**). | no |

**Type safety:**
- No `as unknown as` outside the test harness.
- Biome bans non-null assertions.
- The real gap is the unvalidated JSONL boundary (seeds-9c2d).

**Dead code:**
- src/log.ts (pino is a devDependency)
- `prime._internal`
- test-only exports hidden because knip treats tests as entries (seeds-8f00)

**Test quality:**
- Black-box `runCli` tests are good.
- Vacuous tests:
  - close.test.ts used a nonexistent `--blocked-by` flag (fixed)
  - store.test.ts "serializes concurrent operations" would pass without a lock
- Implementation-pinning: the hardcoded doctor pass count (mx-957e8f); byte-exact empty-file checks.
- Missing: cycle rejection, close→doctor consistency, invalid-enum rows, overwrite-then-edit `--step`, doctor `--fix` under concurrency.

## Phase 5 — Consumer contracts (de facto public API)

No consumer imports seeds in-process; all go through the CLI or read JSONL directly.

| Consumer | Call | Relied on | Documented | Tested |
|---|---|---|---|---|
| warren | `list --format json` (no `--all`/`--limit`) | `.issues[].{id,status,extensions}`; **assumes the list is complete** (bug, seeds-dd20) | partly | default-50 cap only |
| warren | `show <id> --json` | `.issue.{status,description,blockedBy,extensions}`; regex `/not found\|no such/i` on stderr\|\|stdout | envelope yes, error text no | yes |
| warren | `plan show/list --json` | `.plan.{status,children[],sections.steps[].{blocks,existing_seed}}`; **`children` order = run order** | yes | order only via `readPlans`, not the CLI JSON |
| warren | `update --extensions` | shallow merge; **null value = cleared** | merge yes, null no | null **no** |
| warren | `close <id>` ×3 sites | **idempotent on disk** (git-status noop check) | no | **now yes** (this branch) |
| warren | direct JSONL: `mirrorSeeds`/`mirrorPlans` write issues/plans with **no lock**; `auto-plan-run.ts` takes the **first** row (seeds dedups last-wins); its integrity check rejects duplicate ids | storage format | no | n/a |
| warren | prompts (planner/nightwatch/bugwatch) | say step `blocks` is **0-based**; seeds is 1-based since a13b9543. Real warren plans are 1-based, so agents follow `sd plan prompt`. Harm unverified. | — | — |
| overstory | ready/show/create/update/close/list/sync `--json` | `.issues`, `.issue`, `.id ?? .issue.id`, `.count` | yes | `ready.count` **not tested** |
| overstory | claims via `update --status in_progress` | not atomic; racy | — | — |
| overstory | `merge/resolver.ts:213` | `git check-attr` == `merge: union` | — | — |
| greenhouse | `create --json` `.id`; `show --json` `.issue.status`; `--version` | yes | yes | |
| mulch | direct read of issues.jsonl (active-work, audit) | `id,status,title`; active-work does no dedup | no | n/a |

**Recommended changes that would break consumers:**
- seeds-6e2d: overstory's union check and warren's strategy gate.
- seeds-7f39: keep `create .id`, `show .issue`, `list .issues/.count` as they are; add fields, never rename.
- seeds-9be5: JSON must keep `blockedBy`. Warren's `mirrorSeeds` actually benefits.

Consumer-side bugs (not filed here, belong in warren/overstory):
- warren `listSeedStatuses` missing `--all`
- warren `mirrorSeeds` writing without the lock
- warren 0-based prompt text
- overstory not using `--claim`

## Phase 6 — Backlog hygiene (applied)

**Closed, verified against code:**
- seeds-2618: fixed in 2924f374
- seeds-76cf: fixed in 464eb1fd
- seeds-19bd: fixed in a0aeba76
- seeds-64cf: done in e4b1ee8a
- seeds-d457: done in ee28d2f7
- seeds-a2de: plan done
- seeds-a3bd: original cause fixed; residual cost in seeds-056d
- seeds-67a6: check:all 9/9 green
- seeds-b4cf: junk

**Re-prioritised:** seeds-9be5 P2→P1.

**Not duplicates:** `seeds-25de/80eb/347c/8b2c` are the children of seeds-cfc7's plan pl-611d, not duplicates of it. `sd plan ready` is still unimplemented. Keep them.

**Proposed, not applied:**
- close seeds-a493 as superseded by seeds-6e2d (a field-level merge needs the ancestor, which only a merge driver has)
- fold seeds-6c8e into the 6e2d driver work

**Process smell:** 6 issues whose work had landed were still open, because plan parents are never closed (seeds-5671).

## Things that are good — preserve

- JSONL as the database: diffable, greppable, no export step. Atomic temp+rename writes.
- The lock implementation is careful: rename-based stale reclaim with inode check, jitter, consistent plans→issues order. It survived every contention test.
- `--claim` really is atomic (1 of 20 won).
- Errors list valid values, and plan errors say what to do next.
- Exit codes are only 0/1, and stdout stays clean when piped.
- Worktree and subdirectory discovery works.
- `setup claude` is idempotent and reversible.
- Black-box `runCli` test harness. Strict TS with no `any`/`!`. Byte-identical fleet `check:all`.
- `sd ready` derives blocker resolution from closed ids. Build on that.

## Roadmap

**Do first** (pl-bf60 order):
1. Integrity: seeds-9be5 + 3f8d (one-row close), seeds-6e2d (merge driver + doctor validates the strategy), seeds-44db (longer ids), seeds-499f/a34c/20c5/9c2d.
2. Agent contract: seeds-cb18 + 0374 (delete the argv round-trip; JSON errors everywhere), then seeds-7f39 behind per-command JSON contract tests, then seeds-dd20/7291/fb42.
3. Performance: seeds-2ba4 (cold start ÷2), seeds-056d (tests <11s), seeds-b79d.
4. Polish: seeds-5b26, 0f8c, bde5, 6c98, 8f00, 5671.

**Stop doing:**
- Denormalising derived state on write (blockedBy, plan_step_index).
- Shipping a merge strategy that doctor then enforces by substring.
- Adding per-command `parseArgs` copies.
- Leaving plan parents open after their children land.
- Writing JSONL from consumers (warren mirror*) without the lock.

## Fix commits

| Commit | Seed | Change |
|---|---|---|
| 2291f85a | seeds-1d78 | `update --status closed` stamps `closedAt` |
| 83bab5b8, c2ffb69e | seeds-f6eb, seeds-4a7a | re-close is a no-op; fix vacuous close test |
| 6fe4d2f1 | seeds-b52d | store refuses to rewrite files with malformed rows |
| 11fe65b2 | seeds-7cec | init gitignores `*.tmp.*`, `*.lock.stale.*` |

Each fix had a failing test first. All are under 50 lines, none changes a consumer contract, and `check:all` stays green.
