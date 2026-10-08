"""Build src/lib/cms2026-stars.json from the CMS 2026 Star Ratings Data Tables ZIP (Summary Ratings xlsx).
Usage: python3 scripts/build-star-fallback.py "<path to Summary Ratings xlsx>"
Used only as a labeled fallback while CMS 2027 ratings are unpublished."""
import sys, json, pandas as pd
d = pd.read_excel(sys.argv[1], header=1)
out = {}
for _, r in d.iterrows():
    c = str(r["Contract Number"]).strip()
    for col in ["2026 Overall", "2026 Part D Summary", "2026 Part C Summary"]:
        try:
            v = float(r[col]); out[c] = v; break
        except (ValueError, TypeError):
            pass
json.dump(out, open("src/lib/cms2026-stars.json", "w"), separators=(",", ":"), sort_keys=True)
print(len(out), "contracts")
