# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-08-15

### Changed

- Plugin renamed to **`4c-bugfix`** as the primary name; the legacy
  `agentic-4c-bugfix` skill remains as a **deprecated forwarding alias** for
  one migration cycle (its SKILL.md now carries a forwarding notice).
- `4c-concern` now writes a failing **property test** for general invariants
  alongside the concrete repro; `4c-cause` now names the **violated invariant**
  before searching siblings.
- `4c-check` final report and the dossier template now record property-suite
  seed, TEETH proof, changed-file and full-portfolio mutation scores, and
  survivor dispositions.
- Version 0.2.0 → 0.3.0 across `marketplace.json`, `.claude-plugin/plugin.json`,
  and `.zcode-plugin/plugin.json` (all three agree).

## [0.2.0] - 2026-08-15

### Added

- `4c-bugfix` as the concise primary orchestrator skill name; the original
  plugin/skill remains available as a compatibility alias during migration.
- Mandatory property/invariant classification and reproducible property-suite
  proof for application-code bug fixes.
- Changed-file plus full-portfolio mutation proof, with a per-file floor of
  85% and zero meaningful financial/security survivors.

### Changed

- `4c-check` now records property seeds, mutation scores, and survivor
  dispositions as part of the red-then-green completion evidence.

## [0.1.0] - 2026-08-11

### Added

- Initial public release of the 4C bug-fixing skill pack.
- `agentic-4c-bugfix` orchestrator skill with triage, mandatory dossier, and an
  adjacency table to related tools.
- Four gate skills: `4c-concern` (red gate), `4c-cause` (5-Whys + siblings),
  `4c-countermeasure` (architectural fix + siblings), `4c-check` (red-then-green
  proof, full suite, hardening).
- Verifiable red gate: the failing repro test is committed on its own and
  checked in `git log` during the Check gate.
- Portable `.4c/<bug-id>.md` dossier for cross-gate / cross-session state.
- Optional, non-blocking quality-scan gate at each step (scanner-agnostic).
- Worked example: `skills/agentic-4c-bugfix/references/example.md`.
- Open Agent Plugins manifests for Claude Code and ZCode, plus a root
  `marketplace.json` so the repo can be added as a marketplace.
- `docs/SYNC.md` — filter checklist for projecting from a private canonical
  implementation.

### Notes

- This public plugin is a generalized projection of a private canonical
  implementation; private fleet services, absolute paths, and internal token
  names are intentionally omitted.
