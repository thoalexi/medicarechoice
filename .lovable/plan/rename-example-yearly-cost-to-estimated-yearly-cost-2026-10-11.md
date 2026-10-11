# Rename "Example yearly cost" to "Estimated yearly cost"

## Why
"Example" makes the figure sound invented. The premiums, copays and deductibles underneath are real CMS 2027 figures; only the assumed usage in a typical year is estimated. "Estimated yearly cost" says both things honestly.

## Changes
Rename the label everywhere it appears — no logic changes:

1. **src/routes/compare.tsx**
   - Meta description ("by region, example yearly cost, network…").
   - Cost-terms help popover: term name (definition text unchanged).
   - "About these estimates" popover paragraph.
   - Sort dropdown option and its explanation.
   - Side-by-side comparison table row label.
   - Plan card labels (mobile and desktop) — currently lowercase "example yearly cost"; becomes "estimated yearly cost".
2. **src/routes/guide.tsx**
   - Meta description ("…with example yearly costs").
   - Results header label next to the yearly figure.
3. **src/lib/plans.ts**
   - `SORT_LABEL.total`: "example yearly cost" → "estimated yearly cost" (used in the "Why are plans in this order?" sentence).
   - Update the nearby code comment to match.

The sibling label "High-cost scenario (illustrative)" stays as is — the user has not asked to change it.

## After the change
- Save the wording choice to project memory (cost label is "Estimated yearly cost").
- Verify: typecheck clean, and check the Compare page at 393px mobile width to confirm the renamed labels fit without wrapping issues.
