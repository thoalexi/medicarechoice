# Compare page: connect the questionnaire, AI search and filters (revised)

## What's causing the problems today
- **Only county carries over from the questionnaire.** The questionnaire sends just the county to Compare. Every other answer is dropped, so Compare starts over with its own defaults.
- **The AI search ignores "Blue Cross PPO."** It has no place to record an insurer or an exact plan type, so those words are lost. It also shows its own 3 results instead of updating the filters below.
- **No keyword box** in the filters.
- **Each part keeps its own settings**, so nothing shows the full set of choices shaping the results.

## Data check (done before this revision)
- **Plan year:** everything is CMS plan year 2027 (Landscape file September 2026, release 202609; Plan Benefit Package 2027; 2027 Star Ratings). These are still the newest files CMS has posted. Years are not mixed, with three labeled exceptions: Part B premium and deductible (2026 figures, because CMS hasn't announced 2027), the 2026 star rating for any contract missing from the 2027 table, and typical Medigap prices.
- **Which plans are covered:** 181 Michigan Medicare Advantage plans across all 83 counties. On the last check, plan counts per county matched the CMS file and every plan ID was valid and appeared once. **Not included:** individual stand-alone Part D drug plans (we use the median Michigan Part D premium, $49.80, as one typical figure) and individual Medigap policies (3 typical-price examples). Compare will say this plainly so the list isn't mistaken for every option.
- **Coverage area (partial counties):** CMS does not publish ZIP-level coverage areas for Medicare Advantage plans. The ZIP-level coverage file people find online belongs to the Healthcare.gov Marketplace, not Medicare. CMS does publish county-level coverage files, including the monthly "MA Contract Service Area" file ([3](https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data/ma-contract-service-area-state/county)), and those include a "partial county" flag. Plan:
  1. First, look for a plan-level 2027 partial-county flag in the 2027 Plan Benefit Package coverage-area table.
  2. If that isn't there, use the MA Contract Service Area flag. That flag is set per contract, not per plan, and it reflects current enrollment-year data, so it will be labeled that way.
  3. Plans flagged as covering only part of a county stay in the list, with a badge: "May cover only part of this county — confirm your ZIP with the plan or Medicare.gov." No plan is hidden because of incomplete location data.
  4. A new import script writes this flag into the bundled data and runs it through the existing validation checks, like the other CMS files.
- **Reliable plan details:** premium, medical max, drug deductible, plan type, insurer, stars, dental/vision/hearing/fitness, and per-service copays. Some extras are missing for some plans and show "Not available — check the Summary of Benefits."
- **Not in the data:** hospital and doctor networks, and drug formularies.

## How cost estimates work today, and their limits
- **True yearly cost** = 12 months of the plan premium + the Part B premium (2026 figure) + Part D premium if needed + estimated medical costs + estimated drug costs.
- **Medical costs** use the plan's real CMS copays and deductibles, multiplied by an **illustrative number of visits** for each health level. For example, "A few ongoing issues" assumes 4 primary-care visits, 6 specialist visits, half an ER trip and a quarter of a hospital stay. When a plan charges a percentage instead of a flat copay, we apply it to approximate Medicare prices. The total is capped at the plan's medical max.
- **Drug costs** use the monthly amount the person typed, the plan's real drug deductible, then an **assumed 25% share** after that, capped at $2,400 (the 2027 Part D cap). Actual costs depend on each drug's tier, which we don't have.
- **"Worst case"** = the plan's medical max + the $2,400 drug cap + a year of premiums. It is **not** a true maximum. It leaves out care the plan doesn't cover, drugs not on the plan's list (its formulary), most out-of-network bills, dental and other extras, and, for Medigap, Part B excess charges.
- **Changes (no new cost math):**
  - "True yearly cost" becomes **"Example yearly cost."**
  - "Worst case" becomes **"Illustrative high-cost scenario,"** with the line: "Not a limit on everything you could pay."
  - A short "How this is estimated" note sorts every number into two groups:
    - **Official Medicare limits:** $2,400 Part D cap (2027), each plan's medical max and drug deductible, and plan premiums.
    - **Our assumptions:** visit counts, approximate prices, the 25% drug share, typical Medigap and Part D prices, and the 2026 Part B figures.
  - These renames apply on Compare, the questionnaire results, and the "Medical max" bubble. Home, the coverage guide and the methodology page change only where they use these two exact labels.

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
- **This browser tab only (session storage, cleared when the tab closes), kept to the minimum:** health level (one of 3 general choices), monthly drug cost rounded to a range, keep-any-doctor yes/no, budget style, travel yes/no, wanted extras. **Not kept:** ZIP code (only the county is kept), hospital name, any diagnoses, medicine names, or anything typed into the AI box. Nothing is sent to or stored on our server.
- **Logging check:** remove or scrub any console or error-report output that could include these answers or the AI search text (the AI search currently logs only an error status; this will be confirmed).
- **AI search:** only the typed text is sent, as it is today, with the existing "don't enter names or Medicare numbers" note. Questionnaire health answers are never added to it.
- The privacy page will be updated with one line about session storage.

## Out of scope and unchanged
- No redesign of other pages, no new pages, no accounts.
- Places outside Michigan get "We only cover Michigan right now."

## Approved decisions
1. Blue Cross Blue Shield of Michigan and Blue Care Network stay separate, with a suggestion to add the related insurer.
2. Replace the fixed point bonuses with clear, rule-based sorting.
3. The hospital answer is info only (shown during that visit, never saved).
4. Rename "True yearly cost" to "Example yearly cost." The project notes will be updated to match.

## Build order
1. Questionnaire transfer and shared filter state (web address + session storage).
2. Connect the AI search to the shared filters.
3. Keyword search and "Your Current Preferences."
4. Section separation, sorting explanations, cost wording, and the partial-county flag.
5. Full test suite, regression checks, and checks at 393px. Then a report of what changed, what was tested, and what's still limited. **Nothing is published until you review it.**

## Technical details
- **One source of truth:** a `useCompareCriteria()` hook merges URL params (`validateSearch` + zod `fallback`: county, types[], cmsTypes[], carriers[], q, sort, must[]) with a sessionStorage-backed preference store (read in `useEffect` to avoid hydration mismatch). All writes go through one `setCriteria(patch, source)`; the newest write wins within each field, and each field records its source.
- New `src/lib/planFilters.ts`: `CARRIER_ALIASES` derived from the real carrier list; `applyFilters` (carriers AND keyword AND types are separate clauses); `matchKeyword`; `criteriaChips`; `rankExplained` (ordered rules returning reasons). Used by Compare, the guide results and `planSearch.functions.ts`.
- `Plan` gains `cmsType` and `snp`. Type filters match the structure only; SNP is a separate checkbox.
- AI prefs schema: add `carriers` (enum of real carriers), `cmsTypes` (enum of non-SNP CMS types) and `assumption`; health and drug fields are removed from the AI step. The server validates values against the data and returns criteria only, not rankings.
- Guide: writes non-sensitive fields into the Compare link and sensitive ones into sessionStorage before navigating.
- Keyword input debounced (~250ms).
- Tests: carrier/keyword AND logic, PPO excludes SNP and HMO, conflict replacement, guide-to-Compare transfer, no-match messaging; rerun existing tests; check at 393px.
