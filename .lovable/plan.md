# Compare Plans: simpler filter panel

## What's confusing today (Phase 1 findings)
- **HMO/PPO in two places:** a "Plan type" checkbox list (Advantage HMO, Advantage PPO, Other Advantage, Original + Medigap, Original only, Special Needs) and a separate "Advantage plan structure" checkbox list (HMO, HMO-POS, PPO, PFFS).
- **Two controls per benefit:** "Want dental/vision/hearing" (affects order) and "Must include dental/vision/hearing" (narrows the list). Fitness has neither.
- **Travel and doctor choice are hidden:** they come from the questionnaire or AI search but can't be seen or changed in the panel.
- **Two insurer controls:** an insurer checkbox list and the keyword box, which also matches insurer names.
- **"No referrals" sits with the benefits**, though it's about network rules.
- **Preferences strip** can show near-duplicates ("Want dental" and "Must include dental").

## New panel (five short sections, then Advanced)

```text
A  Where do you need coverage?        [County v]
B  What type of coverage?             ( ) All  ( ) Medicare Advantage  ( ) Original Medicare + Medigap
     (only if Advantage) Network type ( ) Any  ( ) HMO  ( ) PPO  ( ) Other
C  What's important to you?           Dental   [Not important | Preferred | Required]
                                      Vision   [ ... ]   Hearing [ ... ]   Fitness [ ... ]
D  Cost and flexibility               ( ) Lower monthly payments
                                      ( ) Lower costs when I need care
                                      ( ) Flexibility to choose doctors
                                      ( ) A balance of all three
     Do you travel often?             [Yes | No | No preference]
E  Find a specific plan               [Search insurance companies or plans...  x]
     Insurer suggestions appear as you type; tapping one adds an insurer chip.
>  Advanced filters (collapsed)       Exact CMS plan type (HMO-POS, PFFS, Regional PPO...)
                                      Include Special Needs Plans (with eligibility note)
                                      Maximum monthly premium
                                      No referrals needed
```

- **HMO/PPO appear only in section B.** "Other" covers HMO-POS and PFFS together; Advanced lets someone pick one exactly. Advanced does not repeat HMO or PPO.
- **Benefits:** one three-way control each.
  - Preferred: plans with confirmed coverage move up. No plan is hidden.
  - Required: confirmed plans first, then a "Coverage needs confirmation" group for unknown ones. Plans confirmed not to cover it are left out. This keeps today's confirmed-vs-unknown rules.
- **Priority:** "Lower monthly payments" sorts by premium. "Lower costs when I need care" sorts by the high-cost scenario. "Balance" sorts by estimated yearly cost. "Flexibility to choose doctors" sorts by estimated yearly cost but moves plans that let you see any or out-of-network doctors up. That uses the same rule as today's "keep any doctor" answer, with no new weights.
- **Travel:** Yes moves plans with out-of-network or any-doctor coverage up, using today's rule. The panel explains: "We can only tell whether a plan covers out-of-network care. A PPO doesn't guarantee coverage while you travel; check with the plan." No and No preference have no effect.
- **Insurers:** one keyword box. Typing "Blue Cross" offers the exact insurer (and suggests Blue Care Network separately, never merged). The insurer checkbox list is removed.
- **Mobile:** same order, using the existing "Filters" show/hide button. Large tap targets, nothing sideways.

## Your Current Preferences (simplified)
- One chip per question, for example: Genesee County · PPO · Blue Cross · Dental: Preferred · Travel: Yes.
- Chips are in two labeled rows: "Narrowing your list" (county, coverage, network, insurer, keyword, required benefits, advanced) and "Changing the order" (preferred benefits, priority, travel). Each chip can be removed. A small note shows where it came from (questionnaire / search / you). "Clear all" stays.

## Questionnaire and AI search
- Questionnaire: County goes to Location. "Want dental" becomes Dental: **Preferred**, never Required. Travel yes becomes Travel: Yes. Budget style becomes the matching priority. Keep any doctor becomes Flexibility. Everything can be changed afterwards.
- AI search fills the same controls. "Blue Cross PPO" sets the insurer and Network: PPO. "PPO **with** dental" sets Dental: Preferred. Only clear words like "must have" or "has to include" set Required. "Here's what we understood" says which one was chosen.
- There is still one shared filter state, and no second filtering system.

## Unchanged
Plan data, cost formulas, plan counts per county, how Special Needs Plans are handled and labeled, the disclaimers, and the rest of the Compare page.

## Testing (before you review; nothing published)
All 14 items in your spec, including:
- questionnaire transfer and the AI search examples
- one HMO/PPO control and one control per benefit
- Preferred doesn't hide plans; Required groups confirmed vs. unknown
- travel persists; insurer + other filters together
- Advanced doesn't duplicate anything; Clear all works
- plan counts match before and after; yearly cost numbers identical before and after
- desktop and 393px checks

## Technical details
- Session prefs: `wants` becomes `benefits: Record<"dental"|"vision"|"hearing"|"fitness", "off"|"preferred"|"required">`. `travels` becomes `"yes"|"no"|"any"`. `priority` adds `"flex"`. `keepAnyDoctor` derives from `priority==="flex"` (the questionnaire still sets it). Old stored values migrate on load.
- URL: `cov=all|ma|orig`, `net=any|hmo|ppo|other`, `cms[]` (advanced exact types), `snp=1`, `carriers[]`, `q`, `max`, `noref=1`, `req[]` (required benefits). Old `types`/`structure`/`must` params are read once and translated, so shared links keep working.
- `applyFilters` maps cov/net/cms/snp to the existing `types` + `structureOf` checks. Required benefits use `p[x] !== false`. Fitness is added to the same check.
- `scorePlan` reads `benefits[x] !== "off"` in place of `extras[x]` and adds fitness to that loop. The travel/flex branches are unchanged. No new weights or cost changes.
- AI schema: `dental/vision/hearing/fitness: "none"|"preferred"|"required"`, `priority` adds `"flex"`, `travels` stays boolean. `planType` maps to `net`.
- Compare panel rewritten as small section components in compare.tsx. The insurer checkbox list and the structure fieldset are removed.
- Tests: extend the existing vitest files to cover the filter mapping, URL migration and cost snapshot equality.
