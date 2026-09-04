# 4C usage example (skills-only repo — no runnable API)

This repo ships agent skills, not a library, so there is no code to import.
The example below shows the intended interaction shape: one bug, one dossier,
four gates.

## Triaging a bug report

User:

> The totals report double-counts split payments.

Agent (running the `4c-bugfix` skill) triages: non-trivial, reproducible in
code → run the full loop, tracking state in `.4c/split-totals.md`.

## The four gates in brief

1. **Concern** — write a failing reproduction test that pins the failure, run
   it in the shell, and commit it before touching application source:

   ```text
   test/totals.test.ts: split payment of $10/$15 across two accounts
   expected 25, got 40 → RED, committed
   ```

2. **Cause** — run 5-Whys on the red repro and record a one-paragraph root
   cause plus sibling occurrences of the same anti-pattern in the dossier.
3. **Countermeasure** — fix the cause (not the symptom) and every in-scope
   sibling; reference the fix commit(s) in the dossier.
4. **Check** — flip the repro green, add edge/property cases, run the full
   regression suite, and record the proof in the dossier.

Trivial changes (typos, config values, cosmetic tweaks) skip the loop with a
`4C skipped — trivial` note, per the skill's triage step.

See `skills/4c-bugfix/SKILL.md` for the full loop and
`skills/agentic-4c-bugfix/references/` for worked examples.
