#!/usr/bin/env python3
"""Build src/lib/cms2027-mi.json from the CMS CY2027 Landscape CSV (Michigan only).

Usage: python3 scripts/build-mi-landscape.py <path/to/CY2027_Landscape_*.csv>
Source: https://www.cms.gov/medicare/coverage/prescription-drug-coverage (CY2027 Landscape ZIP).
Never hand-edit the output. Run scripts/validate-data.py afterwards.
"""
import csv, json, statistics, sys
from collections import OrderedDict

def money(v):
    v = (v or "").replace("$", "").replace(",", "").strip()
    try:
        return float(v)
    except ValueError:
        return None

def stars(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0

def main(path, out="src/lib/cms2027-mi.json"):
    rows = [r for r in csv.DictReader(open(path, encoding="utf-8-sig")) if r["State Territory Abbreviation"] == "MI"]
    plans = OrderedDict()
    pdp = []
    for r in rows:
        if r["Contract Category Type"] == "PDP":
            p = money(r["Part D Total Premium"])
            if p is not None:
                pdp.append(p)
            continue
        pid = r["Contract Plan Segment ID"]
        if pid not in plans:
            plans[pid] = {
                "id": pid,
                "name": r["Plan Name"],
                "carrier": r["Organization Marketing Name"],
                "cmsType": r["Plan Type"],
                "snp": r["Special Needs Plan (SNP) Indicator"] == "Yes",
                "premium": money(r["Monthly Consolidated Premium (Part C + D)"]) or 0.0,
                "moop": money(r["In-Network Maximum Out-of-Pocket (MOOP) Amount"]),
                "rx": r["Part D Coverage Indicator"] == "Yes",
                "rxDed": money(r["Annual Part D Deductible Amount"]),
                "stars": stars(r["Overall Star Rating"]),
                "counties": [],
            }
        plans[pid]["counties"].append(r["County Name"])
    data = {
        "pdpMedian": round(statistics.median(pdp), 2) if pdp else None,
        "pdpMin": min(pdp) if pdp else None,
        "plans": list(plans.values()),
    }
    json.dump(data, open(out, "w"))
    print(f"wrote {out}: {len(plans)} plans, {len(pdp)} PDP rows")

if __name__ == "__main__":
    main(*sys.argv[1:])
