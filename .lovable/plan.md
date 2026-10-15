# Keep every data source verifiably current

## Short answer

Today you press **Check CMS now** on the CMS Updates screen and it reads the CMS pages for newer files. That works — but it only covers 3 of your 6 sources, the weekly automatic check it promises doesn't exist, and the public "sources and dates" list still describes the 2026 star file even though the site now shows 2027 ratings. The plan below closes those three gaps so the screen can be trusted as the single answer to "is anything out of date?".

## What you'll get

1. **Every source gets checked, not just three.**
   - Plan list, copays/benefits and star ratings are checked today.
   - Service-level figures (imaging, therapy, labs) share the same CMS file as copays, so they will now flag together — when the benefits file is superseded, both are marked needing a re-import.
   - The Michigan hospital list gets its own check against the CMS provider-data page.
   - Drug lists stay as they are: looked up live when someone uses "Check my drugs", so there is no file date to watch.

2. **The screen checks itself when you open it.** Anything not checked in the past 7 days is checked automatically as the page loads, and the results appear the same way as the button's results. The button stays for when you want an immediate answer. The line "Also runs automatically every Monday" is removed — it is not true — and replaced with what actually happens.

3. **A plain summary at the top** of the screen, for example:
   ```text
   All 6 sources checked today — CMS has nothing newer.
   ```
   or
   ```text
   2 need attention: hospital list (last checked 12 days ago),
   benefits file (newer CMS file posted Oct 21).
   ```
   Each source keeps its own "last checked" and "last successfully updated" dates, with a warning colour when a check is more than a week old.

4. **The public source list tells the truth about star ratings.** The Methodology page and the hidden validation report still say the site shows 2026 ratings, from a file imported Oct 8. The site actually shows CMS 2027 ratings (605 contracts rated, 130 with no rating, from the Oct 8 2026 CMS file). Those two pages get regenerated from the real data. The "Plan data as of" line itself stays as it is.

5. **The two open figures are handled openly.**
   - **Part B premium and deductible.** CMS has not announced 2027 amounts; the trustees project $209.50 monthly and a $292 deductible, and CMS is expected to announce the real figures in November. You chose to show the projection as well. It appears clearly labelled as a projection, never as a fact, and **cost estimates keep using the confirmed 2026 amounts** ($202.90 and $283) so no estimate rests on a guess. The update screen will also watch for the CMS announcement so you are told when the real numbers land.
   - **Medical out-of-pocket maximum.** The check still reads "Limit not confirmed" because the official CMS document setting the 2027 ceiling has not been read directly. The number lives in the *Final CY 2027 Part C Bid Review Memorandum* (April 22, 2026), which CMS distributes through its contractor mailbox and does not link from its own 2027 rate pages. Until that document is read and its figure recorded, the check stays "not confirmed" — nothing is guessed. Once recorded, the check turns to pass or fail by itself.

6. **Nothing publishes on its own, ever.** Checks only flag. Preview, publish and restore stay exactly as they are, and a failed preview still can't replace live data.

## Things to note

- **Nothing has been published through the screen yet** — no versions exist, so the site runs entirely on its built-in data files. That is fine and is the safer state; the screen's "Restore previous version" only becomes meaningful after a first publish.
- **The hospital list is the oldest source** (CMS release July 22, 2026) and has never been checked automatically. It is the most likely of the six to be behind.
- **One snapshot exists so far** (Oct 10), so the "plans changed since last import" comparison has no second point yet; it starts working at the next import.
- I could not download the bid review memorandum automatically — that server refused the request twice. Getting its out-of-pocket figure may need you to download the file and paste the number in.

## Technical details

- `src/lib/cmsImport.ts`: extend `WATCHED` to cover `services` (tied to the PBP file) and `hospitals` (CMS provider-data dataset page, compared by release date). Replace the hard-coded `current` baseline strings with the dates and file names already in `data/sources.json`, so a re-import only needs one file updated.
- `src/lib/cmsUpdates.functions.ts` / `admin.cms-updates.tsx`: on load, run `runCmsCheck` for any dataset whose `last_checked_at` is older than 7 days (owner-only, same server function as the button); render the summary line and the over-week warning. Delete the false "every Monday" sentence.
- `scripts/validate-data.py`: the star-rating check's wording is hard-coded to 2026; make it read the bundled star file's year and counts so the report and `src/lib/data-provenance.json` describe the 2027 file. Re-run it to regenerate `validation-report.json`, `data-provenance.json` and a new `data/snapshots/` entry.
- `src/lib/medicare-figures.json`: add projected Part B premium and deductible with an explicit `projected` status, the trustees-report source, and a note that CMS announcement is expected in November. `figureNote` and the pages that quote Part B gain a projection wording; the cost math (`PART_B_MONTHLY`, deductibles used in `estimateAnnual`) keeps reading the confirmed values. Add a `WATCHED` entry for the CMS Part B announcement page.
- `data/sources.json`: record `moopInNetworkMax` and its source once the memorandum is read; `validate-data.py` already branches on it, so the check flips from "unconfirmed" to pass/fail with no code change.
- `src/routes/api/public/cms-check.ts` and `src/integrations/supabase/cron-auth.ts` stay in place and unused for now; the weekly schedule is not being pursued since you chose the open-the-screen check.
- Tests (`src/lib/cmsImport.test.ts`, new cases): every dataset with a CMS page is in `WATCHED`; the auto-check triggers only past 7 days; a projected figure can never be marked confirmed or reach the cost math; the provenance star entry matches the bundled star file's year.
- `README.md`: replace the update section with the short routine — open `/admin/cms-updates`, read the summary line, then preview and publish only what you have reviewed.
