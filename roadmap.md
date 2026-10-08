# Roadmap

- [x] Add a donation button (Wikipedia-style "Like what we do? Please keep it going!" banner + donate page)
- [x] Say "Donations support this women owned business!" on the donation banner and page
- [x] Load official CMS 2027 Michigan plan list (all 83 counties, ZIP lookup)
- [x] Wire Stripe checkout on the donate page (done 2026-10-08; going live waits on Stripe onboarding)
- [x] Feedback button + /feedback page storing submissions in Lovable Cloud (done 2026-10-07)
- [x] Make formulary PDF optional with official lookup links (done 2026-10-08)
- [x] Clarify compare filters and cost terms (done 2026-10-08)
- [x] Add home-page trust section and founder story page (done 2026-10-08)
- [ ] Make formulary PDF optional with official lookup links
- [ ] Clarify compare filters and cost terms
- [ ] Add home-page trust section and founder story page

## Done 2026-10-08
- Fixed feedback submit on published site (server now uses SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY)
- Worst-case sort now orders by true worst-case yearly total
- Compare page: Part B premium note, fitness/OTC/giveback/preventive benefits from CMS PBP 2027, star rating row

## Open
- CMS 2027 star ratings not yet published (blank in the Sept 2026 landscape file) — re-extract when CMS releases them; display code already in place
- [x] Formulary checker page (/formulary-check) — AI reads a plan's formulary PDF against the user's drug list (2026-10-08)
- [x] Show 2026 CMS star ratings as a labeled fallback until 2027 ratings publish (2026-10-08)
- [ ] Swap to 2027 star ratings when CMS releases them (blocked on CMS)
