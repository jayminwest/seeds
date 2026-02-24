# Changelog

All notable changes to Seeds will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/jayminwest/seeds/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/jayminwest/seeds/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/jayminwest/seeds/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jayminwest/seeds/releases/tag/v0.1.0
