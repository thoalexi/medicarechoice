import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchPlans, type SearchCriteria } from "@/lib/planSearch.functions";
import { BENEFITS, BENEFIT_LABEL, COV_LABEL, NET_LABEL } from "@/lib/planFilters";
import { PRIORITY_LABEL } from "@/lib/comparePrefs";

/** Lines describing what the search understood — built from validated criteria only, never model text. */
export function understoodLines(c: SearchCriteria): string[] {
  const out: string[] = [];
  if (c.county) out.push(`Location: ${c.county} County`);
  if (c.cov) out.push(`Coverage: ${COV_LABEL[c.cov]}`);
  if (c.net !== "any") out.push(`${c.cms.length ? c.cms.join(", ") : NET_LABEL[c.net]} ${c.netMode === "only" ? "only" : "preferred (other types still shown)"}`);
  if (c.carriers.length) out.push(`Insurer: ${c.carriers.join(" or ")}`);
  if (c.snp) out.push("Including Special Needs Plans");
  if (c.maxPremium !== null) out.push(`Monthly premium up to $${c.maxPremium}`);
  BENEFITS.forEach((b) => { if (c.req.includes(b)) out.push(`${BENEFIT_LABEL[b]}: Required`); else if (c.prefs.preferred[b]) out.push(`${BENEFIT_LABEL[b]}: Preferred`); });
  if (c.prefs.keepAnyDoctor) out.push("Keeping your current doctors matters");
  if (c.prefs.travels) out.push("Travel: Yes");
  if (c.prefs.priority !== "balanced") out.push(PRIORITY_LABEL[c.prefs.priority]);
  return out;
}

export function PlanSearch({ onApply }: { onApply: (c: SearchCriteria) => void }) {
  const run = useServerFn(searchPlans);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [understood, setUnderstood] = useState<string[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 3 || loading) return;
    setLoading(true); setError(null); setNotes([]); setUnderstood([]);
    try {
      const r = await run({ data: { query: q.trim() } });
      if (!r.ok) setError(r.error);
      else {
        const c = r.criteria;
        const n: string[] = [];
        if (r.needsLocation) n.push("You didn't mention where you live, so we kept the county already selected below. Add your city, county or ZIP to change it.");
        if (c.related.length) n.push(`${c.related.join(" and ")} ${c.related.length > 1 ? "are" : "is"} a related but separate insurer — you can search for it in the filters below.`);
        if (c.unknownInsurers.length) n.push(`We couldn't find an insurer called "${c.unknownInsurers.join('", "')}" in Michigan's 2027 plans, so we didn't filter by it.`);
        setNotes(n);
        setUnderstood(understoodLines(c));
        onApply(c);
      }
    } catch { setError("Something went wrong. Please try again."); }
    setLoading(false);
  }

  return (
    <section id="ai-search" aria-labelledby="ai-search-h" className="border-b bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 id="ai-search-h" className="font-display text-3xl font-bold">Find Plans Based on Your Needs</h1>
        <p className="mt-1 text-lg text-muted-foreground">Tell us what you're looking for, and we'll help you narrow down your options.</p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3 md:flex-row">
          <textarea aria-label="Describe what you're looking for" maxLength={500} rows={2} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="I live in Flint, want a Blue Cross PPO with dental and a low monthly cost."
            className="flex-1 rounded-lg border-2 border-input bg-background p-3 text-lg" />
          <button type="submit" disabled={loading || q.trim().length < 3} className="min-h-12 rounded-lg bg-primary px-6 py-3 text-lg font-bold text-primary-foreground disabled:opacity-50">
            {loading ? "Searching…" : "Find my plans"}
          </button>
        </form>
        <p className="mt-2 text-sm text-muted-foreground">Please don't include names, Medicare numbers or medical details. What you type is sent to our AI provider to understand it and isn't saved.</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-muted p-4 text-lg">{error}</p>}
        {understood.length > 0 && (
          <div role="status" className="mt-4 rounded-lg bg-card p-4">
            <p className="font-bold">Here's what we understood — applied to the filters below:</p>
            <p className="mt-1">{understood.join(" · ")}</p>
            {notes.map((n) => <p key={n} className="mt-2 text-muted-foreground">{n}</p>)}
            <a href="#compare-plans" className="mt-2 inline-flex min-h-12 items-center font-bold text-primary underline">See matching plans ↓</a>
          </div>
        )}
        {understood.length === 0 && notes.length > 0 && notes.map((n) => <p key={n} className="mt-2">{n}</p>)}
      </div>
    </section>
  );
}
