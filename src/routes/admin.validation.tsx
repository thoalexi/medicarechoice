import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import report from "@/lib/validation-report.json";
import prov from "@/lib/data-provenance.json";
import profiles from "@/lib/test-profile-results.json";
import { money } from "@/lib/plans";

export const Route = createFileRoute("/admin/validation")({
  head: () => ({
    meta: [
      { title: "Data validation report — PlainPlanGuide" },
      { name: "description", content: "Internal data checks for PlainPlanGuide plan data." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Data validation report" },
      { property: "og:description", content: "Internal data checks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Validation,
});

const BADGE: Record<string, string> = {
  pass: "bg-success text-primary-foreground", fail: "bg-destructive text-primary-foreground",
  unconfirmed: "bg-warning text-primary-foreground", changed: "bg-warning text-primary-foreground", baseline: "bg-muted text-foreground",
};
const LABEL: Record<string, string> = { pass: "Pass", fail: "Fail", unconfirmed: "Limit not confirmed", changed: "Changes found", baseline: "First snapshot" };

function downloadCsv() {
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Profile", "County", "ZIP", "Who", "Drugs", "Rank", "Our plan", "Plan ID", "Our yearly cost", "Our worst case", "Medicare.gov top plans", "Medicare.gov yearly cost", "Difference", "Why"];
  const lines = [head.map(q).join(",")];
  for (const r of profiles.results) r.top.forEach((t, i) => lines.push([`${r.id}. ${r.name}`, r.county, r.answers.zip, r.who, r.drugs, i + 1, t.name, t.id, t.total, t.worstCase ?? "No limit", "", "", "", ""].map(q).join(",")));
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = `plainplanguide-test-profiles-${profiles.ranAt}.csv`; a.click(); URL.revokeObjectURL(url);
}

function Validation() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-bold">Data validation report</h1>
        <p className="mt-2 text-muted-foreground">Last run {report.ranAt} against {report.source}. Overall: <strong>{report.status === "pass" ? "All checks pass" : "Some checks fail"}</strong>.</p>

        <h2 className="mt-10 text-2xl font-bold">Checks</h2>
        <ul className="mt-4 space-y-3">
          {report.checks.map((c) => (
            <li key={c.name} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-sm font-bold ${BADGE[c.status] ?? ""}`}>{LABEL[c.status] ?? c.status}</span><span className="font-bold">{c.name}</span></div>
              <p className="mt-2 text-sm">{c.detail}</p>
              {c.items.length > 0 && <details className="mt-2"><summary className="min-h-12 cursor-pointer font-bold text-primary">{c.count} item(s)</summary>
                <ul className="mt-2 list-disc pl-5 text-sm">{c.items.map((i) => <li key={i}>{i}</li>)}</ul></details>}
            </li>))}
        </ul>

        <h2 className="mt-10 text-2xl font-bold">Data sources</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Dataset</th><th className="p-3">CMS file</th><th className="p-3">Released</th><th className="p-3">Imported</th></tr></thead>
            <tbody>{prov.datasets.map((d) => <tr key={d.key} className="border-b align-top"><td className="p-3 font-bold">{d.label}</td><td className="p-3">{d.file}</td><td className="p-3">{d.released ?? "Not recorded"}</td><td className="p-3">{d.importedAt ?? "Looked up live"}</td></tr>)}</tbody></table>
        </div>

        <h2 className="mt-10 text-2xl font-bold">Test profiles</h2>
        <p className="mt-2">Results from the site's ranking on {profiles.ranAt}. Download the spreadsheet, check each profile on Medicare.gov Plan Finder with the same ZIP and drugs, and fill in the blank columns.</p>
        <button type="button" onClick={downloadCsv} className="mt-4 min-h-12 rounded-lg bg-primary px-5 font-bold text-primary-foreground">Download for hand-checking (CSV)</button>
        <div className="mt-6 space-y-4">
          {profiles.results.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-4">
              <p className="text-lg font-bold">{r.id}. {r.name} — {r.county} County (ZIP {r.answers.zip})</p>
              <p className="text-sm text-muted-foreground">{r.who} Drugs: {r.drugs}.</p>
              <ol className="mt-2 list-decimal pl-5">
                {r.top.map((t) => <li key={t.id}>{t.name} — {money(t.total)}/yr est. · worst case {t.worstCase === null ? "no limit" : money(t.worstCase)} <span className="text-sm text-muted-foreground">({t.id})</span></li>)}
              </ol>
            </div>))}
        </div>
      </main>
      <Disclaimer />
    </div>
  );
}
