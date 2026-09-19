# AGENTS.md — agentic-bugfix-plugin

Public, self-contained **Agent Plugins** skill pack for the 4C
(Concern → Cause → Countermeasure → Check) bug-fixing methodology. There is no
runtime application code: the skills are pure markdown, and the only tooling is
Node + npm.

## Layout

- `skills/<name>/SKILL.md` — the six skills: `4c-bugfix` (orchestrator), the
  four gates (`4c-concern`, `4c-cause`, `4c-countermeasure`, `4c-check`), and
  the deprecated `agentic-4c-bugfix` forwarding alias. Frontmatter `name` must
  match the folder name.
- `skills/agentic-4c-bugfix/references/` — worked examples.
- `skills/skills-index.json` — generated inventory; parity with the skill
  directories is enforced by `tests/skills.test.js`.
- `scripts/check-no-private-refs.js` — leak scan over the whole tree (skips
  VCS metadata, `node_modules`, lane worktrees, local dossiers, and build
  output). `scripts/check-no-private-refs.sh` is a thin bash wrapper.
- `scripts/validate-json.js` — manifest validation for the package and the
  three plugin/marketplace manifests.
- `tests/` — offline `node:test` contract tests (no network, no credentials).
- `.claude-plugin/plugin.json`, `.zcode-plugin/plugin.json`, `marketplace.json`
  — client manifests; versions must stay in lockstep with `package.json`.
- `docs/SYNC.md` — how to project changes from the private canonical source.

## Commands

Run from the repo root:

```
npm install           # dev tooling only (no runtime dependencies)
npm test              # offline test suite (node --test)
npm run check         # private-reference leak scan
npm run validate      # JSON manifest validation
npm run lint          # eslint
npm run format:check  # prettier
```

CI (`.github/workflows/ci.yml`) runs check, validate, lint, format:check, and
test on every push to and pull request against `main`.

## Invariants — keep these stable

- **Red gate**: a failing reproduction test is committed on its own before any
  application source changes; `4c-check` verifies the ordering via `git log`.
- **Four-gate shape** and the skill names are the public contract.
- **Portable and public**: no absolute paths, no environment-specific or
  private references, no secrets, no dependence on a paid tool. The leak scan
  enforces the forbidden-token list.
- **Manifest lockstep**: `package.json`, `.claude-plugin/plugin.json`,
  `.zcode-plugin/plugin.json`, and `marketplace.json` agree on version;
  `CHANGELOG.md` stays current.

## Change checklist

1. One concern per commit. New worked examples belong in
   `skills/agentic-4c-bugfix/references/`.
2. For any skill or manifest change, update the README skill table, the
   `skills-index.json` entry, and `CHANGELOG.md` `[Unreleased]`.
3. Before pushing, run
   `npm test && npm run check && npm run validate && npm run lint && npm run format:check`.
