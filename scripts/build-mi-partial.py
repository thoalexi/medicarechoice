# Partial-county flags for Michigan Medicare Advantage contracts, from the official
# CMS "MA Contract Service Area by State/County" monthly file.
# Usage: python3 scripts/build-mi-partial.py /path/to/MA_Cnty_SA_YYYY_MM.csv YYYY-MM
# CMS does not publish ZIP-level service areas for MA plans; this file only says when a
# contract covers part of a county ("Partial" = "*"). The flag is per contract, not per plan,
# and reflects the current enrollment year. Writes src/lib/mi-partial-counties.json.
import csv, json, sys

src, period = sys.argv[1], sys.argv[2]
plans = json.load(open("src/lib/cms2027-mi.json"))["plans"]
ours = {p["id"].split("_")[0] for p in plans}
partial, seen = {}, set()
for r in csv.DictReader(open(src, encoding="latin-1")):
    if r["State"] != "MI":
        continue
    cid = r["Contract ID"].strip()
    seen.add(cid)
    if r["Partial"].strip() == "*" and cid in ours:
        partial.setdefault(cid, []).append(r["County"].strip())
out = {
    "source": "CMS MA Contract Service Area by State/County",
    "sourceUrl": "https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data/ma-contract-service-area-state/county",
    "period": period,
    "partial": {k: sorted(v) for k, v in sorted(partial.items())},
    "notInFile": sorted(ours - seen),
}
json.dump(out, open("src/lib/mi-partial-counties.json", "w"), indent=1)
print(len(out["partial"]), "contracts with partial counties;", len(out["notInFile"]), "2027 contracts not yet in the file")
