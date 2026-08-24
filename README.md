# 4c-bugfix

> A disciplined, four-gate bug-fixing methodology for coding agents — **Concern → Cause → Countermeasure → Check**.

[![Version](https://img.shields.io/badge/version-0.3.0-blue)](./CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Standard: Agent Plugins](https://img.shields.io/badge/standard-Agent%20Plugins-orange)](https://github.com/victorsalmon/agentic-bugfix-plugin)

**One-liner:** Turn ad-hoc *"fix this"* prompts into **reproducible, red-then-green, root-cause bug fixes** — with an auditable dossier for every issue.

`4c-bugfix` is an open [Agent Plugins](#compatibility) skill pack. Its
primary orchestrator skill is `4c-bugfix`, which makes a coding agent fix bugs
the way a careful engineer does: **reproduce first, find the root cause, fix the
architecture (not the symptom), then prove the fix with properties, mutation,
and the full regression suite.**

The single most important rule is the **red gate**: no application source is touched until a failing reproduction test exists, runs in the shell, and is committed. A fix without a red repro is not a 4C fix.

---

## Why

Unstructured "fix this" prompts let agents patch symptoms — the bug comes back, or a near-identical sibling bug ships next week. 4C turns bug-fixing into a verifiable loop:

- **Reproduced** — a failing test proves the bug is real before anything is changed.
- **Explained** — a one-paragraph root cause, found by 5-Whys, goes in the record.
- **Blast-radius-free** — every sibling occurrence of the anti-pattern is fixed or explicitly deferred.
- **Regression-tested** — red-then-green proof, edge cases, full suite, and class-level hardening.

The triage step keeps it from becoming bureaucratic: trivial changes (typos, config values, cosmetic tweaks) are fixed directly with a "4C skipped — trivial" note, so the loop only runs where it earns its cost.

---

## The four gates

```
  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
  │  CONCERN    │ →  │   CAUSE     │ →  │  COUNTERMEASURE  │ →  │   CHECK     │
  │ pin the     │    │ 5-Whys +    │    │ fix the cause +  │    │ red→green,  │
  │ failure     │    │ siblings    │    │ every sibling    │    │ harden,     │
  │ (RED test)  │    │             │    │                  │    │ full suite  │
  └─────────────┘    └─────────────┘    └──────────────────┘    └─────────────┘
   no source yet      dossier: RCA      dossier: fix SHA(s)      dossier: proof
```

Each gate is its own invocable skill, so you can run the whole loop
(`4c-bugfix`) or jump to a single gate (`/4c-concern`, `/4c-cause`,
`/4c-countermeasure`, `/4c-check`). State is carried between gates by a
**dossier** — a single markdown file per bug (`.4c/<bug-id>.md`).

---

## Quick start

1. Report a bug as you normally would: *"the totals report double-counts split payments."*
2. The agent triggers `4c-bugfix`, triages it (non-trivial → run the loop), and walks the four gates — writing a failing test first, then RCA, then the fix, then property/mutation/regression proof.
3. You get a fix plus a dossier recording the red repro, root cause, sibling fixes, and green proof.

You can also invoke a gate directly, e.g. `/4c-concern` to just pin a reproduction, or `/4c-check` to verify someone else's fix.

---

## Installation

This repo follows the open **Agent Plugins** standard, so it installs into any compatible client. It ships both a [Claude Code](https://www.anthropic.com/claude-code) manifest (`.claude-plugin/plugin.json`) and a [ZCode](https://z.ai) manifest (`.zcode-plugin/plugin.json`).

### Option A — add this repo as a marketplace (recommended)

The repo includes a `marketplace.json`, so you can add it once and install from your client's plugin browser.

- **Claude Code / ZCode:** *Settings → Plugin Management → Discover → `+`* → paste the Git URL:

  ```
  https://github.com/victorsalmon/agentic-bugfix-plugin.git
  ```

  Then find **4c-bugfix** and click **Get** (new plugins are enabled by default).

### Option B — install the plugin directly

Clone and point your client at the directory:

```bash
git clone https://github.com/victorsalmon/agentic-bugfix-plugin.git
```

- **Claude Code:** drop the directory into your plugin path, or use your client's "install from local directory."
- **ZCode:** place it under `~/.zcode/cli/plugins/` or your project's plugin path; the `.zcode-plugin/plugin.json` is auto-discovered.

### Option C — OpenCode / Codex / other `.agents/skills/` clients

These clients discover skills via `.agents/skills/`. Copy or symlink the skill directories:

```bash
mkdir -p .agents/skills
for s in skills/*/; do
  cp -r "$s" ".agents/skills/$(basename "$s")"
done
```

---

## How it works

### Triage
Every invocation starts with a triage table. Trivial changes (typo, config value, CSS tweak, no logic change) are fixed directly with a `4C skipped — trivial` note. Everything else runs the full loop.

### The dossier
A full loop writes `.4c/<bug-id>.md` in the project root with four sections — Concern / Cause / Countermeasure / Check. Each gate appends its outputs (failing-test path + output, root-cause paragraph, sibling list, fix SHAs, green proof). This is how state moves between gates when they run in different sub-agents or sessions, and it gives you an auditable record. Prefer a different location (`docs/fixes/`, a ticket dir)? Use it — just stay consistent.

### The red gate (verifiable)
The Concern gate commits the failing test **on its own** (`test: add failing repro for <bug>`). The Check gate then verifies in `git log` that the RED test commit precedes the fix commit, and re-confirms the test fails without the fix (`git stash` + rerun). This turns "reproduce first" from an aspiration into a checkable gate.

### Optional quality-scan gate
Each gate has an *optional* scan step. Wire in whatever you already use — a custom quality engine, SonarQube, CodeQL, Semgrep, an MCP-served analyzer. Scans are **advisory and non-blocking**: if nothing is wired up, the agent records "scanner unavailable" and continues. The methodology never depends on a paid or private tool.

---

## Configuration

The plugin is zero-config by default. Two conventions, both overridable:

| Setting | Default | Override |
|---|---|---|
| Dossier directory | `.4c/` in the project root | Use your team's preferred fix-record location |
| Quality scanner | none (gates record "scanner unavailable") | Drop in any scanner; the gates call it where noted |

`.4c/` is gitignore-friendly (see `.gitignore`).

---

## Skills included

| Skill | Purpose |
|---|---|
| `4c-bugfix` | Primary orchestrator — triage, dossier, all four gates, property and mutation proof |
| `agentic-4c-bugfix` | **Deprecated** legacy alias — forwards to `4c-bugfix` for one migration cycle |
| `4c-concern` | Red gate — a committed, failing reproduction test before any source edit |
| `4c-cause` | 5-Whys root cause + violated-invariant analysis + codebase-wide sibling search, written to the dossier |
| `4c-countermeasure` | Minimal architectural fix + every sibling repaired or explicitly deferred |
| `4c-check` | Red-then-green proof, full suite, property/mutation proof, blast-radius re-scan, class-level hardening |

A complete worked example lives in [`skills/agentic-4c-bugfix/references/example.md`](./skills/agentic-4c-bugfix/references/example.md).

---

## Compatibility

Built on the **Agent Plugins** open standard — a vendor-neutral format for packaging agent Skills (and optionally MCP servers) into portable plugins that work across clients including Claude Code, ZCode, OpenAI Codex, ChatGPT, and GitHub Copilot.

- ✅ **Claude Code** — `.claude-plugin/plugin.json`
- ✅ **ZCode** — `.zcode-plugin/plugin.json`
- ✅ **OpenCode / Codex** — standard `skills/<name>/SKILL.md` layout, copyable to `.agents/skills/`

The skills are pure methodology (markdown, no scripts, no hardcoded paths), so they are fully portable across operating systems and clients.

---

## Relationship to the canonical source

This public plugin is a **generalized projection** of a richer, private canonical implementation. The public version strips environment-specific bits (private fleet services, absolute paths, internal token names) so it is useful to anyone, while preserving the exact same methodology and skill names.

If you maintain a private canonical copy and want to keep this public plugin in sync, see [`docs/SYNC.md`](./docs/SYNC.md) for the filter checklist.

---

## Contributing

Contributions are welcome — especially new worked examples, language-specific repro patterns, and scanner integrations. See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

The methodology itself is intentionally small and stable; prefer improvements that make the gates clearer or more verifiable over additions that lengthen the loop.

---

## About

This repo is maintained by **Victor Salmon** ([victorsalmon](https://github.com/victorsalmon)) as a public, portfolio-ready plugin. The 4C bug-fixing methodology and original skill pack were created by **Clock Lobster**.

---

## License

[MIT](./LICENSE) © Clock Lobster.
