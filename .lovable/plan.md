# Compare page: connect the questionnaire, AI search and filters (revised)

## What's causing the problems today
- **Only county carries over from the questionnaire.** The questionnaire sends just the county to Compare. Every other answer is dropped, so Compare starts over with its own defaults.
- **The AI search ignores "Blue Cross PPO."** It has no place to record an insurer or an exact plan type, so those words are lost. It also shows its own 3 results instead of updating the filters below.
- **No keyword box** in the filters.
- **Each part keeps its own settings**, so nothing shows the full set of choices shaping the results.

## Data check (done before this revision)
- **Plan year:** everything is CMS plan year 2027 (Landscape file September 2026, release 202609; Plan Benefit Package 2027; 2027 Star Ratings). These are still the newest files CMS has posted. Years are not mixed, with three labeled exceptions: Part B premium and deductible (2026 figures, because CMS hasn't announced 2027), the 2026 star rating for any contract missing from the 2027 table, and typical Medigap prices.
- **Which plans are covered:** 181 Michigan Medicare Advantage plans across all 83 counties. On the last check, plan counts per county matched the CMS file and every plan ID was valid and appeared once. **Not included:** individual stand-alone Part D drug plans (we use the median Michigan Part D premium, $49.80, as one typical figure) and individual Medigap policies (3 typical-price examples). Compare will say this plainly so the list isn't mistaken for every option.
- **Coverage area:** county-level, taken from CMS. Plans that cover only part of a county (partial-county plans) are listed for the whole county. Compare will add a note to confirm with the plan.
- **Reliable plan details:** premium, medical max, drug deductible, plan type, insurer, stars, dental/vision/hearing/fitness, and per-service copays. Some extras are missing for some plans and show "Not available — check the Summary of Benefits."
- **Not in the data:** hospital and doctor networks, and drug formularies.

## How cost estimates work today, and their limits
- **True yearly cost** = 12 months of the plan premium + the Part B premium (2026 figure) + Part D premium if needed + estimated medical costs + estimated drug costs.
- **Medical costs** use the plan's real CMS copays and deductibles, multiplied by an **illustrative number of visits** for each health level. For example, "A few ongoing issues" assumes 4 primary-care visits, 6 specialist visits, half an ER trip and a quarter of a hospital stay. When a plan charges a percentage instead of a flat copay, we apply it to approximate Medicare prices. The total is capped at the plan's medical max.
- **Drug costs** use the monthly amount the person typed, the plan's real drug deductible, then an **assumed 25% share** after that, capped at $2,400 (the 2027 Part D cap). Actual costs depend on each drug's tier, which we don't have.
- **Worst case** = the plan's medical max + the $2,400 drug cap + a year of premiums. It is built entirely from official limits and is the most reliable figure.
- **Change:** no new cost math. On Compare, cost labels will read "Example yearly cost (based on typical use for your health level)," and a short "How this is estimated" note will list the assumptions above. Health level and drug amount stay in the existing estimate, labeled as an example rather than a personal projection.

## What people will see
1. **Two clearly labeled sections**
   - "Find Plans Based on Your Needs": the AI search box, on a soft tinted background.
   - "Browse & Compare Plans": keyword box, filters and plan list.
2. **"Your Current Preferences" strip** between the two sections. Each active choice is a removable chip, marked "Required" (narrows the list), "Sorting" (changes the order) or "Info only." A small tag shows where each one came from (questionnaire, search, or you). There's also a "Clear filters" button. Empty choices are hidden.
3. **Keyword search box** ("Search insurers, plans, or keywords…") with a clear (×) button. It matches parts of words and ignores capital letters. It understands insurer nicknames and plan types, and works together with the other filters.
4. **The AI search fills in the real filters.** "I want a Blue Cross PPO in Flint" sets county = Genesee, insurer = Blue Cross, plan type = PPO, and the list updates. If nothing matches, it says which choices conflict and offers one-tap removal. It never quietly widens the search. A short "Here's what we understood" line explains any assumption.
5. **Questionnaire answers carry over** to the filters, tagged "from your questionnaire," and each can be changed.
6. **Conflicts:** for the same kind of choice (for example plan type PPO vs. HMO), the newest explicit choice wins and the old one is removed.
7. **Insurer filter and keyword stay separate.** If "Blue Cross" is ticked and someone types "Humana," both apply. The page then says: "No plans match both your insurer choice (Blue Cross) and your search 'Humana.'" Each has a quick remove button, and neither replaces the other automatically.

## How each questionnaire answer is used
| Answer | Use | Based on |
|---|---|---|
| ZIP → county | Required filter | CMS service area |
| Health level | Example cost only (labeled) | Illustrative visit counts |
| Monthly drug cost | Example cost only (labeled) | Plan's drug deductible + assumed 25% |
| Keep any doctor | Sorting | Plan type: Original/Medigap vs. HMO vs. PPO (the reason is shown on each card) |
| Preferred hospital | Info only | No network data, so it shows "confirm with the plan" |
| Low premium / peace of mind | Sorting | Plan premium / medical max (both from CMS) |
| Dental / vision / hearing | Sorting; becomes Required only if "Must include" is ticked | CMS benefit flags; missing data shown as unknown, never counted as "yes" |
| Travel | Sorting | Plan type (HMO vs. PPO/Original) |

## Explainable rankings
- The ranking stays rule-based. The AI never ranks plans; it only turns the typed text into filter choices.
- A "Why this order?" note lists the rules in use, for example: "Sorted by example yearly cost; plans with dental moved up because you asked for dental; when costs are within $250, the lower worst case goes first."
- Each plan card shows the reasons and cautions that moved it up or down.
- The current hidden adjustments for "hospital" (penalizing plans that need referrals) and some fixed bonus weights will be replaced by plain sorting rules that use only real plan details. The hospital answer becomes info only.

## Special Needs Plans
- Same handling as today: listed last, unchecked by default, labeled "Only for people who qualify."
- The plan type (structure) and the Special Needs eligibility are kept separate. "PPO" in a filter or search matches only regular PPOs. A Special Needs PPO shows only when the Special Needs box is ticked, and it always keeps its eligibility label.

## Privacy
- **Web address (shareable, not sensitive):** county, insurer, plan type, exact CMS type, keyword, sort, and must-include extras.
- **This browser tab only (session storage, cleared when the tab closes):** health level, drug cost, doctor/hospital preferences, budget style, travel and wanted extras. Nothing is sent to our server or stored there, and nothing is logged.
- **AI search:** only the typed text is sent, as it is today, with the existing "don't enter names or Medicare numbers" note. Questionnaire health answers are never added to it.
- The privacy page will be updated with one line about session storage.

## Out of scope and unchanged
- No redesign of other pages, no new pages, no accounts.
- Places outside Michigan get "We only cover Michigan right now."

## Decisions that need your approval
1. **Blue Cross vs. Blue Care Network:** "Blue Cross" / "BCBS" will match only Blue Cross Blue Shield of Michigan. Blue Care Network (a separate Blue Cross–owned HMO company) is suggested in a note, not included automatically. OK?
2. **Ranking weights:** should we replace the current fixed point bonuses (for example +2,500 for "keep any doctor") with simple ordered sort rules, as described above? This will change the order of some results.
3. **Hospital answer:** OK to make it info only (it no longer affects order)?
4. **Partial-county plans:** keep listing them county-wide with a "confirm your ZIP is covered" note? Getting exact ZIP-level coverage isn't possible with the current CMS files.
5. **Cost labels:** OK to rename "True yearly cost" to "Example yearly cost" on Compare and the questionnaire results? (Your project notes currently use "True yearly cost.")

## Technical details
- **One source of truth:** a `useCompareCriteria()` hook merges URL params (`validateSearch` + zod `fallback`: county, types[], cmsTypes[], carriers[], q, sort, must[]) with a sessionStorage-backed preference store (read in `useEffect` to avoid hydration mismatch). All writes go through one `setCriteria(patch, source)`; the newest write wins within each field, and each field records its source.
- New `src/lib/planFilters.ts`: `CARRIER_ALIASES` derived from the real carrier list; `applyFilters` (carriers AND keyword AND types are separate clauses); `matchKeyword`; `criteriaChips`; `rankExplained` (ordered rules returning reasons). Used by Compare, the guide results and `planSearch.functions.ts`.
- `Plan` gains `cmsType` and `snp`. Type filters match the structure only; SNP is a separate checkbox.
- AI prefs schema: add `carriers` (enum of real carriers), `cmsTypes` (enum of non-SNP CMS types) and `assumption`; health and drug fields are removed from the AI step. The server validates values against the data and returns criteria only, not rankings.
- Guide: writes non-sensitive fields into the Compare link and sensitive ones into sessionStorage before navigating.
- Keyword input debounced (~250ms).
- Tests: carrier/keyword AND logic, PPO excludes SNP and HMO, conflict replacement, guide-to-Compare transfer, no-match messaging; rerun existing tests; check at 393px.
