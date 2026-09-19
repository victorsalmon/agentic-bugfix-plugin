---
name: 4c-bugfix
description: >
  Run a rigorous Concern-Cause-Countermeasure-Check bug fix with a committed
  failing reproduction, root-cause and sibling analysis, an architectural
  repair, property/invariant testing, changed-code mutation testing, and full
  regression proof. Use for non-trivial bugs, regressions, incorrect results,
  or data-handling defects.
triggers:
  - user
  - model
---

# 4C Bug Fix

Run `4c-concern`, `4c-cause`, `4c-countermeasure`, and `4c-check` in order.
Keep the four sections in one dossier at `.4c/<bug-id>.md`. Template:

```markdown
# <bug-id> - 4C Bug Fix

**Repo:** <name> - <branch> **Started:** <date>

## Concern

- Failure in one sentence: When X, Y happens instead of Z.
- Repro test: <path>#<test-name> (committed at <sha>, RED)
- Repro run output (failing): <paste>
- Property test (if the defect is a general invariant): <path>#<prop-name>
  (committed at <sha>, RED)

## Cause

- Root cause (one paragraph): ...
- Violated invariant: ...
- Sibling occurrences of the anti-pattern: <path:line> list

## Countermeasure

- Fix commit(s): <sha> Siblings fixed: <list or "n/a">

## Check

- Repro test now: GREEN (paste)
- Property suite: seed <seed> - GREEN (paste); TEETH proof that a broken
  implementation is rejected
- Mutation: changed-file scores <x%>/<y%>, full-portfolio score <z%> (threshold
  85%); survivors listed with disposition
- Edge-case tests added: <list>
- Full suite: GREEN Quality-scan findings: <list or "scanner unavailable">
- Red-gate proof: test commit <sha> precedes fix commit <sha>; test was RED without fix.
```

## Required proof

1. Commit and run a failing reproduction before changing application source.
2. Identify the violated invariant and every sibling occurrence of the cause.
3. Fix the architecture and siblings without weakening tests or mutation scope.
4. Prove red then green and run the repository's complete QA contract.
5. Classify changed behavior (money, date/time, parsing, state, authorization,
   tenancy, idempotency/concurrency, or no invariant with a reason).
6. Run the complete property suite with a reproducible seed. Add a property for
   each applicable invariant and prove its teeth against a deliberately broken
   implementation or equivalent mutant.
7. Mutate every changed executable business/security file and run the full
   configured mutation portfolio. Require at least 85% per mutated file and
   zero meaningful survivors affecting money, tax, dates, authorization,
   tenancy, validation, idempotency, or state transitions.
8. Add newly changed high-risk modules to the mutation portfolio. Never exclude
   meaningful mutants merely to raise a score.

Documentation-only edits are exempt. A red required gate blocks completion.

`agentic-4c-bugfix` is retained temporarily as a compatibility alias; invoke
`4c-bugfix` for new work.
