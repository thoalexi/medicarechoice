# Roadmap

- [x] Shorten Compare notices, keep explanations in help popovers, and refresh the P favicon.

- [x] Add a donation button (Wikipedia-style "Like what we do? Please keep it going!" banner + donate page)
- [x] Say "Donations support this women owned business!" on the donation banner and page
- [x] Load official CMS 2027 Michigan plan list (all 83 counties, ZIP lookup)
- [x] Wire Stripe checkout on the donate page (done 2026-10-08; going live waits on Stripe onboarding)
- [x] Feedback button + /feedback page storing submissions in Lovable Cloud (done 2026-10-07)
- [x] Make formulary PDF optional with official lookup links (done 2026-10-08)
- [x] Clarify compare filters and cost terms (done 2026-10-08)
- [x] Add home-page trust section and founder story page (done 2026-10-08)
## Done 2026-10-08
- Fixed feedback submit on published site (server now uses SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY)
- Worst-case sort now orders by true worst-case yearly total
- Compare page: Part B premium note, fitness/OTC/giveback/preventive benefits from CMS PBP 2027, star rating row

## Open
- CMS 2027 star ratings not yet published (blank in the Sept 2026 landscape file) — re-extract when CMS releases them; display code already in place
- [x] Formulary checker page (/formulary-check) — AI reads a plan's formulary PDF against the user's drug list (2026-10-08)
- [x] Show 2026 CMS star ratings as a labeled fallback until 2027 ratings publish (2026-10-08)
- [ ] Swap to 2027 star ratings when CMS releases them (blocked on CMS)
- [x] Every Michigan hospital (CMS list) in the guide's searchable hospital box (2026-10-08)
- [x] Drug checker finds the plan's 2027 formulary online automatically (2026-10-08)
- [x] AI plan search refuses off-topic requests (2026-10-08)
- [x] "In testing" (beta) notice on the Check my drugs page (2026-10-08)
- [x] Emphasize the feedback button on the home page and the Check my drugs page (2026-10-08)
- [x] Hospital question: dropdown of matching hospitals as the person types (2026-10-08)
- [x] Service-level CMS benefit data for every Michigan plan (2026-10-10)
- [x] "Search this plan's benefits" box on each plan + "Which plans are best for these?" comparison (2026-10-10)
- [x] Privacy page and site-wide footer (2026-10-10)
- [x] Footer independence notices, How we compare plans page, About funding section (2026-10-10)
- [x] Data provenance, validation checks, test profiles, /admin/validation, /methodology (2026-10-10)
- [ ] Confirm CMS 2027 MOOP limit from the official CMS document, then set limits2027.moopInNetworkMax (blocked: CMS memo not downloadable yet)
- [ ] Decide whether to switch site Part D figures to CMS-confirmed 2027 ($700 deductible max, $2,400 cap) (waiting on owner)
- [ ] Compare plan cards: "Premium $0/mo" pill text sits too high in the pill — lower it so it reads centered
