# Simplify drug checking and clarify Medicare choices

## What will change

### 1. Make the formulary PDF optional
- Keep the medication list required, but label the plan name and PDF clearly.
- If a PDF is uploaded, preserve the current AI document review for tiers, restrictions, stated costs, gaps, and verification steps.
- If no PDF is uploaded, do not guess coverage or send an incomplete request to the AI. Instead, use the selected plan to show official carrier formulary/drug-search links, plus Medicare.gov as a fallback.
- If neither a plan nor a PDF is provided, ask the shopper to choose a plan so the site can direct them to the right official lookup.
- Keep the privacy warning and make clear that only the official plan formulary can confirm coverage and cost.

### 2. Improve the Compare Plans filters
- Select the first county in the existing alphabetized Michigan county list when the page opens.
- Move “Special Needs (SNP)” to the bottom of the plan-type filter list while leaving it unchecked by default.
- Add an accessible question-mark help control beside “Plan types.” Its hover/focus explanation will define:
  - Original Medicare + Medigap
  - Medicare Advantage HMO
  - Medicare Advantage PPO
  - Other Medicare Advantage
  - Original Medicare only
  - Special Needs Plan (SNP), including that shoppers must qualify
- Ensure the explanation also works by keyboard and tap, not hover alone.

### 3. Explain the three cost terms
Add a compact, plain-language explanation near the Compare Plans heading:
- **True yearly cost:** an estimate combining the standard Part B premium, plan premium, estimated medical spending, estimated prescription spending, and a separate Part D premium when needed.
- **Monthly premium:** the amount charged by the plan each month; the standard Part B premium is usually separate, even when a plan advertises a $0 premium.
- **Worst-case limit:** the estimated bad-year total of annual premiums, the medical out-of-pocket limit, and the Part D drug cap. Original Medicare alone has no medical out-of-pocket limit, and non-formulary drugs can cost more.

Use an accessible question-mark/details control so this guidance is available without adding more permanent clutter.

### 4. Put the trust message front and center on the home page
- Add a prominent “Why does this website exist?” section directly after the opening action area.
- Reuse the three messages already shown on the donation page:
  - **Independent:** No insurer pays us to rank their plans higher.
  - **Free, always:** No accounts, no paywalls, no upsells.
  - **Plain language:** Every estimate shows the trade-offs it left out.
- Add a short link to a dedicated About page.

### 5. Add an About page
- Tell the personal story in plain language: MedicareChoice was created to help the founder’s single mother navigate uncertainty and make sense of Medicare jargon.
- Connect that story to the site’s independent, free, plain-language approach and state that donations support this women-owned business.
- Link to the About page from the new home-page section.
- Add unique page title, description, social metadata, and include the page in the sitemap.

## Verification
- Test the drug-check flow both with a PDF and without one.
- Confirm the first alphabetized county is selected and SNP appears last.
- Check help controls with mouse, keyboard, and mobile tap.
- Check the home, About, and Compare pages at desktop and mobile widths.
- Confirm the new route and existing routes build cleanly.
