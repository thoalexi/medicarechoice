import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquareHeart } from "lucide-react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedicareChoice — Plain-language Medicare plan guide" },
      { name: "description", content: "Answer a few simple questions and see which Medicare plan fits your health, doctors, and budget—with true yearly costs." },
      { property: "og:title", content: "MedicareChoice — Plain-language Medicare plan guide" },
      { property: "og:description", content: "Transparent Medicare recommendations with true yearly costs and trade-offs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const parts = [
  ["Part A", "Hospital stays. Usually free if you worked 10+ years."],
  ["Part B", "Doctor visits & outpatient care. About $203/month in 2026."],
  ["Part C", "Medicare Advantage—private plans that replace A & B, often with extras."],
  ["Part D", "Prescription drugs. Your yearly drug costs are capped ($2,100 in 2026; 2027 cap not yet confirmed)."],
  ["Medigap", "Extra insurance that fills Original Medicare's 20% gap."],
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="py-10 md:py-24">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-accent-foreground/70 sm:text-base">For seniors & the families helping them</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">Pick the right Medicare plan—without the fine print headache.</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">Tell us about your doctors, medicines, and budget. We'll show you which plans fit, what you'll really pay in a year, and what you give up with each.</p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
            <Link to="/guide" className="rounded-xl bg-primary px-8 py-5 text-center text-xl font-bold text-primary-foreground shadow-md hover:opacity-90">Start the guided questions →</Link>
            <span className="text-muted-foreground">About 3 minutes · 7 questions</span>
          </div>
          <section className="mt-12 border-y py-10" aria-labelledby="why-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="font-bold uppercase text-primary">Why this website exists</p><h2 id="why-heading" className="mt-2 text-3xl font-bold">Medicare guidance built around families—not insurers.</h2></div>
              <Link to="/about" className="font-bold text-primary underline underline-offset-4">Read our story →</Link>
            </div>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {[
                ["Independent", "No insurer pays us to rank their plans higher."],
                ["Free, always", "No accounts, no paywalls, no upsells."],
                ["Plain language", "Every estimate shows the trade-offs it left out."],
              ].map(([title, description]) => <article key={title} className="border-l-4 border-primary pl-5"><h3 className="text-2xl font-bold">{title}</h3><p className="mt-2 text-muted-foreground">{description}</p></article>)}
            </div>
          </section>
          <div className="mt-8 rounded-xl border-2 border-dashed border-accent bg-card p-5 text-lg">
            Don't want to answer questions?{" "}
            <Link to="/compare" className="font-bold text-primary underline underline-offset-4">Click here for the comparison dashboard</Link>, or <Link to="/compare" hash="ai-search" className="font-bold text-primary underline underline-offset-4">just describe what you want</Link>.
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
        <section className="mb-16 rounded-2xl border-2 border-primary/40 bg-secondary p-6 sm:p-8" aria-labelledby="feedback-heading">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/12 text-primary"><MessageSquareHeart className="size-7" aria-hidden /></span>
            <div className="flex-1">
              <h2 id="feedback-heading" className="text-2xl font-bold sm:text-3xl">Spotted something wrong or confusing?</h2>
              <p className="mt-2 text-lg text-muted-foreground">This site is new and still being tested. Tell us what didn't work — we read every note, and it's how the site gets better.</p>
            </div>
            <Link to="/feedback" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-lg font-bold text-primary-foreground shadow-md transition hover:opacity-90">
              <MessageSquareHeart className="size-5" aria-hidden /> Send feedback
            </Link>
          </div>
        </section>
      </main>
      <Disclaimer />
    </div>
  );
}
