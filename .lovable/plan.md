# Compare page: connect the questionnaire, AI search and filters

## What's causing the problems today
- **Only county carries over from the questionnaire.** The questionnaire sends just the county to Compare in the web address. Health, drug cost, doctors, extras (dental/vision/hearing), budget vs. peace of mind and travel are never passed, so Compare starts over with its own defaults.
- **The AI search ignores "Blue Cross PPO."** It only pulls out county, extras, budget and "Advantage vs. Medigap." It has no slot for an insurer or a specific plan type, so those words are dropped. It also shows its own 3 results instead of updating the filters below.
- **No keyword box** in the filters.
- **Each part keeps its own settings**, so nothing shows the full set of choices shaping the results.

## What people will see
1. **Two clearly labeled sections**
   - "Find Plans Based on Your Needs": the AI search box, on a soft tinted background.
   - "Browse & Compare Plans": keyword box, filters and plan list, on the normal background.
2. **"Your Current Preferences" strip** between the two sections. Each active choice is a small removable chip, for example: Location: Genesee County · Insurer: Blue Cross Blue Shield of Michigan · Plan type: PPO · Wants dental · Health: a few ongoing issues. Chips that narrow the list are marked "Required." Chips that only change the order are marked "Preference." A small tag shows where each one came from (questionnaire, search, or you), and there's a "Clear filters" button. Empty choices are hidden.
3. **Keyword search box** ("Search insurers, plans, or keywords…") with a clear (×) button. It matches parts of words and ignores capital letters. It understands nicknames like BCBS, Blue Cross, UHC and HAP, plus plan types (PPO, HMO, HMO-POS, PFFS). It works together with the other filters and never resets them. If nothing matches, it says so and offers to clear the keyword.
4. **The AI search fills in the real filters.** "I want a Blue Cross PPO in Flint" sets county = Genesee, insurer = Blue Cross, plan type = PPO. Those choices then show up in the filters and chips, and the plan list updates. If nothing matches, it says "No plans match: Blue Cross + PPO in Genesee County" and offers one-tap chips to remove a choice. It never quietly widens the search. A short "Here's what we understood" line explains any assumption.
5. **Questionnaire answers carry over.** "Compare all plans" and "Skip questions" bring every relevant answer along. Those answers fill in the filters and are tagged "from your questionnaire," and you can change any of them.
6. **The newest choice wins.** If the AI search set PPO and you then tick HMO in the filters, PPO is removed and the chip updates, so no two choices conflict.

## How each questionnaire answer is used
| Answer | Use |
|---|---|
| ZIP → county | Required filter (works as it does today) |
| Health level | Changes yearly cost estimates and order |
| Keep my doctors / open to a network | Preference (changes order; never hides plans) |
| Preferred hospital | Shown for information only. Plan data doesn't list hospital networks, so we keep the existing "confirm with the plan" note |
| Monthly drug cost | Changes cost estimates |
| Budget vs. peace of mind | Changes order only. We never invent a price limit |
| Dental / vision / hearing | Preference that changes order. It narrows the list only when you tick "Must include" |
| Travel | Preference (changes order) |

## Insurer names (carrier names)
- Nicknames come only from insurer names that actually appear in the plan data. "Blue Cross," "BCBS" and "Blue Cross Blue Shield" match **Blue Cross Blue Shield of Michigan**. **Blue Care Network** is a separate company (Blue Cross's HMO arm), so it is included only if the person says "Blue Care" or "BCN." When it's left out, a line says: "Blue Care Network is a related but separate insurer — add it?"
- The same goes for HAP vs. HAP CareSource, and Aetna vs. Aetna Medicare HIDE: each is listed separately.

## Plan type matching
- "PPO" includes PPO and Regional PPO. "HMO" means HMO only; HMO-POS is offered as a separate choice in the filters and in the search. PFFS stays separate. Special Needs Plans stay last and unchecked, as they are today.
- The six existing filter groups stay the same. Inside the Advantage groups, people can also narrow to the exact official CMS type (HMO / HMO-POS / PPO / Regional PPO / PFFS).

## Out of scope and unchanged
- No page redesign, no new pages, nothing saved on the server (choices stay in the web address and in this browser only).
- Plans outside Michigan aren't in our data. A request like "Fulton County" gets a polite "We only cover Michigan right now" message.

## Technical details
- **One source of truth:** move Compare's filter state from separate `useState` hooks into `validateSearch` URL params (zod + `fallback`): `county, types[], cmsTypes[], carriers[], q, health, drugs, doctors, priority, dental, vision, hearing, mustExtras, travels, maxPremium, src` (where `src` records the origin of each field). Filter controls, chips and the AI search all write through `navigate({ search: prev => … })`, so later writes replace earlier ones and update loops can't happen.
- New `src/lib/planFilters.ts`: `CARRIER_ALIASES` built from the real carrier list, `matchKeyword(plan, q)`, `applyFilters(plans, criteria)` and `criteriaChips(criteria)`. Compare uses it for its list, and `planSearch.functions.ts` uses it too, so there is only one copy of the filter logic.
- Keyword input debounced (~250ms) into the `q` param.
- AI prefs schema gets `carriers: string[]` (exact names from an enum of real carriers, picked by the alias table), `cmsTypes: string[]` (enum of real CMS types), and `assumption: string | null`. The server checks every value against the data and drops anything unknown. The server function returns criteria and a match count, not its own top-3. The AI never invents plans and never writes text that people see directly; only our fixed wording is shown.
- Guide: both Compare links pass every mapped answer as search params (`src=questionnaire`).
- Plan cards need to show the exact CMS type (`cmsType`) as a field on `Plan` (it's already in the data).
- Check: rerun the existing tests, test "Blue Cross PPO in Flint," "BCBS HMO," a search with no matches, and switching PPO to HMO; check at 393px width.
