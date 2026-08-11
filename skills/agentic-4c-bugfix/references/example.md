# 4C Worked Example — split-payment double-count

A compact, realistic walkthrough. Names and SHAs are illustrative. Use this as
the shape of a correct 4C run, not a literal copy.

## The bug report

> "When I split a payment into two categories, the category-totals report counts
> the amount twice. A $100 split into $60/$40 shows $200 total."

Repo: `payments-service` — branch `fix/split-double-count`.

## Concern (RED)

- **Failure in one sentence:** When a payment is split into multiple categories,
  `getCategoryTotals()` sums each split leg against the *full* payment amount
  instead of the leg amount, so totals are multiplied by the number of legs.
- **Layer chosen:** unit test at the aggregation layer — the bug is pure logic,
  no I/O or UI needed.
- **Repro test** (`src/totals.split.test.ts`):

```ts
it('counts each split leg at its own amount, not the parent total', () => {
  const pmt = splitPayment({ amount: 100, legs: [{ cat: 'food', amount: 60 }, { cat: 'fuel', amount: 40 }] });
  expect(getCategoryTotals([pmt])).toEqual({ food: 60, fuel: 40 });
});
```

- **Run (RED):**

```
AssertionError: expected { food: 100, fuel: 100 } to equal { food: 60, fuel: 40 }
```

- Committed on its own: `test: add failing repro for split-payment double-count`
  (sha `a1b2c3d`).

## Cause

- **5-Whys:**
  1. Totals are doubled → `getCategoryTotals` adds `pmt.amount` per leg.
  2. Why? It reads the parent amount for every leg instead of `leg.amount`.
  3. Why? The legs reducer maps over `pmt.split.legs` but closes over `pmt.amount`.
  4. Why? The reducer was written before splits existed and was never updated for
     the legs data shape — **an unstale invariant: "one payment row = one amount"
     no longer holds for splits.** That is the design defect.
- **Sibling search** (`rg "pmt.amount" src --type ts`): same anti-pattern in
  `getMonthlyTotals()` (`src/totals.ts:88`) and the CSV-export reducer
  (`src/export.ts:140`). Both double-count splits.
- **Root cause (one paragraph):** Totals aggregators treat `pmt.amount` as
  per-leg, an invariant inherited from the pre-split schema. Split payments
  violate that invariant, so every aggregator that iterates legs and sums
  `pmt.amount` multiplies the parent total by the leg count.

## Countermeasure

- Centralized leg-amount resolution in `amountForLeg(pmt, leg)` and routed all
  three aggregators through it (the bug fix + both siblings).
- No test assertions changed.
- Committed: `fix(totals): count split legs at their own amount` (sha `e4f5a6b`).
- Dossier Countermeasure section lists all three call sites fixed.

## Check

- **Repro test now GREEN.** Edge cases added: single-category payment (unchanged
  behavior), empty split (`legs: []`), 3-way split, split whose legs don't sum to
  parent (asserts it still uses leg amounts, not parent).
- **Red-gate proof:** `git log -- src/totals.split.test.ts` shows `a1b2c3d` (RED
  test) before `e4f5a6b` (fix). Checked out `a1b2c3d`, re-ran the test → failed
  as recorded.
- **Full suite:** the repo's test runner (`npm test`) is GREEN, no regressions.
- **Harden:** added a dev/test-build assertion `assertLegsSumToParent(pmt)` so a
  future split that drops a leg fails loudly instead of producing a wrong total.
- **Quality scan:** ran the available static analyzer on `totals.ts` — no new
  findings; complexity dropped slightly after centralizing `amountForLeg`.
- **Final report:** committed in the dossier and the fix-commit body — RED proof,
  root-cause paragraph, GREEN proof, sibling-fix list, scan findings.
