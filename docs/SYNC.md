# Syncing from the private canonical implementation

This public plugin is a **generalized projection** of a richer, private
canonical implementation (the `4c-bugfix` skill family in an internal
monorepo). The two share skill names and the identical 4C methodology, but the
public version strips everything environment-specific so it is useful to anyone.

When the canonical skills change, project the changes here and push to the public
remote. This document is the checklist.

## The mapping

| Canonical (private)                                         | Public (this repo)                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| `<monorepo>/Skills/QA/4c-bugfix/SKILL.md`                   | `skills/4c-bugfix/SKILL.md`                                       |
| Legacy `agentic-4c-bugfix` alias (forwards to `4c-bugfix`)  | Legacy `skills/agentic-4c-bugfix/SKILL.md` alias during migration |
| `<monorepo>/Skills/QA/4c-bugfix/4c-concern/SKILL.md`        | `skills/4c-concern/SKILL.md`                                      |
| `<monorepo>/Skills/QA/4c-bugfix/4c-cause/SKILL.md`          | `skills/4c-cause/SKILL.md`                                        |
| `<monorepo>/Skills/QA/4c-bugfix/4c-countermeasure/SKILL.md` | `skills/4c-countermeasure/SKILL.md`                               |
| `<monorepo>/Skills/QA/4c-bugfix/4c-check/SKILL.md`          | `skills/4c-check/SKILL.md`                                        |
| `<monorepo>/Skills/QA/4c-bugfix/references/example.md`      | `skills/agentic-4c-bugfix/references/example.md`                  |
| `<monorepo>/Skills/QA/4c-bugfix/aqe-bridge/SKILL.md`        | **(dropped — private fleet service)**                             |

## Filter rules (apply on every projection)

Copy each canonical skill, then apply these transformations. The left column is
what to find; the right is what to replace it with.

### 1. Dossier path

| Find                                                                                                                                               | Replace                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Absolute dossier path under the monorepo's task queue (e.g. `…/Tasks/Code/<bug-id>-4c.md`, with its `Tasks/Review/` / `Tasks/Complete/` move note) | `.4c/<bug-id>.md` relative to the project root (keep the "move alongside the fix when done" idea, expressed portably) |

### 2. AQE / private quality engine → scanner-agnostic

The canonical version has a whole `aqe-bridge` skill wired to a private local
service. **Drop the skill entirely**, and downgrade every "Optional AQE gate"
reference to a scanner-agnostic hook.

| Find                                                                                                                                          | Replace                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aqe-bridge` skill (the whole file)                                                                                                           | (do not copy it)                                                                                                                                                              |
| "Optional AQE gate: call `defect_predict` / `quality_assess` / `qe_security_url-validate` / `validation_pipeline` via the `aqe-bridge` skill" | "Optional quality-scan gate: run your scanner (a custom quality engine, SonarQube, CodeQL, Semgrep, an MCP-served analyzer, …) and record findings, or 'scanner unavailable'" |
| `localhost:21004`, `mcp_aqe`, `FLEET_API_TOKEN_*`, `aqe.ts`, `createAqeClient`, `Resolve-AqeBridgeUrl.ps1`                                    | (must not appear at all)                                                                                                                                                      |

### 3. Environment-specific repos / tools → generic

| Find                                                                                    | Replace                                                                                                 |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `qa-suite` (a repo-specific test-suite skill name)                                      | "the repo's test runner (`npm test` / `pytest` / `go test` / `cargo test` / a repo test skill)"         |
| `iqa-mode`, `feature-planning` (private companion skills)                               | generic descriptions in the adjacency table ("interactive QA / triage tools", "feature-planning tools") |
| Internal monorepo / hostnames / `currents-bookkeeping` / `currentsbk.ca` / `salmon-run` | generic project names (`payments-service`) or removed                                                   |
| `Tasks/Manual/`, `Invoke-GitPullSafe.ps1`, `Invoke-SafeCommit.ps1`                      | "your team's convention" / "your issue tracker or `TODO/`"                                              |
| Any absolute Windows path (`C:\…`, backslash paths to private dirs)                     | relative / portable references                                                                          |

### 4. Keep identical

Do **not** change these — they are the contract:

- Skill names and the four-gate shape.
- The triage table and "4C skipped — trivial" note.
- The red-gate rule (commit the failing test alone; Check verifies via `git log`).
- The dossier four-section structure (Concern / Cause / Countermeasure / Check).
- The "no workarounds" and "fix every sibling in scope" rules.
- Frontmatter `name` / `description` / `triggers` (keep the trigger phrasing in
  sync — it is what makes the skills auto-activate).

## Step-by-step sync procedure

1. **Diff the canonical skills** since the last sync. Identify what actually
   changed (methodology wording vs. environment-specific references).
2. **Copy the changed content** into the matching public file from the table
   above.
3. **Apply the filter rules** (sections 1–3 above) by hand. Filtering requires
   judgment — do not automate it blindly.
4. **Run the leak check** (see below) and resolve every hit.
5. **Update both manifests in lockstep** if `version` or `description` changed:
   `.claude-plugin/plugin.json`, `.zcode-plugin/plugin.json`, and the
   `marketplace.json` entry must all agree.
6. **Bump the version** in all three manifests + `CHANGELOG.md` (semver: patch
   for clarifications, minor for additive changes, major for shape changes).
   Since 0.3.0 the plugin name is `4c-bugfix` and `agentic-4c-bugfix` is the
   deprecated alias — keep that relationship when syncing.
7. **Commit and push** to the public remote.

## Leak check

After filtering, run this from the repo root. It must report **zero** hits — any
hit is a private reference that leaked:

The canonical forbidden patterns and the scan skip/exclusion lists live in
`scripts/check-no-private-refs.js`; the scan covers the whole repository tree
(minus VCS metadata, dependencies, lane worktrees, dossiers, and build output),
so new files are guarded by default. `scripts/check-no-private-refs.sh` runs
the same scan when bash is available. Run `npm run check` from the repo root —
it exits non-zero if any forbidden token appears outside the excluded files.

## How often

Sync whenever a canonical change touches methodology, the red gate, the dossier
shape, a gate's steps, or trigger phrasing. Purely environment-specific changes
(private fleet wiring, internal hostnames) do **not** sync — they have no public
counterpart.
