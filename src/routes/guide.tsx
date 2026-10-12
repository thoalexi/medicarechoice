import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { setPrefs, markSources, toBand, PRIORITY_LABEL, type Priority, type Travel } from "@/lib/comparePrefs";
import { applyFilters, netMatches, BENEFITS, BENEFIT_LABEL, EMPTY_CRITERIA, NET_LABEL, type Benefit, type Cov, type Net, type NetMode } from "@/lib/planFilters";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { DataAsOf } from "@/components/DataAsOf";
import { plansFor, regionLabel, regionFromZip, scorePlan, rankPlans, sortForPriority, explainOrder, money, PART_D_OOP_CAP, FIGURES, figureNote, type Answers, type Plan } from "@/lib/plans";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guided Medicare questions — PlainPlanGuide" },
      { name: "description", content: "Seven plain-language questions that lead to clear Medicare plan recommendations with estimated yearly costs." },
      { property: "og:title", content: "Guided Medicare questions — PlainPlanGuide" },
      { property: "og:description", content: "Find your best-fit Medicare plan in about 3 minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Guide,
});

import { HospitalPicker } from "@/components/HospitalPicker";

function Choice({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc?: string | undefined }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className={`w-full rounded-xl border-2 p-5 text-left transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${selected ? "border-primary bg-primary/10" : "bg-card hover:border-primary/50"}`}>
      <div className="flex items-start justify-between gap-3"><span className="text-xl font-bold">{title}</span>{selected && <span className="shrink-0 rounded-full bg-primary px-3 py-0.5 text-sm font-bold text-primary-foreground">Selected</span>}</div>
      {desc && <div className="mt-1 text-foreground/80">{desc}</div>}
    </button>
  );
}

function Guide() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({ zip: "", health: "some", doctorsFlex: "any", hospital: "none", drugsMonthly: 0, priority: "balanced", extras: { dental: false, vision: false, hearing: false }, travels: false });
  const set = (p: Partial<Answers>) => setA((x) => ({ ...x, ...p }));
  const [g, setG] = useState<Guided>({ cov: null, net: null, netMode: null, travel: "unsure", fitness: false });
  const setGuided = (p: Partial<Guided>) => setG((x) => ({ ...x, ...p }));
  const region = regionFromZip(a.zip);
  const offered = (n: Net) => !region || plansFor(region).some((p) => p.type !== "Special Needs (SNP)" && netMatches(p, n));
  const askNet = g.cov === "ma" || g.cov === "unsure";
  const askMode = askNet && (g.net === "hmo" || g.net === "ppo" || g.net === "other");
  const NET_CARDS: [Net, string, string][] = [
    ["ppo", "PPO — More flexibility", "PPO plans generally let you see doctors and specialists both inside and outside the plan's network. You'll usually pay less when you stay in-network."],
    ["hmo", "HMO — Care within a network", "HMO plans generally require you to use doctors and hospitals in the plan's network, except in certain situations such as emergencies. Some HMOs require referrals for specialists."],
    ["other", "Other Medicare Advantage plans", "Some plans have different network or provider rules, such as HMO-POS or Private Fee-for-Service (PFFS) plans. Their rules are not the same as each other; each plan shows its own type."],
  ];

  const steps: { q: string; help: string; body: ReactNode; valid?: boolean; optional?: boolean }[] = [
    { q: "What's your ZIP code?", help: "Plans and prices change by county.", valid: /^\d{5}$/.test(a.zip),
      body: <div><input aria-label="ZIP code" inputMode="numeric" maxLength={5} value={a.zip} onChange={(e) => set({ zip: e.target.value.replace(/\D/g, "") })} placeholder="e.g. 48201" className="w-48 rounded-xl border-2 border-input bg-card px-4 py-4 text-2xl" />
        {a.zip.length === 5 && <p className="mt-3 text-lg">📍 {regionLabel(regionFromZip(a.zip))}</p>}</div> },
    { q: "Do you have a type of Medicare coverage in mind?", help: "There are different ways to get Medicare coverage. If you're not sure which is right for you, we can help you explore your options.", optional: true,
      body: <div className="grid gap-3">
        <Choice selected={g.cov === "ma"} onClick={() => setGuided({ cov: "ma" })} title="Medicare Advantage" desc="Plans offered by private insurance companies that provide your Medicare Part A and Part B benefits. Many also include prescription drug coverage and extra benefits, such as dental or vision." />
        <Choice selected={g.cov === "orig"} onClick={() => setGuided({ cov: "orig", net: null, netMode: null })} title="Original Medicare" desc="Coverage provided directly through Medicare. You can generally visit any doctor or hospital that accepts Medicare. You can also choose to add separate prescription drug coverage." />
        <Choice selected={g.cov === "medigap"} onClick={() => setGuided({ cov: "medigap", net: null, netMode: null })} title="Original Medicare + Medigap" desc="Original Medicare with supplemental insurance that helps pay certain costs Medicare doesn't cover, such as deductibles and coinsurance. Medigap does not include drug coverage. Eligibility, enrollment rules and prices vary. We show typical price examples, not individual policies." />
        <Choice selected={g.cov === "unsure"} onClick={() => setGuided({ cov: "unsure" })} title="I'm not sure" desc="Help me explore the different options." />
      </div> },
    ...(askNet ? [{ q: "Do you prefer a particular kind of Medicare Advantage plan?", help: "Different plans have different rules about which doctors and hospitals you can use. If you're unsure, you can compare the options.", optional: true,
      body: <div className="grid gap-3">
        {g.cov === "unsure" && <p className="rounded-xl bg-muted p-4 text-lg">These are types of Medicare Advantage plans. This question is optional. You can skip it to keep Original Medicare options in your results.</p>}
        {NET_CARDS.filter(([n]) => offered(n)).map(([n, t, d]) => <Choice key={n} selected={g.net === n} onClick={() => setGuided({ net: n })} title={t} desc={d} />)}
        <Choice selected={g.net === "any"} onClick={() => setGuided({ net: "any", netMode: null })} title="I'm not sure" desc="Show me the available plan types so I can compare." />
        {g.cov === "unsure" && g.net && g.net !== "any" && <p role="status" className="rounded-xl border-2 border-primary bg-primary/5 p-4 text-lg">This will focus your results on Medicare Advantage plans. Original Medicare options will be hidden until you change this.</p>}
      </div> }] : []),
    ...(askMode ? [{ q: "Is this the only type of plan you want to see?", help: `You chose ${g.net ? NET_LABEL[g.net] : ""}.`, optional: true,
      body: <div className="grid gap-3">
        <Choice selected={g.netMode === "only"} onClick={() => setGuided({ netMode: "only" })} title="Yes, only show me this type." />
        <Choice selected={g.netMode === "prefer"} onClick={() => setGuided({ netMode: "prefer" })} title="I prefer this type, but I'm open to others." desc="Matching plans come first. Other types are listed after them as alternatives." />
      </div> }] : []),
    { q: "How would you describe your health?", help: "This helps us estimate what a typical year of care costs you.",
      body: <div className="grid gap-3">
        <Choice selected={a.health === "healthy"} onClick={() => set({ health: "healthy" })} title="Pretty healthy" desc="A checkup or two a year." />
        <Choice selected={a.health === "some"} onClick={() => set({ health: "some" })} title="A few ongoing issues" desc="Regular visits, maybe a specialist or test." />
        <Choice selected={a.health === "chronic"} onClick={() => set({ health: "chronic" })} title="Serious or chronic conditions" desc="E.g. heart disease, cancer care, frequent specialists." />
      </div> },
    { q: "Is being able to keep your current doctors important to you?", help: "We can help you compare plans that offer more flexibility in choosing doctors, but you'll need to confirm whether your doctors accept a specific plan.",
      body: <div className="grid gap-3">
        <Choice selected={a.doctorsFlex === "any"} onClick={() => set({ doctorsFlex: "any" })} title="Yes, very important" />
        <Choice selected={a.doctorsFlex === "network-ok"} onClick={() => set({ doctorsFlex: "network-ok" })} title="No preference" />
        <div className="mt-4">
          <label className="block text-lg font-bold" htmlFor="hospital-input">Preferred hospital (optional)
            <span className="block text-base font-normal text-muted-foreground">Start typing a name or city, like "McLaren Flint" or "Marquette". Pick one from the list, or type your own.</span>
          </label>
          <HospitalPicker value={a.hospital} onChange={(v) => set({ hospital: v })} />
        </div>
        <fieldset className="mt-4"><legend className="text-lg font-bold">Do you travel often or spend time away from home?</legend>
          <p className="text-muted-foreground">Some plans offer more flexibility when you're away from home. Always confirm coverage with the insurance company before traveling.</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">{([["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] as [Travel, string][]).map(([v, l]) =>
            <Choice key={v} selected={g.travel === v} onClick={() => { setGuided({ travel: v }); set({ travels: v === "yes" }); }} title={l} />)}</div></fieldset>
      </div> },
    { q: "About how much do your prescriptions cost per month?", help: "Use the full pharmacy price if you know it. Rough is fine.",
      body: <div className="grid gap-3 sm:grid-cols-2">
        {[[0, "None"], [50, "Under $100 (generics)"], [300, "$100–$500"], [1500, "Over $500 (brand / specialty)"]].map(([v, l]) =>
          <Choice key={v} selected={a.drugsMonthly === v} onClick={() => set({ drugsMonthly: v as number })} title={l as string} />)}
      </div> },
    { q: "What matters most about cost and flexibility?", help: "There's no wrong answer—it's a trade-off.",
      body: <div className="grid gap-3">
        {(["low-premium", "peace", "flex", "balanced"] as Priority[]).map((v) => <Choice key={v} selected={a.priority === v} onClick={() => set({ priority: v, ...(v === "flex" ? { doctorsFlex: "any" as const } : {}) })} title={PRIORITY_LABEL[v]}
          desc={v === "low-premium" ? "Plans with lower monthly bills come first. Costs when you need care may be higher." : v === "peace" ? "Plans with a lower high-cost year come first. Monthly bills may be higher." : v === "flex" ? "Plans that let you see more doctors come first." : undefined} />)}
      </div> },
    { q: "Would you like dental, vision, hearing, or fitness extras?", help: "Pick any that matter to you. Plans that include them move higher, and no plans are hidden. Original Medicare doesn't cover these. Many Advantage plans do.",
      body: <div className="grid gap-3 sm:grid-cols-2">
        {BENEFITS.map((x) =>
          <Choice key={x} selected={!!a.extras[x]} onClick={() => set({ extras: { ...a.extras, [x]: !a.extras[x] } })} title={BENEFIT_LABEL[x]} />)}
      </div> },
  ];

  if (step >= steps.length) return <Results a={a} g={g} onEdit={() => setStep(0)} />;
  const s = steps[step]!;
  return (
    <div className="min-h-screen"><SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-2 text-muted-foreground">Question {step + 1} of {steps.length}</div>
        <div className="mb-8 h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <h1 className="text-3xl font-bold sm:text-4xl">{s.q}</h1>
        <p className="mb-8 mt-2 text-lg text-muted-foreground">{s.help}</p>
        {s.body}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-xl border-2 px-6 py-3 text-lg font-bold disabled:opacity-30">← Back</button>
          {s.optional && <button type="button" onClick={() => { if (s.q.startsWith("Do you have a type")) setGuided({ cov: null, net: null, netMode: null }); else if (s.q.startsWith("Do you prefer")) setGuided({ net: null, netMode: null }); else setGuided({ netMode: null }); setStep(step + 1); }} className="min-h-12 px-3 text-lg font-bold text-primary underline">Skip this question</button>}
          <button disabled={s.valid === false} onClick={() => { if (step === steps.length - 1) void import("@/lib/analytics").then((m) => m.track("questionnaire_complete")); setStep(step + 1); }} className="rounded-xl bg-primary px-8 py-3 text-lg font-bold text-primary-foreground disabled:opacity-40">{step === steps.length - 1 ? "See my plans" : "Next →"}</button>
        </div>
        <p className="mt-10 text-center"><Link to="/compare" search={regionFromZip(a.zip) ? { county: regionFromZip(a.zip) } : {}} className="text-primary underline">Skip questions — go to the comparison dashboard</Link></p>
      </main>
    </div>
  );
}

/** Guided Questions answers that become shared Compare criteria. null = skipped (no restriction). */
type Guided = { cov: "ma" | "orig" | "medigap" | "unsure" | null; net: Net | null; netMode: NetMode | null; travel: Travel; fitness: boolean };

/** Same mapping Compare uses: skipping or "not sure" never adds a restriction. */
function guidedCriteria(g: Guided): { cov: Cov; net: Net; netMode: NetMode } {
  const net: Net = g.net && g.net !== "any" && (g.cov === "ma" || g.cov === "unsure") ? g.net : "any";
  const cov: Cov = net !== "any" ? "ma" : g.cov === "ma" || g.cov === "orig" || g.cov === "medigap" ? g.cov : "all";
  return { cov, net, netMode: g.netMode ?? "prefer" };
}

function Results({ a, g, onEdit }: { a: Answers; g: Guided; onEdit: () => void }) {
  const region = regionFromZip(a.zip);
  const gc = guidedCriteria(g);
  const crit = { ...EMPTY_CRITERIA, county: region, ...gc };
  const preferNet = gc.net !== "any" && gc.netMode === "prefer";
  const ranked0 = rankPlans(applyFilters(plansFor(region), crit).map((p) => scorePlan(p, a)), sortForPriority(a.priority));
  const isAlt = (p: Plan) => preferNet && !netMatches(p, gc.net);
  const ranked = preferNet ? [...ranked0.filter((r) => !isAlt(r.plan)), ...ranked0.filter((r) => isAlt(r.plan))] : ranked0;
  const netName = NET_LABEL[gc.net];
  const link = { ...(region ? { county: region } : {}), ...(gc.cov !== "all" ? { cov: gc.cov } : {}), ...(gc.net !== "any" ? { net: gc.net, netMode: gc.netMode } : {}) };
  // Hand general choices to Compare for this browser tab only (no ZIP, hospital or medicine details).
  useEffect(() => {
    const preferred = Object.fromEntries(BENEFITS.map((b) => [b, !!a.extras[b]])) as Record<Benefit, boolean>;
    setPrefs({ health: a.health, drugs: toBand(a.drugsMonthly), keepAnyDoctor: a.doctorsFlex === "any", priority: a.priority, preferred, travels: g.travel }, "questionnaire");
    markSources({ county: "questionnaire", ...(gc.cov !== "all" ? { cov: "questionnaire" } : {}), ...(gc.net !== "any" ? { net: "questionnaire" } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, g]);
  return (
    <div className="min-h-screen"><SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-4xl font-bold">Your best-fit plans</h1><p className="mt-1 text-sm text-muted-foreground">Independent site — not affiliated with Medicare or CMS. Official info: Medicare.gov or 1-800-MEDICARE.</p><DataAsOf />
        <p className="mt-2 text-lg text-muted-foreground">For {regionLabel(region)}. Plans and premiums from the official CMS 2027 list. Costs include your Part B premium and are estimated for a typical year given your answers. Prescription estimates assume your drugs are on the plan’s formulary (its list of covered drugs).</p>
        <button onClick={onEdit} className="mt-3 min-h-12 text-primary underline">Change my answers</button>
        {gc.net !== "any" && gc.netMode === "only" && ranked.length > 0 && <p role="status" className="mt-4 rounded-xl border-2 border-primary bg-primary/5 p-4 text-lg">Showing {netName} Medicare Advantage plans because you selected {netName} only. These are not every Medicare plan available.</p>}
        {preferNet && <p role="status" className="mt-4 rounded-xl border-2 border-primary bg-primary/5 p-4 text-lg">{netName} plans are listed first because you prefer {netName}. Other plan types are marked as alternatives.</p>}
        {gc.cov === "medigap" && <p className="mt-4 rounded-xl bg-muted p-4 text-lg">Medigap prices shown are typical examples, not individual policies. Eligibility, enrollment rules and prices vary. Medigap doesn't include drug coverage, so a separate Part D plan is included in the estimate.</p>}
        {ranked.length === 0 && <div role="status" className="mt-6 rounded-xl bg-muted p-6 text-lg"><p>We couldn't find {gc.net !== "any" ? `${netName} plans` : "plans"} that match all your choices in this county. You can change your preferences to see more options.</p>
          <button onClick={onEdit} className="mt-3 min-h-12 font-bold text-primary underline">Change my answers</button></div>}
        {ranked.length > 1 && Math.abs(ranked[0]!.cost.total - ranked[1]!.cost.total) < 250 && (
          <p className="mt-6 rounded-xl border-2 border-primary bg-primary/5 p-4 text-lg">These top plans cost about the same in a typical year, so we ranked the one with the lower high-cost scenario first. Compare their high-cost scenario, doctor and hospital copays, and extras to choose between them.</p>
        )}
        <details className="mt-4"><summary className="min-h-12 cursor-pointer py-3 font-bold text-primary">How did we pick this order?</summary>
          <ul className="list-disc space-y-1 pl-6">{explainOrder(a, sortForPriority(a.priority)).map((l) => <li key={l}>{l}</li>)}</ul>
          <p className="mt-2 text-sm text-muted-foreground">Plans are never ordered by who offers them. Hospital choice isn't used for ranking because plan data doesn't list hospital networks.</p></details>
        <div className="mt-8 space-y-6">
          {ranked.slice(0, 4).map(({ plan, cost, reasons, cautions }, i) => (
            <article key={plan.id} className={`rounded-2xl border-2 bg-card p-6 ${i === 0 ? "border-primary shadow-lg" : ""}`}>
              {i === 0 && <div className="mb-2 inline-block rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">Best match</div>}
              {isAlt(plan) && <div className="mb-2 inline-block rounded-full bg-muted px-3 py-1 text-sm font-bold">Alternative — not a {netName} plan</div>}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 className="text-2xl font-bold">{plan.name}</h2><div className="text-muted-foreground">{plan.cmsType && plan.real ? plan.cmsType : plan.type} · {plan.carrier}{plan.starRating ? ` · ${plan.starRating}★${plan.starYear === 2026 ? " (2026 rating)" : ""}` : ""}</div></div>
                <div className="text-right"><div className="text-sm text-muted-foreground">Estimated yearly cost</div><div className="font-display text-4xl font-bold text-primary">{money(cost.total)}</div></div>
              </div>
              <p className="mt-3 text-lg">{plan.summary}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-muted p-4 text-center">
                <div><div className="text-sm text-muted-foreground">Premiums</div><div className="text-xl font-bold">{money(cost.premiums)}</div></div>
                <div><div className="text-sm text-muted-foreground">Medical care</div><div className="text-xl font-bold">{money(cost.medical)}</div></div>
                <div><div className="text-sm text-muted-foreground">Prescriptions</div><div className="text-xl font-bold">{money(cost.drugs)}</div></div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">High-cost scenario (illustrative): {cost.worstCase ? money(cost.worstCase) : "no limit"}</p>
              <p className="mt-1 text-sm text-muted-foreground">This scenario includes drug costs up to the Part D cap ({money(PART_D_OOP_CAP)}, {figureNote(FIGURES.partDOopCap)}) — something most plan ads leave out. An Advantage plan’s medical out-of-pocket limit does not include drugs. Check the plan’s formulary to confirm your exact medications are covered — <Link to="/formulary-check" className="font-bold text-primary underline">check my drugs</Link>.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ul className="space-y-1">{reasons.map((r) => <li key={r} className="text-success">✓ <span className="text-foreground">{r}</span></li>)}</ul>
                <ul className="space-y-1">{cautions.map((r) => <li key={r} className="text-warning">⚠ <span className="text-foreground">{r}</span></li>)}</ul>
              </div>
            </article>
          ))}
        </div>
        <Link to="/compare" search={link} className="mt-10 inline-block rounded-xl border-2 border-primary px-6 py-3 text-lg font-bold text-primary">Compare all plans side by side →</Link>
      </main>
      <Disclaimer />
    </div>
  );
}
