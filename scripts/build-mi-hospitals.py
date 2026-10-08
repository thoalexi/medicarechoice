"""Build src/lib/mi-hospitals.json from the CMS Hospital General Information dataset (xubh-q36u).
Run yearly: python3 scripts/build-mi-hospitals.py"""
import json, re, urllib.request

URL = ("https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0"
       "?conditions%5B0%5D%5Bproperty%5D=state&conditions%5B0%5D%5Bvalue%5D=MI&limit=1000")
SMALL = {"of", "and", "the", "at", "in", "for"}
KEEP = {"UP", "UM", "DMC", "VA", "ER", "II"}


def tc(s: str) -> str:
    out = []
    for i, w in enumerate(s.split()):
        if w in KEEP:
            out.append(w)
        elif i and w.lower() in SMALL:
            out.append(w.lower())
        else:
            out.append(re.sub(r"^(Mc)(\w)", lambda m: m.group(1) + m.group(2).upper(), w.capitalize()))
    return " ".join(out).replace("'S", "'s")


rows = json.load(urllib.request.urlopen(URL))["results"]
hosp = sorted(
    ({"name": tc(r["facility_name"]), "city": tc(r["citytown"]), "county": tc(r["countyparish"]), "type": r["hospital_type"]} for r in rows),
    key=lambda h: h["name"],
)
json.dump(hosp, open("src/lib/mi-hospitals.json", "w"), separators=(",", ":"))
print(len(hosp), "hospitals")
