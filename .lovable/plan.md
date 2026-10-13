# Add Meta Pixel (ID 966964635872874)

## What visitors see
Nothing changes in the design. No banner is added. Google Analytics is untouched. No Conversions API, no other trackers.

## Location check (verified)
- The location lookup answers on both plainplanguide.com and plainplanguide.lovable.app (tested today: status 200 with a country code).
- The Pixel loads only when the lookup succeeds within about 2 seconds AND returns a country outside consent regions (EU, EEA, UK, Switzerland).
- If the lookup fails, times out, returns an error, an unknown country (XX) or Tor (T1), the Pixel never loads.
- Browser "Global Privacy Control" opt-out also blocks it.

## Page address audit (findings)
- The Compare page puts choices in its web address: county, coverage type, network type, insurers, required benefits, maximum premium, sort, and **the free text typed into the plan search** (q=). That text could contain anything, including a medicine or health condition.
- The guide passes the county into Compare. ZIP codes, medicines and questionnaire answers are not in addresses today, but the Pixel must not depend on that staying true.
- Meta's standard script automatically sends the full page address and the referring address.

## How PageViews are sent safely
- The official Meta script is installed, but its automatic page-address reporting would leak the Compare address. So every PageView is sent with only the page path, e.g. `https://plainplanguide.com/compare` — never anything after `?` or `#`.
- The referring address is reduced to the website's name only (e.g. `https://www.google.com`).
- Automatic extra events (button-click and form detection) are turned off, so no form text or button labels are sent.
- No custom event details are sent at all.

## PageView counting
- One PageView per page visit, including in-site navigation.
- A to B to back to A = three PageViews.
- Only the overlap between the first page load and the router's first "page changed" signal is suppressed (one-time guard on the initial load), not repeat visits.
- Changes to Compare filters (same page, only the address details change) do not count as new pages.

## Privacy page
Update the "Cookies" and "Who else sees information" sections: name Meta, say it receives which page was viewed (no search terms or answers) and sets its own cookies for ad measurement, and that it is off in EU/UK and when location can't be confirmed. Remove "We don't use Facebook pixels."

## Verification
- Playwright on desktop and 393px phone: Pixel loads once; A to B to A sends three PageViews; initial load sends exactly one; Compare with filters and a typed search sends a path-only address with no `?`; referrer is name-only.
- Simulated EU country, failed lookup and GPC on: Pixel never loads.
- After publishing, confirm in Meta Events Manager > Test Events or the Meta Pixel Helper extension.
- Not published until you review.

## Technical details
- New `src/lib/metaPixel.ts`, called from a `useEffect` in `__root.tsx` alongside (not inside) the GA effect.
- Standard `fbq` loader snippet; `fbq('set','autoConfig',false,ID)`; `fbq('init', ID)`.
- Because `fbevents.js` always reads `location.href` for `dl`, PageView is sent via Meta's documented image endpoint `facebook.com/tr?id=ID&ev=PageView&dl=<origin+pathname>&rl=<referrer origin>` instead of `fbq('track','PageView')`. Cookie `_fbp` is still set by the loaded script.
- Dedupe: track by `pathname` on router `onResolved`, skipping only when pathname equals the last sent pathname AND the trigger is the first resolve after initial load.
- Region lookup cached for the page visit.
