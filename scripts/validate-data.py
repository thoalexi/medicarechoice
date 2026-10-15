#!/usr/bin/env python3
"""Validate the bundled Michigan plan data against the CMS source and the previous import.

Usage: python3 scripts/validate-data.py <path/to/CY2027_Landscape_*.csv>
Run after any import script. Writes:
  src/lib/validation-report.json  (pass/fail report shown on /admin/validation)
  src/lib/data-provenance.json    (sources + "Plan data as of" date)
  data/snapshots/<date>.json      (snapshot used for the next change comparison)
"""
import csv, datetime, glob, json, os, re, sys
from collections import Counter, defaultdict

def _stars_meta():
    d = json.load(open("src/lib/cms2027-stars.json"))
    return d.get("year"), len(d.get("ratings", {})), len(d.get("unavailable", {}))

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)

def money(v):
    v = (v or "").replace("$", "").replace(",", "").strip()
    try: return float(v)
    except ValueError: return None

def check(name, status, detail, items=None):
    return {"name": name, "status": status, "detail": detail, "items": (items or [])[:200], "count": len(items or [])}

def main(src):
    today = datetime.date.today().isoformat()
    sources = json.load(open(P("data/sources.json")))
    lim = sources["limits2027"]
    data = json.load(open(P("src/lib/cms2027-mi.json")))
    extras = json.load(open(P("src/lib/cms2027-mi-extras.json")))
    plans = data["plans"]
    rows = [r for r in csv.DictReader(open(src, encoding="utf-8-sig"))
            if r["State Territory Abbreviation"] == "MI" and r["Contract Category Type"] != "PDP"]
    srcPlans = defaultdict(list)
    for r in rows: srcPlans[r["Contract Plan Segment ID"]].append(r)
    checks = []

    # 1. Plan count per county
    ours = Counter(c for p in plans for c in p["counties"])
    theirs = Counter(r["County Name"] for r in rows)
    bad = [f"{c}: site {ours.get(c,0)}, CMS {theirs.get(c,0)}" for c in sorted(set(ours) | set(theirs)) if ours.get(c,0) != theirs.get(c,0)]
    checks.append(check("Plan count per county matches CMS", "fail" if bad else "pass",
        f"{len(theirs)} counties, {sum(theirs.values())} county-plan listings in the CMS file.", bad))

    # 2. Plan ID format and uniqueness
    ids = Counter(p["id"] for p in plans)
    bad = [f"{i}: bad format" for i in ids if not re.fullmatch(r"[HRES]\d{4}_\d{3}_\d+", i)]
    bad += [f"{i}: appears {n} times" for i, n in ids.items() if n > 1]
    bad += [f"{i}: in CMS file but missing from site" for i in srcPlans if i not in ids]
    bad += [f"{i}: on site but not in CMS file" for i in ids if i not in srcPlans]
    checks.append(check("Every plan ID is valid and appears exactly once", "fail" if bad else "pass", f"{len(ids)} plans checked.", bad))

    # 3. Missing / negative values
    bad = []
    for p in plans:
        if p["premium"] is None or p["premium"] < 0: bad.append(f"{p['id']}: premium {p['premium']}")
        if p["moop"] is None or p["moop"] <= 0: bad.append(f"{p['id']}: out-of-pocket limit missing ({p['moop']})")
        if p["rx"] and (p["rxDed"] is None or p["rxDed"] < 0): bad.append(f"{p['id']}: drug deductible {p['rxDed']}")
        e = extras.get(p["id"], {})
        for k in ("pcp", "spec", "er", "stay"):
            v = e.get(k)
            if isinstance(v, (int, float)) and v < 0: bad.append(f"{p['id']}: negative {k} copay {v}")
    checks.append(check("No negative or missing premiums, deductibles or out-of-pocket limits", "fail" if bad else "pass",
        "Medicare Advantage plans must list a premium and an in-network out-of-pocket limit; drug plans a drug deductible. Medigap and Original Medicare are not in this file.", bad))

    # 4. CMS limits
    bad = [f"{p['id']}: drug deductible ${p['rxDed']:,.0f} > ${lim['partDDeductibleMax']}" for p in plans if p["rx"] and p["rxDed"] and p["rxDed"] > lim["partDDeductibleMax"]]
    for i, rs in srcPlans.items():
        t = money(rs[0]["Part D Out-of-Pocket (OOP) Threshold"])
        if rs[0]["Part D Coverage Indicator"] == "Yes" and t is not None and t != lim["partDOopThreshold"]:
            bad.append(f"{i}: Part D out-of-pocket threshold ${t:,.0f} (CMS 2027: ${lim['partDOopThreshold']:,})")
    checks.append(check("Part D values within CMS 2027 limits", "fail" if bad else "pass",
        f"Deductible at most ${lim['partDDeductibleMax']}, out-of-pocket threshold ${lim['partDOopThreshold']:,}. Source: {lim['partDSource']}", bad))
    hi = max((p["moop"] or 0) for p in plans)
    if lim["moopInNetworkMax"]:
        bad = [f"{p['id']}: ${p['moop']:,.0f}" for p in plans if p["moop"] and p["moop"] > lim["moopInNetworkMax"]]
        checks.append(check("Out-of-pocket limits within CMS 2027 maximum", "fail" if bad else "pass", lim["moopSource"], bad))
    else:
        checks.append(check("Out-of-pocket limits within CMS 2027 maximum", "unconfirmed",
            f"Limit not confirmed. {lim['moopSource']} Highest limit in our data: ${hi:,.0f}."))

    # 5. Star rating, plan type, counties match source
    bad = []
    for p in plans:
        rs = srcPlans.get(p["id"])
        if not rs: continue
        r = rs[0]
        try: s = float(r["Overall Star Rating"])
        except ValueError: s = 0
        if s != p["stars"]: bad.append(f"{p['id']}: star rating site {p['stars']}, CMS {s}")
        if r["Plan Type"] != p["cmsType"]: bad.append(f"{p['id']}: plan type site {p['cmsType']}, CMS {r['Plan Type']}")
        if (r["Special Needs Plan (SNP) Indicator"] == "Yes") != p["snp"]: bad.append(f"{p['id']}: SNP flag differs")
        if sorted(x["County Name"] for x in rs) != sorted(p["counties"]): bad.append(f"{p['id']}: county list differs")
    checks.append(check("Star rating, plan type and counties match CMS", "fail" if bad else "pass",
        "Star ratings in this check come from the landscape file. The site shows CMS {} ratings from the separate Star Ratings file ({} contracts rated, {} unavailable).".format(*_stars_meta()), bad))

    # 6. Changes since previous import
    snap = {p["id"]: {**{k: p[k] for k in ("name", "cmsType", "premium", "moop", "rxDed", "stars")},
                      "counties": sorted(p["counties"]),
                      **{k: extras.get(p["id"], {}).get(k) for k in ("pcp", "spec", "er", "stay", "deductible")}} for p in plans}
    os.makedirs(P("data/snapshots"), exist_ok=True)
    prev_files = sorted(f for f in glob.glob(P("data/snapshots/*.json")) if not f.endswith(f"{today}.json"))
    changes = []
    if prev_files:
        prev = json.load(open(prev_files[-1]))
        for i, v in snap.items():
            if i not in prev: changes.append(f"{i}: new plan"); continue
            for k, nv in v.items():
                ov = prev[i].get(k)
                if ov != nv:
                    changes.append(f"{i}: {k} {len(ov) if k=='counties' and ov else ov} → {len(nv) if k=='counties' else nv}" + (" counties" if k == "counties" else ""))
        changes += [f"{i}: plan removed" for i in prev if i not in snap]
        checks.append(check("Plans changed since previous import", "changed" if changes else "pass",
            f"Compared with snapshot {os.path.basename(prev_files[-1])[:-5]}.", changes))
    else:
        checks.append(check("Plans changed since previous import", "baseline", "First snapshot saved today; changes will be flagged after the next import."))
    json.dump(snap, open(P(f"data/snapshots/{today}.json"), "w"), indent=0)

    status = "fail" if any(c["status"] == "fail" for c in checks) else "pass"
    json.dump({"ranAt": today, "source": os.path.basename(src), "status": status, "checks": checks},
              open(P("src/lib/validation-report.json"), "w"), indent=1)
    land = next(d for d in sources["datasets"] if d["key"] == "landscape")
    json.dump({"asOf": land["released"], "asOfSource": "CMS 2027 Landscape file", "datasets": sources["datasets"], "limits2027": lim},
              open(P("src/lib/data-provenance.json"), "w"), indent=1)
    for c in checks: print(f"[{c['status'].upper():11}] {c['name']} ({c['count']})")

if __name__ == "__main__":
    main(*sys.argv[1:])
