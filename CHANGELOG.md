# Changelog

All notable changes to Seeds will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/jayminwest/seeds/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jayminwest/seeds/releases/tag/v0.1.0
