import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Pill, Plus, Trash2, FileText, CheckCircle2, AlertTriangle, HelpCircle, Loader2, ExternalLink } from "lucide-react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { checkFormulary } from "@/lib/formulary.functions";
import type { FormularyReport } from "@/lib/ai/formulary.server";
import { PLANS } from "@/lib/plans";
import { CARRIER_FORMULARY_URLS, MEDICARE_PLAN_FINDER_URL } from "@/lib/formulary-links";

export const Route = createFileRoute("/formulary-check")({
  head: () => ({
    meta: [
      { title: "Check my drugs against a plan's formulary — MedicareChoice" },
      { name: "description", content: "List your medications, upload a Medicare plan's official drug list (formulary), and get a plain-language read of tiers, restrictions, costs and gaps." },
      { property: "og:title", content: "Check my drugs — MedicareChoice" },
      { property: "og:description", content: "See whether your medications are on a plan's formulary, at what tier, and what to verify before enrolling." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FormularyCheck,
});

type Row = { name: string; dose: string };
const MAX_BYTES = 20 * 1024 * 1024;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function FormularyCheck() {
  const run = useServerFn(checkFormulary);
  const [rows, setRows] = useState<Row[]>([{ name: "", dose: "" }]);
  const [planName, setPlanName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FormularyReport | null>(null);
  const [showLookup, setShowLookup] = useState(false);
  const planNames = useMemo(() => Array.from(new Set(PLANS.map((p) => p.name))).sort(), []);
  const selectedPlan = PLANS.find((p) => p.name === planName);
  const carrierLookup = selectedPlan ? CARRIER_FORMULARY_URLS[selectedPlan.carrier] : undefined;

  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const drugs = rows.filter((r) => r.name.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!drugs.length) return setError("Please add at least one medication.");
    setShowLookup(false);
    if (!file) {
      if (!selectedPlan) return setError("Please choose a plan so we can send you to its official drug lookup.");
      setReport(null);
      setShowLookup(true);
      return;
    }
    if (file.type !== "application/pdf") return setError("The formulary must be a PDF file.");
    if (file.size > MAX_BYTES) return setError("That file is larger than 20 MB. Try the plan's shorter 'abridged' drug list, or check by phone.");
    setBusy(true);
    setReport(null);
    try {
      const res = await run({
        data: {
          drugs: drugs.map((d) => ({ name: d.name.trim(), dose: d.dose.trim() || null })),
          planName: planName.trim() || null,
          fileName: file.name.slice(0, 200),
          pdfBase64: await toBase64(file),
        },
      });
      if (res.ok) setReport(res.report);
      else setError(res.error);
    } catch {
      setError("Something went wrong sending your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-4xl font-bold">Check my drugs</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Every plan that covers prescriptions has its own <strong>formulary</strong> — its list of covered drugs. List your medications and choose a plan. Upload its formulary for an AI-powered document review, or continue without a PDF to use the plan’s official drug lookup.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-8">
          <section className="rounded-2xl border-2 bg-card p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold"><Pill className="size-5 text-primary" aria-hidden /> 1. Your medications</h2>
            <div className="mt-4 space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input aria-label={`Medication ${i + 1} name`} placeholder="Drug name (e.g. Eliquis)" maxLength={100} value={r.name} onChange={(e) => update(i, { name: e.target.value })} className="min-w-0 flex-[2] rounded-xl border-2 border-input bg-background p-3 text-lg" />
                  <input aria-label={`Medication ${i + 1} strength`} placeholder="Strength (optional)" maxLength={100} value={r.dose} onChange={(e) => update(i, { dose: e.target.value })} className="min-w-0 flex-1 rounded-xl border-2 border-input bg-background p-3 text-lg" />
                  {rows.length > 1 && (
                    <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Remove medication ${i + 1}`} className="rounded-xl border-2 px-3 text-muted-foreground hover:text-destructive"><Trash2 className="size-5" /></button>
                  )}
                </div>
              ))}
            </div>
            {rows.length < 30 && (
              <button type="button" onClick={() => setRows([...rows, { name: "", dose: "" }])} className="mt-3 inline-flex items-center gap-2 font-bold text-primary"><Plus className="size-5" aria-hidden /> Add another</button>
            )}
          </section>

          <section className="rounded-2xl border-2 bg-card p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold"><FileText className="size-5 text-primary" aria-hidden /> 2. The plan's formulary</h2>
            <label className="mt-4 block text-lg font-bold">Plan name {file ? "(optional)" : "(needed without a PDF)"}
              <select value={planName} onChange={(e) => { setPlanName(e.target.value); setShowLookup(false); }} className="mt-2 block w-full rounded-xl border-2 border-input bg-background p-3 text-lg font-normal">
                <option value="">Choose a plan</option>
                {planNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-lg font-bold">Formulary PDF (optional, up to 20 MB)
              <input type="file" accept="application/pdf" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setShowLookup(false); }} className="mt-2 block w-full rounded-xl border-2 border-dashed border-input bg-background p-4 text-base font-normal" />
            </label>
            <p className="mt-3 text-sm text-muted-foreground">For a detailed AI review, upload the plan’s official “Drug List,” “Formulary,” or “Covered Drugs” PDF for 2027. Please don’t upload documents with your personal information. Nothing you send is saved.</p>
          </section>

          {error && <p role="alert" className="rounded-xl border-2 border-destructive/40 bg-destructive/10 p-4 text-lg text-destructive">{error}</p>}

          <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-xl font-bold text-primary-foreground disabled:opacity-60 sm:w-auto">
            {busy ? <><Loader2 className="size-5 animate-spin" aria-hidden /> Reading the formulary… this can take a minute</> : file ? "Review this formulary" : "Find the official drug lookup"}
          </button>
        </form>

        {showLookup && selectedPlan && (
          <section className="mt-8 border-l-4 border-primary bg-secondary p-6" aria-live="polite">
            <h2 className="text-2xl font-bold">Check your drugs with {selectedPlan.carrier}</h2>
            <p className="mt-3">Have your medication names, strengths, and how often you take them ready. The official lookup is the best place to confirm whether each drug is covered, its tier, restrictions, and what you may pay.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {carrierLookup && <a href={carrierLookup} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground">Open {selectedPlan.carrier} drug lookup <ExternalLink className="size-4" aria-hidden /></a>}
              <a href={MEDICARE_PLAN_FINDER_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border-2 border-primary bg-background px-5 py-3 font-bold text-primary">Open Medicare Plan Finder <ExternalLink className="size-4" aria-hidden /></a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">MedicareChoice has not checked your medications in this path. Confirm every drug and cost in the plan’s official formulary before enrolling.</p>
          </section>
        )}

        {report && <Report report={report} />}
      </main>
      <Disclaimer />
    </div>
  );
}

const STATUS = {
  found: { label: "Listed", Icon: CheckCircle2, cls: "text-primary" },
  not_found: { label: "Not found", Icon: AlertTriangle, cls: "text-destructive" },
  unclear: { label: "Unclear", Icon: HelpCircle, cls: "text-muted-foreground" },
} as const;

function Report({ report }: { report: FormularyReport }) {
  return (
    <section className="mt-10 space-y-6" aria-live="polite">
      <h2 className="font-display text-3xl font-bold">What we found{report.planName ? ` in ${report.planName}` : ""}</h2>
      <div className="space-y-4">
        {report.drugs.map((d, i) => {
          const s = STATUS[d.status];
          return (
            <article key={i} className="rounded-2xl border-2 bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold">{d.name}</h3>
                <span className={`inline-flex items-center gap-1 font-bold ${s.cls}`}><s.Icon className="size-5" aria-hidden />{s.label}</span>
              </div>
              <dl className="mt-3 grid gap-2 text-base sm:grid-cols-2">
                {d.matchedAs && <div><dt className="text-sm text-muted-foreground">Listed as</dt><dd>{d.matchedAs}</dd></div>}
                {d.tier && <div><dt className="text-sm text-muted-foreground">Tier</dt><dd className="font-bold">{d.tier}</dd></div>}
                {d.statedCost && <div><dt className="text-sm text-muted-foreground">Cost stated in document</dt><dd>{d.statedCost}</dd></div>}
                {d.page && <div><dt className="text-sm text-muted-foreground">Page</dt><dd>{d.page}</dd></div>}
              </dl>
              {d.restrictions.length > 0 && (
                <ul className="mt-3 list-disc pl-6 text-base">{d.restrictions.map((r, j) => <li key={j}>{r}</li>)}</ul>
              )}
              <p className="mt-3 text-muted-foreground">{d.note}</p>
            </article>
          );
        })}
      </div>
      {report.gaps.length > 0 && (
        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5">
          <h3 className="flex items-center gap-2 text-xl font-bold"><AlertTriangle className="size-5 text-destructive" aria-hidden /> Possible gaps</h3>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-lg">{report.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
        </div>
      )}
      <div className="rounded-2xl border-2 bg-card p-5">
        <h3 className="text-xl font-bold">Before you enroll, verify</h3>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-lg">{report.verify.map((v, i) => <li key={i}>{v}</li>)}</ul>
      </div>
      <p className="text-sm text-muted-foreground">This is an AI reading of the document and it can miss things. The plan's own formulary and the plan's member services are the final word. Copays for each tier are often listed in the plan's Summary of Benefits rather than the formulary. Free help: Michigan MMAP counselors, 1-800-803-7174.</p>
    </section>
  );
}
