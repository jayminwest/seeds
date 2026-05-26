# Seeds: `sd plan` — Planning Facilitation

Design spec for extending seeds beyond issue tracking into a structured planning layer for AI agents.

## Thesis

Most human and agent attention should be spent in the planning step, not the review step. Plans should be the artifact reviewed; by the time an agent is tasked with implementation, the work should be so straightforward that even a small model can execute it. When an implementation fails, the fix belongs in the planning *process* — adding a new section, validation rule, or risk check that prevents the failure mode next time — not in post-hoc code review.

`sd plan` makes planning a structured, templated, customizable workflow that lives where the work already lives: alongside the seeds it produces.

## Design Principles

1. **Structured data, not prose.** Plans are JSONL rows with validated fields. No markdown plan documents anywhere in the artifact path. The plan is queryable, validatable, mechanically traversable.
2. **Plans are first-class.** Plans get their own ID space and their own JSONL file, parallel to issues. They are not a field on a seed.
3. **Bidirectional linking.** Plans know their parent seed and their spawned children; seeds know their plan. Navigation is cheap from either direction.
4. **Config-declared templates.** Customization mirrors mulch's `custom_types`: declare plan templates in `.seeds/config.yaml` with required/optional sections and validation. AJV schema generated from the template definition.
5. **Soft mulch coupling.** `sd plan` works standalone. If `ml` is on PATH, prior art (conventions, patterns, decisions, failures) is injected into the planning prompt automatically. Mulch absent → planning still works.
6. **One-shot with resume.** The LLM receives a structured prompt, produces a complete plan JSON, and submits it. Validation failure returns a patchable partial-state diff — no multi-turn state machine required.
7. **Decomposable, recursively.** A plan step may itself be another plan. Epics decompose into nested plans without context-switching to a different tool.

## Architecture Overview

```
.seeds/
  config.yaml          # adds plan_templates: block
  issues.jsonl         # unchanged shape; gains optional plan_id field
  plans.jsonl          # NEW — one plan per line
  templates.jsonl      # convoy templates (existing, untouched)
  .gitignore
```

Plans are created via `sd plan prompt <seed-id>` → LLM → `sd plan submit <seed-id>`. On successful submit, child seeds are spawned with blocking edges wired and `plan_id` back-pointers populated.

## On-Disk Format

### config.yaml additions

```yaml
project: overstory
version: "1"

plan_templates:
  feature:
    sections:
      context:
        required: true
        kind: text
        min_length: 50
        prompt: "Why does this work need to happen? What problem or opportunity drives it?"
      approach:
        required: true
        kind: text
        prompt: "What's the chosen approach, and why this over alternatives?"
      alternatives:
        required: false
        kind: list
        item:
          name: { kind: text }
          rejected_because: { kind: text }
        prompt: "What other approaches were considered and rejected?"
      steps:
        required: true
        kind: steps
        min: 2
        prompt: "Decompose into ordered, independent implementation steps. Each becomes a child seed."
      risks:
        required: false
        kind: list
        item: text
        mulch_source: failure
        prompt: "What could go wrong? Known failure modes from prior work are pre-filled when mulch is available."
      acceptance:
        required: true
        kind: list
        item: text
        min: 1
        prompt: "Concrete, verifiable conditions for plan completion."
```

Section field reference:

| Field           | Purpose                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `required`      | Validation gate. Required sections must be non-empty on submit.                                     |
| `kind`          | One of `text`, `list`, `steps`, or a structured object spec.                                        |
| `min_length`    | For `kind: text` — minimum character count.                                                          |
| `min`           | For `kind: list` or `kind: steps` — minimum number of entries.                                       |
| `item`          | For `kind: list` — schema for each entry. Either `text` or a structured object.                      |
| `mulch_source`  | When mulch is present, pre-populate this section's `prior_art` from records of this type.            |
| `prompt`        | The natural-language prompt the LLM sees when filling this section.                                 |

### plans.jsonl

One plan per line, append-on-create, atomic-rewrite on update (same locking model as `issues.jsonl`).

```jsonl
{"id":"pl-a1b2","seed":"seeds-9c4d","template":"feature","status":"draft","revision":1,"sections":{"context":"...","approach":"...","alternatives":[],"steps":[{"title":"Add OAuth provider config","type":"task","priority":2,"blocks":[1]},{"title":"Wire callback handler","type":"task","priority":2,"blocks":[]}],"risks":["Token refresh race condition (mx-902)"],"acceptance":["Login flow completes end-to-end","Refresh token rotates on use"]},"children":["seeds-aa01","seeds-aa02"],"outcome":null,"reviewedBy":null,"createdAt":"2026-05-06T10:00:00Z","updatedAt":"2026-05-06T10:00:00Z"}
```

Optional `adoptedChildren?: string[]` is a subset of `children` whose entries were
linked via adoption (step `existing_seed` at submit time, or `sd plan adopt`
post-submit) rather than fresh-spawned. The field is only persisted when
non-empty, so plans that never use adoption stay byte-identical to pre-feature
output. `sd plan show` renders `(adopted)` next to each entry; `sd plan submit
--overwrite` preserves entries for adopted children that survive the rewrite.

### issues.jsonl additions

Two optional fields on `Issue`:

- `plan_id?: string` — the plan this seed is part of (parent seed, spawned child, or [adopted](#adoption-and-release) child).
- `plan_step_index?: number` — the 0-based index in the plan's `steps` array (set for spawned children, submit-time adoptions, and `sd plan adopt --step <i>`; absent on loose adoptions). Enables stale-child detection on plan revisions.

These are additive; existing seeds remain valid. `sd plan release` clears both fields and strips the description's `seeds:plan-backref` block (see [Adoption and Release](#adoption-and-release)).

## Plan Lifecycle

```
draft  →  approved  →  active        →  done
              ↓             ↓
        (validation     (children
         passed,         all closed,
         children        outcome
         spawned)        appended)
```

- **draft** — created by `sd plan prompt`; not yet submitted, no children.
- **approved** — `sd plan submit` succeeded, validation passed, children spawned.
- **active** — at least one child seed is `in_progress`. Set automatically.
- **done** — all children closed. `sd plan outcome` may append a result.

Optional human review gate is **suggested, not enforced** (see Reviewer Suggestion below).

## Command Surface

```
sd plan prompt   <seed-id> [--template <name>] [--domain <name>]
                                                       Print structured prompt JSON to stdout.
                                                       Embeds mulch prior_art when ml is on PATH.

sd plan submit   <seed-id> --plan <file> [--overwrite]
                                                       Validate plan JSON, spawn children, write
                                                       plans.jsonl row, update parent seed.
                                                       --overwrite required to replace an existing
                                                       approved plan.

sd plan show     <pl-id>                               Display plan with sections, children, status.

sd plan list     [--seed <id>] [--status <s>]          Query plans.
                 [--outcome <r>] [--template <name>]

sd plan outcome  <pl-id> --result <success|partial|failure>
                 [--note <text>]                       Append outcome on plan close.

sd plan validate <pl-id>                               Re-run validation against current template
                                                       (useful after template config changes).

sd plan templates                                      List available templates from config.

sd plan adopt    <plan-id> <seed-id...> [--step <i>]   Adopt existing open seeds into a plan
                                                       (link-only; bumps revision). `--step` is the
                                                       1-based blueprint step index to anchor to.

sd plan release  <plan-id> <seed-id...>                Detach seeds from a plan without closing them
                                                       (link-only; bumps revision).

sd plan edit     <id>                                  Edit plan fields in place; bumps revision.
  [--name <text>]                                      <id> accepts a plan id or seed id.
  [--section <name> <text>]                            V1: text sections only. --section approach
  [--step <i> --title/--priority/--type ...]           refreshes seeds:plan-backref on all children.
                                                       --step is 1-based; metadata edits propagate to
                                                       plan.children[i-1].
```

`sd ready` is updated to surface plans-in-`draft` for the parent seeds it would otherwise return — planning is the highest-priority work when present.

`sd show <seed>` and `sd list` gain awareness of `plan_id`: a seed with a plan in `draft` displays a hint, and a seed whose plan is `approved` shows the children inline.

## Walkthrough Protocol

Hybrid: one-shot with resume on validation failure.

### Successful path

```bash
$ sd plan prompt seeds-9c4d --template feature > plan.json
# stdout is the structured prompt: sections, prompts, validation rules,
# and prior_art populated from mulch where mulch_source matched.

# LLM fills plan.json with answers under sections.

$ sd plan submit seeds-9c4d --plan plan.json
✓ plan pl-a1b2 created (status: approved)
✓ spawned 4 child seeds: seeds-aa01, seeds-aa02, seeds-aa03, seeds-aa04
✓ seeds-9c4d now blocked by 4 children
```

### Validation-failure path

```bash
$ sd plan submit seeds-9c4d --plan plan.json
✗ validation failed:
  - sections.risks: required, missing
  - sections.steps: must have >=2 entries (got 1)

# stderr emits a partial-state JSON the LLM patches and resubmits:
# {
#   "errors": [
#     { "path": "sections.risks", "code": "required", "fix": "add a 'risks' array (string entries)" },
#     { "path": "sections.steps", "code": "min", "fix": "add at least 1 more step entry" }
#   ],
#   "current": { ...plan-as-submitted... }
# }

# LLM patches plan.json and re-submits.
```

The LLM never has to re-run `sd plan prompt`; the failure response carries enough state to patch and retry.

### Prompt JSON shape (emitted by `sd plan prompt`)

```json
{
  "plan_request": {
    "seed": "seeds-9c4d",
    "template": "feature",
    "instructions": "Fill every section. Required fields are marked. Use prior_art entries to ground decisions.",
    "sections": [
      {
        "name": "context",
        "required": true,
        "kind": "text",
        "min_length": 50,
        "prompt": "Why does this work need to happen?",
        "prior_art": []
      },
      {
        "name": "risks",
        "required": false,
        "kind": "list",
        "item": "text",
        "prompt": "What could go wrong?",
        "prior_art": [
          { "id": "mx-902", "type": "failure", "summary": "OAuth token refresh race in concurrent sessions" }
        ]
      }
    ],
    "validation": {
      "all_required_present": true,
      "min_steps": 2,
      "min_acceptance": 1
    }
  }
}
```

### Submission JSON shape (consumed by `sd plan submit`)

```json
{
  "template": "feature",
  "sections": {
    "context": "...",
    "approach": "...",
    "alternatives": [
      { "name": "Build custom JWT layer", "rejected_because": "Reinventing wheel; OAuth library is mature." }
    ],
    "steps": [
      { "title": "Add OAuth provider config", "type": "task", "priority": 2, "blocks": [2] },
      { "title": "Wire callback handler", "type": "task", "priority": 2, "blocks": [] },
      { "title": "Audit cookie flags",        "type": "task", "priority": 2, "blocks": [], "existing_seed": "seeds-aa05" }
    ],
    "risks": ["Token refresh race (mx-902)"],
    "acceptance": ["Login flow completes end-to-end"]
  }
}
```

The `blocks: [2]` syntax in `steps` references **1-based** step indices (step 1 is the first step, step N is the last) and uses forward semantics: step 1 with `blocks: [2]` means step 1 *blocks* step 2 (step 2 depends on step 1 finishing first). On submit, indices are translated into spawned-seed IDs: each child gets the targets in its `blocks` field, and each target gets the blocking step's ID appended to its `blockedBy` field. Leave `blocks: []` for steps nothing depends on. Note: the internal `plan_step_index` field stored on each spawned child seed remains 0-based — it's a code-level back-link, not author-facing.

## Plan Templates (Customization)

Templates are declared in `.seeds/config.yaml` under `plan_templates:`. Each template names a set of sections and validation rules. Templates ship with seeds (built-in defaults loaded if not redeclared) and can be overridden or extended per project.

### Built-in templates

| Template   | Use case                                                              |
| ---------- | --------------------------------------------------------------------- |
| `feature`  | New capability or significant change. Default for `type: feature`.    |
| `bug`      | Defect fix. Adds `reproduction` and `root_cause` sections.            |
| `refactor` | Internal restructuring. Adds `behavior_invariant` (must stay equal). |

`sd plan prompt <seed-id>` infers the template from the seed's `type` if `--template` is not passed.

### Section `kind` reference

| Kind          | Shape                              | Notes                                                       |
| ------------- | ---------------------------------- | ----------------------------------------------------------- |
| `text`        | string                             | `min_length` optional.                                      |
| `list`        | array                              | `item: text` or `item: { ...object spec... }`. `min` opt.   |
| `steps`       | array of step objects              | Spawns child seeds 1:1. Step is `{title?, type, priority, blocks: [step_index], labels?: string[], plan_template?, existing_seed?}`. `blocks` uses 1-based step indices. `labels` is optional; values are normalized (lowercased, trimmed, deduped) and applied to the spawned child or merged additively into an adopted seed's existing labels (never clobbers). `existing_seed` adopts an already-open seed instead of spawning a fresh child (see [Adoption and Release](#adoption-and-release)). `title` is required for fresh-spawn steps and optional for adoption-only steps (where the adopted seed's title is preserved). |
| object spec   | nested record of named fields      | Each field has its own `kind` recursively.                  |

A custom template:

```yaml
plan_templates:
  spike:
    sections:
      hypothesis:
        required: true
        kind: text
        prompt: "What are we trying to learn?"
      timebox:
        required: true
        kind: text
        prompt: "Hard upper bound (hours/days)."
      success_signal:
        required: true
        kind: list
        item: text
        prompt: "What observable signals tell us the spike succeeded?"
      kill_signal:
        required: true
        kind: list
        item: text
        prompt: "What signals tell us to stop and abandon?"
      steps:
        required: false
        kind: steps
        prompt: "Optional: tasks if the spike confirms the hypothesis."
```

Validation is generated from the template config the same way mulch generates AJV schemas from `custom_types`.

## Default `feature` Template

Six sections:

1. **context** *(required, text)* — Why the work matters.
2. **approach** *(required, text)* — Chosen approach with rationale.
3. **alternatives** *(optional, list)* — Considered + rejected.
4. **steps** *(required, steps, min 2)* — Decomposition; each becomes a child seed.
5. **risks** *(optional, list, mulch_source: failure)* — Known failure modes.
6. **acceptance** *(required, list, min 1)* — Verifiable completion conditions.

`out_of_scope` and `open_questions` are deliberately omitted from the default. They are workflow-specific and easy to add via custom templates.

## Nested Plans

A step in `kind: steps` may declare `plan_template: <name>` to mark itself as a sub-plan. On submit, the spawned child seed is created with `requires_plan: true`. Calling `sd plan prompt <child-seed-id>` then walks the LLM through the sub-plan using the named template. This decomposes epics in-place without context switching.

```json
{
  "title": "OAuth integration",
  "type": "epic",
  "priority": 1,
  "plan_template": "feature"
}
```

Bidirectional linking is preserved: the sub-plan's `seed` field points at the spawned child; the spawned child's `plan_id` points at the sub-plan once created. `sd plan show <pl-id>` recursively displays nested plans up to a configurable depth (default 3).

A child seed marked `requires_plan: true` is excluded from `sd ready` until its sub-plan reaches `approved`. This guarantees no implementation begins on un-planned epic branches.

## Mulch Integration (Soft)

When `ml` is resolvable on PATH, `sd plan prompt` enriches the prompt JSON with prior art:

1. **Domain inference** — explicit `--domain` flag → seed labels matching declared mulch domains → directory anchors derived from `git diff --name-only` against the seed's referenced files.
2. **Per-section enrichment** — for any section with a `mulch_source: <type>` hint (or for sections matching well-known names: `approach` ↔ pattern + decision; `risks` ↔ failure; `acceptance` ↔ guide), seeds shells out to `ml query --domain <name> --type <type> --json --limit 5` (or calls the programmatic API exported from `mulch/src/api.ts`).
3. **Embedding** — top-N records become `prior_art` entries on the section: `[{id, type, summary, relevance}]`. The LLM is instructed to ground its answer in these entries when relevant.

Mulch absent → `prior_art` arrays are empty, validation rules are unaffected, planning still works.

### Optional outbound write

`sd plan submit --record-decision` (off by default) calls `ml record <inferred-domain> --type decision --rationale <approach> --evidence-seeds <plan-id>` on success. This back-fills the chosen approach as a mulch decision linked to the plan. Defaults to off so seeds remains standalone.

## Validation

AJV schema is generated from each template's section spec. Validation runs on `sd plan submit` and is re-runnable via `sd plan validate <pl-id>` (e.g., after editing the template config).

Validation covers:

- Required sections are present and non-empty.
- `min_length` on `text` sections.
- `min` on `list` and `steps` sections.
- `steps[].blocks` references valid **1-based** step indices in the range `1..steps.length` (step 1 is the first step). `0` and out-of-range values are rejected with a clear "step indices are 1-based" error; self-references (step `n` listing `n` in its own `blocks`) are also rejected.
- `steps[].existing_seed`, when present, is a non-empty string (AJV check). Existence, status, current-plan, parent-self, mutual exclusion with `plan_template`, and duplicate-across-steps checks run in a pre-write pass alongside the spawn pipeline — see [Adoption and Release](#adoption-and-release).
- Each step declares either `title` (fresh spawn) or `existing_seed` (adoption). A step with both is allowed; the supplied `title` is used only for the mismatch warning. A step with neither is rejected (`step N must declare either 'title' (fresh spawn) or 'existing_seed' (adoption)`). This lets synthesis-style plans — where every child is an adoption — omit titles entirely.
- Object-spec fields match their declared `kind`.
- `template` name resolves in `plan_templates`.

Validation failure emits the partial-state diff described in Walkthrough Protocol.

## Re-submission and Overwrite

Re-submitting a plan for a seed that already has a non-`draft` plan is rejected by default:

```bash
$ sd plan submit seeds-9c4d --plan plan.json
✗ plan pl-a1b2 already exists for seeds-9c4d (status: approved, revision: 1)
  Use --overwrite to replace it. Spawned children will not be auto-closed;
  obsolete steps from the previous revision will be flagged.
```

With `--overwrite`:

1. The existing `plans.jsonl` row is replaced atomically. `revision` is incremented.
2. The new `steps` are diffed against the previous `children` with this precedence:
   1. **`step.existing_seed` id** — matches a current plan-child (rename / reorder pin) or pulls in an external adoption.
   2. **`step.title`** — legacy fallback against any unmatched current plan-children.
   3. **Spawn fresh** — no match either way.

   Id-first precedence keeps adopted children stable across overwrites and prevents the title-match path from racing with an id-pinned step. Pre-existing overwrite-by-title behavior is unchanged when no step uses `existing_seed`.
3. Children whose corresponding step is gone are listed in stderr as **obsolete** with a suggestion to close them: `sd close seeds-aa03 --reason "obsoleted by plan pl-a1b2 revision 2"`. Seeds does not auto-close them — the LLM has the context to decide whether the existing work is still useful.
4. New steps spawn new child seeds; existing matching children are kept (their backref block is refreshed in place so the snippet stays in sync with the live plan).
5. `plan.adoptedChildren` is reconciled: prior entries that survive the rewrite are kept, freshly-adopted ids are appended, and the field is dropped if it becomes empty.

Plan revisions are not preserved as separate rows. Git history of `plans.jsonl` is the audit trail. This keeps storage simple and avoids ID-space inflation.

## Adoption and Release

Adoption links an already-open seed into a plan instead of spawning a fresh child; release is the inverse. Both are **link-only** — they never mutate the seed's `status`, `assignee`, `labels`, `priority`, `type`, or `title`. The plan and seed JSONL rows are updated, edges are wired (or unwired), the `seeds:plan-backref` block in `description` is applied (or stripped), and the plan's `revision` is bumped once per command call.

Three surfaces stage adoptions and releases:

1. **Submit-time adoption** — a step in the submitted plan JSON carries `existing_seed: "<seed-id>"`. The named seed is linked into the plan at that step index instead of spawning a new child.
2. **`sd plan adopt <plan-id> <seed-id...> [--step <i>]`** — post-submit adoption. `--step` is the 1-based blueprint step index to anchor to; omit it for a loose adoption (the seed gets no `plan_step_index` and its backref reads `Adopted into plan <pl-id>` instead of `Step N of plan <pl-id>`).
3. **`sd plan release <plan-id> <seed-id...>`** — detach without closing. The seed remains open and queryable; only its plan link goes away.

### Lifecycle

Adoption on a fresh-submit or via `sd plan adopt`:

- `seed.plan_id` ← `<plan-id>`
- `seed.plan_step_index` ← step index (0-based; omitted on loose adoptions)
- `seed.description` ← `applyPlanBackref(...)` — prepends the marker-delimited block, or replaces an existing block in place (manual notes wrapping the markers survive)
- `seed.blocks` ← `appendUnique(seed.blocks, parentSeed.id)`
- `parentSeed.blockedBy` ← gains the adopted seed (deduped)
- `plan.children` ← appends the adopted seed (deduped)
- `plan.adoptedChildren` ← appends the adopted seed (deduped)
- `plan.revision` ← `prev + 1` (single bump per command)

Release inverts each mutation:

- `seed.plan_id` and `seed.plan_step_index` ← cleared (JSON.stringify drops the fields)
- `seed.description` ← `stripPlanBackref(...)` — removes only the marker block, collapses whitespace at the new boundary, returns `undefined` when nothing remained so the field is dropped entirely
- `seed.blocks` ← drops `parentSeed.id` (returns the same array when no change)
- `parentSeed.blockedBy` ← drops the released seed
- `plan.children` ← drops the released seed
- `plan.adoptedChildren` ← drops the released seed; the field is removed from the plan row when it becomes empty
- `plan.revision` ← `prev + 1`

`sd plan show` renders adopted entries with a trailing `(adopted)` muted tag in human output; `--json` includes `adopted: true` on each child summary that's listed in `plan.adoptedChildren`.

### Validation (pre-write, fail-fast)

All candidates are resolved before any mutation. Any rejection aborts the command with both `plans.jsonl` and `issues.jsonl` untouched.

**Adoption rejections:**

| Condition                                                            | Error                                                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `existing_seed` not found                                            | `seed <id> not found`                                                                            |
| `existing_seed` is closed                                            | `seed <id> is closed; only open or in-progress seeds can be adopted`                             |
| `existing_seed` already attached to another plan                     | `seed <id> is already attached to plan <pl-id>` (overwrite path allows same-plan adoptions)      |
| `existing_seed` equals the parent seed of the plan                   | `cannot adopt the parent seed <id> into its own plan <pl-id>`                                    |
| Same `existing_seed` listed by two steps in one submit / two CLI args | `existing_seed <id> is already adopted by an earlier step in this plan` / `Duplicate seed id…`   |
| Step sets both `existing_seed` and `plan_template`                   | `existing_seed and plan_template are mutually exclusive`                                          |
| `--step <i>` (adopt) out of range against `plan.sections.steps`      | `--step <i> is out of range (plan <pl-id> has N steps)`                                          |

**Title mismatch warning** — when `seed.title !== step.title` on a submit-time adoption, a `⚠` warning goes to stderr and the seed's title is preserved. Adoption is not silently retitling; agents must reconcile manually if the mismatch is meaningful.

**Release rejections:**

| Condition                                          | Error                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| Seed not found                                     | `seed <id> not found`                                              |
| Seed has no plan or is attached to a different one | `seed <id> is not attached to plan <pl-id>` / `…attached to <px>`  |
| Seed equals the parent of the plan                 | `cannot release the parent seed <id> from its own plan <pl-id>`   |
| Duplicate seed ids in args                         | `Duplicate seed id(s) in args: <id>…`                              |

### Concurrency: lock order

Both `sd plan adopt` and `sd plan release` follow the global seeds convention: **outer lock = `plans.jsonl`, inner lock = `issues.jsonl`** (`mx-f29e43`). Same order as `sd plan submit`, `sd plan outcome`, and `sd plan review` so the lock graph has no cycles. All mutations across both files commit under the combined lock, and a single revision bump per command is guaranteed.

### Edge cases

- **Reassignment from another plan is out of scope.** A seed with a non-matching `plan_id` is rejected with a clear error; the caller must `sd plan release <other-pl> <seed>` first, then adopt. A future `--reassign-from <pl>` flag could collapse the two-step dance into one atomic command (deferred).
- **Loose adoption** (`sd plan adopt` without `--step`) is intentional: pulling related ad-hoc work into a plan rarely lines up with a specific blueprint step. The backref block reflects this — agents reading the seed see `Adopted into plan <pl-id>` rather than a misleading step anchor.
- **Adopting an in-progress seed** is allowed and intentional. Adoption is link-only; an agent already working the seed keeps working it, now with the plan framing surfaced in `sd show <seed>` and the plan now blocked by their progress.
- **Manual notes around the backref block survive release.** The `seeds:plan-backref:start/end` markers are the only thing `stripPlanBackref` touches; string-based search/replace is explicitly avoided.
- **JSONL byte stability.** `plan.adoptedChildren` is only persisted when non-empty, and is dropped from the row when release empties it. Plans that never use adoption produce the same `plans.jsonl` bytes as before the feature shipped.

## In-Place Editing (`sd plan edit`)

`sd plan edit` performs targeted, field-level edits without going through the full `sd plan submit --overwrite` ceremony. It's the planning analog of `sd update` for issues.

```bash
sd plan edit <id> [--name <text>]
                  [--section <name> <text>]
                  [--step <i> [--title <text>] [--priority <p>] [--type <type>]]
                  [--json]
```

- `<id>` accepts a plan id (`pl-*`) or the parent seed id (resolved via the same `resolvePlanIdArg` used by `sd plan show`).
- All flags compose atomically in one invocation. `plan.revision` is bumped exactly once and `plan.updatedAt` is refreshed regardless of how many fields changed.
- Lock order matches the rest of the planning surface: outer `plans.jsonl`, inner `issues.jsonl` (mx-f29e43). Both files are touched under the combined lock so combined edits stay atomic.
- Out-of-scope by design: **structural edits** — adding, removing, or reordering steps — still require `sd plan submit --overwrite`. The edit command never spawns or orphans children and never renumbers `step.blocks`.

### `--name <text>`

Replaces `plan.name`. Empty string is rejected. No child seeds are touched.

### `--section <name> <text>`

Replaces `plan.sections[name]` with the supplied text. V1 supports text sections only (no `list` / `steps` / object-spec kinds); the name must resolve in the template's section spec.

`--section approach` is special-cased: after the section is written, the `seeds:plan-backref` block on every entry in `plan.children` is refreshed (`applyPlanBackref`) so the snippet rendered in each child seed's description stays in sync with the live approach. Other sections do not touch children.

### `--step <i> [--title <text>] [--priority <p>] [--type <type>]`

`--step` is the **1-based** blueprint step index (matching `step.blocks` and `sd plan adopt --step <i>`). At least one of `--title` / `--priority` / `--type` must be provided alongside `--step`; conversely, those metadata flags are only meaningful with `--step`.

Edits mutate `plan.sections.steps[i-1]` in place and propagate to the child seed at `plan.children[i-1]`:

- `--title` updates both the blueprint step's `title` and the child seed's `title`.
- `--priority` accepts `0-4` or `P0-P4` (same parser as `sd update --priority`) and updates the child seed's `priority`. The blueprint step's `priority` is also updated for consistency.
- `--type` is validated against `VALID_TYPES` (`task | bug | feature | epic`) and updates the child seed's `type`.

Out-of-range `--step` (less than 1 or greater than `plan.sections.steps.length`) is rejected pre-write with a clear error; both JSONL files stay untouched.

Adopted children are edited just like spawned ones — the lookup is purely by index. If a step has no corresponding entry in `plan.children` (shouldn't happen on a healthy plan), the command rejects.

### Concurrency and atomicity

The combined locks acquired by `sd plan edit` are the same outer/inner pair as `sd plan submit`, `sd plan outcome`, `sd plan review`, `sd plan adopt`, and `sd plan release`. Concurrent `sd plan edit` from multiple agents serializes through the advisory lock model; last-write-wins on the JSONL contents.

## Outcomes

Plans gain a lightweight outcome field:

```bash
$ sd plan outcome pl-a1b2 --result success
$ sd plan outcome pl-a1b2 --result failure --note "auth provider library deprecated mid-implementation"
```

Outcome values: `success | partial | failure`. Aggregation, retros, template-evolution-from-failures are deliberately out of scope — those workflows are team-specific. Outcomes are stored so external tooling (or future seeds commands) can build on them.

## Reviewer Suggestion (Not Required)

Human review of plans is suggested but not gated:

- `sd plan submit` transitions `draft → approved` automatically on successful validation.
- `sd plan show` displays a "review suggested" hint when `reviewedBy` is null.
- `sd plan review <pl-id> --by <name>` populates `reviewedBy`. This is informational, not a state transition.
- Teams that want a hard gate can wrap `sd plan submit` in a hook or CI check that blocks the spawned children's `ready` state on a `plan-reviewed` label.

The default optimizes for autonomous swarms; opt-in rigor for teams that need it.

## Out of Scope (V1)

- **Markdown plan documents.** Plans are structured data, not prose.
- **Failure-feedback automation.** Plans don't auto-evolve templates from outcomes; that's workflow-specific and defers to teams.
- **Canopy integration.** Planning prompts are not stored as canopy templates in V1.
- **Plan diffing UI.** Git diff of `plans.jsonl` is the V1 review surface.
- **Cross-repo plans.** A plan lives in one `.seeds/` instance; multi-repo coordination is out of scope.
- **Real-time collaboration.** Same locking model as issues — atomic writes, last-write-wins on conflicts.

## Open Implementation Questions

1. **Section schema vs. `custom_types` reuse.** Should `plan_templates` reuse mulch's `custom_types` AJV-schema-generation code (extract into a shared package), or maintain a parallel implementation in seeds? Sharing reduces drift; keeping them separate keeps seeds dependency-free.
2. **Step ID stability.** `--overwrite` diffing by step title is fragile. Should templates be able to declare stable `step_id` keys that survive title edits, at the cost of more author burden?
3. **Mulch query interface.** Shell out to `ml query --json` (works today, language-agnostic) vs. import from `@os-eco/mulch-cli` programmatically (faster, tighter coupling, requires npm dep). Soft coupling argues for the shell route.
4. **Default template inference.** Inferring template from seed `type` is convenient but couples the type taxonomy to template names. Should the mapping be configurable, or hard-coded to `task→feature, bug→bug, feature→feature, epic→feature` (with `--template` always overriding)?
5. **Sub-plan depth.** Recursive nested plans risk runaway decomposition. Should there be a configurable `max_plan_depth` in `config.yaml` (default 3)?
6. **Children lifecycle when parent plan moves to `done`.** If a plan is marked `done` but children are still open, is that a validation error, a warning, or allowed? Recommend: warning, not error, so plans can be retroactively closed without forcing child cleanup first.
