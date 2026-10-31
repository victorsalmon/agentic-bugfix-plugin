---
name: 4c-concern
description: >
  Red gate of the 4C pattern — pin the failure by writing and committing a
  failing reproduction test before any application source is modified. Use when
  starting any non-trivial bug fix, when the reproduction is unclear, or as the
  first gate of 4c-bugfix. Never skip this gate; a fix without a red
  repro is not a 4C fix.
triggers:
  - user
  - model
---

# 4C Concern — Pin the failure (RED gate)

Goal: a committed, failing test that proves the bug exists, _before_ any source
edit. This is the gate the whole loop depends on.

1. Read the bug report, logs, and existing tests. Ask **at most two** clarifying
   questions if the reproduction is ambiguous — then proceed.
2. State the failure in one sentence and write it to the dossier
   (`.4c/<bug-id>.md`, Concern section): _"When X, Y happens instead of Z."_
3. **Do not edit application source.** Tests only.
4. Choose the lowest layer that shows the bug. If the repo has a test-suite
   skill or documented runner, use it to pick the right layer (unit / integration
   / browser-E2E); otherwise pick the layer that exercises the faulty logic with
   the least surrounding machinery.
5. Write a failing reproduction test. Run it in the shell and **confirm it fails
   for the bug's reason** (not for a setup error). Paste the failing output into
   the dossier. If the defect is a general invariant (money, dates,
   parser/serializer, state transitions, authorization, tenancy,
   idempotency/concurrency), also write a failing property test and record its
   seed.
6. **Commit the test on its own** with `test: add failing repro for <bug>` so the
   RED state is recorded in git history — `4c-check` will verify this commit
   precedes the fix.
7. If the test cannot be made to fail, stop. Either the bug is already fixed, it
   is environmental, or the reproduction is wrong — ask for clarification; do not
   proceed to Cause.
8. Optional quality-scan gate: run your defect-prediction / static-analysis
   scanner on the target if one is available. Treat the result as advisory only.
   Record findings (or "scanner unavailable") in the dossier.

## This gate is the change-level case of a general obligation

The red reproduction is not a special ceremony for bugs. It is the bug-shaped
case of one rule that applies to every change, fix or feature: **a change is not
proven until a test fails without it and passes with it.** A bug happens to be
the case where the "without it" half already exists in production.

So when the fix lands, do not stop at "the repro is green". Ask the same
question about the *rest* of the diff: if the new behaviour were inverted or
off-by-one, would any test notice? The deterministic way to answer that is the
diff-adversarial gate, which mutates only the lines the change added and
requires the change's own tests to fail:

```powershell
pwsh -NoProfile -File <cl-common>/Skills/battle-tested-qa/scripts/Invoke-DodgyDiff.ps1 `
  -RepoRoot <repo> -BaseRef <base> -TestCommand "<focused tests>"
```

`0` = every mutation of the change was noticed, `1` = at least one was not (a
surviving mutant: add the assertion), `2` = cannot-evaluate (no mutable line,
red baseline, dirty file) - which is work to do, never a pass. Doctrine and
limits: `Skills/battle-tested-qa/references/diff-adversarial-testing.md`.
