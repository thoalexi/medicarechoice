# Keep CMS sources verifiably current (simplified, 2027 only)

## Principle

"Checked" never means "the website is current." A source shows as fine only when your last check **succeeded** and found **nothing newer** than the version **actually serving the website**.

## What changes

1. **Checks run only when you press "Check CMS now."** The unused scheduled-check route and the false "runs every Monday" line are removed. Nothing checks on opening the screen.

2. **One check per distinct source per run.**
   - Plan list (Landscape file)
   - Benefits file — covers copays, extras and service-level figures together
   - Star ratings
   - Michigan hospital list (new)
   - Part B 2027 announcement page (new, to know when real figures land)

3. **Lightweight first.** Each check reads the CMS page's release date and file name. The file is downloaded and checksummed only when that suggests a change, or when you press a "Full comparison" option. If contents weren't compared, the row says "File contents not compared."

4. **Each source row on the existing screen shows:**
   - Last successful check (and, if the latest attempt failed, "Last check failed" with the reason — stays visible until a later check succeeds).
   - Newest release found at CMS.
   - Version serving the website (published version if one is live, otherwise the built-in file).
   - Status: No newer release found / Update available / Check failed / Manual verification required. "Update available" stays until that release is published.

5. **Drug lists keep the current cache.** No scanning every plan. A cached document is reused until it expires (30 days) or you ask to refresh it. Each entry records plan ID, coverage year, official URL and retrieval date. If the document can't be confirmed as 2027, visitors see the existing "couldn't confirm" message with the insurer link and upload option. On the screen, drug lists show as "Manual verification required."

6. **2027 only; 2026 fallback, labelled.** Where a confirmed 2027 figure doesn't exist yet (Part B premium and deductible today), estimates use the confirmed 2026 value, and a short label sits beside each affected estimate: "Uses 2026 Part B amount — 2027 not announced yet." Projections are not stored or used. When you confirm the 2027 values, calculations switch and the labels disappear in the same step.

7. **Medical out-of-pocket ceiling** stays "not confirmed" until entered with its official document, link, page/table and limit category.

8. **Validate before publishing.** A staged update must pass the existing validation checks before Publish is allowed. Preview, publish and restore stay as they are. Methodology and validation pages describe only the live version — a check or preview never changes them. The stale 2026 star wording is corrected from the live 2027 data.

9. **Low AI use.** All checks, parsing, comparison and checksums are ordinary code. No dataset or document goes through AI for freshness checks. (The existing drug-list lookup's single AI pick step stays, used only on cache miss or refresh.)

## Tests

- Failed download shows "Check failed," never green.
- Same file name, changed contents (full comparison) shows "Update available."
- Unpublished newer release stays "Update available" after re-checks.
- Comparison uses the published version when live, otherwise built-in.
- Benefits file is checked once per run, not per category.
- Cached drug list past 30 days or without a confirmed 2027 year isn't treated as current.
- Estimates use 2026 Part B with label; after confirming 2027, math changes and labels vanish together.
- A staged update that fails validation can't be published.

## Remaining gaps (need you)

- Out-of-pocket ceiling: the CMS memo couldn't be downloaded automatically; you'll enter it with proof.
- Part B 2027: you confirm when CMS announces it.
- Publishing always needs your review.

## Technical details

- `dataset_checks`: additive columns `last_success_at`, `last_error`, `found_release`, `found_file`, `found_checksum`, `contents_compared`.
- `src/lib/cmsImport.ts`: extend `WATCHED` with hospitals and Part B page; services map to the pbp check; baseline from live `dataset_versions` row else bundled metadata in `data/sources.json`. Streamed SHA-256 only on change or full comparison.
- Pure `deriveStatus()` with unit tests in `cmsImport.test.ts`.
- Delete `src/routes/api/public/cms-check.ts`; update `admin.cms-updates.tsx` rows in place (no new screen).
- `formulary_documents`: additive `plan_id`, `coverage_year`, `retrieved_at`; reuse rule = 2027 and under 30 days.
- `medicare-figures.json`: per figure `year` + `confirmed`; fallback label component driven by `figureNote` beside yearly estimates.
- `publishVersion`: require passing validation result.
- `scripts/validate-data.py`: read star year/counts from data; regenerate provenance/report.

## Two added safeguards

- **Metadata-only wording.** When only the release date and file name were checked, the status reads "No newer release found — metadata only." Nothing is ever labelled "verified current."
- **Validation tied to the exact staged version.** Each validation result stores the checksum and ID of the staged version it tested. Publish is allowed only if that version's own passing result matches its checksum. A pass from an older version or from the live data never counts. Enforced inside the publish function in the database, not just on screen. Tests cover both cases.
