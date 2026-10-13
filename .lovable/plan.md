# Add Meta Pixel (ID 966964635872874)

## What visitors see
Nothing changes in the design. No banner is added.

## How it behaves
- Before loading, the site checks the visitor's country (same-origin `/cdn-cgi/trace`, about 2 seconds max).
- Visitors in consent-required regions (EU, EEA, UK, Switzerland), or whose country can't be found, never load the Pixel.
- Everyone else gets the official Meta Pixel and a PageView on every page, including moves between pages without reloading.
- Each page address is sent only once, so there are no duplicate PageViews.
- Browser "Global Privacy Control" opt-out signals are honored (Pixel not loaded).
- Google Analytics is untouched. No Conversions API, no other trackers.

## Privacy page
Update the "Cookies" and "Who else sees information" sections: name Meta, say it receives page views and sets its own cookies for ad measurement, that it is off in EU/UK, and that nothing typed (ZIP, answers, medicines) is sent. Remove "We don't use Facebook pixels."

## Verification
- Playwright on desktop and 393px phone: Pixel script loads once, one PageView per page, one more after in-site navigation, none on repeat.
- Simulated EU country: Pixel never loads.
- After publishing, you can confirm in Meta Events Manager > Test Events, or with the Meta Pixel Helper browser extension.

## Technical details
- New `src/lib/metaPixel.ts`: standard `fbq` snippet injected from a `useEffect` in `__root.tsx`, `fbq('init', id)` once, manual `fbq('track','PageView')` on load and on router `onResolved`, deduped by last href (mirrors existing GA pattern).
- Pixel ID is public, kept as a constant.
- Not published until you review.
