"""Build src/lib/cms2027-stars.json from the CMS 2027 Star Ratings Data Tables ZIP
("Summary Ratings (Oct 8 2026).csv"). Deterministic: matched by Contract Number only.
Category priority per contract: 2027 Overall, then Part D Summary, then Part C Summary.
Non-numeric values ("Not enough data available", "Plan too new to be measured", ...) are kept
as an unavailable reason string, never converted to a number.
Usage: python3 scripts/build-stars-2027.py "<Summary Ratings csv>" """
import sys, csv, json, hashlib

path = sys.argv[1]
raw = open(path, "rb").read()
rows = list(csv.reader(raw.decode("latin-1").splitlines()))
hdr = [h.strip() for h in rows[1]]
need = ["Contract Number", "2027 Overall", "2027 Part D Summary", "2027 Part C Summary"]
missing = [n for n in need if n not in hdr]
if missing:
    sys.exit(f"Unexpected file layout, missing columns: {missing}")
idx = {n: hdr.index(n) for n in need}
ratings, unavailable = {}, {}
for r in rows[2:]:
    if len(r) <= max(idx.values()):
        continue
    c = r[idx["Contract Number"]].strip()
    if not c:
        continue
    if c in ratings or c in unavailable:
        sys.exit(f"Duplicate contract {c}")
    reason = None
    for col, cat in [("2027 Overall", "overall"), ("2027 Part D Summary", "partD"), ("2027 Part C Summary", "partC")]:
        v = r[idx[col]].strip()
        try:
            f = float(v)
            if not (1 <= f <= 5):
                sys.exit(f"Rating out of range for {c}: {v}")
            ratings[c] = {"stars": f, "category": cat}
            break
        except ValueError:
            if v and v != "Not Applicable" and reason is None:
                reason = v
    if c not in ratings:
        unavailable[c] = reason or "Not available"
out = {
    "year": 2027,
    "source": "https://www.cms.gov/files/zip/2027-star-ratings-data-tables-oct-8-2026.zip",
    "released": "2026-10-08",
    "sha256": hashlib.sha256(raw).hexdigest(),
    "ratings": ratings,
    "unavailable": unavailable,
}
json.dump(out, open("src/lib/cms2027-stars.json", "w"), separators=(",", ":"), sort_keys=True)
print(len(ratings), "rated,", len(unavailable), "unavailable")
