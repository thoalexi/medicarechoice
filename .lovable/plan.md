# Formulary Checker

A new page, **Check my drugs** (`/formulary-check`), where a shopper lists their medications, uploads a plan's official formulary (PDF), and gets a plain-language report.

## What the user does
1. Type medications (name, strength, how often) — add/remove rows, large inputs.
2. Optionally pick the plan from our CMS 2027 list (pre-fills plan name) or type it.
3. Upload the plan's formulary PDF (max 20 MB) — with a short "where to find it" tip (plan website, "Drug List / Formulary").
4. Press **Check my drugs**; results stream in.

## What the report shows
- Per drug: **Found / Not found / Unclear**, tier, restrictions (prior authorization, step therapy, quantity limit), any cost the document states, and the page it was found on.
- **Possible gaps** flagged in plain words (not listed, high tier/specialty, needs prior approval).
- **What to verify before enrolling**: checklist (call the plan, confirm pharmacy, confirm cost at your tier, ask doctor about alternatives).
- Clear reminder: AI reading can miss things; the plan's formulary and the plan itself are the final word. Plan copays by tier are often in the Summary of Benefits, not the formulary.

## Entry points
- Header nav link "Check my drugs".
- Link from the guide's prescriptions step, guide results, and compare page formulary notes.
- Added to sitemap; own page title/description.

## Privacy
- Nothing saved: medications and the PDF are sent for that one check and not stored in the database.
- Note on page: don't upload documents containing personal info.

## Technical details
- Server function `src/lib/formulary.functions.ts` (POST, zod: up to 30 drugs, name ≤100 chars; PDF base64, `application/pdf`, ≤20 MB) calling Lovable AI Gateway Responses with `openai/gpt-6-astra`, PDF as an `input_file` part, strict JSON schema output (drugs[], gaps[], verify[]), reasoning effort low, streamed server-side and returned when complete; no artificial timeouts.
- Follow gateway SDK skill: install `ai` + `@ai-sdk/openai`; copy helper/run-ID modules into `src/lib/ai/*.server.ts`.
- Errors: 429/402/403 surfaced with friendly messages (busy, credits, unavailable); refusals end the request.
- UI: `src/routes/formulary-check.tsx` using existing tokens/components; loading state with progress text.
- Verify with a real sample formulary PDF via Playwright before finishing; record rule in AGENTS.md (AI calls server-only via gateway helpers).
