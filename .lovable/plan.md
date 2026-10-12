# Compare Plans filter redesign + two new Guided Questions

## What's confusing today
- HMO/PPO can be picked in two places: the "Plan type" list and the "Advantage plan structure" list.
- Each benefit has two controls: "Want dental" (changes the order) and "Must include dental" (narrows the list). Fitness has neither.
- Travel and "keep my doctors" come from the questionnaire, but you can't see or change them in the panel.
- There are two ways to pick an insurer: an insurer checkbox list and the keyword box.
- "No referrals" sits with the benefits, even though it's a network rule.
- The preferences strip can show near-duplicate chips.

## 1. Two new Guided Questions
Both use the existing large cards. Each card is fully clickable, has its explanation always visible (no tooltips), shows a clear selected state, works with keyboard and screen reader, and stacks on phones.

**Q1 "Do you have a type of Medicare coverage in mind?"** (asked right after ZIP)
- Medicare Advantage
- Original Medicare
- Original Medicare + Medigap
- I'm not sure

Each card uses your wording. The Medigap card adds: "Medigap does not include drug coverage. Eligibility, enrollment rules and prices vary. We show typical examples, not individual policies."

**Q2 "Do you prefer a particular kind of Medicare Advantage plan?"**
- Shown only if Q1 is Medicare Advantage or I'm not sure.
- Choices: PPO / HMO / Other (HMO-POS, Private Fee-for-Service) / I'm not sure, with your wording.
- Regional PPOs count as PPO. HMO-POS stays separate from HMO, and PFFS from PPO.
- A choice only appears if that plan type is offered in the person's county.

**Follow-up (only after PPO/HMO/Other): "Is this the only type of plan you want to see?"**
- "Yes, only show me this type" makes it a requirement.
- "I prefer this type, but I'm open to others" makes it a preference.

Skipping either question, or answering I'm not sure, sets no restriction. Nothing is picked automatically. Back, Next, Skip and the progress bar keep working, and the question count adjusts to the questions actually shown.

## 2. New Compare filter panel
```text
A  Where do you need coverage?   [County v]
B  What type of coverage?        All | Medicare Advantage | Original Medicare | Original Medicare + Medigap
     (Advantage only) Network    Any | HMO | PPO | Other
                                 then: ( ) Only this type  ( ) Show it first, others after
C  What's important to you?      Dental / Vision / Hearing / Fitness: Not important | Preferred | Required
D  Cost and flexibility          Lower monthly premiums | Lower potential medical expenses |
                                 More freedom to choose doctors | A balance of cost and flexibility
     Keep my current doctors?    Yes | No   (separate from the priority above)
     Do you travel often or spend time away from home?   Yes | No | Not sure
       "Some plans offer more flexibility when you're away from home. Always
        confirm coverage with the insurance company before traveling."
E  Find a specific plan          [Search insurance companies or plans...]
>  Advanced filters (collapsed)  Exact CMS plan type, Special Needs Plans (with eligibility note),
                                 maximum monthly premium, no referrals needed
```
- **One place for HMO/PPO** (section B). Advanced offers only exact CMS types such as HMO-POS, PFFS and Regional PPO, and never repeats HMO or PPO.
- **Network "Only this type":** only matching plans appear. If none match, it says: "We couldn't find PPO plans that match all your choices in this county. You can change your preferences to see more options." There's a button to change it. A banner reads: "Showing PPO Medicare Advantage plans because you selected PPO only."
- **Network "Show it first":** matching plans come first. Other types appear under "Other plan types (alternatives)" and are never labeled as the preferred type.
- **Benefits:**
  - Preferred moves confirmed plans up and hides nothing.
  - Required puts confirmed plans first, puts unknowns under "Coverage needs confirmation," and leaves out plans confirmed not to cover it.
- **Priority and doctors:**
  - Priority uses today's sort rules: premium, high-cost scenario, estimated yearly cost, and estimated yearly cost with flexible plans moved up.
  - "Keep my current doctors" is its own single control, so lower premiums plus keeping your doctors both stay set. Choosing "More freedom" turns it on but never turns it off.
- **Travel:** Yes uses today's out-of-network rule. No and Not sure have no effect. No travel coverage claims are made.
- **Search:**
  - One box for keywords, insurer names and nicknames, and plan names.
  - Picking a suggested insurer turns it into an insurer chip and removes that text from the box.
  - Blue Cross Blue Shield of Michigan and Blue Care Network stay separate.
  - The insurer checkbox list is removed.
- **Original Medicare / Medigap selected:** network controls are hidden and no HMO/PPO rule applies. The note about typical Medigap examples stays.

## 3. Current Preferences
Two labeled rows with one chip per choice. Every chip can be removed or tapped to edit, and a small tag shows where it came from (Guided Questions, AI-assisted search, or you).
- **Narrowing your list:** Genesee County, Medicare Advantage, PPO only, Blue Cross Blue Shield of Michigan, required benefits, Advanced filters.
- **Changing the order:** Dental: Preferred, Travel: Yes, Lower monthly premiums, Keep my doctors, PPO preferred.

## 4. One shared state everywhere
- Guided Questions, Compare, AI-assisted search and Current Preferences all read and write the same settings. The newest explicit choice wins: switching PPO only to HMO replaces it, with no conflicting leftovers.
- AI-assisted search: "Blue Cross PPO" sets the insurer and PPO as a preference. Clear wording like "only" or "must" makes it a requirement, and benefits work the same way. "Here's what we understood" says which.
- Choices persist across navigation and refresh. Shareable choices go in the web address. Personal answers stay in this browser tab only, as today.
- The same labels are used on every page.

## Unchanged
2027 CMS plan data, cost formulas, plan counts, Special Needs handling and labels, disclosures, design system, and the rest of the page. Nothing is published until you review it.

## Testing
- All previously approved tests.
- Your tests 1–10 and the final acceptance scenario (ZIP → Advantage → PPO only → Dental Preferred → Travel Yes → switch to HMO).
- Plan counts match before and after, cost figures are identical before and after, and no plans are invented.
- Desktop and 393px checks, plus the existing automated tests.

## Technical details
- Session prefs: `benefits: Record<dental|vision|hearing|fitness, off|preferred|required>`, `travels: yes|no|unsure`, `priority` adds `flex`, `keepAnyDoctor` stays an independent boolean. Old stored values migrate on load.
- URL: `cov=all|ma|orig|medigap`, `net=any|hmo|ppo|other`, `netMode=only|prefer`, `cms[]`, `snp`, `carriers[]`, `q`, `max`, `noref`, `req[]`. Old `types`/`structure`/`must` links are translated once.
- `applyFilters` maps cov/net(only)/cms/snp onto the existing `types` + `structureOf`. `net` prefer is a stable partition after ranking (matches, then alternatives). Required benefits use `p[x] !== false`, with fitness added.
- `scorePlan` reads `benefits[x] !== "off"` and adds fitness to the existing loop. The travel and doctor branches are unchanged. No new weights or cost changes.
- Guide: Q1/Q2/follow-up are added to `steps` with conditional inclusion. Available network types come from the county's plans. Answers are written to the Compare link (cov/net/netMode) and to session prefs.
- AI schema: benefits use `none|preferred|required`, `planTypeMode: only|prefer`, `priority` adds `flex`.
- Tests: extend vitest for the mappings, URL migration and a cost snapshot. Use Playwright for the flows.
