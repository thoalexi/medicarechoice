"""Build service-level cost sharing for Michigan plans from the CMS PBP Benefits ZIP.

Usage: unzip https://www.cms.gov/files/zip/pbp-benefits-2027.zip into a folder, then:
  python3 scripts/build-mi-services.py <unzipped-folder>
Writes src/lib/cms2027-mi-services.json:
  { "services": {key: label}, "plans": {planId: {serviceKey: row}} }
Row fields (all copied from CMS, never estimated):
  c  [min, max] in-network copay in dollars     p  [min, max] in-network coinsurance %
  z  1 when the plan lists no copay and no coinsurance ($0)
  days  hospital/SNF per-day copays [[amount, fromDay, toDay], ...]
  a  1/0 prior authorization required            r  1/0 referral required
  d  1/0 plan deductible applies first
  o  out-of-network {c, p, d} (PPO/POS plans only, from Section C OON)
Missing fields mean CMS did not report them for that plan.
"""
import csv, json, os, re, sys

src = sys.argv[1]
ids = set(json.load(open("src/lib/cms2027-mi-extras.json")))

# key, label, file, prefix, include-regex for cost columns, exclude-regex, OON category codes
S = [
    ("pcp", "Primary care doctor visit", "pbp_b7_health_prof", "b7a", r"", r"", ["7a"]),
    ("specialist", "Specialist visit", "pbp_b7_health_prof", "b7d", r"", r"", ["7d"]),
    ("chiro", "Chiropractor", "pbp_b7_health_prof", "b7b", r"_mc", r"", ["7b"]),
    ("ot", "Occupational therapy", "pbp_b7_health_prof", "b7c", r"", r"", ["7c"]),
    ("pt", "Physical or speech therapy", "pbp_b7_health_prof", "b7i", r"", r"", ["7i"]),
    ("mental", "Mental health visit (therapist)", "pbp_b7_health_prof", "b7e", r"", r"", ["7e1", "7e2"]),
    ("psych", "Psychiatrist visit", "pbp_b7_health_prof", "b7h", r"", r"", ["7h1", "7h2"]),
    ("podiatry", "Podiatrist (foot doctor)", "pbp_b7_health_prof", "b7f", r"", r"", ["7f"]),
    ("telehealth", "Telehealth visit", "pbp_b7_health_prof", "b7j", r"", r"", []),
    ("lab", "Lab tests (blood work)", "pbp_b8_clin_diag_ther", "b8a", r"lab", r"", ["8a2"]),
    ("diagtest", "Diagnostic tests and procedures", "pbp_b8_clin_diag_ther", "b8a", r"dmc", r"", ["8a1"]),
    ("imaging", "Advanced imaging (MRI, CT, PET scans)", "pbp_b8_clin_diag_ther", "b8b", r"drs", r"", ["8b1"]),
    ("xray", "X-rays", "pbp_b8_clin_diag_ther", "b8b", r"copay_mc_amt|cmc", r"", ["8b3"]),
    ("radiation", "Radiation therapy", "pbp_b8_clin_diag_ther", "b8b", r"tmc", r"", ["8b2"]),
    ("outpatient", "Outpatient hospital services", "pbp_b9_outpat_hosp", "b9a", r"ohs", r"", ["9a1"]),
    ("observation", "Observation stay", "pbp_b9_outpat_hosp", "b9a", r"obs", r"", ["9a2"]),
    ("surgery_center", "Outpatient surgery center", "pbp_b9_outpat_hosp", "b9b", r"", r"", ["9b"]),
    ("er", "Emergency room", "pbp_b4_emerg_urgent", "b4a", r"_mc", r"", []),
    ("urgent", "Urgent care", "pbp_b4_emerg_urgent", "b4b", r"_mc", r"", []),
    ("ambulance", "Ambulance (ground)", "pbp_b10_amb_trans", "b10a", r"gas", r"", ["10a1"]),
    ("dme", "Medical equipment (walkers, wheelchairs, oxygen)", "pbp_b11_dme_prosth_orth_sup", "b11a", r"", r"", ["11a"]),
    ("prosthetics", "Prosthetics and braces", "pbp_b11_dme_prosth_orth_sup", "b11b", r"", r"mcms", ["11b1"]),
    ("diabetic", "Diabetic supplies", "pbp_b11_dme_prosth_orth_sup", "b11c", r"", r"dtsi|c3", ["11c1"]),
    ("dialysis", "Kidney dialysis", "pbp_b12_renal_dialysis", "b12", r"", r"", ["12"]),
    ("cardiac_rehab", "Cardiac rehab", "pbp_b3_cardiac_rehab", "b3", r"_mc_.*_crs$", r"", ["3-1"]),
    ("pulm_rehab", "Pulmonary rehab", "pbp_b3_cardiac_rehab", "b3", r"_mc_.*_prs$", r"", ["3-3"]),
    ("home_health", "Home health care", "pbp_b6_home_health", "b6", r"", r"", ["6"]),
    ("partb_drugs", "Part B drugs (e.g. infusions, chemo)", "pbp_b15_partb_rx_drugs", "mrx_b", r"^mrx_b_(copay|coins)_(min|max)", r"", ["15-2"]),
    ("chemo", "Chemotherapy drugs", "pbp_b15_partb_rx_drugs", "mrx_b", r"chemo", r"", ["15-2"]),
    ("hearing_exam", "Hearing exam", "pbp_b18_hearing_exams_aids", "b18a", r"med_|copay_amt$|copay_amt_max$|med_coins", r"rht|fha", ["18a"]),
    ("hearing_aid", "Hearing aids", "pbp_b18_hearing_exams_aids", "b18b", r"", r"", []),
    ("eye_exam", "Eye exam", "pbp_b17_eye_exams_wear", "b17a", r"_mc_|rex", r"", ["17a"]),
    ("eyewear", "Glasses or contacts", "pbp_b17_eye_exams_wear", "b17b", r"", r"", ["17b"]),
    ("hospital", "Inpatient hospital stay", "pbp_b1a_inpat_hosp", "b1a", "DAYS", r"", []),
    ("snf", "Skilled nursing facility", "pbp_b2_snf", "b2", "DAYS", r"", []),
]

def num(v):
    try: return float(v)
    except (TypeError, ValueError): return None

def pre(p): return p if p.startswith("mrx") else f"pbp_{p}"

def rows(name):
    with open(os.path.join(src, name + ".txt"), encoding="cp1252") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            pid = f'{r["pbp_a_hnumber"]}_{r["pbp_a_plan_identifier"]}_{int(r.get("segment_id") or 0)}'
            if pid in ids: yield pid, r

def rng(vals):
    v = [x for x in vals if x is not None]
    return [round(min(v)), round(max(v))] if v else None

def days(r, P, kind):
    out = []
    for i in range(1, 4):
        amt = num(r.get(f"{P}_{kind}_mcs_{'amt' if kind == 'copay' else 'pct'}_int{i}_t1"))
        if amt is None: continue
        b = num(r.get(f"{P}_{kind}_mcs_bgnd_int{i}_t1")); e = num(r.get(f"{P}_{kind}_mcs_endd_int{i}_t1"))
        out.append([round(amt), int(b or 1), int(e or 0)])
    return out

def flag(r, P, words):
    vals = [r[k] for k in r if k.startswith(P + "_") and re.search(words, k) and k.endswith("yn") and r[k]]
    return (1 if "1" in vals else 0) if vals else None

out = {}
for key, label, fname, p, inc, exc, _ in S:
    P = pre(p)
    for pid, r in rows(fname):
        row = {}
        if inc == "DAYS":
            dc = days(r, P, "copay")
            if dc: row["days"] = dc
            pc = days(r, P, "coins")
            if pc: row["p"] = rng([x[0] for x in pc])
            if not dc and num(r.get(f"{P}_copay_mcs_amt_t1")) is not None: row["c"] = rng([num(r.get(f"{P}_copay_mcs_amt_t1"))])
        else:
            def cols(kind, unit):
                return [k for k in r if k.startswith(P + "_") and kind in k and unit in k and not k.endswith("_yn")
                        and not re.search(r"nmc|ehc|wav|bonly|ira", k) and re.search(inc, k) and not (exc and re.search(exc, k))]
            c = rng([num(r[k]) for k in cols("copay", "amt")])
            pc = rng([num(r[k]) for k in cols("coins", "pct")])
            if c: row["c"] = c
            if pc: row["p"] = pc
        if "c" not in row and "p" not in row and "days" not in row and r.get(f"{P}_copay_yn") == "2" and r.get(f"{P}_coins_yn") == "2":
            row["z"] = 1
        a = flag(r, P, r"auth"); f = flag(r, P, r"refer"); d = flag(r, P, r"^(?!.*nmc).*(ded|deduct)_")
        if a is not None: row["a"] = a
        if f is not None: row["r"] = f
        if d is not None: row["d"] = d
        if row: out.setdefault(pid, {})[key] = row

# Out-of-network (PPO / POS) from Section C
oon_map = {code: key for key, *_rest, codes in S for code in codes}
for pid, r in rows("pbp_Section_C_OON"):
    o = {}
    c = rng([num(r.get("pbp_c_oon_outpt_copay_min_amt")), num(r.get("pbp_c_oon_outpt_copay_max_amt"))])
    pc = rng([num(r.get("pbp_c_oon_outpt_coins_min_pct")), num(r.get("pbp_c_oon_outpt_coins_max_pct"))])
    if c: o["c"] = c
    if pc: o["p"] = pc
    if not o and r.get("pbp_c_oon_outpt_copay_yn") == "2" and r.get("pbp_c_oon_outpt_coins_yn") == "2": o["z"] = 1
    if r.get("pbp_c_oon_outpt_ded_yn"): o["d"] = 1 if r["pbp_c_oon_outpt_ded_yn"] == "1" else 0
    if not o: continue
    for code in (r.get("pbp_c_oon_out_mc_bendesc_cats") or "").split(";"):
        key = oon_map.get(code)
        if key and key in out.get(pid, {}) and "o" not in out[pid][key]:
            out[pid][key]["o"] = o

json.dump({"services": {k: l for k, l, *_ in S}, "plans": out}, open("src/lib/cms2027-mi-services.json", "w"), separators=(",", ":"))
print(len(out), "plans")
for k, *_ in S:
    n = sum(1 for v in out.values() if k in v and ("c" in v[k] or "p" in v[k] or "z" in v[k] or "days" in v[k]))
    print(f"  {k}: {n} with cost, {sum(1 for v in out.values() if 'o' in v.get(k, {}))} with out-of-network")
