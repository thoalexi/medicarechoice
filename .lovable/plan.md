# Add McLaren Flint and fetch formularies automatically

## 1. McLaren Flint in the hospital list
The "Preferred hospital system" dropdown in the guided questions uses a short fixed list of 10 systems, and only McLaren Greater Lansing is on it.
- Swap in a fuller Michigan list, grouped by system: all major McLaren hospitals (Flint, Greater Lansing, Macomb, Oakland, Bay Region, Northern Michigan, Port Huron, Lapeer, Caro, Central Michigan), plus other common Flint-area choices (Hurley Medical Center, Ascension Genesys), Ascension Michigan, Bronson, Munson, MyMichigan Health, and the existing systems.
- Add a "Something else (type it)" option so nobody gets stuck.
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

## What you need to do
Turning on Firecrawl, a web-reading service, is required for step 2. A connect card will appear. Each lookup uses a few Firecrawl credits.

## Technical details
- `guide.tsx`: expand HOSPITALS into grouped `<optgroup>`s plus a free-text "Other" input; same values feed `scorePlan` and the AI search prompt.
- Connect Firecrawl and check `uses_connector_gateway`, then call its endpoints server-side only.
- New `src/lib/ai/formularyFetch.server.ts`: from `CARRIER_FORMULARY_URLS[carrier]`, use Firecrawl map/scrape (links) plus search for `"<plan name>" 2027 formulary pdf` restricted to the carrier domain. Pick candidates with a small AI call that matches plan name, contract ID (H-number), and year 2027. Download the PDF with fetch (20 MB cap, check content-type), then base64 it into the existing `analyzeFormulary`.
- `formulary.functions.ts`: make `pdfBase64`/`fileName` optional; add `planId`; when no file is given, auto-fetch it; return `source: { url, title }` or a `notFound` result.
- Cache table `formulary_documents` (plan_id, url, fetched_at) storing only the public URL, with RLS allowing server-only writes; refresh after 30 days.
- UI: progress text ("Finding your plan's drug list..." then "Reading it..."), source link on the report, fallback to the current links and upload.
- Test on McLaren, HAP, and Humana plans with Playwright.
