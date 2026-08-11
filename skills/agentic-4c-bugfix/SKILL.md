---
name: agentic-4c-bugfix
description: >
  Orchestrate a disciplined 4C (Concern-Cause-Countermeasure-Check) bug fix that
  is reproduced, root-caused, blast-radius-free, and regression-tested. Use when
  the user reports a bug, says "fix this", "why is X broken", "this used to
  work", "there's a regression", or wants a structured regression-proof repair.
  Also use for any non-trivial defect where a guess-and-patch fix is not
  acceptable.
triggers:
  - user
  - model
---

# Agentic 4C Bug-Fixing — Orchestrator

Run a full 4C loop for any non-trivial bug. The goal is a fix that is
**reproduced, explained, blast-radius-free, and regression-tested**. Do not skip
gates; do not collapse them into one pass. A worked example lives in
`references/example.md` — read it the first time you run this skill.

## Triage first — is 4C warranted?

Not every "fix this" needs the full loop. Decide before starting:

| Signal | Action |
|---|---|
| Typo, copy change, CSS tweak, single config value, no logic change | Fix directly. Commit with `fix:` and note "4C skipped — trivial (no logic change)." No dossier. |
| Anything else — a logic bug, a wrong result, a crash, a regression, a data-handling error | Run the full 4C loop below. |

When in doubt, run the loop. The cost of a 4C loop on a borderline bug is far
smaller than the cost of a symptom-patch that recurs.

## The dossier (mandatory for a full loop)

Carry state between gates in one dossier at `.4c/<bug-id>.md` relative to the
project root (create the `.4c/` dir; it's gitignore-friendly). Move it alongside
the fix when done. Every gate appends its section. If gates run in different
sub-agents or sessions, the dossier is how the next gate knows what the previous
one found. Template:

```markdown
# <bug-id> — 4C Bug Fix
**Repo:** <name> — <branch>   **Started:** <date>

## Concern
- Failure in one sentence: When X, Y happens instead of Z.
- Repro test: <path>#<test-name>   (committed at <sha>, RED)
- Repro run output (failing): <paste>

## Cause
- Root cause (one paragraph): ...
- Sibling occurrences of the anti-pattern: <path:line> list

## Countermeasure
- Fix commit(s): <sha>   Siblings fixed: <list or "n/a">

## Check
- Repro test now: GREEN (paste)
- Edge-case tests added: <list>
- Full suite: GREEN   Quality-scan findings: <list or "scanner unavailable: <reason>">
- Red-gate proof: test commit <sha> precedes fix commit <sha>; test was RED without fix.
```

> If your team has a preferred location for fix records (e.g. `docs/fixes/`,
> a ticketing dir, an `issues/` folder), use that instead of `.4c/` — just stay
> consistent.

## The four gates

Run each by invoking its skill. Do not inline the steps from memory — load the
skill so you follow its current wording.

1. **Concern** — invoke `4c-concern`. No application source is touched until a
   failing reproduction test exists, is run in the shell, and is committed (RED).
2. **Cause** — invoke `4c-cause`. Document the root cause and every sibling
   occurrence of the anti-pattern in the dossier.
3. **Countermeasure** — invoke `4c-countermeasure`. Fix the architecture, not the
   symptom; fix every sibling in scope.
4. **Check** — invoke `4c-check`. Re-run the repro, add edge tests, run the full
   test suite, harden against the bug class, and prove the red gate.

## Optional quality-scan gate

`4c-concern`, `4c-cause`, and `4c-check` each offer an *optional* quality-scan
step. If you have a scanner available (a custom quality engine, SonarQube,
CodeQL, Semgrep, an MCP-served analyzer, etc.), run it on the affected files and
record findings in the dossier. **Scanners are advisory and non-blocking**: if no
scanner is wired up, record "scanner unavailable" and continue. Never let an
external scan block a fix.

## Adjacent skills — when to use what

| Skill / tool | Owns | Boundary vs 4C |
|---|---|---|
| **agentic-4c-bugfix (this)** | Fixing one confirmed bug rigorously | Takes a single known bug, returns a regression-proof fix |
| Interactive QA / triage tools | Human testing + inline triage of bugs found while testing | Intake: hands a confirmed bug *to* 4C. Does not fix rigorously itself. |
| Repo test runner (`npm test` / `pytest` / `go test` / repo test skill) | The automated test suite | 4C-Check calls it to run the full suite and to choose the repro layer. |
| Feature-planning tools | Shaping *new* features | 4C is for defects in existing behavior, not new scope. |

If you arrived here from an interactive QA or triage session, the bug is already
triaged — skip straight to the dossier + Concern gate.
