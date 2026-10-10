import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { DataAsOf } from "@/components/DataAsOf";
import { PlanSearch } from "@/components/PlanSearch";
import { HelpPopover } from "@/components/HelpPopover";
import { BenefitSearchPanel } from "@/components/BenefitSearch";
import type { ServiceChip } from "@/lib/benefitSearch.functions";
import { COUNTIES, DATA_SOURCE, PART_B_MONTHLY, PART_D_OOP_CAP, plansFor, estimateAnnual, money, type Health, type PlanType, type Region, type Share } from "@/lib/plans";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Medicare plans side by side — PlainPlanGuide" },
      { name: "description", content: "Filter and compare Medigap and Medicare Advantage plans by region, true yearly cost, network, and extras." },
      { property: "og:title", content: "Compare Medicare plans side by side — PlainPlanGuide" },
      { property: "og:description", content: "An interactive Medicare plan comparison dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { county?: string } =>
    typeof s["county"] === "string" && s["county"] ? { county: s["county"] } : {},
  component: Compare,
});

const TYPES: PlanType[] = ["Original + Medigap", "Advantage HMO", "Advantage PPO", "Other Advantage", "Original only", "Special Needs (SNP)"];
const DEFAULT_TYPES = TYPES.filter((t) => t !== "Special Needs (SNP)");
const NA = "Not available — check the plan's Summary of Benefits";
const share = (v: Share | undefined) => v === undefined ? NA : typeof v === "number" ? money(v) : `${v.pct}% of the cost`;
const ext = (v: boolean | null) => (v === null ? NA : v ? "Included" : "Not covered");

function Compare() {
  const { county } = Route.useSearch();
  const [region, setRegion] = useState<Region>(() => (county && COUNTIES.includes(county) ? county : COUNTIES[0] ?? ""));
  const [health, setHealth] = useState<Health>("some");
  const [drugs, setDrugs] = useState(50);
  const [types, setTypes] = useState<PlanType[]>(DEFAULT_TYPES);
  const [needs, setNeeds] = useState({ dental: false, vision: false, hearing: false, noReferrals: false });
  const [sort, setSort] = useState<"total" | "premium" | "oop">("total");
  const [picked, setPicked] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [openSearch, setOpenSearch] = useState<string | null>(null);
  const [chips, setChips] = useState<ServiceChip[]>([]);

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
      <PlanSearch onResults={(c, ids) => { if (c) setRegion(c); setTypes(TYPES); setPicked(ids); setTimeout(() => document.getElementById("compare-plans")?.scrollIntoView({ behavior: "smooth" }), 50); }} />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-10">
        <button type="button" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters} className="flex min-h-14 items-center justify-between rounded-2xl border-2 bg-card px-5 text-lg font-bold lg:hidden">
          <span>Filters · {region} County</span><span aria-hidden>{showFilters ? "▲ Hide" : "▼ Show"}</span>
        </button>
        <aside className={`h-fit space-y-5 rounded-2xl border bg-card p-5 lg:sticky lg:top-4 lg:block ${showFilters ? "" : "hidden"}`}>
          <p className="hidden text-2xl font-bold lg:block">Filters</p>
          <label className="block font-bold">Michigan county<select className={sel} value={region} onChange={(e) => setRegion(e.target.value)}>
            {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label className="block font-bold">Expected health use<select className={sel} value={health} onChange={(e) => setHealth(e.target.value as Health)}>
            <option value="healthy">Low (healthy)</option><option value="some">Medium</option><option value="chronic">High (chronic)</option></select></label>
          <label className="block font-bold">Monthly drug costs: {money(drugs)}<input type="range" min={0} max={2000} step={25} value={drugs} onChange={(e) => setDrugs(+e.target.value)} className="mt-2 w-full accent-primary" /></label>
          <fieldset><legend className="flex items-center gap-1 font-bold">Plan types <HelpPopover label="What do these plan types mean?">
            <h2 className="text-lg font-bold">Medicare plan types</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div><dt className="font-bold">Original Medicare + Medigap</dt><dd>Original Medicare plus private supplemental coverage for many costs Parts A and B leave behind. A separate Part D plan covers prescriptions.</dd></div>
              <div><dt className="font-bold">Medicare Advantage HMO</dt><dd>A private plan replacing Parts A and B. You usually use its network and may need referrals.</dd></div>
              <div><dt className="font-bold">Medicare Advantage PPO</dt><dd>A private plan replacing Parts A and B. It has a network, but you can usually pay more to go outside it.</dd></div>
              <div><dt className="font-bold">Other Medicare Advantage</dt><dd>Private Medicare plans with a different network or payment structure, such as PFFS plans.</dd></div>
              <div><dt className="font-bold">Original Medicare only</dt><dd>Federal Parts A and B without Medigap. It has no yearly medical spending limit. Prescriptions need a separate Part D plan.</dd></div>
              <div><dt className="font-bold">Special Needs Plan (SNP)</dt><dd>A Medicare Advantage plan for people who meet specific eligibility rules, such as having Medicaid, certain chronic conditions, or institutional care needs.</dd></div>
            </dl>
          </HelpPopover></legend>
            {TYPES.map((t) => <label key={t} className="mt-1 flex items-center gap-2"><input type="checkbox" className="size-5" checked={types.includes(t)} onChange={() => setTypes((x) => x.includes(t) ? x.filter((y) => y !== t) : [...x, t])} />{t}</label>)}</fieldset>
          <fieldset><legend className="font-bold">Must include</legend>
            {(["dental", "vision", "hearing", "noReferrals"] as const).map((k) => <label key={k} className="mt-1 flex items-center gap-2"><input type="checkbox" className="size-5" checked={needs[k]} onChange={() => setNeeds({ ...needs, [k]: !needs[k] })} />{k === "noReferrals" ? "No referrals" : k.charAt(0).toUpperCase() + k.slice(1)}</label>)}</fieldset>
        </aside>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div id="compare-plans"><div className="flex items-center gap-2"><h2 className="text-3xl font-bold sm:text-4xl">Compare plans</h2><HelpPopover label="What do the cost terms mean?">
              <h2 className="text-lg font-bold">Understanding plan costs</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div><dt className="font-bold">True yearly cost</dt><dd>Our estimate of the standard Part B premium, plan premiums, medical spending, prescription spending, and a separate Part D premium when needed.</dd></div>
                <div><dt className="font-bold">Monthly premium</dt><dd>What the plan charges each month. The standard Part B premium is usually separate, even when a plan says its premium is $0.</dd></div>
                <div><dt className="font-bold">Worst-case limit</dt><dd>Our estimated bad-year total: annual premiums, the medical out-of-pocket limit, and the Part D drug cap. Original Medicare alone has no medical limit. Drugs outside a plan’s formulary can cost more.</dd></div>
              </dl>
            </HelpPopover></div><p className="mt-1 text-sm text-muted-foreground">Independent site — not affiliated with Medicare or CMS. Official info: Medicare.gov or 1-800-MEDICARE.</p><DataAsOf /><p className="text-muted-foreground">{rows.length} plans · select up to 3 to compare side by side</p><p className="text-sm text-muted-foreground">True yearly cost includes the standard Part B premium ({money(PART_B_MONTHLY)}/mo, 2026 figure). Source: {DATA_SOURCE}. Extra benefits show what’s included in the premium; confirm details in the plan’s Summary of Benefits.</p>
              <div className="mt-3 rounded-xl border-2 border-primary bg-primary/5 p-4 text-sm">
                <p>💊 Every plan that covers prescriptions has its own <strong>formulary</strong> — the list of drugs it covers. Before you enroll, look up your medications in the plan’s formulary to make sure they’re covered and see what you’d pay. <Link to="/formulary-check" className="font-bold text-primary underline">Check my drugs against a formulary →</Link></p>
                <p className="mt-2">Our worst-case figure includes the Part D drug out-of-pocket cap ({money(PART_D_OOP_CAP)}, 2026 figure; 2027 not yet confirmed) — but only if your drugs are on the plan’s formulary. If you take an expensive drug that isn’t covered, your true cost could be higher.</p>
              </div></div>
            <div className="flex items-center gap-1 font-bold">Sort by <select className="ml-2 rounded-lg border-2 border-input bg-card p-2" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="total">True yearly cost</option><option value="premium">Monthly premium</option><option value="oop">Worst-case limit</option></select>
              <HelpPopover label="What do these sort options mean?">
                <dl className="space-y-3 text-sm">
                  <div><dt className="font-bold">True yearly cost</dt><dd>Our estimate of everything you'd pay in a typical year: the standard Part B premium, plan premiums, medical spending, prescription spending, and a separate Part D premium when needed.</dd></div>
                  <div><dt className="font-bold">Monthly premium</dt><dd>What the plan charges each month. The standard Part B premium is usually separate, even when a plan says its premium is $0.</dd></div>
                  <div><dt className="font-bold">Worst-case limit</dt><dd>Our estimated bad-year total: annual premiums plus the plan's medical out-of-pocket limit and the Part D drug cap. Original Medicare alone has no medical limit, and drugs outside a plan's formulary can cost more.</dd></div>
                </dl>
              </HelpPopover></div>
          </div>

          {cmp.length > 1 && (
            <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-primary bg-card p-2 sm:p-4"><p className="mb-2 text-sm text-muted-foreground sm:hidden">Swipe sideways to see each plan →</p>
              {Math.max(...cmp.map((r) => r.c.total)) - Math.min(...cmp.map((r) => r.c.total)) <= 250 && <p className="mb-3 rounded-xl bg-primary/5 p-3 text-sm">These plans cost about the same in a typical year. Compare their worst-case limit, copays and extras to choose between them.</p>}
              <table className="w-full text-left"><tbody>
                <tr><th className="p-2"></th>{cmp.map(({ p }) => <th key={p.id} className="p-2 font-display text-lg">{p.name}</th>)}</tr>
                {([
                  ["True yearly cost", (r) => money(r.c.total)],
                  ["Monthly plan premium", (r) => money(r.p.monthlyPremium)],
                  ["Medical deductible", (r) => money(r.p.deductible)],
                  ["Doctor visit", (r) => share(r.p.copays?.pcp)],
                  ["Specialist visit", (r) => share(r.p.copays?.spec)],
                  ["Emergency room", (r) => share(r.p.copays?.er)],
                  ["5-day hospital stay", (r) => share(r.p.copays?.stay)],
                  ["Drug deductible", (r) => r.p.rxDeductible === undefined ? NA : money(r.p.rxDeductible)],
                  ["Medical out-of-pocket limit (does not include drugs)", (r) => r.p.oopMax === null ? "No limit" : money(r.p.oopMax)],
                  ["Drugs included", (r) => r.p.drugCoverage ? "Yes" : `Separate Part D (${money(r.p.drugPremium)}/mo)`],
                  ["Doctors", (r) => r.p.networkSize],
                  ["Referrals", (r) => r.p.referralsNeeded ? "Required" : "Not needed"],
                  ["Dental", (r) => r.p.extrasDetail?.dental ?? ext(r.p.dental)],
                  ["Vision", (r) => r.p.extrasDetail?.vision ?? ext(r.p.vision)],
                  ["Hearing", (r) => r.p.extrasDetail?.hearing ?? ext(r.p.hearing)],
                  ["Fitness", (r) => r.p.extrasDetail?.fitness ?? ext(r.p.fitness)],
                  ["Health-items allowance", (r) => r.p.extrasDetail?.otc ?? (r.p.real ? NA : "Not included")],
                  ["Part B giveback", (r) => r.p.partBGiveback ? `${money(r.p.partBGiveback)}/mo off your Part B premium` : r.p.real ? "None listed" : "Not included"],
                  ["CMS star rating", (r) => r.p.starRating ? `${r.p.starRating} out of 5 stars${r.p.starYear === 2026 ? " (2026 rating — 2027 not yet released)" : ""}` : r.p.real ? "New — no rating yet" : "Not rated (CMS rates only Advantage and Part D plans)"],
                  ["Preventive care at $0", (r) => r.p.preventiveZero === null ? NA : r.p.preventiveZero ? "Yearly checkups, mammograms & screenings at $0" : "May have copays"],
                  ["CMS plan type", (r) => r.p.cmsType ?? (r.p.real ? NA : "Original Medicare / Medigap")],
                  ["CMS plan ID", (r) => r.p.real ? r.p.id : "None (not a CMS plan)"],
                ] as [string, (r: (typeof cmp)[number]) => string][]).map(([l, f]) => (
                  <tr key={l} className="border-t"><td className="sticky left-0 min-w-32 bg-card p-2 font-bold">{l}</td>{cmp.map((r) => <td key={r.p.id} className="min-w-40 p-2">{f(r)}</td>)}</tr>))}
              </tbody></table>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {rows.map(({ p, c }) => (
              <div key={p.id} className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 rounded-2xl border-2 bg-card p-4 sm:p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-4 ${picked.includes(p.id) ? "border-primary" : ""}`}>
                <label className="-m-2 flex size-10 items-start justify-center p-2"><input type="checkbox" aria-label={`Compare ${p.name}`} className="size-6" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} /></label>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold">{p.name}</h2>
                  <div className="mt-1 md:hidden"><span className="font-display text-2xl font-bold text-primary">{money(c.total)}</span> <span className="text-sm text-muted-foreground">true yearly cost · worst case {c.worstCase ? money(c.worstCase) : "unlimited"}</span></div>
                  <div className="text-muted-foreground">{p.type} · {p.carrier}{p.starRating ? ` · ${p.starRating}★${p.starYear === 2026 ? " (2026)" : ""}` : ""}</div>
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
                  <button type="button" onClick={() => setOpenSearch(openSearch === p.id ? null : p.id)} aria-expanded={openSearch === p.id} className="mt-3 min-h-12 font-bold text-primary underline">
                    {openSearch === p.id ? "Hide benefit search" : "🔍 Search this plan's benefits"}</button>
                  {openSearch === p.id && <BenefitSearchPanel plan={p} areaPlans={rows.map((r) => r.p)} chips={chips} setChips={setChips} />}
                </div>
                <div className="hidden text-right md:block"><div className="text-sm text-muted-foreground">True yearly cost</div><div className="font-display text-3xl font-bold text-primary">{money(c.total)}</div>
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
