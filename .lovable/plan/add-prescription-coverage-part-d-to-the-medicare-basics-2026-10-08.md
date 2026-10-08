# Add prescription coverage (Part D) to the Medicare basics

## What will change

### 1. Expand the basics section on "What does Medicare cover?"
The section is currently titled "The basics: three kinds of coverage" and lists Original Medicare, Medigap, and Medicare Advantage — with no mention of prescriptions. It becomes four bullets that cover all four Medicare parts plus the Medigap add-on, with a one-line lead explaining how they fit together:

- **Original Medicare (Parts A & B)** — hospital stays and doctor visits. Does not cover most dental, routine vision, hearing aids, or prescriptions.
- **Part D (prescription drugs)** — a separate plan sold by private insurers. Yearly drug costs are capped, but only for drugs on that plan's own list.
- **Medicare Advantage (Part C)** — private plans that replace Parts A & B. Most include drug coverage and extras like dental, vision, and hearing; details vary by plan and county.
- **Medigap** — add-on insurance that helps pay what Original Medicare leaves behind. It does not add dental, vision, or drug coverage, and it cannot be used alongside a Medicare Advantage plan.

The heading becomes "The basics: the four parts, and one add-on" so the page stays accurate — Medigap is not one of Medicare's four parts.

### 2. Add prescriptions to the quick summary table
A new "Prescriptions" row so the table answers the question readers are most likely to have:
- Original Medicare: No — needs a separate Part D plan
- Medigap: No
- Medicare Advantage: Usually included

### 3. Point readers to the drug checker
The Part D bullet links to the existing "Check my drugs" page, with the reminder that drugs outside a plan's list don't count toward the yearly cap. This is the same warning already used on the Compare page and in the site footer, so nothing new is introduced.

### 4. Say so in the page description
The opening sentence and the search-result description currently name only dental, vision, hearing aids, and cataract surgery. Both will mention prescription drugs too, so the page matches what it actually answers.

## Technical details

- File: `src/routes/what-does-medicare-cover.tsx` — the basics `<section id="basics">` list, the summary table's `<tbody>`, the intro paragraph, and the `head()` description/og:description strings.
- The drug-cost cap figure will be pulled from the existing shared plan data (`PART_D_OOP_CAP` and `money()` in `src/lib/plans.ts`) instead of typing a dollar amount into the page, so it can't drift out of date from the rest of the site.
- The new link uses the same internal link style as the other links on the page and goes to `/formulary-check`, which already exists.
- No data, filter, or cost-calculation changes; this is display copy and one table row.

## Verification
- Read the rendered page at desktop and phone widths: heading, four bullets, and the new table row all display, with nothing cut off.
- Click the new link in the Part D bullet and confirm it lands on the drug-checking page.
- Confirm the quick summary table still scrolls sideways cleanly on a phone with the extra row.
- Check the page's title, description, and social preview text in the browser tab and page source.
- Confirm the site builds with no new errors.
