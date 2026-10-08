# Plan: Formulary & worst-case drug cost explanations

## Goal
Make two things clear on the site, in plain language:
1. Every plan that includes prescriptions has its own **formulary** (list of covered drugs) — before enrolling, check the plan's formulary to confirm your drugs are covered and what they will cost.
2. **Worst-case cost figures shown in plan marketing usually exclude medication costs** — if you take an expensive drug, your real yearly total can be higher. (MedicareChoice's own worst-case estimate *does* include the Part D out-of-pocket cap of $2,100 — say so, and note the caveat that it assumes your drugs are on the plan's formulary.)

## Changes

### 1. `src/routes/compare.tsx`
- Under the existing "True yearly cost includes the standard Part B premium…" source line, add a short highlighted note box (plain language, senior-friendly):
  - "Every plan that covers prescriptions has its own **formulary** — the list of drugs it covers. Before you enroll, look up your medications in the plan's formulary to make sure they're covered and see what you'd pay."
  - "Our worst-case figure includes the Part D drug out-of-pocket cap ($2,100 in 2027) — but only if your drugs are on the plan's formulary. If you take an expensive drug that isn't covered, your true cost could be higher."
- Optionally add the same formulary reminder as a second line under the "Drugs included" comparison-table row label — keep it to the note box if the table stays clean.

### 2. `src/routes/guide.tsx` (Results)
- In the intro paragraph under "Your best-fit plans", add one sentence: prescription estimates assume your drugs are on the plan's formulary.
- After the "Worst-case year:" line, add a small note: "This worst case includes drug costs up to the Part D cap — something most plan ads leave out. Check the plan's formulary to confirm your exact medications are covered."

### 3. `src/components/SiteHeader.tsx` (Disclaimer)
- Append one sentence: "Plans that cover prescriptions each have their own formulary (list of covered drugs) — confirm your medications are covered, and at what cost, in the plan's formulary before enrolling."

## Non-changes
- No change to the cost math in `src/lib/plans.ts` — it already includes drug spending and the Part D cap in both the estimate and the worst case.
- No new data files, no CMS regeneration.

## Verification
- Typecheck + build clean.
- Load /compare and /guide in the preview (Playwright) and confirm the new notes render in the right spots.
