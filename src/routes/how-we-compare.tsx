import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";

export const Route = createFileRoute("/how-we-compare")({
  head: () => ({
    meta: [
      { title: "How we compare Medicare plans — MedicareChoice" },
      { name: "description", content: "Where our Michigan 2027 plan data comes from, how true yearly cost and worst case are estimated, and how the best match is chosen." },
      { property: "og:title", content: "How MedicareChoice compares plans" },
      { property: "og:description", content: "Official CMS data, honest cost estimates, and rankings that never depend on who offers the plan." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://medicarechoice.app/how-we-compare" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://medicarechoice.app/how-we-compare" }],
  }),
  component: HowWeCompare,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 text-lg leading-relaxed">{children}</div>
    </section>
  );
}

function HowWeCompare() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="font-bold uppercase text-primary">Our method</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">How we compare plans</h1>

        <Section title="Where the plan data comes from">
          <p>Every Michigan plan, price and benefit comes from official files published by CMS, the federal agency that runs Medicare: the 2027 Medicare Advantage and Part D Landscape files and the 2027 Plan Benefit Package files. We don't type in or estimate plan figures by hand.</p>
          <p>CMS hasn't released 2027 star ratings yet, so we show 2026 ratings, labeled "2026." New plans show "New — no rating yet." Medigap prices are typical estimates and are labeled that way.</p>
        </Section>

        <Section title="True yearly cost">
          <p>Our estimate of a typical year: 12 months of the plan's premium, plus the standard Part B premium, plus a separate Part D drug plan premium if the plan doesn't cover drugs. We add your likely medical costs using the plan's real copays and deductible, and your drug costs using the plan's drug deductible, up to the Part D cap.</p>
        </Section>

        <Section title="Worst case">
          <p>What a very bad year could cost: premiums, plus the plan's medical out-of-pocket limit, plus the Part D drug cap. A Medicare Advantage plan's out-of-pocket limit does <strong>not</strong> include drugs, so we add the drug cap separately. Original Medicare alone has no yearly limit.</p>
        </Section>

        <Section title="How the “Best match” is chosen">
          <p>We start with the estimated true yearly cost. Then we adjust for your answers: whether you want to keep any doctor, whether you prefer peace of mind or a lower premium, whether you travel, and which extras you want (dental, vision, hearing).</p>
          <p>When two plans cost within about $250 of each other in a typical year, the one with the lower worst case ranks higher, and we tell you they cost about the same.</p>
          <p>Special Needs Plans are always listed last, because only people who meet certain rules can join them.</p>
        </Section>

        <Section title="What never affects rankings">
          <p>Who offers the plan. Payments from insurers (we take none). Donations: donors have no say in rankings or content.</p>
        </Section>

        <Section title="What our estimates can't tell you">
          <ul className="list-disc space-y-2 pl-5">
            <li>These are estimates, not quotes. Your real costs depend on the care you use.</li>
            <li>Drug estimates assume your medicines are on the plan's formulary. <Link to="/formulary-check" className="font-bold text-primary underline">Check my drugs</Link>.</li>
            <li>Medicare data doesn't list which hospitals are in each plan's network. Always confirm your doctors and hospitals with the plan.</li>
          </ul>
          <p>For free, unbiased help, call Michigan MMAP at 1-800-803-7174, or visit Medicare.gov.</p>
        </Section>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/guide" className="inline-flex min-h-12 items-center rounded-lg bg-primary px-5 font-bold text-primary-foreground">Start the guided questions</Link>
          <Link to="/compare" className="inline-flex min-h-12 items-center rounded-lg border-2 border-primary px-5 font-bold text-primary">Compare plans</Link>
        </div>
      </main>
      <Disclaimer />
    </div>
  );
}
