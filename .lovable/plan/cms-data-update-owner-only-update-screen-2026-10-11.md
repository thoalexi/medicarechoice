# CMS data update + owner-only update screen

## Part 1 — Fix current figures (one-time, from official CMS files)
- Part D yearly drug cap: change $2,100 (2026) to the confirmed 2027 $2,400 after re-checking the 2027 Announcement PDF.
- Part D deductible: confirm the 2027 standard maximum $700 is used only as a limit check; every plan keeps its own CMS deductible (audit that no plan was defaulted to $700).
- Star ratings: download the 2027 Star Ratings data tables (released Oct 8, 2026), match by contract ID (and plan-level Part D/overall summary category), label "2027 rating," keep "New — no rating yet" / "Not available" where CMS has none. The 2026 fallback stays only for contracts missing from 2027.
- Landscape and Plan Benefit Package: check CMS for newer 2027 releases than 202609 / Oct 1; import only if newer, with a change report.
- Part A / Part B: check whether CMS has published final 2027 figures. If not, keep 2026 figures labeled "2026 figure — 2027 not yet announced." No projections shown as fact.

## Part 2 — One shared, year-specific figures file
- All Medicare constants (Part B premium, Part D cap, standard deductible, MOOP limits, their year and confirmed/assumed status, source link) move into one data file that the cost math and all page wording read from.
- Pages updated to read from it: Compare, guide results, home, coverage guide, Michigan 2027 guide, methodology, footer, "Plan data as of" line. Michigan plan counts computed from the plan data, not typed.
- Wording kept: estimates not quotes; worst case is not a cap on every expense (excludes non-covered care, off-formulary drugs, out-of-network); drug checker beta notice; confirm drugs and doctors with the plan.

## Part 3 — Private "CMS Updates" screen (owner only)
Sign-in: owner-only account (email + password, sign-ups disabled), checked by an owner role on the server. Separate from feedback and donation data.

Screen has four actions:
1. Check for updates — looks at the CMS pages for newer files; records "last checked" per dataset.
2. Preview changes — downloads (or accepts an uploaded ZIP/CSV when download fails), imports into a staging copy, runs validation, shows additions, removals, changed figures and failures.
3. Publish checked update — only if validation passes; becomes the live version; records "last successfully updated."
4. Restore previous version — switches live back to the prior published version.

Each dataset version records: source URL, coverage year, CMS publication date, import date, SHA-256 checksum. Same checksum re-imported = "no change," no duplicate.

Financial constants (Part B, Part D cap, etc.) are never auto-approved: the screen shows the CMS value and source and the owner confirms it.

Weekly scheduled check emails nothing; it just marks "update available" on the screen for owner review. Nothing publishes automatically.

## Part 4 — Tests
Representative cost calculations, unavailable ratings, unchanged re-import, malformed file, interrupted import (live untouched), publish, rollback.

## Technical details
- Storage: new tables `dataset_versions` (dataset key, year, status staged/live/archived, checksum unique per dataset, source URL, published/imported/checked dates, validation report, JSON payload in storage bucket), `medicare_constants` (year, key, value, status confirmed/prior-year, source), `user_roles` with `has_role`. RLS: owner role only; public read only of the live published payload via a server function.
- Site reads live data through a cached server function; bundled JSON remains the built-in fallback so the site never breaks if the database is unreachable.
- Importers: port the existing Python parsing (landscape, PBP extras/copays/services, stars) to deterministic TypeScript that runs server-side (Python can't run on the published server). Existing scripts stay as the reference and are cross-checked against the TS output in tests. Large PBP ZIP handled by streaming unzip of only needed tables; manual upload via signed storage upload when the file exceeds request limits.
- Validation reuses the rules in `scripts/validate-data.py` (IDs, duplicates, counties, limits, ratings matched, missing values) plus a diff vs. live.
- Scheduled check: a protected server route called by a weekly database cron job.
- No AI anywhere in the import, matching, or approval path.
- Tests with vitest.

## Things you'll need to do
- Pick the owner email; you'll set a password on first sign-in.
- If CMS blocks automatic downloads, upload the file on the screen.
