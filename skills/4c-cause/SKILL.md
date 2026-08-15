---
name: 4c-cause
description: >
  Find the root cause of a bug with 5-Whys and a codebase-wide anti-pattern
  search, and record it in the 4C dossier. Use after `4c-concern` has produced a
  committed failing test. Never start fixing until Cause is documented.
triggers:
  - user
  - model
---

# 4C Cause — Find the root cause

Goal: an architectural explanation, not a symptom description, plus a complete
list of sibling occurrences. Write everything to the dossier Cause section.

1. **5-Whys.** State the direct cause, then ask "why?" until you reach an
   architectural cause - a missing guard, a wrong invariant, a duplicated
   pattern, a type hole, a schema mismatch, a race, an unchecked error path. Stop
   when the answer is "and that's the design defect."
2. **Name the violated invariant.** State the invariant the bug breaks in one
   sentence (e.g. "one payment row = one amount", "totals equal the sum of
   legs"). If it is a general invariant (money, dates, parser/serializer,
   state transitions, authorization, tenancy, idempotency/concurrency), note
   that the Concern gate should have added a failing property test - if it did
   not, add one now and record it in the dossier.
3. **Search the whole codebase** for the same anti-pattern (`rg` / `grep` /
   your search tool). List **every** sibling occurrence with `file:line` in the
   dossier. The Countermeasure gate will fix or explicitly defer each one.
4. **Document the root cause in one paragraph** in the dossier before writing any
   fix. If you can't explain it in a paragraph, you don't understand it yet.
5. Optional quality-scan gate: run a code-quality / complexity scanner on the
   affected region, and a secret/PII scanner if the bug involves URLs, secrets,
   or PII. Treat output as hints, not blockers.
