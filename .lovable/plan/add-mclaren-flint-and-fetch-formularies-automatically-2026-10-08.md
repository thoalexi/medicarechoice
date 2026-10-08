# Add McLaren Flint and fetch formularies automatically

## 1. McLaren Flint in the hospital list
The "Preferred hospital system" dropdown in the guided questions uses a short fixed list of 10 systems, and only McLaren Greater Lansing is on it.
- Replace it with every Michigan hospital, taken from Medicare's official hospital list (CMS Hospital General Information), not typed in by hand. That covers about 170 hospitals, including McLaren Flint, Hurley, and the small rural and Upper Peninsula hospitals.
- Make the box searchable: type "Flint" or "McLaren" to narrow it down, with each hospital showing its city and health system.
- Keep a "Something else (type it)" option so nobody gets stuck.
- Note: the CMS data doesn't list which hospitals each plan uses, so the site still says "Check that this hospital is in network" instead of promising it.

## 2. Look up the formulary for the shopper
Right now, without a PDF upload, the drug checker only gives a link to the insurer's website. New flow:
1. The shopper picks their plan and enters their medicines (no upload needed).
2. The site goes to that insurer's official drug-list page, finds the 2027 formulary PDF for that plan, and downloads it.
3. That PDF goes through the same AI review used now (tier, restrictions, stated cost, gaps, what to check).
4. The report names the exact document used, with a link, so the shopper can confirm it.
- If the right document can't be found or confirmed for that plan, the site says so plainly and shows the insurer link and the upload option, as it does today. It never guesses.
- Uploading a PDF still works and takes priority.
- Found documents are saved for a while (only the public PDF, never the shopper's medicine list), so repeat lookups are faster and cheaper.

## 3. Keep the AI search on topic
The "Tell us what matters to you" search already uses the AI only to pull out preferences, and it always shows real plans instead of free-form AI answers. To make sure nobody can use it as a general chatbot:
- The AI first decides whether the request is about choosing a Medicare plan. If it isn't (homework, recipes, "write me a poem"), the search shows a polite message: "This search only helps you find Medicare plans. Try describing your doctors, medicines, budget, or the extras you want." No plans and no AI-written text are shown.
- Instructions hidden inside a request ("ignore your rules...") are ignored.
- The site never shows the AI's own wording, only plans and fixed messages, so there's nothing to misuse.
- The search box keeps its 500-character limit.

## What you need to do
Turning on Firecrawl, a web-reading service, is required for step 2. A connect card will appear. Each lookup uses a few Firecrawl credits.

## Technical details
- New `scripts/build-mi-hospitals.py` downloads the CMS Hospital General Information file, keeps State = MI (all hospital types), and writes `src/lib/mi-hospitals.json` (name, city, county, system). Regenerate yearly, same as the plan data; record in AGENTS.md.
- `guide.tsx`: searchable combobox over that list plus a free-text "Other" input; the chosen name feeds `scorePlan` and the AI search prompt.
- `planSearch.server.ts`: add a required `onTopic: boolean` to the strict schema and a prompt rule that treats user text as data only; `planSearch.functions.ts` returns a fixed off-topic message when false. Also stop showing the AI's `followUpQuestion` text and use fixed wording instead. The drug checker's medication fields get the same on-topic check.
- Add the hospital-list, formulary-lookup, and on-topic tasks to roadmap.md.
- Connect Firecrawl and check `uses_connector_gateway`, then call its endpoints server-side only.
- New `src/lib/ai/formularyFetch.server.ts`: from `CARRIER_FORMULARY_URLS[carrier]`, use Firecrawl map/scrape (links) plus search for `"<plan name>" 2027 formulary pdf` restricted to the carrier domain. Pick candidates with a small AI call that matches plan name, contract ID (H-number), and year 2027. Download the PDF with fetch (20 MB cap, check content-type), then base64 it into the existing `analyzeFormulary`.
- `formulary.functions.ts`: make `pdfBase64`/`fileName` optional; add `planId`; when no file is given, auto-fetch it; return `source: { url, title }` or a `notFound` result.
- Cache table `formulary_documents` (plan_id, url, fetched_at) storing only the public URL, with RLS allowing server-only writes; refresh after 30 days.
- UI: progress text ("Finding your plan's drug list..." then "Reading it..."), source link on the report, fallback to the current links and upload.
- Test on McLaren, HAP, and Humana plans with Playwright.
