import { createFileRoute, Link } from "@tanstack/react-router";
import { Pill } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CARRIERS, STRUCTURES, MUSTS, TYPES, DEFAULT_TYPES, applyFilters, type UrlCriteria, type Must, type Structure } from "@/lib/planFilters";
import { usePrefs, setPrefs, resetPrefs, DRUG_BANDS, type DrugBand, type Source } from "@/lib/comparePrefs";
import type { SearchCriteria } from "@/lib/planSearch.functions";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { DataAsOf } from "@/components/DataAsOf";
import { PlanSearch } from "@/components/PlanSearch";
import { HelpPopover } from "@/components/HelpPopover";
import { BenefitSearchPanel } from "@/components/BenefitSearch";
import type { ServiceChip } from "@/lib/benefitSearch.functions";
import { COUNTIES, DATA_SOURCE, PART_B_MONTHLY, PART_D_OOP_CAP, FIGURES, figureNote, plansFor, scorePlan, rankPlans, explainOrder, sortForPriority, SORT_LABEL, money, type Health, type PlanType, type Share, type SortKey } from "@/lib/plans";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Medicare plans side by side — PlainPlanGuide" },
      { name: "description", content: "Filter and compare Medigap and Medicare Advantage plans by region, estimated yearly cost, network, and extras." },
      { property: "og:title", content: "Compare Medicare plans side by side — PlainPlanGuide" },
      { property: "og:description", content: "An interactive Medicare plan comparison dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Partial<Record<"county" | "types" | "structure" | "carriers" | "q" | "must" | "max" | "sort", string>> => {
    const out: Record<string, string> = {};
    for (const k of ["county", "types", "structure", "carriers", "q", "must", "max", "sort"]) {
      const v = s[k];
      if (typeof v === "string" && v) out[k] = v.slice(0, 300);
      else if (typeof v === "number") out[k] = String(v);
    }
    return out;
  },
  component: Compare,
});

const list = (v: string | undefined) => (v ? v.split("|").filter(Boolean) : []);
const MUST_LABEL: Record<Must, string> = { dental: "Dental", vision: "Vision", hearing: "Hearing", noReferrals: "No referrals" };
const SRC_LABEL: Record<Source, string> = { questionnaire: "from your questionnaire", search: "from your search", you: "you chose" };
const NA = "Not available — check the plan's Summary of Benefits";
const share = (v: Share | undefined) => v === undefined ? NA : typeof v === "number" ? money(v) : `${v.pct}% of the cost`;
const ext = (v: boolean | null) => (v === null ? NA : v ? "Included" : "Not covered");

function Compare() {
  const sp = Route.useSearch();
  const navigate = useNavigate({ from: "/compare" });
  const prefs = usePrefs();
  const c: UrlCriteria = {
    county: sp.county && COUNTIES.includes(sp.county) ? sp.county : COUNTIES[0] ?? "",
    types: sp.types ? list(sp.types).filter((t): t is PlanType => (TYPES as string[]).includes(t)) : DEFAULT_TYPES,
    structures: list(sp.structure).filter((x): x is Structure => (STRUCTURES as readonly string[]).includes(x)),
    carriers: list(sp.carriers).filter((x) => CARRIERS.includes(x)),
    q: (sp.q ?? "").slice(0, 80),
    must: list(sp.must).filter((m): m is Must => (MUSTS as string[]).includes(m)),
    maxPremium: sp.max !== undefined && !Number.isNaN(Number(sp.max)) ? Math.max(0, Number(sp.max)) : null,
    sort: sp.sort === "total" || sp.sort === "premium" || sp.sort === "oop" ? sp.sort : "",
  };
  const sortKey: SortKey = c.sort || sortForPriority(prefs.priority);
  const update = (patch: Partial<UrlCriteria>) => {
    const n = { ...c, ...patch };
    const def = n.types.length === DEFAULT_TYPES.length && DEFAULT_TYPES.every((t) => n.types.includes(t));
    navigate({ to: ".", replace: true, resetScroll: false, search: {
      county: n.county, ...(def ? {} : { types: n.types.join("|") }), ...(n.structures.length ? { structure: n.structures.join("|") } : {}),
      ...(n.carriers.length ? { carriers: n.carriers.join("|") } : {}), ...(n.q ? { q: n.q } : {}),
      ...(n.must.length ? { must: n.must.join("|") } : {}), ...(n.maxPremium !== null ? { max: String(n.maxPremium) } : {}), ...(n.sort ? { sort: n.sort } : {}),
    } });
  };
  const answers = {
    zip: "", health: prefs.health, doctorsFlex: prefs.keepAnyDoctor ? "any" : "network-ok", hospital: "none",
    drugsMonthly: prefs.drugs, priority: prefs.priority, extras: prefs.wants, travels: prefs.travels,
  } as const;
  const [picked, setPicked] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [openSearch, setOpenSearch] = useState<string | null>(null);
  const [chips, setChips] = useState<ServiceChip[]>([]);
  const [qDraft, setQDraft] = useState(c.q);

  const area = useMemo(() => plansFor(c.county), [c.county]);
  const ranked = useMemo(() => rankPlans(applyFilters(area, c).map((p) => scorePlan(p, { ...answers, extras: { ...answers.extras } })), sortKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area, JSON.stringify(c), JSON.stringify(prefs), sortKey]);
  const rows = ranked.map((r) => ({ p: r.plan, c: r.cost, matched: r.matched }));

  // Which single filter is blocking results, so we can say so instead of silently loosening anything.
  const blockers = rows.length > 0 ? [] : ([
    c.carriers.length && { label: `Insurer: ${c.carriers.join(", ")}`, fix: { carriers: [] } },
    c.structures.length && { label: `Plan type ${c.structures.join(", ")}`, fix: { structures: [] } },
    c.q && { label: `Keyword "${c.q}"`, fix: { q: "" } },
    c.maxPremium !== null && { label: `Premium up to $${c.maxPremium}`, fix: { maxPremium: null } },
    c.must.length && { label: `Must include ${c.must.map((m) => MUST_LABEL[m]).join(", ")}`, fix: { must: [] } },
    { label: "Plan type checkboxes", fix: { types: DEFAULT_TYPES } },
  ].filter(Boolean) as { label: string; fix: Partial<UrlCriteria> }[]).map((b) => ({ ...b, n: applyFilters(area, { ...c, ...b.fix }).length })).filter((b) => b.n > 0);

  const applySearch = (s: SearchCriteria) => {
    update({ county: s.county || c.county, carriers: s.carriers, structures: s.structure ? [s.structure] : [], types: s.types, maxPremium: s.maxPremium, q: "", sort: "" });
    setQDraft("");
    setPrefs({ keepAnyDoctor: s.prefs.keepAnyDoctor || prefs.keepAnyDoctor, travels: s.prefs.travels || prefs.travels, priority: s.prefs.priority === "balanced" ? prefs.priority : s.prefs.priority,
      wants: { dental: s.prefs.wants.dental || prefs.wants.dental, vision: s.prefs.wants.vision || prefs.wants.vision, hearing: s.prefs.wants.hearing || prefs.wants.hearing } }, "search");
    setPicked([]);
    setTimeout(() => document.getElementById("compare-plans")?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const src = (k: string) => (prefs.sources[k] ? ` (${SRC_LABEL[prefs.sources[k]!]})` : "");
  const prefChips: { label: string; clear: () => void }[] = [
    ...(["dental", "vision", "hearing"] as const).filter((w) => prefs.wants[w]).map((w) => ({ label: `Prefers ${w}${src(w)}`, clear: () => setPrefs({ wants: { ...prefs.wants, [w]: false } }, "you") })),
    ...(prefs.keepAnyDoctor ? [{ label: `Doctors outside a network${src("keepAnyDoctor")}`, clear: () => setPrefs({ keepAnyDoctor: false }, "you") }] : []),
    ...(prefs.travels ? [{ label: `Travels${src("travels")}`, clear: () => setPrefs({ travels: false }, "you") }] : []),
    ...(prefs.priority !== "balanced" ? [{ label: `${prefs.priority === "peace" ? "Predictable costs" : "Low monthly cost"} first${src("priority")}`, clear: () => setPrefs({ priority: "balanced" }, "you") }] : []),
  ];
  const filterChips: { label: string; clear: () => void }[] = [
    ...c.carriers.map((x) => ({ label: `Insurer: ${x}`, clear: () => update({ carriers: c.carriers.filter((y) => y !== x) }) })),
    ...c.structures.map((x) => ({ label: `Plan type: ${x}`, clear: () => update({ structures: c.structures.filter((y) => y !== x) }) })),
    ...(c.q ? [{ label: `Keyword: "${c.q}"`, clear: () => { setQDraft(""); update({ q: "" }); } }] : []),
    ...(c.maxPremium !== null ? [{ label: `Premium up to $${c.maxPremium}/mo`, clear: () => update({ maxPremium: null }) }] : []),
    ...c.must.map((m) => ({ label: `Must include: ${MUST_LABEL[m]}`, clear: () => update({ must: c.must.filter((y) => y !== m) }) })),
  ];

  const toggle = (id: string) => setPicked((x) => x.includes(id) ? x.filter((y) => y !== id) : x.length < 3 ? [...x, id] : x);
  const cmp = rows.filter((r) => picked.includes(r.p.id));
  const sel = "mt-1 block w-full rounded-lg border-2 border-input bg-card p-2";

  return (
    <div className="min-h-screen"><SiteHeader />
      <PlanSearch onApply={applySearch} />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-10">
        <button type="button" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters} className="flex min-h-14 items-center justify-between rounded-2xl border-2 bg-card px-5 text-lg font-bold lg:hidden">
          <span>Filters · {c.county} County</span><span aria-hidden>{showFilters ? "▲ Hide" : "▼ Show"}</span>
        </button>
        <aside className={`h-fit space-y-5 rounded-2xl border bg-card p-5 lg:block ${showFilters ? "" : "hidden"}`}>
          <p className="hidden text-2xl font-bold lg:block">Filters</p>
          <label className="block font-bold">Michigan county<select className={sel} value={c.county} onChange={(e) => update({ county: e.target.value })}>
            {COUNTIES.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
          <form onSubmit={(e) => { e.preventDefault(); update({ q: qDraft.trim() }); }}>
            <label className="block font-bold" htmlFor="kw">Search by insurer or plan name</label>
            <div className="mt-1 flex gap-2"><input id="kw" type="search" maxLength={80} value={qDraft} onChange={(e) => setQDraft(e.target.value)} placeholder="e.g. Humana, BCBS, dental" className="min-h-12 w-full min-w-0 rounded-lg border-2 border-input bg-card p-2" />
              <button type="submit" className="min-h-12 rounded-lg bg-primary px-3 font-bold text-primary-foreground">Go</button></div>
          </form>
          <fieldset><legend className="font-bold">Insurer</legend>
            <div className="mt-1 max-h-56 overflow-y-auto rounded-lg border p-2">
              {CARRIERS.filter((x) => area.some((p) => p.carrier === x)).map((x) => <label key={x} className="flex min-h-10 items-center gap-2"><input type="checkbox" className="size-5 shrink-0" checked={c.carriers.includes(x)} onChange={() => update({ carriers: c.carriers.includes(x) ? c.carriers.filter((y) => y !== x) : [...c.carriers, x] })} />{x}</label>)}
            </div></fieldset>
          <fieldset><legend className="font-bold">Advantage plan structure</legend>
            {STRUCTURES.map((x) => <label key={x} className="mt-1 flex min-h-10 items-center gap-2"><input type="checkbox" className="size-5 shrink-0" checked={c.structures.includes(x)} onChange={() => update({ structures: c.structures.includes(x) ? c.structures.filter((y) => y !== x) : [...c.structures, x] })} />{x === "PPO" ? "PPO (incl. Regional PPO)" : x}</label>)}</fieldset>
          <label className="block font-bold">Highest monthly premium<select className={sel} value={c.maxPremium ?? ""} onChange={(e) => update({ maxPremium: e.target.value === "" ? null : Number(e.target.value) })}>
            <option value="">Any</option>{[0, 25, 50, 100, 200].map((v) => <option key={v} value={v}>{v === 0 ? "$0 only" : `Up to $${v}`}</option>)}</select></label>
          <div className="space-y-3 rounded-xl bg-secondary/50 p-3">
            <p className="font-bold">For your cost estimate <span className="block text-sm font-normal text-muted-foreground">Kept only in this browser tab, never in the web address.</span></p>
            <label className="block font-bold">Expected health use<select className={sel} value={prefs.health} onChange={(e) => setPrefs({ health: e.target.value as Health }, "you")}>
              <option value="healthy">Low (healthy)</option><option value="some">Medium</option><option value="chronic">High (chronic)</option></select></label>
            <label className="block font-bold">Monthly drug costs<select className={sel} value={prefs.drugs} onChange={(e) => setPrefs({ drugs: Number(e.target.value) as DrugBand }, "you")}>
              {DRUG_BANDS.map((d) => <option key={d.v} value={d.v}>{d.v === 1500 ? "Over $500 (brand/specialty)" : d.label}</option>)}</select></label>
          </div>
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
            {TYPES.map((t) => <label key={t} className="mt-1 flex items-center gap-2"><input type="checkbox" className="size-5" checked={c.types.includes(t)} onChange={() => update({ types: c.types.includes(t) ? c.types.filter((y) => y !== t) : [...c.types, t] })} />{t}</label>)}</fieldset>
          <fieldset><legend className="font-bold">Must include</legend>
            {MUSTS.map((k) => <label key={k} className="mt-1 flex items-center gap-2"><input type="checkbox" className="size-5" checked={c.must.includes(k)} onChange={() => update({ must: c.must.includes(k) ? c.must.filter((y) => y !== k) : [...c.must, k] })} />{MUST_LABEL[k]}</label>)}
            <p className="mt-1 text-sm text-muted-foreground">Hides plans CMS lists as not covering it. Plans with unknown coverage stay listed.</p></fieldset>
          {(filterChips.length > 0 || prefChips.length > 0) && <button type="button" onClick={() => { resetPrefs(); setQDraft(""); update({ carriers: [], structures: [], q: "", must: [], maxPremium: null, types: DEFAULT_TYPES, sort: "" }); }} className="min-h-12 font-bold text-primary underline">Clear all filters and preferences</button>}
        </aside>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div id="compare-plans"><div className="flex items-center gap-2"><h2 className="text-3xl font-bold sm:text-4xl">Compare plans</h2><HelpPopover label="What do the cost terms mean?">
              <h2 className="text-lg font-bold">Understanding plan costs</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div><dt className="font-bold">Estimated yearly cost</dt><dd>Our estimate of the standard Part B premium, plan premiums, medical spending, prescription spending, and a separate Part D premium when needed.</dd></div>
                <div><dt className="font-bold">Monthly premium</dt><dd>What the plan charges each month. The standard Part B premium is usually separate, even when a plan says its premium is $0.</dd></div>
                <div><dt className="font-bold">High-cost scenario</dt><dd>An illustrative bad year, not a guaranteed maximum: annual premiums, the medical out-of-pocket limit, and the Part D drug cap. Original Medicare alone has no medical limit. Drugs outside a plan’s formulary can cost more.</dd></div>
              </dl>
            </HelpPopover></div>
              <p className="mt-1 text-muted-foreground">{rows.length} plans in {c.county} County · select up to 3 to compare side by side</p>
              <div className="flex items-center gap-1"><DataAsOf compact /><HelpPopover label="About this independent guide and its estimates">
                <h2 className="text-lg font-bold">About these estimates</h2>
                <p className="mt-3">Independent site — not affiliated with Medicare or CMS. Official info: Medicare.gov or 1-800-MEDICARE.</p>
                <p className="mt-3">Estimated yearly cost includes the standard Part B premium ({money(PART_B_MONTHLY)}/mo, {figureNote(FIGURES.partBMonthly)}). Source: {DATA_SOURCE}.</p>
                <p className="mt-3">Extra benefits show what’s included in the premium; confirm details in the plan’s Summary of Benefits. All costs are estimates, not quotes.</p>
              </HelpPopover></div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border-2 border-primary bg-card p-4">
                <span className="flex items-center gap-2"><Pill aria-hidden className="size-6 shrink-0 text-accent" /><p className="font-semibold">Each plan has its own drug list (formulary).</p></span>
                <Link to="/formulary-check" className="inline-flex min-h-12 items-center font-bold text-primary underline">Check my drugs →</Link>
                <HelpPopover label="Why check my drugs before enrolling?">
                  <h2 className="text-lg font-bold">Check your medications</h2>
                  <p className="mt-3">Before you enroll, check the plan’s formulary to make sure your medications are covered and see what you’d pay.</p>
                  <p className="mt-3">Our worst-case estimate includes the Part D drug out-of-pocket cap ({money(PART_D_OOP_CAP)}, {figureNote(FIGURES.partDOopCap)}), but only for drugs on the plan’s formulary. An expensive drug that isn’t covered could make your true cost higher.</p>
                  <p className="mt-3">An Advantage plan’s medical out-of-pocket limit does not include drugs.</p>
                </HelpPopover>
              </div></div>
            <div className="flex items-center gap-1 font-bold">Sort by <select className="ml-2 rounded-lg border-2 border-input bg-card p-2" value={sortKey} onChange={(e) => update({ sort: e.target.value as SortKey })}>
              <option value="total">Estimated yearly cost</option><option value="premium">Monthly premium</option><option value="oop">High-cost scenario</option></select>
              <HelpPopover label="What do these sort options mean?">
                <dl className="space-y-3 text-sm">
                  <div><dt className="font-bold">Estimated yearly cost</dt><dd>Our estimate of everything you'd pay in a typical year: the standard Part B premium, plan premiums, medical spending, prescription spending, and a separate Part D premium when needed.</dd></div>
                  <div><dt className="font-bold">Monthly premium</dt><dd>What the plan charges each month. The standard Part B premium is usually separate, even when a plan says its premium is $0.</dd></div>
                  <div><dt className="font-bold">High-cost scenario</dt><dd>An illustrative bad year, not a guaranteed maximum: annual premiums plus the plan's medical out-of-pocket limit and the Part D drug cap. Original Medicare alone has no medical limit, and drugs outside a plan's formulary can cost more.</dd></div>
                </dl>
              </HelpPopover></div>
          </div>

          {(filterChips.length > 0 || prefChips.length > 0) && (
            <div className="mt-4 rounded-2xl border bg-card p-4" aria-label="Your active filters and preferences">
              {filterChips.length > 0 && <><p className="font-bold">Showing only</p><ul className="mt-1 flex flex-wrap gap-2">{filterChips.map((x) => <li key={x.label}><button type="button" onClick={x.clear} aria-label={`Remove ${x.label}`} className="min-h-12 rounded-full bg-primary/10 px-4 text-left">{x.label} <span aria-hidden>✕</span></button></li>)}</ul></>}
              {prefChips.length > 0 && <><p className="mt-3 font-bold">Listed first if they match <span className="font-normal text-muted-foreground">(no plans are hidden)</span></p><ul className="mt-1 flex flex-wrap gap-2">{prefChips.map((x) => <li key={x.label}><button type="button" onClick={x.clear} aria-label={`Remove ${x.label}`} className="min-h-12 rounded-full bg-secondary px-4 text-left">{x.label} <span aria-hidden>✕</span></button></li>)}</ul></>}
            </div>
          )}
          <details className="mt-3"><summary className="min-h-12 cursor-pointer py-3 font-bold text-primary">Why are plans in this order?</summary>
            <ul className="list-disc space-y-1 pl-6">{explainOrder({ doctorsFlex: answers.doctorsFlex, travels: prefs.travels, extras: prefs.wants }, sortKey).map((l) => <li key={l}>{l}</li>)}</ul>
            <p className="mt-2 text-sm text-muted-foreground">Plans are never ordered by who offers them. Plans are shown for your whole county; CMS doesn't publish ZIP-level service areas, so confirm a plan serves your address.</p></details>

          {cmp.length > 1 && (
            <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-primary bg-card p-2 sm:p-4"><p className="mb-2 text-sm text-muted-foreground sm:hidden">Swipe sideways to see each plan →</p>
              {Math.max(...cmp.map((r) => r.c.total)) - Math.min(...cmp.map((r) => r.c.total)) <= 250 && <p className="mb-3 rounded-xl bg-primary/5 p-3 text-sm">These plans cost about the same in a typical year. Compare their worst-case limit, copays and extras to choose between them.</p>}
              <table className="w-full text-left"><tbody>
                <tr><th className="p-2"></th>{cmp.map(({ p }) => <th key={p.id} className="p-2 font-display text-lg">{p.name}</th>)}</tr>
                {([
                  ["Estimated yearly cost", (r) => money(r.c.total)],
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
                  <div className="mt-1 md:hidden"><span className="font-display text-2xl font-bold text-primary">{money(c.total)}</span> <span className="text-sm text-muted-foreground">estimated yearly cost · worst case {c.worstCase ? money(c.worstCase) : "unlimited"}</span></div>
                  <div className="text-muted-foreground">{p.cmsType && p.real ? p.cmsType : p.type} · {p.carrier}{p.starRating ? ` · ${p.starRating}★${p.starYear === 2026 ? " (2026)" : ""}` : ""}</div>
                  <p className="mt-2">{p.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1">Premium {money(p.monthlyPremium)}/mo</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">Medical max {p.oopMax === null ? "no limit" : money(p.oopMax)}
                      <HelpPopover compact label="Medical max vs. worst case">
                        <h2 className="text-lg font-bold">Medical max vs. worst case</h2>
                        <p className="mt-3"><strong>Medical max</strong> is the most you'd pay in a year for covered doctor and hospital care. It does not include drugs or premiums.</p>
                        <p className="mt-3"><strong>Worst case</strong> adds the medical max, the Part D drug cap ({money(PART_D_OOP_CAP)}, {figureNote(FIGURES.partDOopCap)}), and a year of premiums including Part B.</p>
                      </HelpPopover></span>
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
                <div className="hidden text-right md:block"><div className="text-sm text-muted-foreground">Estimated yearly cost</div><div className="font-display text-3xl font-bold text-primary">{money(c.total)}</div>
                  <div className="text-sm text-muted-foreground">Worst case {c.worstCase ? money(c.worstCase) : "unlimited"}</div></div>
              </div>
            ))}
            {rows.length === 0 && <div role="status" className="rounded-xl bg-muted p-6 text-lg"><p>No plans in {c.county} County match all of these filters.</p>
              {blockers.length > 0 && <ul className="mt-3 space-y-2">{blockers.map((b) => <li key={b.label}><button type="button" onClick={() => update(b.fix)} className="min-h-12 text-left font-bold text-primary underline">Remove "{b.label}" to see {b.n} plan{b.n === 1 ? "" : "s"}</button></li>)}</ul>}</div>}
          </div>
        </section>
      </main>
      <Disclaimer />
    </div>
  );
}
