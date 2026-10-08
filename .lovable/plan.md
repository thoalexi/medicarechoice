# Declutter the Compare dashboard

Goal: the Compare page feels calm and scannable for seniors — fewer things shouting at once — without losing any plan data or filters.

## What changes

**1. Plan cards: show less, reveal on demand**
- Each plan card shows only: plan name, carrier, type, star rating, monthly premium, medical out-of-pocket limit, and true yearly cost.
- The long row of benefit tags (dental/vision/hearing/fitness/allowance/giveback/checkups) collapses into a single "Show benefits & details" toggle per card.
- The plan summary sentence stays, since it's plain language.

**2. One explanation box instead of several**
- The formulary note, Part B premium note, and worst-case drug-cost note are merged into one short, highlighted "Good to know" box at the top (3 short sentences max), instead of stacked paragraphs.

**3. Side-by-side table: grouped and shorter by default**
- The comparison table keeps all rows, but they're grouped under three headings: **Costs**, **Doctors & rules**, **Extra benefits** — so it reads in chunks instead of one long list.
- Rarely-needed rows (CMS plan type, CMS plan ID) move to the bottom under a "Technical details" toggle.

**4. Filters sidebar: quieter**
- Filter labels stay, but the sidebar gets more breathing room and the "Must include" options are shortened ("Dental", "Vision", "Hearing", "No referrals" — already short, kept as-is).
- No functional changes to filters, sorting, or the cost math.

**5. Visual calm**
- Reduce the number of colored borders/badges competing for attention: only the selected-for-compare cards keep the highlighted border; tags use one neutral style.
- Slightly larger spacing between cards so the list doesn't feel like a wall.

## What does NOT change
- All plans, filters, sorting options, and the true-yearly-cost math stay exactly the same.
- The guided questionnaire, formulary checker, and other pages are untouched.

## Technical notes
- All edits are in `src/routes/compare.tsx` (presentation only); no changes to `src/lib/plans.ts` or data files.
- Uses existing design tokens; no new colors.
