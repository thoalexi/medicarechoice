# AI plan search: "Describe what you're looking for"

## What people will see
- A single large search box at the top of the Compare page (and a link to it from the home page): "Tell us what matters to you, in your own words."
- Example placeholder: "I live in Lansing, see Dr. Patel at Sparrow, want dental and a low monthly cost."
- After they press **Find my plans**, they get the **top 3 plans** as simple cards: plan name, monthly premium, estimated true yearly cost, and 2–3 plain-language reasons why it fits ("Covers dental and vision", "$0 monthly premium", "PPO, so out-of-network doctors are allowed at a higher cost").
- Each card has a "See details" button that opens it in the existing comparison, and a "Compare these 3" button.
- If something important is missing (like their ZIP or county), the tool asks one short follow-up question instead of guessing.
- Same reminders as elsewhere: estimates only, check the plan's formulary, confirm with Medicare.gov or MMAP.

## How it stays honest
- The AI only picks from the real CMS 2027 Michigan plans already in the app — it cannot invent plans or prices.
- Costs shown come from the app's existing cost math, not from the AI.
- The AI turns the description into preferences (county, plan type, extras, budget vs. peace of mind, travel), then the app filters and ranks the actual plans; the AI writes short reasons using only those plans' real details.

## Keeping the page calm
- Only the search box shows at first. Filters and the full table sit below it, unchanged.
- No chat history and no account needed. Nothing typed is saved.

## Technical details
- New server function `src/lib/planSearch.functions.ts` (zod: query ≤ 500 chars) calling a helper in `src/lib/ai/planSearch.server.ts`.
- Step 1: AI (openai/gpt-6-astra via Lovable AI Gateway Responses, streamed, low reasoning, strict JSON schema) extracts structured preferences: zip/county, planTypes, needDental/Vision/Hearing/Fitness, maxMonthlyPremium, priority (budget|peace), travelsOutOfState, needsDrugCoverage, followUpQuestion|null.
- Step 2: server filters with existing `plansFor`/county logic and ranks with the existing scoring + cost model; takes top 5 candidates.
- Step 3: second short AI call writes 2–3 reasons per plan from the candidates' real fields only, picks top 3 (IDs must be in the candidate list; anything else is discarded).
- Friendly errors for rate limits / credits, matching the drug checker.
- Uses a small amount of workspace AI credits per search.
