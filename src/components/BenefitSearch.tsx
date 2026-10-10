import { useEffect, useState } from "react";
import { matchServices, type ServiceChip } from "@/lib/benefitSearch.functions";
import { money, type Plan } from "@/lib/plans";

type Range = [number, number];
type Row = { c?: Range; p?: Range; z?: 1; days?: [number, number, number][]; a?: 0 | 1; r?: 0 | 1; d?: 0 | 1; o?: { c?: Range; p?: Range; d?: 0 | 1 } };
type Data = { services: Record<string, string>; plans: Record<string, Record<string, Row>> };

const NOT_FOUND = "Not found in this plan's benefit data — check the plan's Evidence of Coverage";
const PART_B_RULE: Record<string, string> = {
  orig: "Original Medicare rule: after the yearly Part B deductible, you usually pay 20% of the Medicare-approved amount, with no yearly limit. Hospital stays follow Part A rules.",
  "medigap-g": "Original Medicare rule: Part B usually leaves you 20% after the yearly Part B deductible. Medigap Plan G pays that 20% — you pay the Part B deductible.",
  "medigap-n": "Original Medicare rule: Part B usually leaves you 20% after the yearly Part B deductible. Medigap Plan N pays most of it, except up to $20 for some office visits and up to $50 for ER visits.",
};
const partBRule = (p: Plan) => PART_B_RULE[p.id] ?? "Original Medicare rule: after the yearly Part B deductible, Part B usually leaves you 20%. Your Medigap plan may pay some or all of it.";

let cache: Data | null = null;
function useData() {
  const [d, setD] = useState<Data | null>(cache);
  useEffect(() => { if (!cache) import("@/lib/cms2027-mi-services.json").then((m) => { cache = (m.default ?? m) as unknown as Data; setD(cache); }); }, []);
  return d;
}

const range = (r: Range, f: (n: number) => string) => (r[0] === r[1] ? f(r[0]) : `${f(r[0])}–${f(r[1])}`);
function cost(r: { c?: Range; p?: Range; z?: 1 } & Pick<Row, "days">): string | null {
  if (r.days?.length) return r.days.map(([amt, a, b]) => `${money(amt)} a day (days ${a}–${b})`).join("; ");
  const parts: string[] = [];
  if (r.c) parts.push(`${range(r.c, money)} copay`);
  if (r.p) parts.push(`${range(r.p, (n) => `${n}%`)} coinsurance`);
  if (parts.length) return parts.join(" or ");
  return r.z ? "$0" : null;
}
const yn = (v: 0 | 1 | undefined) => (v === undefined ? "Not listed" : v ? "Yes" : "No");

// Ranking key (never shown): $0 first, then lower copays, coinsurance after copays.
const weight = (r: Row | undefined) => {
  if (!r) return 1e6;
  if (r.z || (r.c && r.c[1] === 0 && !r.p)) return 0;
  if (r.days?.length) return r.days.reduce((s, [amt, a, b]) => s + amt * Math.min(b - a + 1, 5), 0) / 5;
  if (r.c) return r.c[1];
  if (r.p) return 1000 + r.p[1];
  return 1e6;
};

export function BenefitSearchPanel({ plan, areaPlans, chips, setChips }: { plan: Plan; areaPlans: Plan[]; chips: ServiceChip[]; setChips: (c: ServiceChip[]) => void }) {
  const data = useData();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showBest, setShowBest] = useState(false);

  const run = async () => {
    if (text.trim().length < 2) return;
    setBusy(true); setError("");
    try {
      const r = await matchServices({ data: { text } });
      if (r.ok) { setChips([...chips, ...r.items.filter((i) => !chips.some((c) => c.asked === i.asked))].slice(0, 10)); setText(""); }
      else setError(r.error);
    } catch { setError("Something went wrong. Please try again."); }
    setBusy(false);
  };

  const matched = chips.filter((c) => c.key);
  const best = data && showBest ? areaPlans.filter((p) => p.real).map((p) => {
    const rows = data.plans[p.id] ?? {};
    const zeros = matched.filter((c) => weight(rows[c.key!]) === 0).length;
    const total = matched.reduce((s, c) => s + weight(rows[c.key!]), 0);
    const auth = matched.filter((c) => rows[c.key!]?.a === 1).length;
    return { p, rows, zeros, total, auth };
  }).sort((a, b) => b.zeros - a.zeros || a.total - b.total || a.auth - b.auth) : [];
  const gapPlans = areaPlans.filter((p) => !p.real);

  return (
    <div className="mt-4 rounded-xl border-2 border-primary/40 bg-background p-4">
      <label htmlFor={`bs-${plan.id}`} className="block font-bold">What care do you expect to need?</label>
      <p className="text-sm text-muted-foreground">Type in plain words, like “2 MRIs, physical therapy and blood work.” We only match your words to CMS benefit categories — costs come straight from CMS data.</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input id={`bs-${plan.id}`} value={text} maxLength={500} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void run(); } }}
          className="min-h-12 flex-1 rounded-lg border-2 border-input bg-card px-3 text-base" placeholder="e.g. MRI, physical therapy" />
        <button type="button" onClick={run} disabled={busy} className="min-h-12 rounded-lg bg-primary px-5 font-bold text-primary-foreground disabled:opacity-60">{busy ? "Looking…" : "Search"}</button>
      </div>
      {error && <p role="alert" className="mt-2 text-destructive">{error}</p>}

      {chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Services you're checking">
          {chips.map((c) => (
            <li key={c.asked}><button type="button" onClick={() => setChips(chips.filter((x) => x !== c))} aria-label={`Remove ${c.asked}`}
              className="flex min-h-12 items-center gap-2 rounded-full border-2 bg-card px-4 text-sm">
              <span>{c.asked}{c.key && data ? <span className="text-muted-foreground"> → {data.services[c.key]}</span> : null}</span><span aria-hidden className="font-bold">✕</span></button></li>))}
        </ul>
      )}

      {chips.length > 0 && !data && <p className="mt-3">Loading plan benefits…</p>}
      {chips.length > 0 && data && (
        <div className="mt-4 space-y-3">
          {chips.map((c) => {
            if (!plan.real) return <div key={c.asked} className="rounded-lg border bg-card p-3"><p className="font-bold">{c.asked}</p><p className="text-sm">{partBRule(plan)}</p></div>;
            const r = c.key ? data.plans[plan.id]?.[c.key] : undefined;
            const v = r ? cost(r) : null;
            const oon = r?.o ? cost(r.o) : null;
            return (
              <div key={c.asked} className="rounded-lg border bg-card p-3">
                <p className="font-bold">{c.asked}{c.key ? <span className="font-normal text-muted-foreground"> · {data.services[c.key]}</span> : null}</p>
                {!c.key || !r || !v ? <p className="text-sm">{NOT_FOUND}</p> : (
                  <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 text-sm">
                    <dt className="font-bold">In network</dt><dd>{v}</dd>
                    {oon && <><dt className="font-bold">Out of network</dt><dd>{oon}</dd></>}
                    <dt className="font-bold">Prior approval</dt><dd>{yn(r.a)}</dd>
                    <dt className="font-bold">Referral</dt><dd>{yn(r.r)}</dd>
                    <dt className="font-bold">Deductible first</dt><dd>{yn(r.d)}</dd>
                  </dl>)}
              </div>);
          })}
          <p className="text-sm text-muted-foreground">Visit limits aren't in the CMS data — check the plan's Evidence of Coverage. These are the plan's stated costs from CMS 2027 data, not a quote.</p>
          {matched.length > 0 && <button type="button" onClick={() => setShowBest((s) => !s)} aria-expanded={showBest} className="min-h-12 rounded-lg border-2 border-primary px-5 font-bold text-primary">{showBest ? "Hide plan comparison" : "Which plans are best for these?"}</button>}
        </div>
      )}

      {showBest && data && (
        <div className="mt-4 space-y-3">
          <p className="text-sm">Plans in this county, sorted by the most $0 services, then lower copays, then fewer prior approvals. Stated costs only — not an estimate of your bill.</p>
          <ol className="space-y-3">
            {best.map(({ p, rows, auth }, i) => (
              <li key={p.id} className={`rounded-lg border-2 bg-card p-3 ${p.id === plan.id ? "border-primary" : ""}`}>
                <p className="font-bold">{i + 1}. {p.name}</p>
                <p className="text-sm text-muted-foreground">Premium {money(p.monthlyPremium)}/mo · Max out-of-pocket {p.oopMax === null ? "no limit" : money(p.oopMax)} (medical only, not drugs) · {auth} need prior approval</p>
                <ul className="mt-1 text-sm">
                  {matched.map((c) => { const r = rows[c.key!]; const v = r ? cost(r) : null; return <li key={c.asked}><span className="font-bold">{c.asked}:</span> {v ?? NOT_FOUND}</li>; })}
                </ul>
              </li>))}
            {gapPlans.map((p) => (
              <li key={p.id} className="rounded-lg border bg-card p-3">
                <p className="font-bold">{p.name}</p>
                <p className="text-sm text-muted-foreground">Premium {money(p.monthlyPremium)}/mo (typical estimate) · {p.oopMax === null ? "No yearly limit" : `Max ${money(p.oopMax)}`}</p>
                <p className="text-sm">{partBRule(p)}</p>
              </li>))}
          </ol>
        </div>
      )}
    </div>
  );
}
