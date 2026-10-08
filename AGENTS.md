<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Plan catalog comes from the bundled CMS Landscape extract in src/lib, with dental/vision/hearing from the CMS PBP Benefits file via scripts/build-mi-extras.py (regenerate both from the yearly CMS ZIPs); never hand-edit plan figures.
- AI calls run only server-side via Lovable AI Gateway helpers in src/lib/ai/*.server.ts, invoked from *.functions.ts server functions; why: keeps the key and prompts off the client.
- Star ratings fall back to the prior-year CMS Star Ratings data table (src/lib/cms2026-stars.json via scripts/build-star-fallback.py) by contract ID, labeled with its year, until the current-year landscape file carries ratings; why: CMS publishes new ratings after the landscape file.
- Michigan hospital list comes from the CMS Hospital General Information dataset via scripts/build-mi-hospitals.py into src/lib/mi-hospitals.json; never hand-edit; why: complete, official list.
- Formulary auto-lookup uses Firecrawl (gateway) server-side plus an AI pick step, caching only public PDF URLs in formulary_documents (service-role only); why: never guess a document, never store user medicines.
