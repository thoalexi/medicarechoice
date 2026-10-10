# Plan data validation, test profiles and /methodology

## What you'll get

1. **"Plan data as of [date]" line** on the Compare page and the guided-questions results, e.g. "Plan data as of Sept. 30, 2026 (CMS 2027 Landscape file)." Tapping it opens the full source list on /methodology.
2. **Hidden report page at /admin/validation.** No sign-in, as you chose. Not linked anywhere, hidden from search engines, and read-only. It shows only public CMS facts and our own estimates, nothing about visitors. It has three parts:
   - **Data sources:** each dataset with its CMS file name, CMS release date and the date we imported it.
   - **Checks:** a pass/fail list for the latest import, with the failing plans named.
   - **Test profiles:** the site's top plans and estimated costs for each profile, plus a "Download for hand-checking" spreadsheet.
3. **Automated checks** that run every time plan data is rebuilt:
   - Plan count per county matches the CMS source file.
   - Every plan ID has the right format (e.g. H1234-001-0) and appears exactly once.
   - No missing or negative premiums, deductibles or out-of-pocket limits where the plan type requires them. Medigap and Original Medicare are exempt from the out-of-pocket limit check.
   - Out-of-pocket limits and Part D figures are within the CMS limits for 2027:
     - **Part D:** confirmed in CMS's official 2027 Rate Announcement. The drug deductible is at most $700 and the out-of-pocket cap is $2,400 (they were $615 and $2,100 in 2026).
     - **Medical out-of-pocket limit:** I couldn't download CMS's official 2027 memo, only a secondhand summary. Until I can read the CMS document itself, this check shows "Limit not confirmed" instead of passing or failing.
   - Star rating, plan type (HMO/PPO/PFFS/SNP) and county list match the CMS source for every plan.
   - **Changes since last import:** any plan whose premium, limits, deductibles, copays, star rating, type or counties changed is flagged, showing old and new values.
4. **About 10 test profiles**, each set in a different Michigan county:

   | # | Person | County |
   |---|---|---|
   | 1 | Healthy, no drugs | Wayne |
   | 2 | Healthy, 2–3 common generics | Oakland |
   | 3 | Some care, several generics | Kent |
   | 4 | One expensive brand drug | Genesee |
   | 5 | Insulin user | Washtenaw |
   | 6 | Frequent specialist visits | Ingham |
   | 7 | Chronic conditions, high drug use | Saginaw |
   | 8 | Wants peace of mind, keeps own doctors | Kalamazoo |
   | 9 | Lowest premium, wants dental/vision | Marquette |
   | 10 | Travels out of state | Grand Traverse |

   For each profile, the site's top 3 plans and their estimated yearly cost and worst case are saved. The spreadsheet has blank columns ("Medicare.gov top plans", "Medicare.gov yearly cost", "Difference", "Why") for you to fill in. Your notes stay in your own copy, since the page has no sign-in.
5. **New public /methodology page.** It replaces "How we compare plans": the old address forwards there and the footer link becomes "Methodology." In plain language it covers:
   - how yearly costs and the worst case are estimated
   - how plans are ranked
   - a clear **"What is NOT included"** list: dental/vision/hearing costs beyond what the plan covers, drugs not on the formulary, out-of-network bills, Part B excess charges, long-term care, premium penalties, and income-based surcharges (IRMAA)
   - every data source, with file names and dates

## Things to note
- **No rebuild script for the main plan list yet.** All other data files have one, so I'll add one for the CMS 2027 Landscape file. That lets the checks compare against the original CMS file.
- **2027 Part D figures.** The site still uses the 2026 Part D figures ($2,100 cap). CMS has now confirmed $2,400 for 2027. Switching would raise worst-case figures site-wide, so I won't change it unless you say so.

## Technical details
- New scripts: `scripts/build-mi-landscape.py` (from the CMS Landscape ZIP), `scripts/validate-data.py`, and `scripts/run-test-profiles.ts`. The profiles use the same `estimateAnnual`/`scorePlan`/`rankPlans` code as the site.
- Outputs, all generated and never edited by hand: `src/lib/data-provenance.json`, `src/lib/validation-report.json` and `src/lib/test-profile-results.json`, plus `data/snapshots/<date>.json` for the change comparison.
- `/admin/validation` gets a `noindex` tag and is left out of the sitemap, navigation and `robots.txt`.
- No database tables, and nothing about visitors is stored.
- AGENTS.md gains one rule for the provenance/validation pipeline.
