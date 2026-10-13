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

## Final privacy and reliability checks
- **Page paths audited:** every page path is generic (/, /guide, /compare, /formulary-check, /what-does-medicare-cover, /michigan-medicare-2027, /about, /donate, /feedback, /privacy, /methodology, /how-we-compare). None contains health details. Admin, sign-in and password pages are excluded from the Pixel entirely.
- **Referrer-Policy:** add a site-wide `strict-origin-when-cross-origin` referrer rule, plus `referrerpolicy="no-referrer"` on the Pixel script and every request we build. Outside sites then see at most `https://plainplanguide.com`, never `?` details. Google Analytics reads the address itself, not this header, so it is unaffected.
- **All Meta requests inspected:** Playwright records every request to facebook.com / facebook.net / connect.facebook.net (script, PageView, any beacon). Test fails if any request URL, Referer header or body contains `?`, `#`, a test search phrase, a test medicine name, a ZIP or a questionnaire answer.
- **Automatic events off:** `autoConfig` disabled and no `fbq('track')` calls, so the script sends nothing on its own. If testing shows the script still sends anything automatically, that is a failure.
- **Attribution kept:** our PageView includes Meta's browser ID (`_fbp`) and ad-click ID (`_fbc`, created from `fbclid` when someone arrives from an ad), so Meta can still match visits to ads. The `fbclid` value itself is never sent in a page address.
- **Events Manager recognition:** can only be proven against the live site. Plan: publish with the Pixel switched off, then you open Events Manager > Test Events and I switch it on for test codes only to confirm PageViews appear with path-only addresses. The Pixel is switched on for real visitors only after that check passes.
- **If any check cannot be verified, the Pixel stays off** and I will explain exactly what could not be confirmed.

