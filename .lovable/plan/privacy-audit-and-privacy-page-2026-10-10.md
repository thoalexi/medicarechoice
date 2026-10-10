# Privacy audit and /privacy page

## Part 1 — What the site touches today (please confirm)

| Area | What's collected | Stored? | Who else receives it |
|---|---|---|---|
| Guided questions (ZIP, health use, doctors/hospital, drug spending, priorities, extras) | Answers on screen | No. Kept only in the open browser tab, gone when the page is closed. The county is put in the Compare page's web address. | Nobody. All math runs in the browser. |
| Compare filters and side-by-side picks | County, filters, chosen plans | No (browser tab only) | Nobody |
| AI plan search | The text the person types | No. Not saved by us. | The AI service (Lovable AI, which passes it to OpenAI) to read the request |
| "Search this plan's benefits" | Typed services (e.g. "MRI, physical therapy") | No | The AI service (Lovable AI / OpenAI) |
| Check my drugs | Medicine list; optional uploaded formulary PDF; chosen plan | Medicines and PDFs are not saved. We save only the public web address of a plan's official formulary PDF, linked to the plan ID, so the next lookup is faster. It contains nothing about the visitor. | Medicines and PDF go to the AI service (Lovable AI / OpenAI). The plan name goes to Firecrawl, a web-search service, to find the official formulary. |
| Hospital search box | What's typed | No | Nobody (searches a built-in list) |
| Feedback form | Category, message, page it was sent from, optional email | Yes, in our database, kept until deleted by us (no automatic deletion). Not publicly readable. | Lovable Cloud (our hosting/database provider) |
| Donations | Amount, once/monthly; card, name, email entered inside Stripe's form | We store nothing. Stripe keeps the payment record and sends the receipt. | Stripe |
| Local storage | One setting: "donation banner closed" (yes/no) | In the visitor's browser until they clear it | Nobody |
| Cookies | The site sets none of its own. Stripe's checkout may set its own cookies for fraud prevention when the donation form opens. | — | Stripe |
| Analytics | Lovable's built-in hosting stats (page visits, referring site, rough device type) | Held by Lovable | Lovable (hosting) |
| Error reports | If the page crashes, the error message is sent to Lovable for fixing | Held by Lovable | Lovable |
| Server logs | Brief error notes if the AI or search service fails (status code only, not the typed text) | Held by hosting for a short time | Lovable |
| Accounts | None. No sign-in. | — | — |

Not used: Google Analytics, ad trackers, Facebook pixels, newsletter lists. We don't sell or share personal information.

## Part 2 — Build after you confirm

1. New page **/privacy**, plain language, same layout as About:
   - Short summary at top: no accounts, no ads, we don't sell or share personal information.
   - One short section per row above, with exactly what's listed — no extra claims.
   - AI section: typed text goes to Lovable AI (using OpenAI) to process; please don't enter names, Medicare numbers, birth dates, or other identifying details.
   - Feedback: what's kept and that you can ask us to delete it.
   - Donations: Stripe processes payments; we never see card numbers.
   - Privacy questions: a link to the Feedback form (no email address shown). "Last updated: October 10, 2026."
2. New site-wide footer (on every page, with the existing disclaimer) with links to Privacy, About, Feedback and Donate. Mobile-friendly, 48px tap targets.
3. Add /privacy to sitemap.xml and give it its own page title and description.
4. Mark the task in the project task list.

## Need from you

- Confirm or correct anything in the table above.
