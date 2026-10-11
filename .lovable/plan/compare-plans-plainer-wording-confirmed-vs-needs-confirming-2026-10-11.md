# Compare Plans: plainer wording + confirmed vs. "needs confirming" benefits

No changes to plan data, cost math, values sent to the estimate, or which plans are available.

## 1. Sorting explanation (accurate to the real ranking)
- Heading: "Why are these plans shown first?"
- When you chose dental, vision, hearing, doctors outside a network, or travel: "We show plans that best match what matters to you. For example, if you selected dental or hearing coverage, plans offering those benefits appear higher. If we can't confirm whether a plan includes a benefit, we won't assume it does. You can always check with the insurance company."
- The remaining lines stay truthful but plainer:
  - "After that, plans are sorted by [estimated yearly cost / monthly premium / high-cost scenario], lowest first."
  - "If two plans cost within about $250 of each other, the one with the lower high-cost year goes first."
  - "Original Medicare alone (no yearly spending limit) comes after plans with a limit. Special Needs Plans, which have eligibility rules, are listed last."
  - "We never put a plan higher because of which company offers it. We show plans for your whole county, so confirm a plan serves your address."

## 2. Cost estimate box
- Heading: "Help us estimate your costs"
- Text: "Your answers help us show examples of what different plans might cost based on your needs."
- Secondary line (verified: answers are kept only in this browser tab, never saved to an account): "Your answers are only used to help estimate costs. We don't save them to an account."
- "Expected health use" becomes "How much medical care do you expect to need?" — "A little — Mostly routine checkups", "Some — Regular appointments or ongoing health needs", "A lot — Frequent appointments or more complex care". Note: "We'll use your answer to show an example of what your medical costs could look like. Your actual costs may be different." Same three values underneath.
- "Monthly drug costs" becomes "How much do you spend on prescriptions each month?" — "$0 / I don't take prescriptions", "Under $100 (mostly generics)", "$100 to $500", "Over $500 (brand or specialty)". Same values.

## 3. "Must include" benefits — two groups
Today, plans listed as not covering a benefit are already hidden; plans with unknown coverage stay mixed in. This is a display change only, no filter rebuild:
- Filter note: "When selected, we'll show plans with this benefit and point out any plans where coverage still needs to be confirmed."
- When dental, vision or hearing is checked, the results split into:
  - "Plans with confirmed coverage" — data shows every checked benefit is included.
  - "Plans requiring confirmation" — at least one checked benefit is unknown, with the note: "Some plans don't provide complete benefit details here. Contact the insurance company to confirm what's covered." Each card names which benefit needs confirming.
- Each group keeps the existing order. Plans known not to cover the benefit stay hidden. Same card design, just a heading per group.

## 4. Other plain-language fixes on the page
- "Advantage plan structure" becomes "Medicare Advantage network type"; "PPO (incl. Regional PPO)" becomes "PPO (including Regional PPO)".
- "Listed first if they match (no plans are hidden)" becomes "Plans that match these appear higher. No plans are hidden."
- Chips: "Prefers dental" becomes "Want dental"; "Doctors outside a network" becomes "See doctors outside a network".
- Comparison table: "CMS plan type" becomes "Plan type (from Medicare)"; "CMS plan ID" becomes "Medicare plan ID"; "CMS star rating" becomes "Medicare star rating"; "Health-items allowance" becomes "Allowance for health items (like vitamins or bandages)".
- "Each plan has its own drug list (formulary)" stays; the help text "worst-case estimate" becomes "high-cost scenario" so the page uses the same term throughout.
- "Search this plan's benefits" stays; "Go" button becomes "Search".
- Empty results: "No plans in X County match all of these choices. Try removing one:".
- Legal terms (Part B, Part D, Medigap, formulary, out-of-pocket limit, SNP) are kept, since they matter.

## Checks
- Same plan counts before and after for each filter; group split matches the data.
- Look at desktop and 393px phone width; clean build.

## Status
Most wording edits are already written; remaining step is one missing import, then testing at desktop and phone width.
