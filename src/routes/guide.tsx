import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { plansFor, regionLabel, regionFromZip, scorePlan, money, PART_D_OOP_CAP, type Answers } from "@/lib/plans";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guided Medicare questions — MedicareChoice" },
      { name: "description", content: "Seven plain-language questions that lead to clear Medicare plan recommendations with true yearly costs." },
      { property: "og:title", content: "Guided Medicare questions — MedicareChoice" },
      { property: "og:description", content: "Find your best-fit Medicare plan in about 3 minutes." },
    ],
  }),
  component: Guide,
});

import { HospitalPicker } from "@/components/HospitalPicker";

function Choice({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className={`w-full rounded-xl border-2 p-5 text-left transition ${selected ? "border-primary bg-primary/10" : "bg-card hover:border-primary/50"}`}>
      <div className="text-xl font-bold">{title}</div>
      {desc && <div className="mt-1 text-muted-foreground">{desc}</div>}
    </button>
  );
}

function Guide() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({ zip: "", health: "some", doctorsFlex: "any", hospital: "none", drugsMonthly: 0, priority: "balanced", extras: { dental: false, vision: false, hearing: false }, travels: false });
  const set = (p: Partial<Answers>) => setA((x) => ({ ...x, ...p }));

  const steps: { q: string; help: string; body: ReactNode; valid?: boolean }[] = [
    { q: "What's your ZIP code?", help: "Plans and prices change by county.", valid: /^\d{5}$/.test(a.zip),
      body: <div><input aria-label="ZIP code" inputMode="numeric" maxLength={5} value={a.zip} onChange={(e) => set({ zip: e.target.value.replace(/\D/g, "") })} placeholder="e.g. 48201" className="w-48 rounded-xl border-2 border-input bg-card px-4 py-4 text-2xl" />
        {a.zip.length === 5 && <p className="mt-3 text-lg">📍 {regionLabel(regionFromZip(a.zip))}</p>}</div> },
    { q: "How would you describe your health?", help: "This helps us estimate what a typical year of care costs you.",
      body: <div className="grid gap-3">
        <Choice selected={a.health === "healthy"} onClick={() => set({ health: "healthy" })} title="Pretty healthy" desc="A checkup or two a year." />
        <Choice selected={a.health === "some"} onClick={() => set({ health: "some" })} title="A few ongoing issues" desc="Regular visits, maybe a specialist or test." />
        <Choice selected={a.health === "chronic"} onClick={() => set({ health: "chronic" })} title="Serious or chronic conditions" desc="E.g. heart disease, cancer care, frequent specialists." />
      </div> },
    { q: "How important is keeping your current doctors?", help: "Medigap lets you see any doctor; Advantage plans use networks.",
      body: <div className="grid gap-3">
        <Choice selected={a.doctorsFlex === "any"} onClick={() => set({ doctorsFlex: "any" })} title="Very—I don't want to switch" />
        <Choice selected={a.doctorsFlex === "network-ok"} onClick={() => set({ doctorsFlex: "network-ok" })} title="I'm open to a network if it saves money" />
        <div className="mt-4">
          <label className="block text-lg font-bold" htmlFor="hospital-input">Preferred hospital (optional)
            <span className="block text-base font-normal text-muted-foreground">Start typing a name or city, like "McLaren Flint" or "Marquette". Pick one from the list, or type your own.</span>
          </label>
          <HospitalPicker value={a.hospital} onChange={(v) => set({ hospital: v })} />
        </div>
        <label className="mt-2 flex items-center gap-3 text-lg"><input type="checkbox" className="size-6" checked={a.travels} onChange={(e) => set({ travels: e.target.checked })} /> I spend part of the year out of state (e.g. Florida winters)</label>
      </div> },
    { q: "About how much do your prescriptions cost per month?", help: "Use the full pharmacy price if you know it. Rough is fine.",
      body: <div className="grid gap-3 sm:grid-cols-2">
        {[[0, "None"], [50, "Under $100 (generics)"], [300, "$100–$500"], [1500, "Over $500 (brand / specialty)"]].map(([v, l]) =>
          <Choice key={v} selected={a.drugsMonthly === v} onClick={() => set({ drugsMonthly: v as number })} title={l as string} />)}
      </div> },
    { q: "What matters more to you?", help: "There's no wrong answer—it's a trade-off.",
      body: <div className="grid gap-3">
        <Choice selected={a.priority === "low-premium"} onClick={() => set({ priority: "low-premium" })} title="Lowest monthly bill" desc="I'll accept higher costs if I get sick." />
        <Choice selected={a.priority === "balanced"} onClick={() => set({ priority: "balanced" })} title="A balance" />
        <Choice selected={a.priority === "peace"} onClick={() => set({ priority: "peace" })} title="Peace of mind" desc="I'd pay more monthly to avoid surprise bills." />
      </div> },
    { q: "Do you want dental, vision, or hearing extras?", help: "Original Medicare doesn't cover these. Many Advantage plans do.",
      body: <div className="grid gap-3 sm:grid-cols-3">
        {(["dental", "vision", "hearing"] as const).map((x) =>
          <Choice key={x} selected={a.extras[x]} onClick={() => set({ extras: { ...a.extras, [x]: !a.extras[x] } })} title={x.charAt(0).toUpperCase() + x.slice(1)} />)}
      </div> },
  ];

  if (step >= steps.length) return <Results a={a} onEdit={() => setStep(0)} />;
  const s = steps[step]!;
  return (
    <div className="min-h-screen"><SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-2 text-muted-foreground">Question {step + 1} of {steps.length}</div>
        <div className="mb-8 h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <h1 className="text-3xl font-bold sm:text-4xl">{s.q}</h1>
        <p className="mb-8 mt-2 text-lg text-muted-foreground">{s.help}</p>
        {s.body}
        <div className="mt-10 flex justify-between">
          <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-xl border-2 px-6 py-3 text-lg font-bold disabled:opacity-30">← Back</button>
          <button disabled={s.valid === false} onClick={() => setStep(step + 1)} className="rounded-xl bg-primary px-8 py-3 text-lg font-bold text-primary-foreground disabled:opacity-40">{step === steps.length - 1 ? "See my plans" : "Next →"}</button>
        </div>
        <p className="mt-10 text-center"><Link to="/compare" search={regionFromZip(a.zip) ? { county: regionFromZip(a.zip) } : {}} className="text-primary underline">Skip questions — go to the comparison dashboard</Link></p>
      </main>
    </div>
  );
}

function Results({ a, onEdit }: { a: Answers; onEdit: () => void }) {
  const region = regionFromZip(a.zip);
  const ranked = plansFor(region).map((p) => scorePlan(p, a)).sort((x, y) => y.score - x.score);
  return (
    <div className="min-h-screen"><SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-4xl font-bold">Your best-fit plans</h1>
        <p className="mt-2 text-lg text-muted-foreground">For {regionLabel(region)}. Plans and premiums from the official CMS 2027 list. Costs include your Part B premium and are estimated for a typical year given your answers. Prescription estimates assume your drugs are on the plan’s formulary (its list of covered drugs).</p>
        <button onClick={onEdit} className="mt-3 text-primary underline">Change my answers</button>
        <div className="mt-8 space-y-6">
          {ranked.slice(0, 4).map(({ plan, cost, reasons, cautions }, i) => (
            <article key={plan.id} className={`rounded-2xl border-2 bg-card p-6 ${i === 0 ? "border-primary shadow-lg" : ""}`}>
              {i === 0 && <div className="mb-2 inline-block rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">Best match</div>}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 className="text-2xl font-bold">{plan.name}</h2><div className="text-muted-foreground">{plan.type} · {plan.carrier}{plan.starRating ? ` · ${plan.starRating}★${plan.starYear === 2026 ? " (2026 rating)" : ""}` : ""}</div></div>
                <div className="text-right"><div className="text-sm text-muted-foreground">Estimated true yearly cost</div><div className="font-display text-4xl font-bold text-primary">{money(cost.total)}</div></div>
              </div>
              <p className="mt-3 text-lg">{plan.summary}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-muted p-4 text-center">
                <div><div className="text-sm text-muted-foreground">Premiums</div><div className="text-xl font-bold">{money(cost.premiums)}</div></div>
                <div><div className="text-sm text-muted-foreground">Medical care</div><div className="text-xl font-bold">{money(cost.medical)}</div></div>
                <div><div className="text-sm text-muted-foreground">Prescriptions</div><div className="text-xl font-bold">{money(cost.drugs)}</div></div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Worst-case year: {cost.worstCase ? money(cost.worstCase) : "no limit"}</p>
              <p className="mt-1 text-sm text-muted-foreground">This worst case includes drug costs up to the Part D cap ({money(PART_D_OOP_CAP)}) — something most plan ads leave out. Check the plan’s formulary to confirm your exact medications are covered — <Link to="/formulary-check" className="font-bold text-primary underline">check my drugs</Link>.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ul className="space-y-1">{reasons.map((r) => <li key={r} className="text-success">✓ <span className="text-foreground">{r}</span></li>)}</ul>
                <ul className="space-y-1">{cautions.map((r) => <li key={r} className="text-warning">⚠ <span className="text-foreground">{r}</span></li>)}</ul>
              </div>
            </article>
          ))}
        </div>
        <Link to="/compare" className="mt-10 inline-block rounded-xl border-2 border-primary px-6 py-3 text-lg font-bold text-primary">Compare all plans side by side →</Link>
      </main>
      <Disclaimer />
    </div>
  );
}
