---
name: 4c-countermeasure
description: >
  Implement the architectural fix for a bug and repair every in-scope sibling
  occurrence identified by 4c-cause. Use after `4c-cause` has documented the root
  cause. Fix the cause, never the symptom.
triggers:
  - user
  - model
---

# 4C Countermeasure — Fix the cause

Goal: the minimal architectural change that makes the reproduction test pass,
plus every sibling occurrence repaired or explicitly deferred.

1. Implement the minimal, architectural fix that turns the Concern repro test
   GREEN. **Do not change the test's assertions** — if the assertions need to
   change, the reproduction was wrong; go back to `4c-concern`.
2. Fix **every** sibling occurrence listed in the dossier Cause section. For any
   sibling that is out of scope (different module, different release, too risky),
   do not silently skip it — list it in the dossier and in the final commit / PR
   / handoff under "Blast radius not fixed", and write a follow-up task (issue
   tracker, `TODO/`, or your team's convention).
3. No workarounds. If a real fix is genuinely blocked and a workaround is the
   best available, **stop and ask the user** rather than committing a workaround
   dressed as a fix.
4. Record the fix commit SHA(s) and the sibling-fix list in the dossier
   Countermeasure section.
