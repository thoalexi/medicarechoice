"""Add each plan's in-network copays to src/lib/cms2027-mi-extras.json from the CMS PBP Benefits ZIP.

Usage: unzip https://www.cms.gov/files/zip/pbp-benefits-2027.zip into a folder, run build-mi-extras.py first,
then: python3 scripts/build-mi-copays.py <unzipped-folder>
Adds: pcp, spec, er (per visit, $ copay or {"pct": n}), stay (cost of a 5-day hospital stay), medDed (medical deductible).
"""
import csv, json, sys, os
src = sys.argv[1]
path = "src/lib/cms2027-mi-extras.json"
out = json.load(open(path))
ids = set(out)

def rows(name):
    with open(os.path.join(src, name + ".txt"), encoding="cp1252") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            pid = f'{r["pbp_a_hnumber"]}_{r["pbp_a_plan_identifier"]}_{int(r.get("segment_id") or 0)}'
            if pid in ids:
                yield pid, r

def num(v):
    try: return float(v)
    except (TypeError, ValueError): return None

def share(r, p):
    c = num(r.get(f"pbp_{p}_copay_amt_mc_min"))
    if c is not None: return round(c)
    pct = num(r.get(f"pbp_{p}_coins_pct_mc_min"))
    if pct is not None: return {"pct": round(pct)}
    if r.get(f"pbp_{p}_copay_yn") == "2" and r.get(f"pbp_{p}_coins_yn") == "2": return 0
    return None

for pid, r in rows("pbp_b7_health_prof"):
    for k, p in (("pcp", "b7a"), ("spec", "b7d")):
        v = share(r, p)
        if v is not None: out[pid][k] = v
for pid, r in rows("pbp_b4_emerg_urgent"):
    v = share(r, "b4a")
    if v is not None: out[pid]["er"] = v

DAYS = 5
for pid, r in rows("pbp_b1a_inpat_hosp"):
    n = int(num(r.get("pbp_b1a_copay_mcs_int_num_t1")) or 0)
    if n:
        total = 0.0
        for i in range(1, n + 1):
            amt = num(r.get(f"pbp_b1a_copay_mcs_amt_int{i}_t1")) or 0
            b = int(num(r.get(f"pbp_b1a_copay_mcs_bgnd_int{i}_t1")) or 1)
            e = int(num(r.get(f"pbp_b1a_copay_mcs_endd_int{i}_t1")) or 999)
            days = max(0, min(e, DAYS) - b + 1)
            total += amt * days
        out[pid]["stay"] = round(total)
    elif num(r.get("pbp_b1a_copay_mcs_amt_t1")) is not None:
        out[pid]["stay"] = round(num(r.get("pbp_b1a_copay_mcs_amt_t1")))
    elif num(r.get("pbp_b1a_coins_mcs_pct_t1")) is not None:
        out[pid]["stay"] = {"pct": round(num(r.get("pbp_b1a_coins_mcs_pct_t1")))}
    elif r.get("pbp_b1a_copay_yn") == "2" and r.get("pbp_b1a_coins_yn") == "2":
        out[pid]["stay"] = 0

for pid, r in rows("pbp_Section_D"):
    if r.get("pbp_d_ann_deduct_yn") == "1":
        d = num(r.get("pbp_d_ann_deduct_amt"))
        if d: out[pid]["medDed"] = round(d)

json.dump(out, open(path, "w"), separators=(",", ":"))
has = lambda k: sum(1 for v in out.values() if k in v)
print(len(out), "plans; pcp", has("pcp"), "spec", has("spec"), "er", has("er"), "stay", has("stay"), "medDed", has("medDed"))
