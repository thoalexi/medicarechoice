# Keep every data source verifiably current (revised)

## Principle

"Checked" never means "the website is current." The screen only says a source is fine when a check **succeeded**, found **nothing newer** than what the **live website is actually using**. Anything else gets an honest status.

## What you'll get

1. **Three separate facts per source**, shown side by side:
   - Last check: when it was attempted, and whether it succeeded or failed (with the reason).
   - Newest release found at CMS: release date, file name, and checksum when available.
   - Serving the website: which version the public site uses right now — built-in file or a published version — with its release date and checksum.

2. **Comparison is against live data, not paperwork.** "Newer or not" is decided against the version actually serving the site (published version if one is live, otherwise the built-in file). Editing the source list alone can never make old live data look current.

3. **Honest statuses only:**
   - No newer release found — successful check within 7 days, newest found matches live.
   - Update available — a newer release was found but not published. Stays this way until you publish it, however recent the check.
   - Check failed — the last attempt failed. Never green, even if an earlier check succeeded.
   - Check overdue — no successful check in 7 days.
   - Manual verification required — the source can't be checked automatically (drug lists, the medical out-of-pocket ceiling, Part B figures until CMS announces them).

   The top summary counts these statuses exactly, for example "3 no newer release · 1 update available · 2 need manual verification". It never says "all sources checked" when some weren't. Data categories that share one CMS file (copays, extras and service-level figures all come from the benefits file) are shown grouped under that file, so one check isn't counted as three.

4. **The screen checks itself when opened** for any source with no successful check in 7 days. The button stays. The false "runs every Monday" line is removed.

5. **Hospital list and other downloads** are compared by CMS release/version metadata **and** a checksum of the downloaded file, where CMS allows the download. If only a webpage date is available, the status says so ("release date only, file not compared") rather than claiming the data is unchanged. A changed file with the same name is caught by the checksum.

6. **Drug lists (Check my drugs) — verified, not assumed.**
   - Each cached document records: plan ID (contract–plan–segment), coverage year, official document URL, when it was retrieved, and the document's version text or checksum when available.
   - Cache rule: an entry is reused only if its coverage year is 2027 and it was retrieved within 30 days; otherwise it's re-looked-up. A document whose year can't be confirmed as 2027 is never shown as current — the visitor sees the existing "couldn't confirm" message with the insurer link and upload option.
   - The update screen shows drug lists as "Manual verification required", with counts of cached documents, how many are older than 30 days, and how many lack a confirmed year. Nothing about users is stored — only public document details.

7. **Part B figures labelled where they're used.** Cost estimates keep using the confirmed 2026 Part B amounts ($202.90/month, $283 deductible). Every results page and plan card that shows a yearly estimate says, right beside the number: "Uses 2026 Part B amounts — 2027 not announced yet." Projected 2027 figures ($209.50 / $292, trustees' projection) are stored separately, marked projected, and can never feed the cost math. Confirmed, projected and prior-year values are kept as three distinct kinds.

8. **Medical out-of-pocket ceiling needs real proof.** It stays "not confirmed" until you enter, together: the amount, the official document title, a verifiable link or uploaded copy, the page/table, the coverage year, and the limit category (e.g. in-network mandatory maximum). A number without these is rejected.

9. **Public Methodology and validation pages describe the live version only.** They're generated from whatever is serving the site. A check or a preview never changes them; only publishing does. The stale 2026 star wording is fixed by regenerating from the current live data (2027 ratings).

10. **Preview, publish and restore stay exactly as they are.** Checks only flag; nothing publishes on its own.

## Tests that must pass

- A failed download shows "Check failed", never green.
- Same file name, different contents → "Update available" (checksum).
- No successful check in 7+ days → "Check overdue".
- A newer file found but unpublished stays "Update available" after re-checks.
- Cached formulary older than 30 days or with a non-2027 or missing year is never treated as current.
- Built-in vs published data: comparison uses whichever is live.
- An incomplete or failed preview can't replace live data or change public provenance.
- A projected figure can never reach cost math or be marked confirmed.
- An out-of-pocket entry missing any proof field is rejected.

## What still needs you

- **Out-of-pocket ceiling:** the CMS memorandum couldn't be downloaded automatically (their server refused). You'll need to get the document and enter the figure with its proof details.
- **Part B 2027:** when CMS announces it (expected November), the screen will flag it; you review and confirm.
- **Drug lists:** spot-check a few plans' documents occasionally; the screen tells you which are stale or unconfirmed.
- **Publishing:** every update still needs your review before it goes live.

## Technical details

- `dataset_checks`: add columns `last_attempt_at`, `last_attempt_ok`, `last_error`, `last_success_at`, `found_release`, `found_file`, `found_checksum` (additive migration).
- `src/lib/cmsImport.ts`: `WATCHED` covers landscape, pbp (grouping extras/copays/services), stars, hospitals, Part B announcement page. Compute SHA-256 of downloads where feasible (size-capped, streamed on the Worker). Baseline = live version from `dataset_versions` (live row) else bundled metadata in `data/sources.json` + bundled checksum.
- Status derivation is a pure function `deriveStatus(check, live, now)` with unit tests for every case above.
- `admin.cms-updates.tsx`: three-column per-source layout, grouped by source file; summary counts; auto-check on load for overdue sources.
- `formulary_documents`: add `plan_id`, `coverage_year`, `retrieved_at`, `doc_version`, `checksum` (nullable, additive); lookup enforces the 2027 + 30-day reuse rule.
- `medicare-figures.json`: `status: confirmed | projected | prior_year`; `PART_B_*` cost constants read only confirmed/prior_year values; an inline label component is shown next to yearly estimates.
- MOOP entry: owner form with required proof fields stored in a staged `figures` version; `validate-data.py` reads it only from the live version.
- `scripts/validate-data.py`: read star year/counts from the data; provenance and methodology rendered from the live dataset version, not from check results.
- `README.md`: short weekly routine.
