import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchPlans, type PlanMatch } from "@/lib/planSearch.functions";
import { money } from "@/lib/plans";

export function PlanSearch({ onResults }: { onResults: (county: string | null, ids: string[]) => void }) {
  const run = useServerFn(searchPlans);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [matches, setMatches] = useState<PlanMatch[]>([]);
  const [county, setCounty] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 3 || loading) return;
    setLoading(true); setError(null); setFollowUp(null); setMatches([]);
    try {
      const r = await run({ data: { query: q.trim() } });
      if (!r.ok) setError(r.error);
      else if (r.followUp) setFollowUp(r.followUp);
      else { setMatches(r.matches); setCounty(r.county); if (r.matches.length === 0) setError("No plans matched everything you asked for. Try loosening a requirement."); }
    } catch { setError("Something went wrong. Please try again."); }
    setLoading(false);
  }

  return (
    <section id="ai-search" className="mx-auto max-w-6xl px-6 pt-10">
      <div className="rounded-2xl border-2 border-primary/40 bg-card p-6">
        <h1 className="font-display text-3xl font-bold">Tell us what matters to you</h1>
        <p className="mt-1 text-muted-foreground">Describe it in your own words and we'll suggest the 3 best-fitting plans.</p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3 md:flex-row">
          <textarea aria-label="Describe what you're looking for" maxLength={500} rows={2} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="I live in Lansing, see my doctor at Sparrow, want dental and a low monthly cost."
            className="flex-1 rounded-lg border-2 border-input bg-background p-3 text-lg" />
          <button type="submit" disabled={loading || q.trim().length < 3} className="rounded-lg bg-primary px-6 py-3 text-lg font-bold text-primary-foreground disabled:opacity-50">
            {loading ? "Searching…" : "Find my plans"}
          </button>
        </form>
        {followUp && <p className="mt-4 rounded-lg bg-muted p-4 text-lg">{followUp} <span className="text-muted-foreground">Add it to your description and search again.</span></p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-muted p-4 text-lg">{error}</p>}
        {matches.length > 0 && (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {matches.map((m, i) => (
                <div key={m.id} className="rounded-xl border-2 bg-background p-4">
                  <div className="text-sm font-bold text-primary">#{i + 1} match</div>
                  <h2 className="text-lg font-bold">{m.name}</h2>
                  <div className="text-sm text-muted-foreground">{m.type} · {m.carrier}</div>
                  <div className="mt-2">Premium <b>{money(m.monthlyPremium)}/mo</b></div>
                  <div>True yearly cost <b>{money(m.total)}</b></div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {m.reasons.map((r) => <li key={r}>✓ {r}</li>)}
                    {m.cautions.map((c) => <li key={c}>⚠ {c}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <button onClick={() => onResults(county, matches.map((m) => m.id))} className="mt-4 rounded-lg border-2 border-primary px-5 py-2 font-bold text-primary">
              Compare these {matches.length} side by side
            </button>
            <p className="mt-3 text-sm text-muted-foreground">Estimates only, using official CMS 2027 plan data. Check each plan's formulary for your drugs and confirm with Medicare.gov or Michigan MMAP (1-800-803-7174) before enrolling.</p>
          </>
        )}
      </div>
    </section>
  );
}
