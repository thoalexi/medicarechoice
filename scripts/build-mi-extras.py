"""Regenerate src/lib/cms2027-mi-extras.json from the CMS PBP Benefits ZIP.

Usage: download https://www.cms.gov/files/zip/pbp-benefits-2027.zip, unzip into a folder,
then run: python3 scripts/build-mi-extras.py <unzipped-folder>
Only mandatory (included-in-premium) supplemental benefits count as covered;
optional buy-up riders are reported separately.
"""
import csv, json, sys, os

src = sys.argv[1]
plans = json.load(open("src/lib/cms2027-mi.json"))["plans"]
ids = {p["id"] for p in plans}

def rows(name):
    with open(os.path.join(src, name + ".txt"), encoding="cp1252") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            pid = f'{r["pbp_a_hnumber"]}_{r["pbp_a_plan_identifier"]}_{int(r.get("segment_id") or 0)}'
            if pid in ids:
                yield pid, r

def amt(v):
    try:
        x = float(v)
        return round(x) if x > 0 else None
    except (TypeError, ValueError):
        return None

out = {pid: {} for pid in ids}

for pid, r in rows("pbp_b16_dental"):
    amos = {k: v for k, v in r.items() if k.endswith("_amo") and k.startswith(("pbp_b16b_bendesc", "pbp_b16c_bendesc"))}
    prev = any(v in ("2", "4") for k, v in amos.items() if k.startswith("pbp_b16b"))
    comp = any(v in ("2", "4") for k, v in amos.items() if k.startswith("pbp_b16c"))
    optional = any(v == "3" for v in amos.values())
    limit = 0
    if r.get("pbp_b16b_maxplan_pv_yn") == "1":
        limit += amt(r.get("pbp_b16b_maxplan_pv_amt")) or 0
    if r.get("pbp_b16c_maxplan_cmp_yn") == "1" and r.get("pbp_b16c_maxplan_cmp_type") == "2":
        limit += amt(r.get("pbp_b16c_maxplan_cmp_amt")) or 0
    out[pid].update(dental=prev or comp, dentalComprehensive=comp, dentalMax=limit or None, dentalOptional=optional and not (prev or comp))

for pid, r in rows("pbp_b17_eye_exams_wear"):
    exam = r.get("pbp_b17a_bendesc_yn") == "1"
    wear = r.get("pbp_b17b_bendesc_yn") == "1"
    m = amt(r.get("pbp_b17b_comb_maxplan_amt"))
    if m is None:
        cands = [amt(v) for k, v in r.items() if k.startswith("pbp_b17b_indv_maxplan_amt")]
        cands = [c for c in cands if c]
        m = max(cands) if cands else None
    out[pid].update(vision=exam or wear, visionExam=exam, eyewear=wear, eyewearMax=m if wear else None)

for pid, r in rows("pbp_b18_hearing_exams_aids"):
    exam = r.get("pbp_b18a_bendesc_yn") == "1"
    aids = r.get("pbp_b18b_bendesc_yn") == "1"
    m = amt(r.get("pbp_b18b_maxplan_amt")) if r.get("pbp_b18b_maxplan_yn") == "1" else None
    out[pid].update(hearing=exam or aids, hearingExam=exam, hearingAids=aids, hearingAidMax=m if aids else None)

for pid, v in out.items():
    for k in ("dental", "vision", "hearing"):
        v.setdefault(k, False)

json.dump(out, open("src/lib/cms2027-mi-extras.json", "w"), separators=(",", ":"))
print(len(out), "plans;", sum(v["dental"] for v in out.values()), "dental,", sum(v["vision"] for v in out.values()), "vision,", sum(v["hearing"] for v in out.values()), "hearing")
