# PlainPlanGuide

A free, independent, plain-language Medicare guide for seniors and their adult children, focused on Michigan 2027 plans.

**Live website**: https://plainplanguide.com

## What PlainPlanGuide does

- **3-minute guided questionnaire**: county, health, doctors and hospitals, prescriptions, budget vs. peace of mind, and extras lead to plan suggestions with estimated true yearly costs and trade-offs.
- **Compare plans**: filter, sort and compare Michigan Medicare Advantage, Medigap and Original Medicare options side by side, plus an AI plan search.
- **Search a plan's benefits**: look up services (MRI, physical therapy, lab work) to see copays, prior approval and referral rules as CMS lists them.
- **Check my drugs (beta)**: check medicines against a plan's official formulary.
- **Plain-language guides**: what Medicare covers, Michigan 2027, and our methodology.

## Independence

- Not affiliated with, endorsed by, or connected to Medicare, CMS, or any government agency.
- We don't sell insurance, enroll anyone, or take payment from insurers. Plans are never ranked by who offers them.
- Funded by donations only. Donations support this women-owned business.

## Data sources

All plan figures come from official CMS public files and are never hand-edited:

- CMS CY2027 Medicare Advantage & Part D Landscape files (Michigan, all 83 counties)
- CMS 2027 Plan Benefit Package (PBP) Benefits files
- CMS Hospital General Information
- CMS Star Ratings (prior year, labeled, until current-year ratings are published)

All costs are estimates, not quotes. Confirm at Medicare.gov or with Michigan MMAP (1-800-803-7174).

## Local development

Built with TanStack Start, React 19, Tailwind CSS and [Lovable](https://lovable.dev/projects/a2ae8170-1341-4207-8c03-28307024f5e2).

```sh
bun install
bun dev
```

## How to run the next CMS update

**In the browser (star ratings and yearly Medicare figures):**
1. Sign in at `/auth`, then open `/admin/cms-updates`.
2. Press **Check CMS now** to see whether CMS posted newer files (last checked and last updated are shown separately).
3. Star ratings: paste the cms.gov Star Ratings Data Tables ZIP link (or upload the "Summary Ratings" CSV) and press preview. Review changes and checks.
4. Yearly figures: type only CMS-announced amounts with the cms.gov link; tick "Confirmed" only when CMS has announced that year's figure. Preview.
5. Press **Publish checked update**. If anything looks wrong, press **Restore previous version**.

**Plan list and benefits (Landscape and PBP files)** — still imported with the scripts:
`python3 scripts/build-mi-landscape.py`, `build-mi-extras.py`, `build-mi-copays.py`, `build-mi-services.py`, then `python3 scripts/validate-data.py` and `bun scripts/run-test-profiles.ts`; update `data/sources.json`. Tests: `bunx vitest run`.
