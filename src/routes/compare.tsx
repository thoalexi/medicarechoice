import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { COUNTIES, DATA_SOURCE, PART_B_MONTHLY, plansFor, estimateAnnual, money, type Health, type PlanType, type Region } from "@/lib/plans";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Medicare plans side by side — MedicareChoice" },
      { name: "description", content: "Filter and compare Medigap and Medicare Advantage plans by region, true yearly cost, network, and extras." },
      { property: "og:title", content: "Compare Medicare plans side by side — MedicareChoice" },
      { property: "og:description", content: "An interactive Medicare plan comparison dashboard." },
    ],
  }),
  component: Compare,
});

const TYPES: PlanType[] = ["Original + Medigap", "Advantage HMO", "Advantage PPO", "Special Needs (SNP)", "Other Advantage", "Original only"];
const DEFAULT_TYPES = TYPES.filter((t) => t !== "Special Needs (SNP)");
const ext = (v: boolean | null) => (v === null ? "?" : v ? "✓" : "—");

function Compare() {
  const [region, setRegion] = useState<Region>("Ingham");
  const [health, setHealth] = useState<Health>("some");
  const [drugs, setDrugs] = useState(50);
  const [types, setTypes] = useState<PlanType[]>(DEFAULT_TYPES);
  const [needs, setNeeds] = useState({ dental: false, vision: false, hearing: false, noReferrals: false });
  const [sort, setSort] = useState<"total" | "premium" | "oop">("total");
  const [picked, setPicked] = useState<string[]>([]);

  const rows = useMemo(() => plansFor(region).filter((p) => types.includes(p.type)
    && (!needs.dental || p.dental !== false) && (!needs.vision || p.vision !== false) && (!needs.hearing || p.hearing !== false) && (!needs.noReferrals || !p.referralsNeeded))
    .map((p) => ({ p, c: estimateAnnual(p, health, drugs) }))
    .sort((a, b) => sort === "total" ? a.c.total - b.c.total : sort === "premium" ? a.p.monthlyPremium - b.p.monthlyPremium : (a.c.worstCase ?? 1e9) - (b.c.worstCase ?? 1e9)),
    [region, types, needs, health, drugs, sort]);

  const toggle = (id: string) => setPicked((x) => x.includes(id) ? x.filter((y) => y !== id) : x.length < 3 ? [...x, id] : x);
  const cmp = rows.filter((r) => picked.includes(r.p.id));
  const sel = "mt-1 block w-full rounded-lg border-2 border-input bg-card p-2";

  return (
    <div className="min-h-screen"><SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit space-y-5 rounded-2xl border bg-card p-5 lg:sticky lg:top-4">
          <p className="text-2xl font-bold">Filters</p>
          <label className="block font-bold">Michigan county<select className={sel} value={region} onChange={(e) => setRegion(e.target.value)}>
            {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label className="block font-bold">Expected health use<select className={sel} value={health} onChange={(e) => setHealth(e.target.value as Health)}>
            <option value="healthy">Low (healthy)</option><option value="some">Medium</option><option value="chronic">High (chronic)</option></select></label>
          <label className="block font-bold">Monthly drug costs: {money(drugs)}<input type="range" min={0} max={2000} step={25} value={drugs} onChange={(e) => setDrugs(+e.target.value)} className="mt-2 w-full accent-primary" /></label>
          <fieldset><legend className="font-bold">Plan types</legend>
            {TYPES.map((t) => <label key={t} className="mt-1 flex items-center gap-2"><input type="checkbox" className="size-5" checked={types.includes(t)} onChange={() => setTypes((x) => x.includes(t) ? x.filter((y) => y !== t) : [...x, t])} />{t}</label>)}</fieldset>
          <fieldset><legend className="font-bold">Must include</legend>
            {(["dental", "vision", "hearing", "noReferrals"] as const).map((k) => <label key={k} className="mt-1 flex items-center gap-2"><input type="checkbox" className="size-5" checked={needs[k]} onChange={() => setNeeds({ ...needs, [k]: !needs[k] })} />{k === "noReferrals" ? "No referrals" : k.charAt(0).toUpperCase() + k.slice(1)}</label>)}</fieldset>
        </aside>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><h1 className="text-4xl font-bold">Compare plans</h1><p className="text-muted-foreground">{rows.length} plans · tick up to 3 to compare side by side</p><p className="text-sm text-muted-foreground">True yearly cost includes the standard Part B premium ({money(PART_B_MONTHLY)}/mo). Source: {DATA_SOURCE}. Extra benefits show what’s included in the premium; confirm details in the plan’s Summary of Benefits.</p></div>
            <label className="font-bold">Sort by <select className="ml-2 rounded-lg border-2 border-input bg-card p-2" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="total">True yearly cost</option><option value="premium">Monthly premium</option><option value="oop">Worst-case limit</option></select></label>
          </div>

          {cmp.length > 1 && (
            <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-primary bg-card p-4">
              <table className="w-full text-left"><tbody>
                <tr><th className="p-2"></th>{cmp.map(({ p }) => <th key={p.id} className="p-2 font-display text-lg">{p.name}</th>)}</tr>
                {([
                  ["True yearly cost", (r) => money(r.c.total)],
                  ["Monthly plan premium", (r) => money(r.p.monthlyPremium)],
                  ["Deductible", (r) => money(r.p.deductible)],
                  ["Medical out-of-pocket limit", (r) => r.p.oopMax === null ? "No limit" : money(r.p.oopMax)],
                  ["Drugs included", (r) => r.p.drugCoverage ? "Yes" : `Separate Part D (${money(r.p.drugPremium)}/mo)`],
                  ["Doctors", (r) => r.p.networkSize],
                  ["Referrals", (r) => r.p.referralsNeeded ? "Required" : "Not needed"],
                  ["Dental", (r) => r.p.extrasDetail?.dental ?? ext(r.p.dental)],
                  ["Vision", (r) => r.p.extrasDetail?.vision ?? ext(r.p.vision)],
                  ["Hearing", (r) => r.p.extrasDetail?.hearing ?? ext(r.p.hearing)],
                  ["Fitness", (r) => r.p.extrasDetail?.fitness ?? ext(r.p.fitness)],
                  ["Health-items allowance", (r) => r.p.extrasDetail?.otc ?? "—"],
                  ["Part B giveback", (r) => r.p.partBGiveback ? `${money(r.p.partBGiveback)}/mo off your Part B premium` : "—"],
                  ["CMS star rating", (r) => r.p.starRating ? `${r.p.starRating} out of 5 stars` : "—"],
                  ["Preventive care at $0", (r) => r.p.preventiveZero === null ? "?" : r.p.preventiveZero ? "Yearly checkups, mammograms & screenings at $0" : "May have copays"],
                  ["CMS plan type", (r) => r.p.cmsType ?? "—"],
                  ["CMS plan ID", (r) => r.p.real ? r.p.id : "—"],
                ] as [string, (r: (typeof cmp)[number]) => string][]).map(([l, f]) => (
                  <tr key={l} className="border-t"><td className="p-2 font-bold">{l}</td>{cmp.map((r) => <td key={r.p.id} className="p-2">{f(r)}</td>)}</tr>))}
              </tbody></table>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {rows.map(({ p, c }) => (
              <div key={p.id} className={`grid gap-4 rounded-2xl border-2 bg-card p-5 md:grid-cols-[auto_1fr_auto] ${picked.includes(p.id) ? "border-primary" : ""}`}>
                <input type="checkbox" aria-label={`Compare ${p.name}`} className="mt-1 size-6" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} />
                <div>
                  <h2 className="text-xl font-bold">{p.name}</h2>
                  <div className="text-muted-foreground">{p.type} · {p.carrier}{p.starRating ? ` · ${p.starRating}★` : ""}</div>
                  <p className="mt-2">{p.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-muted px-3 py-1">Premium {money(p.monthlyPremium)}/mo</span>
                    <span className="rounded-full bg-muted px-3 py-1">Max {p.oopMax === null ? "no limit" : money(p.oopMax)}</span>
                    {(["dental", "vision", "hearing", "fitness", "otc"] as const).map((k) => p.extrasDetail?.[k] && p.extrasDetail[k] !== "Not covered" && (
                      <span key={k} className="rounded-full bg-secondary px-3 py-1" title={p.extrasDetail[k]}>
                        {k === "otc" ? "Allowance" : k.charAt(0).toUpperCase() + k.slice(1)}{`: ${p.extrasDetail[k]}`}
                      </span>))}
                    {p.partBGiveback ? <span className="rounded-full bg-secondary px-3 py-1">Part B giveback: {money(p.partBGiveback)}/mo</span> : null}
                    {p.preventiveZero ? <span className="rounded-full bg-secondary px-3 py-1">$0 checkups & screenings</span> : null}
                  </div>
                </div>
                <div className="text-right"><div className="text-sm text-muted-foreground">True yearly cost</div><div className="font-display text-3xl font-bold text-primary">{money(c.total)}</div>
                  <div className="text-sm text-muted-foreground">Worst case {c.worstCase ? money(c.worstCase) : "unlimited"}</div></div>
              </div>
            ))}
            {rows.length === 0 && <p className="rounded-xl bg-muted p-6 text-lg">No plans match these filters. Try unchecking a requirement.</p>}
          </div>
        </section>
      </main>
      <Disclaimer />
    </div>
  );
}
