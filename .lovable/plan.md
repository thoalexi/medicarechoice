# Fix feedback submissions + enrich plan details

## 1. Fix "supabaseUrl is required" on feedback submit (the mobile bug)

**Root cause (confirmed):** `src/lib/feedback.functions.ts` reads `process.env["VITE_SUPABASE_URL"]` and `process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]` inside the server handler. `VITE_*` variables are browser build-time values — they don't exist in the published site's server runtime, so the database client is created with an empty URL and every submission fails. It worked in preview because the dev server exposes them.

**Fix:** read `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (the server-side names, which exist in both preview and published runtimes) instead. Then verify end-to-end by submitting real feedback in the preview and confirming the row lands in the feedback table.

## 2. Fix worst-case sorting

**Root cause (confirmed):** the compare page's "worst case" sort orders plans by their out-of-pocket maximum only, ignoring premiums — so the order looks random. Fix: sort by the computed worst-case yearly total (premium + out-of-pocket limit + drug cap), with "unlimited" plans last.

## 3. Answer the Part B question on the page

The true yearly cost **already includes** the Part B premium ($202.90/month, 2026 figure) — but nothing on the page says so, which is exactly what the visitor asked about. Add a clear line near the cost breakdown, e.g. "Includes the standard Part B premium of $202.90/month."

## 4. Add more benefit detail per plan

From the CMS data we already have, plus the benefits file:

- **Star ratings**: already in the data (`starRating`) — surface them visibly on plan cards/rows (e.g. "4.5 ★ CMS rating") for each plan.
- **Fitness benefit** (e.g. gym membership): parse from the CMS Plan Benefit Package file (fitness benefit category) via `scripts/build-mi-extras.py`, add to the extras JSON, and show as a tag/column like dental/vision/hearing.
- **Monthly allowance / Part B giveback**: parse the Part B rebate / over-the-counter or flex allowance benefits from the same PBP file where available; show as "Monthly allowance: $X" when present.
- **No-copay preventive care** (yearly checkups, mammograms, screenings): add a note that Medicare covers these at $0 on every plan type (this is a Medicare-wide rule, so it's safe to state generally rather than per-plan).

## Technical notes

- `src/lib/feedback.functions.ts`: swap env var names only.
- `src/routes/compare.tsx`: worst-case sort key; star rating display; new benefit columns/tags.
- `scripts/build-mi-extras.py` + `src/lib/cms2027-mi-extras.json`: extend parser for fitness and allowance benefits, regenerate JSON from the already-downloaded CMS PBP 2027 file (no hand-edited figures).
- `src/lib/plans.ts`: extend `extrasDetail` type with fitness/allowance fields.
- Verify: typecheck, vitest, and a real feedback submission through the preview.
