import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedicareChoice — Plain-language Medicare plan guide" },
      { name: "description", content: "Answer a few simple questions and see which Medicare plan fits your health, doctors, and budget—with true yearly costs." },
      { property: "og:title", content: "MedicareChoice — Plain-language Medicare plan guide" },
      { property: "og:description", content: "Transparent Medicare recommendations with true yearly costs and trade-offs." },
    ],
  }),
  component: Index,
});

const parts = [
  ["Part A", "Hospital stays. Usually free if you worked 10+ years."],
  ["Part B", "Doctor visits & outpatient care. About $203/month in 2026."],
  ["Part C", "Medicare Advantage—private plans that replace A & B, often with extras."],
  ["Part D", "Prescription drugs. Your yearly drug costs are capped at $2,100."],
  ["Medigap", "Extra insurance that fills Original Medicare's 20% gap."],
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6">
        <section className="py-16 md:py-24">
          <p className="mb-4 font-bold uppercase tracking-widest text-accent-foreground/70">For seniors & the families helping them</p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-6xl">Pick the right Medicare plan—without the fine print headache.</h1>
          <p className="mt-6 max-w-2xl text-xl text-muted-foreground">Tell us about your doctors, medicines, and budget. We'll show you which plans fit, what you'll really pay in a year, and what you give up with each.</p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/guide" className="rounded-xl bg-primary px-8 py-5 text-xl font-bold text-primary-foreground shadow-md hover:opacity-90">Start the guided questions →</Link>
            <span className="text-muted-foreground">About 3 minutes · 7 questions</span>
          </div>
          <div className="mt-8 rounded-xl border-2 border-dashed border-accent bg-card p-5 text-lg">
            Don't want to answer questions?{" "}
            <Link to="/compare" className="font-bold text-primary underline underline-offset-4">Click here for the comparison dashboard</Link>.
          </div>
        </section>
        <section className="pb-16">
          <h2 className="mb-6 text-3xl font-bold">Medicare in one minute</h2>
          <div className="grid gap-4 md:grid-cols-5">
            {parts.map(([t, d]) => (
              <div key={t} className="rounded-xl border bg-card p-5">
                <div className="font-display text-2xl font-bold text-primary">{t}</div>
                <p className="mt-2 text-base">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-secondary p-6"><h3 className="text-2xl font-bold">Original Medicare + Medigap</h3><p className="mt-2">Higher monthly cost, but see any doctor in the U.S. and almost no surprise bills.</p></div>
            <div className="rounded-xl bg-secondary p-6"><h3 className="text-2xl font-bold">Medicare Advantage (HMO / PPO)</h3><p className="mt-2">Low or $0 monthly cost and often dental/vision, but networks, referrals, and higher costs in a bad year.</p></div>
          </div>
        </section>
      </main>
      <Disclaimer />
    </div>
  );
}
