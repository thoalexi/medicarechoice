# Compare page: filters scroll with the page

## Goal
Undo the "sticky filters" change on the Compare page. Seniors may find a panel that stays put while the plans scroll confusing, so the filters will scroll away with the rest of the page — the simple, predictable behavior the site had before.

## Change
- In `src/routes/compare.tsx`, remove the sticky positioning from the filter panel (`lg:sticky lg:top-4 lg:self-start`). The panel keeps its current look and all filters; it simply scrolls with the page again.
- No other changes to filters, plans, or mobile behavior (on mobile the filters already sit behind the "Filters · County" show/hide button).

## Verify
- Build is clean.
- Scroll the Compare page on desktop width and confirm the filter panel scrolls away with the page.
- Quick check at 393px mobile width that the filter show/hide button still works.
