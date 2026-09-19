# Contributing to 4c-bugfix

Thanks for your interest in improving the 4C bug-fixing methodology. This plugin
is intentionally small and stable, so the bar for changes is **clarity and
verifiability**, not feature count.

## What we want

- **New worked examples** in `skills/agentic-4c-bugfix/references/` — especially
  in languages/frameworks not yet covered (Go, Rust, Python, Java, mobile, etc.).
  An example should show the full Concern → Cause → Countermeasure → Check shape
  with a real red-then-green arc.
- **Language-specific reproduction patterns** — how to write a tight failing test
  at the right layer in a given stack.
- **Scanner integrations** — clearer guidance for wiring a specific scanner
  (SonarQube, CodeQL, Semgrep, an MCP analyzer) into the optional quality-scan
  gate.
- **Clarity fixes** — wording that makes a gate easier to follow correctly
  without lengthening the loop.

## What to keep stable

- The **four-gate shape** (Concern / Cause / Countermeasure / Check) and the
  skill names. These are the contract users rely on.
- The **red gate**: the failing repro must be committed before the fix, and the
  Check gate must verify it. Do not weaken this.
- The **dossier** as the cross-gate state artifact.
- **No hardcoded paths or private/environment-specific references.** Skills must
  stay portable across OSes and clients. Use relative references and
  `${CLAUDE_PLUGIN_ROOT}` where a path is unavoidable.
- **Scanner-agnosticism.** The methodology must not depend on any paid or
  private tool.

## How to propose a change

1. Open an issue first for anything beyond a typo or docs fix — a short sketch
   of the change and _why_ lets us agree before you do the work.
2. Keep a PR to one concern. Methodology changes, new examples, and tooling
   tweaks should be separate PRs.
3. If you change a skill's wording, re-read it end-to-end as if you were the
   agent running it — does it still guide a correct 4C loop?
4. If you add or rename a skill, update all three manifests
   (`.claude-plugin/plugin.json`, `.zcode-plugin/plugin.json`, and
   `marketplace.json`) and the README's skill table so they stay in sync.
5. Add a `CHANGELOG.md` entry under `[Unreleased]`.

## Projecting from a private canonical implementation

If you maintain a private fork of this methodology (deeper, environment-specific)
and want changes to flow here, follow [`docs/SYNC.md`](./docs/SYNC.md). The
short version: copy the skill, strip every private reference (absolute paths,
internal hostnames, token names, fleet services), generalize any
environment-specific tool to a scanner-agnostic hook, and verify the result is
portable.

## Licensing

By contributing, you agree your contributions will be licensed under the
[MIT license](./LICENSE).
