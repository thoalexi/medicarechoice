import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import cms from "@/lib/cms2027-mi.json";

const URL = "https://plainplanguide.com/michigan-medicare-2027";
const TITLE = "Choosing Medicare Plans in Michigan (2027 Guide) — PlainPlanGuide";
const DESC = "A plain-language, step-by-step guide to choosing a 2027 Medicare plan in Michigan. Compare Medicare Advantage and Medigap options in every county with true yearly costs.";

export const Route = createFileRoute("/michigan-medicare-2027")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: "Choosing Medicare Plans in Michigan for 2027" },
      { property: "og:description", content: "Step-by-step help for Michigan seniors and families choosing 2027 Medicare coverage — no sales pitch." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: MichiganGuide,
});

const plans = cms.plans;
const TOTAL = plans.length;
const COUNTY_COUNT = new Set(plans.flatMap((p) => p.counties)).size;
const ZERO = plans.filter((p) => p.premium === 0).length;

const SECTIONS = [
  { id: "snapshot", label: "2027 snapshot" },
  { id: "steps", label: "4 steps" },
  { id: "deadlines", label: "Deadlines" },
  { id: "help", label: "Free help" },
];

const STEPS = [
  {
    title: "Choose your foundation",
    body: (
      <>
        <p><strong>Original Medicare + Medigap (like Plan G or N):</strong> see any doctor or hospital in the country that accepts Medicare. Higher monthly premiums, but predictable costs and almost no network limits.</p>
        <p className="mt-3"><strong>Medicare Advantage (HMO or PPO):</strong> low or $0 plan premiums, often with drug coverage and dental/vision extras — but you use the plan's network and may need approval before some care.</p>
      </>
    ),
  },
  {
    title: "Confirm your doctors and hospitals",
    body: (
      <>
        <p>Networks in Michigan differ a lot from plan to plan, even within the same county. Call your doctors' offices or use each plan's provider search before you choose.</p>
        <p className="mt-3">If you spend winters out of state or see specialists you trust, look closely at PPO plans or Medigap so you aren't stuck with out-of-network bills.</p>
      </>
    ),
  },
  {
    title: "Check your prescriptions",
    body: (
      <>
        <p>Every plan that covers drugs has its own formulary (list of covered drugs). Your yearly drug costs are capped — but only for drugs on the plan's list.</p>
        <p className="mt-3">A very expensive drug that isn't covered can change your total cost a lot. <Link to="/formulary-check" className="font-bold text-primary underline underline-offset-4">Check your drugs here</Link>.</p>
      </>
    ),
  },
  {
    title: "Compare the true yearly cost",
    body: (
      <>
        <p>A $0 premium plan can still cost thousands if you need surgery, many specialist visits, or therapy. Look at copays and the plan's yearly out-of-pocket limit — the most you'd pay for covered in-network medical care.</p>
        <p className="mt-3">Our comparison adds premiums, likely medical costs, and drug costs into one yearly estimate.</p>
      </>
    ),
  },
];

function MichiganGuide() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-14">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Back to home
        </Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-accent-foreground/70">Michigan · 2027 plan year</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">Choosing a Medicare plan in Michigan for 2027</h1>
        <p className="mt-5 text-lg text-muted-foreground sm:text-xl">Open Enrollment runs <strong className="text-foreground">October 15 – December 7</strong>. Here's what Michigan seniors and their families need to know to pick the right coverage — without the sales pitch.</p>

        <nav aria-label="Jump to a section" className="mt-6 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border-2 border-primary bg-card px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10">{s.label}</a>
          ))}
        </nav>

        <section id="snapshot" className="mt-12 scroll-mt-6">
          <h2 className="text-3xl font-bold">The Michigan 2027 snapshot</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              [String(TOTAL), "Medicare Advantage plans offered in Michigan"],
              [String(COUNTY_COUNT), "Michigan counties covered"],
              [String(ZERO), "plans with a $0 plan premium"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl border bg-card p-5">
                <p className="font-display text-4xl font-bold text-primary">{n}</p>
                <p className="mt-1 text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-lg">Even with a $0 plan premium, you still pay the standard Part B premium. How many plans you can pick from depends on your county — the Detroit area has many choices, while northern Michigan and the Upper Peninsula have fewer.</p>
          <p className="mt-2 text-sm text-muted-foreground">Counts from the official CMS 2027 Medicare Advantage files, including special needs plans.</p>
        </section>

        <section id="steps" className="mt-14 scroll-mt-6">
          <h2 className="text-3xl font-bold">4 steps to choose your plan</h2>
          <ol className="mt-6 space-y-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border bg-card p-6">
                <h3 className="text-2xl font-bold"><span className="text-primary">Step {i + 1}:</span> {s.title}</h3>
                <div className="mt-3 text-lg">{s.body}</div>
              </li>
            ))}
          </ol>
        </section>

        <section id="deadlines" className="mt-14 scroll-mt-6">
          <h2 className="text-3xl font-bold">Key dates</h2>
          <ul className="mt-5 space-y-4 text-lg">
            <li className="border-l-4 border-primary pl-5"><strong>October 15 – December 7:</strong> Annual Open Enrollment. Changes start January 1, 2027.</li>
            <li className="border-l-4 border-primary pl-5"><strong>January 1 – March 31:</strong> If you're in a Medicare Advantage plan, you can switch plans or go back to Original Medicare once.</li>
          </ul>
        </section>

        <section id="help" className="mt-14 scroll-mt-6">
          <h2 className="text-3xl font-bold">Free, unbiased help in Michigan</h2>
          <p className="mt-4 text-lg"><strong>MMAP</strong> (Michigan Medicare/Medicaid Assistance Program) offers free counseling at <a href="tel:18008037174" className="font-bold text-primary underline underline-offset-4">1-800-803-7174</a>. They don't sell insurance or earn commissions.</p>
          <p className="mt-3 text-lg"><strong>PlainPlanGuide</strong> lets you compare every Michigan plan by county, see estimated yearly costs, and check your drug list — free, with no insurer paying us.</p>
        </section>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/compare" className="rounded-xl bg-primary px-6 py-4 text-center text-lg font-bold text-primary-foreground hover:opacity-90">Compare 2027 Michigan plans →</Link>
          <Link to="/formulary-check" className="rounded-xl border-2 border-primary px-6 py-4 text-center text-lg font-bold text-primary hover:bg-primary/10">Check my prescriptions</Link>
          <Link to="/guide" className="rounded-xl border-2 border-primary px-6 py-4 text-center text-lg font-bold text-primary hover:bg-primary/10">Take the 3-minute questionnaire</Link>
        </div>
      </main>
      <Disclaimer />
    </div>
  );
}
