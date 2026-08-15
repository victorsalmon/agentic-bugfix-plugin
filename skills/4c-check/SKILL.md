---
name: 4c-check
description: >
  Verify a 4C bug fix, harden against the bug class, and prove a green
  regression-suite run. Use after `4c-countermeasure`. Produces the proof
  (red-then-green, full suite, blast-radius) that the fix is regression-proof.
---

# 4C Check — Prove the fix and harden

Goal: evidence, in the dossier, that the fix works and the bug class cannot
silently recur.

1. **Re-run the Concern repro test.** Confirm GREEN. Paste output into the
   dossier Check section.
2. **Verify the red gate.** Confirm the repro test's commit (`test: add failing
   repro …` from `4c-concern`) precedes the fix commit in `git log`, and that the
   test was actually RED without the fix — `git stash` the fix (or check out the
   test commit) and re-run the test to see it fail. If you cannot show
   red-then-green, the gate failed; do not claim the fix is done.
3. **Add 2–3 edge-case tests** around the bug: boundary values, null/empty,
   concurrency/timing where relevant.
4. **Run the full repo test suite.** Use the repo's documented runner
   (`npm test` / `pytest` / `go test` / `cargo test` / a repo test skill) plus the
   linter. **No regressions** — a single red test outside your change blocks the
   fix.
5. **Prove the changed invariants.** Classify every changed behavior as money,
   date/time, parser/serializer, state transition, authorization, tenancy,
   idempotency/concurrency, or `no general invariant` with a concrete reason.
   Run the complete property suite with a recorded reproducible seed; add a
   property for every applicable invariant and a TEETH test showing a broken
   implementation or equivalent mutant is rejected.
6. **Prove the tests can detect faults.** Mutate every changed executable
   business/security file and run the full configured mutation portfolio.
   Require at least 85% per mutated file and zero meaningful survivors affecting
   money, tax, dates, authorization, tenancy, validation, idempotency, or state
   transitions. Add newly changed high-risk modules to the portfolio; never
   exclude meaningful mutants merely to raise the score.
7. **Second blast-radius scan.** Re-search the codebase for the same anti-pattern
   from `4c-cause`. Fix any new hits in scope, or list remaining ones in the
   dossier.
8. **Harden against the bug class** so it cannot reoccur silently: a type
   constraint, a schema check, a lint rule, an invariant assertion, or a guard —
   whichever fits.
9. **Optional quality-scan gate.** If a scanner is available, run a code-quality
   scan and a secret/PII scan on the changed files, and a docs/contract scan on
   anything the fix touched. Record findings (or "scanner unavailable: <reason>").
10. **Final report** in the dossier Check section (mirrored in the commit message
   / PR description / handoff — whichever the repo uses):
   - Proof the repro test was RED before the fix (commit SHA + output).
   - One-paragraph root cause (from Cause).
   - Proof the repro test + full suite are GREEN after the fix.
   - Property seed/results, changed-file and full-portfolio mutation scores,
     and every surviving mutant with its disposition.
   - Blast-radius result and any out-of-scope risks.
   - Scan findings and whether a scanner was available.
