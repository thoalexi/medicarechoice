import { createFileRoute, Link } from "@tanstack/react-router";
import { Pill } from "lucide-react";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CARRIERS, BENEFITS, BENEFIT_LABEL, COVS, COV_LABEL, NETS, NET_LABEL, EXACT_FOR, EMPTY_CRITERIA,
  applyFilters, carrierSuggestions, fromLegacy, netActive, netMatches,
  type UrlCriteria, type Benefit, type Cov, type Net, type NetMode,
} from "@/lib/planFilters";
import { usePrefs, setPrefs, resetPrefs, markSources, DRUG_BANDS, PRIORITY_LABEL, type DrugBand, type Priority, type Source, type Travel } from "@/lib/comparePrefs";
import type { SearchCriteria } from "@/lib/planSearch.functions";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { DataAsOf } from "@/components/DataAsOf";
import { PlanSearch } from "@/components/PlanSearch";
import { HelpPopover } from "@/components/HelpPopover";
import { BenefitSearchPanel } from "@/components/BenefitSearch";
import type { ServiceChip } from "@/lib/benefitSearch.functions";
import { COUNTIES, DATA_SOURCE, PART_B_MONTHLY, PART_D_OOP_CAP, FIGURES, figureNote, plansFor, scorePlan, rankPlans, explainOrder, sortForPriority, money, type Health, type Share, type SortKey } from "@/lib/plans";

const KEYS = ["county", "cov", "net", "netMode", "cms", "snp", "carriers", "q", "req", "noref", "max", "sort", "types", "structure", "must"] as const;

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
  validateSearch: (s: Record<string, unknown>): Partial<Record<(typeof KEYS)[number], string>> => {
    const out: Record<string, string> = {};
    for (const k of KEYS) {
      const v = s[k];
      if (typeof v === "string" && v) out[k] = v.slice(0, 300);
      else if (typeof v === "number") out[k] = String(v);
    }
    return out;
  },
  component: Compare,
});

const list = (v: string | undefined) => (v ? v.split("|").filter(Boolean) : []);
const SRC_LABEL: Record<Source, string> = { questionnaire: "Guided Questions", search: "AI-assisted search", you: "you" };
const DRUG_TEXT: Record<number, string> = { 0: "$0 / I don't take prescriptions", 50: "Under $100 (mostly generics)", 300: "$100 to $500", 1500: "Over $500 (brand/specialty)" };
const NA = "Not available — check the plan's Summary of Benefits";
const share = (v: Share | undefined) => v === undefined ? NA : typeof v === "number" ? money(v) : `${v.pct}% of the cost`;
const ext = (v: boolean | null) => (v === null ? NA : v ? "Included" : "Not covered");
type Level = "off" | "preferred" | "required";
const LEVEL_LABEL: Record<Level, string> = { off: "Not important", preferred: "Preferred", required: "Required" };

/** One radio group shown as large buttons. Used for every single-choice question in the panel. */
function Choices<T extends string>({ legend, help, name, value, options, onChange, row = false }: {
  legend: ReactNode; help?: ReactNode; name: string; value: T; options: [T, string][]; onChange: (v: T) => void; row?: boolean;
}) {
  return (
    <fieldset>
      <legend className="font-bold">{legend}</legend>
      {help && <p className="mt-1 text-sm text-muted-foreground">{help}</p>}
      <div className={`mt-2 ${row ? "grid grid-flow-col auto-cols-fr gap-1" : "grid gap-2"}`}>
        {options.map(([v, l]) => (
          <label key={v} className="block cursor-pointer">
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="peer sr-only" />
            <span className={`flex min-h-12 items-center rounded-lg border-2 border-input bg-card px-3 py-2 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ${row ? "justify-center text-center text-sm leading-tight" : ""}`}>{l}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-4 border-t pt-5 first:border-t-0 first:pt-0"><h3 className="font-display text-xl font-bold">{title}</h3>{children}</section>;
}

function Compare() {
  const sp = Route.useSearch();
  const navigate = useNavigate({ from: "/compare" });
  const prefs = usePrefs();
  const legacy = fromLegacy(sp);
  const pick = <T extends string>(v: string | undefined, all: readonly T[], d: T): T => (v && (all as readonly string[]).includes(v) ? (v as T) : d);
  const c: UrlCriteria = {
    ...EMPTY_CRITERIA,
    ...legacy,
    county: sp.county && COUNTIES.includes(sp.county) ? sp.county : COUNTIES[0] ?? "",
    ...(sp.cov ? { cov: pick<Cov>(sp.cov, COVS, "all") } : {}),
    ...(sp.net ? { net: pick<Net>(sp.net, NETS, "any") } : {}),
    ...(sp.netMode ? { netMode: pick<NetMode>(sp.netMode, ["only", "prefer"], "only") } : {}),
    ...(sp.cms ? { cms: list(sp.cms) } : {}),
    ...(sp.snp ? { snp: sp.snp === "1" } : {}),
    carriers: list(sp.carriers).filter((x) => CARRIERS.includes(x)),
    q: (sp.q ?? "").slice(0, 80),
    ...(sp.req ? { req: list(sp.req).filter((b): b is Benefit => (BENEFITS as string[]).includes(b)) } : {}),
    ...(sp.noref ? { noRef: sp.noref === "1" } : {}),
    maxPremium: sp.max !== undefined && !Number.isNaN(Number(sp.max)) ? Math.max(0, Number(sp.max)) : null,
    sort: sp.sort === "total" || sp.sort === "premium" || sp.sort === "oop" ? sp.sort : "",
  };
  const sortKey: SortKey = c.sort || sortForPriority(prefs.priority);
  /** Every change goes through here; the newest explicit choice replaces the old one. */
  const update = (patch: Partial<UrlCriteria>, source: Source = "you") => {
    const n = { ...c, ...patch };
    navigate({ to: ".", replace: true, resetScroll: false, search: {
      county: n.county,
      ...(n.cov !== "all" ? { cov: n.cov } : {}),
      ...(n.net !== "any" ? { net: n.net, netMode: n.netMode } : {}),
      ...(n.cms.length ? { cms: n.cms.join("|") } : {}), ...(n.snp ? { snp: "1" } : {}),
      ...(n.carriers.length ? { carriers: n.carriers.join("|") } : {}), ...(n.q ? { q: n.q } : {}),
      ...(n.req.length ? { req: n.req.join("|") } : {}), ...(n.noRef ? { noref: "1" } : {}),
      ...(n.maxPremium !== null ? { max: String(n.maxPremium) } : {}), ...(n.sort ? { sort: n.sort } : {}),
    } });
    const keys = Object.keys(patch).filter((k) => k !== "sort" && k !== "req").map((k) => (k === "netMode" ? "net" : k));
    if (keys.length) markSources(Object.fromEntries(keys.map((k) => [k, source])));
  };
  const level = (b: Benefit): Level => (c.req.includes(b) ? "required" : prefs.preferred[b] ? "preferred" : "off");
  const setLevel = (b: Benefit, v: Level, source: Source = "you") => {
    if ((v === "required") !== c.req.includes(b)) update({ req: v === "required" ? [...c.req, b] : c.req.filter((x) => x !== b) }, source);
    setPrefs({ preferred: { ...prefs.preferred, [b]: v === "preferred" } }, source, { [b]: source });
  };
  const extras = Object.fromEntries(BENEFITS.map((b) => [b, level(b) !== "off"])) as Record<Benefit, boolean>;
  const answers = {
    zip: "", health: prefs.health, doctorsFlex: prefs.keepAnyDoctor ? "any" : "network-ok", hospital: "none",
    drugsMonthly: prefs.drugs, priority: prefs.priority, extras, travels: prefs.travels === "yes",
  } as const;
  const [picked, setPicked] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [openSearch, setOpenSearch] = useState<string | null>(null);
  const [chips, setChips] = useState<ServiceChip[]>([]);
  const [qDraft, setQDraft] = useState(c.q);
  // Keyword search applies shortly after typing stops.
  useEffect(() => {
    const t = setTimeout(() => { if (qDraft.trim() !== c.q) update({ q: qDraft.trim().slice(0, 80) }); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDraft]);

  const area = useMemo(() => plansFor(c.county), [c.county]);
  const areaCarriers = useMemo(() => CARRIERS.filter((x) => area.some((p) => p.carrier === x)), [area]);
  const suggestions = carrierSuggestions(qDraft, areaCarriers.filter((x) => !c.carriers.includes(x)));
  const ranked = useMemo(() => rankPlans(applyFilters(area, c).map((p) => scorePlan(p, answers)), sortKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area, JSON.stringify(c), JSON.stringify(prefs), sortKey]);
  const rows = ranked.map((r) => ({ p: r.plan, c: r.cost, matched: r.matched }));
  type Row = (typeof rows)[number];
  const needs = (p: Row["p"]) => c.req.filter((b) => p[b] === null);
  const grouping = c.req.length > 0;
  const preferNet = netActive(c) && c.netMode === "prefer";
  const onlyNet = netActive(c) && c.netMode === "only";
  const netName = c.cms.filter((x) => EXACT_FOR[c.net].includes(x)).join(" or ") || NET_LABEL[c.net];
  const groupOf = (r: Row) => (preferNet && !netMatches(r.p, c.net) ? 2 : 0) + (needs(r.p).length ? 1 : 0);
  const shown = [...rows].sort((a, b) => groupOf(a) - groupOf(b)); // stable: keeps ranked order inside each group
  const groupTitle = (g: number): ReactNode => {
    if (!grouping && !preferNet) return null;
    const alt = g >= 2, unk = g % 2 === 1;
    const head = preferNet ? (alt ? "Other plan types (alternatives)" : `${netName} plans (your preference)`) : "";
    const tail = grouping ? (unk ? "Coverage needs confirmation" : "Confirmed coverage") : "";
    return <div className="pt-2"><h3 className="text-xl font-bold">{[head, tail].filter(Boolean).join(" — ")}</h3>
      {unk && <p className="mt-1 rounded-xl bg-muted p-3">We don't have complete benefit details for these plans. Contact the insurance company to confirm what's covered.</p>}
      {alt && <p className="mt-1 text-muted-foreground">These are not {netName} plans. They're shown because you said you're open to other types.</p>}</div>;
  };

  // Which single filter is blocking results, so we can say so instead of silently loosening anything.
  const blockers = rows.length > 0 ? [] : ([
    c.carriers.length && { label: `Insurer: ${c.carriers.join(", ")}`, fix: { carriers: [] } },
    onlyNet && { label: `${netName} only`, fix: { net: "any" as Net, cms: [] } },
    c.q && { label: `Search "${c.q}"`, fix: { q: "" } },
    c.maxPremium !== null && { label: `Premium up to $${c.maxPremium}`, fix: { maxPremium: null } },
    c.req.length && { label: `Required: ${c.req.map((b) => BENEFIT_LABEL[b]).join(", ")}`, fix: { req: [] } },
    c.noRef && { label: "No referrals needed", fix: { noRef: false } },
    c.cov !== "all" && { label: COV_LABEL[c.cov], fix: { cov: "all" as Cov } },
  ].filter(Boolean) as { label: string; fix: Partial<UrlCriteria> }[]).map((b) => ({ ...b, n: applyFilters(area, { ...c, ...b.fix }).length })).filter((b) => b.n > 0);

  const applySearch = (s: SearchCriteria) => {
    const patch: Partial<UrlCriteria> = { q: "", sort: "" };
    if (s.county) patch.county = s.county;
    if (s.cov) patch.cov = s.cov;
    if (s.net !== "any") { patch.net = s.net; patch.netMode = s.netMode; patch.cms = s.cms; }
    else if (s.cov && s.cov !== "ma") { patch.net = "any"; patch.cms = []; }
    if (s.snp) patch.snp = true;
    if (s.carriers.length) patch.carriers = s.carriers;
    if (s.maxPremium !== null) patch.maxPremium = s.maxPremium;
    const mentioned = BENEFITS.filter((b) => s.req.includes(b) || s.prefs.preferred[b]);
    if (mentioned.length) patch.req = [...c.req.filter((b) => !mentioned.includes(b)), ...s.req];
    update(patch, "search");
    if (mentioned.length) markSources(Object.fromEntries(mentioned.map((b) => [b, "search" as Source])));
    setQDraft("");
    const pp: Parameters<typeof setPrefs>[0] = {};
    if (mentioned.length) pp.preferred = { ...prefs.preferred, ...Object.fromEntries(mentioned.map((b) => [b, s.prefs.preferred[b]])) };
    if (s.prefs.keepAnyDoctor) pp.keepAnyDoctor = true;
    if (s.prefs.travels) pp.travels = "yes";
    if (s.prefs.priority !== "balanced") pp.priority = s.prefs.priority;
    if (Object.keys(pp).length) setPrefs(pp, "search");
    setPicked([]);
    setTimeout(() => document.getElementById("compare-plans")?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const tag = (k: string) => prefs.sources[k];
  const openPanel = () => { setShowFilters(true); setTimeout(() => document.getElementById("filters")?.scrollIntoView({ behavior: "smooth" }), 30); };
  type Chip = { key: string; label: string; src?: Source; clear?: () => void };
  const narrowChips: Chip[] = [
    { key: "county", label: `${c.county} County`, src: tag("county") },
    ...(c.cov !== "all" ? [{ key: "cov", label: COV_LABEL[c.cov], src: tag("cov"), clear: () => update({ cov: "all" }) }] : []),
    ...(onlyNet ? [{ key: "net", label: `${netName} only`, src: tag("net"), clear: () => update({ net: "any", cms: [] }) }] : []),
    ...c.carriers.map((x) => ({ key: `car-${x}`, label: x, src: tag("carriers"), clear: () => update({ carriers: c.carriers.filter((y) => y !== x) }) })),
    ...(c.q ? [{ key: "q", label: `Search: "${c.q}"`, src: tag("q"), clear: () => { setQDraft(""); update({ q: "" }); } }] : []),
    ...c.req.map((b) => ({ key: `req-${b}`, label: `${BENEFIT_LABEL[b]}: Required`, src: tag(b), clear: () => setLevel(b, "off") })),
    ...(c.snp && (c.cov === "all" || c.cov === "ma") ? [{ key: "snp", label: "Including Special Needs Plans", src: tag("snp"), clear: () => update({ snp: false }) }] : []),
    ...(c.maxPremium !== null ? [{ key: "max", label: `Premium up to $${c.maxPremium}/mo`, src: tag("maxPremium"), clear: () => update({ maxPremium: null }) }] : []),
    ...(c.noRef ? [{ key: "noref", label: "No referrals needed", src: tag("noRef"), clear: () => update({ noRef: false }) }] : []),
  ];
  const orderChips: Chip[] = [
    ...(preferNet ? [{ key: "netp", label: `${netName} preferred`, src: tag("net"), clear: () => update({ net: "any", cms: [] }) }] : []),
    ...BENEFITS.filter((b) => level(b) === "preferred").map((b) => ({ key: `pref-${b}`, label: `${BENEFIT_LABEL[b]}: Preferred`, src: tag(b), clear: () => setLevel(b, "off") })),
    ...(prefs.priority !== "balanced" ? [{ key: "priority", label: PRIORITY_LABEL[prefs.priority], src: tag("priority"), clear: () => setPrefs({ priority: "balanced" }, "you") }] : []),
    ...(prefs.keepAnyDoctor ? [{ key: "doc", label: "Keeping current doctors matters", src: tag("keepAnyDoctor"), clear: () => setPrefs({ keepAnyDoctor: false }, "you") }] : []),
    ...(prefs.travels === "yes" ? [{ key: "travel", label: "Travel: Yes", src: tag("travels"), clear: () => setPrefs({ travels: "unsure" }, "you") }] : []),
  ];
  const anyActive = narrowChips.length > 1 || orderChips.length > 0;
  const clearAll = () => { resetPrefs(); setQDraft(""); update({ ...EMPTY_CRITERIA }); };

  const toggle = (id: string) => setPicked((x) => x.includes(id) ? x.filter((y) => y !== id) : x.length < 3 ? [...x, id] : x);
  const cmp = rows.filter((r) => picked.includes(r.p.id));
  const sel = "mt-1 block min-h-12 w-full rounded-lg border-2 border-input bg-card p-2";
  const chipList = (xs: Chip[], tone: string) => (
    <ul className="mt-1 flex flex-wrap gap-2">{xs.map((x) => (
      <li key={x.key}>
        <button type="button" onClick={x.clear ?? openPanel} aria-label={x.clear ? `Remove ${x.label}` : `Change ${x.label}`} className={`min-h-12 rounded-full px-4 text-left ${tone}`}>
          {x.label}{x.src && <span className="ml-1 text-sm text-muted-foreground">· {SRC_LABEL[x.src]}</span>} <span aria-hidden>{x.clear ? "✕" : "✎"}</span>
        </button>
      </li>))}</ul>);

  return (
    <div className="min-h-screen"><SiteHeader />
      <PlanSearch onApply={applySearch} />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8 lg:py-10">
        <button type="button" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters} aria-controls="filters" className="flex min-h-14 items-center justify-between rounded-2xl border-2 bg-card px-5 text-lg font-bold lg:hidden">
          <span>Filters · {c.county} County</span><span aria-hidden>{showFilters ? "▲ Hide" : "▼ Show"}</span>
        </button>
        <aside id="filters" aria-label="Filters" className={`h-fit space-y-5 rounded-2xl border bg-card p-5 lg:block ${showFilters ? "" : "hidden"}`}>
          <p className="hidden text-2xl font-bold lg:block">Filters</p>

          <Section title="Where do you need coverage?">
            <label className="block font-bold">Michigan county<select className={sel} value={c.county} onChange={(e) => update({ county: e.target.value })}>
              {COUNTIES.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
          </Section>

          <Section title="What type of coverage are you looking for?">
            <Choices name="cov" value={c.cov} onChange={(v) => update({ cov: v })}
              legend={<span className="flex items-center gap-1">Coverage type <HelpPopover label="What do these coverage types mean?">
                <h2 className="text-lg font-bold">Ways to get Medicare</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <div><dt className="font-bold">Medicare Advantage</dt><dd>Plans from private insurance companies that provide your Part A and Part B benefits. Many include drug coverage and extras like dental or vision.</dd></div>
                  <div><dt className="font-bold">Original Medicare</dt><dd>Coverage directly through Medicare. You can generally see any doctor or hospital that accepts Medicare. It has no yearly spending limit. Drug coverage is a separate Part D plan.</dd></div>
                  <div><dt className="font-bold">Original Medicare + Medigap</dt><dd>Original Medicare plus supplemental insurance that helps pay deductibles and coinsurance. Medigap does not include drug coverage. Eligibility, enrollment rules and prices vary; we show typical examples, not individual policies.</dd></div>
                </dl></HelpPopover></span>}
              options={COVS.map((v) => [v, COV_LABEL[v]])} />
            {c.cov === "ma" && <div id="filters-net" className="space-y-3 rounded-xl bg-secondary/50 p-3">
              <Choices name="net" value={c.net} onChange={(v) => update({ net: v, cms: [] })}
                legend="Network type" help="Plans have different rules about which doctors and hospitals you can use."
                options={NETS.map((v) => [v, v === "ppo" ? "PPO — more flexibility" : v === "hmo" ? "HMO — care within a network" : v === "other" ? "Other plan types (HMO-POS, PFFS)" : NET_LABEL.any])} />
              {c.net === "ppo" && <p className="text-sm">PPO plans generally let you see doctors both inside and outside the network. You usually pay less in-network.</p>}
              {c.net === "hmo" && <p className="text-sm">HMO plans generally require network doctors and hospitals, except in emergencies. Some require referrals for specialists.</p>}
              {c.net === "other" && <p className="text-sm">HMO-POS and PFFS plans have different rules from each other. Each plan below shows its exact type and rules.</p>}
              {c.net !== "any" && <Choices name="netMode" value={c.netMode} onChange={(v) => update({ netMode: v })} legend={`Is ${NET_LABEL[c.net]} the only type you want to see?`}
                options={[["only", "Yes, only show this type"], ["prefer", "Show it first, others after"]]} />}
            </div>}
          </Section>

          <Section title="What's important to you?">
            {BENEFITS.map((b) => <Choices key={b} row name={`b-${b}`} value={level(b)} onChange={(v) => setLevel(b, v)} legend={BENEFIT_LABEL[b]}
              options={(["off", "preferred", "required"] as Level[]).map((v) => [v, LEVEL_LABEL[v]])} />)}
            <p className="text-sm text-muted-foreground"><strong>Preferred</strong> moves plans with confirmed coverage higher and hides nothing. <strong>Required</strong> leaves out plans confirmed not to cover it, and lists plans we can't confirm separately.</p>
          </Section>

          <Section title="What matters most about cost and flexibility?">
            <Choices name="priority" value={prefs.priority} legend="Main priority"
              onChange={(v: Priority) => setPrefs({ priority: v, ...(v === "flex" && !prefs.keepAnyDoctor ? { keepAnyDoctor: true } : {}) }, "you")}
              options={(["low-premium", "peace", "flex", "balanced"] as Priority[]).map((v) => [v, PRIORITY_LABEL[v]])} />
            <Choices name="doctors" value={prefs.keepAnyDoctor ? "yes" : "no"} onChange={(v) => setPrefs({ keepAnyDoctor: v === "yes" }, "you")}
              legend="Is being able to keep your current doctors important to you?"
              help="We can help you compare plans that offer more flexibility in choosing doctors, but you'll need to confirm whether your doctors accept a specific plan."
              options={[["yes", "Yes, very important"], ["no", "No preference"]]} />
            <Choices<Travel> row name="travel" value={prefs.travels} onChange={(v) => setPrefs({ travels: v }, "you")}
              legend="Do you travel often or spend time away from home?"
              help="Some plans offer more flexibility when you're away from home. Always confirm coverage with the insurance company before traveling."
              options={[["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]]} />
          </Section>

          <Section title="Find a specific plan">
            <form onSubmit={(e) => { e.preventDefault(); update({ q: qDraft.trim().slice(0, 80) }); }} role="search">
              <label className="block font-bold" htmlFor="kw">Search insurance companies or plans</label>
              <div className="relative mt-1">
                <input id="kw" type="search" maxLength={80} value={qDraft} onChange={(e) => setQDraft(e.target.value)} placeholder="Search insurance companies or plans..." autoComplete="off"
                  aria-describedby={suggestions.length ? "kw-sugg" : undefined} className="min-h-12 w-full min-w-0 rounded-lg border-2 border-input bg-card p-2 pr-12" />
                {qDraft && <button type="button" onClick={() => { setQDraft(""); update({ q: "" }); }} aria-label="Clear search" className="absolute right-0 top-0 flex size-12 items-center justify-center text-xl">✕</button>}
              </div>
            </form>
            {suggestions.length > 0 && <div id="kw-sugg" aria-live="polite">
              <p className="text-sm text-muted-foreground">Show only plans from:</p>
              <ul className="mt-1 space-y-1">{suggestions.map((s) => <li key={s.carrier}>
                <button type="button" onClick={() => { setQDraft(s.rest); update({ carriers: [...c.carriers, s.carrier], q: s.rest }); }} className="min-h-12 w-full rounded-lg border-2 border-primary/40 px-3 py-2 text-left font-semibold">+ {s.carrier}</button>
              </li>)}</ul></div>}
            {c.carriers.length > 0 && <ul className="flex flex-wrap gap-2" aria-label="Selected insurers">{c.carriers.map((x) => <li key={x}>
              <button type="button" onClick={() => update({ carriers: c.carriers.filter((y) => y !== x) })} aria-label={`Remove insurer ${x}`} className="min-h-12 rounded-full bg-primary/10 px-4 text-left">{x} <span aria-hidden>✕</span></button></li>)}</ul>}
          </Section>

          <div className="space-y-3 rounded-xl bg-secondary/50 p-3">
            <div><p className="font-bold">Help us estimate your costs</p><p className="mt-1">Your answers help us show examples of what different plans might cost based on your needs.</p><p className="mt-1 text-sm text-muted-foreground">Your answers are only used to help estimate costs. We don't save them to an account.</p></div>
            <label className="block font-bold">How much medical care do you expect to need?<span className="mt-1 block text-sm font-normal text-muted-foreground">We'll use your answer to show an example of what your medical costs could look like. Your actual costs may be different.</span><select className={sel} value={prefs.health} onChange={(e) => setPrefs({ health: e.target.value as Health }, "you")}>
              <option value="healthy">A little — Mostly routine checkups</option><option value="some">Some — Regular appointments or ongoing health needs</option><option value="chronic">A lot — Frequent appointments or more complex care</option></select></label>
            <label className="block font-bold">How much do you spend on prescriptions each month?<select className={sel} value={prefs.drugs} onChange={(e) => setPrefs({ drugs: Number(e.target.value) as DrugBand }, "you")}>
              {DRUG_BANDS.map((d) => <option key={d.v} value={d.v}>{DRUG_TEXT[d.v]}</option>)}</select></label>
          </div>

          <details className="rounded-xl border p-3">
            <summary className="min-h-12 cursor-pointer py-3 font-bold">Advanced filters</summary>
            <div className="space-y-4 pt-2">
              {c.cov === "ma" && EXACT_FOR[c.net].length > 0 && <fieldset><legend className="font-bold">Exact plan type (from Medicare)</legend>
                {EXACT_FOR[c.net].map((x) => <label key={x} className="mt-1 flex min-h-12 items-center gap-2"><input type="checkbox" className="size-5 shrink-0" checked={c.cms.includes(x)} onChange={() => update({ cms: c.cms.includes(x) ? c.cms.filter((y) => y !== x) : [...c.cms, x] })} />{x} only</label>)}</fieldset>}
              {(c.cov === "all" || c.cov === "ma") && <label className="flex min-h-12 items-start gap-2"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={c.snp} onChange={() => update({ snp: !c.snp })} />
                <span><span className="font-bold">Include Special Needs Plans</span><span className="block text-sm text-muted-foreground">Only for people who qualify, for example with Medicaid, certain chronic conditions, or nursing-home care. Listed last.</span></span></label>}
              <label className="block font-bold">Highest monthly premium<select className={sel} value={c.maxPremium ?? ""} onChange={(e) => update({ maxPremium: e.target.value === "" ? null : Number(e.target.value) })}>
                <option value="">Any</option>{[0, 25, 50, 100, 200].map((v) => <option key={v} value={v}>{v === 0 ? "$0 only" : `Up to $${v}`}</option>)}</select></label>
              <label className="flex min-h-12 items-center gap-2"><input type="checkbox" className="size-5 shrink-0" checked={c.noRef} onChange={() => update({ noRef: !c.noRef })} />No referrals needed to see specialists</label>
            </div>
          </details>
          {anyActive && <button type="button" onClick={clearAll} className="min-h-12 font-bold text-primary underline">Clear all filters and preferences</button>}
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
              <p className="mt-1 text-muted-foreground">{rows.length} plans in {c.county} County match your choices · select up to 3 to compare side by side</p>
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
                  <p className="mt-3">Our high-cost scenario includes the Part D drug out-of-pocket cap ({money(PART_D_OOP_CAP)}, {figureNote(FIGURES.partDOopCap)}), but only for drugs on the plan’s formulary. An expensive drug that isn’t covered could make your true cost higher.</p>
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

          <div className="mt-4 rounded-2xl border bg-card p-4" aria-label="Your Current Preferences">
            <p className="font-display text-lg font-bold">Your Current Preferences</p>
            <p className="mt-2 font-bold">Narrowing your list</p>{chipList(narrowChips, "bg-primary/10")}
            {orderChips.length > 0 && <><p className="mt-3 font-bold">Changing the order <span className="font-normal text-muted-foreground">— no plans are hidden</span></p>{chipList(orderChips, "bg-secondary")}</>}
          </div>
          {onlyNet && rows.length > 0 && <p role="status" className="mt-3 rounded-xl border-2 border-primary bg-primary/5 p-3">Showing {netName} Medicare Advantage plans because you selected {netName} only. <button type="button" onClick={openPanel} className="min-h-12 font-bold text-primary underline">Change this</button></p>}
          {preferNet && <p role="status" className="mt-3 rounded-xl border-2 border-primary bg-primary/5 p-3">{netName} plans are listed first because you prefer {netName}. Other plan types follow as alternatives. <button type="button" onClick={openPanel} className="min-h-12 font-bold text-primary underline">Change this</button></p>}
          <details className="mt-3"><summary className="min-h-12 cursor-pointer py-3 font-bold text-primary">Why are these plans shown first?</summary>
            <ul className="list-disc space-y-1 pl-6">{explainOrder({ doctorsFlex: answers.doctorsFlex, travels: answers.travels, extras }, sortKey).map((l) => <li key={l}>{l}</li>)}</ul>
            <p className="mt-2 text-sm text-muted-foreground">We never put a plan higher because of which company offers it. We show plans for your whole county, so confirm a plan serves your address.</p></details>

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
                  ["Allowance for health items (like vitamins or bandages)", (r) => r.p.extrasDetail?.otc ?? (r.p.real ? NA : "Not included")],
                  ["Part B giveback", (r) => r.p.partBGiveback ? `${money(r.p.partBGiveback)}/mo off your Part B premium` : r.p.real ? "None listed" : "Not included"],
                  ["Medicare star rating", (r) => r.p.starRating ? `${r.p.starRating} out of 5 stars${r.p.starYear === 2026 ? " (2026 rating — 2027 not yet released)" : ""}` : r.p.real ? "New — no rating yet" : "Not rated (CMS rates only Advantage and Part D plans)"],
                  ["Preventive care at $0", (r) => r.p.preventiveZero === null ? NA : r.p.preventiveZero ? "Yearly checkups, mammograms & screenings at $0" : "May have copays"],
                  ["Plan type (from Medicare)", (r) => r.p.cmsType ?? (r.p.real ? NA : "Original Medicare / Medigap")],
                  ["Medicare plan ID", (r) => r.p.real ? r.p.id : "None (not a CMS plan)"],
                ] as [string, (r: (typeof cmp)[number]) => string][]).map(([l, f]) => (
                  <tr key={l} className="border-t"><td className="sticky left-0 min-w-32 bg-card p-2 font-bold">{l}</td>{cmp.map((r) => <td key={r.p.id} className="min-w-40 p-2">{f(r)}</td>)}</tr>))}
              </tbody></table>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {shown.map(({ p, c }, i) => (<Fragment key={p.id}>
              {(i === 0 || groupOf(shown[i - 1]!) !== groupOf(shown[i]!)) && groupTitle(groupOf(shown[i]!))}
              <div className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 rounded-2xl border-2 bg-card p-4 sm:p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-4 ${picked.includes(p.id) ? "border-primary" : ""}`}>
                <label className="-m-2 flex size-10 items-start justify-center p-2"><input type="checkbox" aria-label={`Compare ${p.name}`} className="size-6" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} /></label>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold">{p.name}</h2>
                  {needs(p).length > 0 && <p className="mt-1 text-sm font-semibold text-warning">Confirm with the insurer: {needs(p).map((b) => BENEFIT_LABEL[b].toLowerCase()).join(", ")} coverage</p>}
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
            </Fragment>))}
            {rows.length === 0 && <div role="status" className="rounded-xl bg-muted p-6 text-lg">
              <p>{onlyNet ? `We couldn't find ${netName} plans that match all your choices in this county. You can change your preferences to see more options.` : `No plans in ${c.county} County match all of these choices. You can change your preferences to see more options.`}</p>
              {blockers.length > 0 && <ul className="mt-3 space-y-2">{blockers.map((b) => <li key={b.label}><button type="button" onClick={() => update(b.fix)} className="min-h-12 text-left font-bold text-primary underline">Remove "{b.label}" to see {b.n} plan{b.n === 1 ? "" : "s"}</button></li>)}</ul>}
              <button type="button" onClick={openPanel} className="mt-3 min-h-12 font-bold text-primary underline">Change my preferences</button></div>}
          </div>
        </section>
      </main>
      <Disclaimer />
    </div>
  );
}
