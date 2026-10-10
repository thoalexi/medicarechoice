import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShieldCheck, BookOpenText } from "lucide-react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Why MedicareChoice exists — Our story" },
      { name: "description", content: "MedicareChoice began with one daughter helping her single mother make sense of Medicare uncertainty and jargon." },
      { property: "og:title", content: "Why MedicareChoice exists" },
      { property: "og:description", content: "A daughter’s story of building a free, independent, plain-language Medicare guide for her mother and families like hers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b bg-secondary/60">
          <div className="mx-auto max-w-4xl px-6 py-14 md:py-20">
            <p className="font-bold uppercase text-primary">Our story</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">I built MedicareChoice for my mother.</h1>
            <p className="mt-6 max-w-3xl whitespace-pre-line text-xl leading-relaxed text-muted-foreground">
              {"My single mother was trying to make an important Medicare decision while facing uncertainty, unfamiliar terms, and pages of fine print. I wanted her to have a place that explained the choices clearly, without pressure, sales pitches, or jargon.\n\nAs I built the site, she became one of its most important sources of feedback. She showed me which terms were confusing, where explanations still felt too complicated, and what information actually helped her feel more confident in making a decision. Her experience helped shape the website into something designed around the questions real people have when navigating Medicare.\n\nIs it perfect? No. But I think my mom said it best: “If we could help just one person, it would be worth it. One elderly person who could make an informed decision. You always wanted to help the elderly.”\n\nThat’s ultimately why we built this site. If it can make an overwhelming decision a little clearer, help someone understand what they’re actually choosing, or give a family a little more confidence that they’re making the right decision for themselves, then it has done what we hoped it would do."}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-12">
          <h2 className="text-3xl font-bold">That personal need became this website</h2>
          <p className="mt-4 text-lg leading-relaxed">
            MedicareChoice is for seniors and the adult children, relatives, and friends helping them. It brings plan details together, estimates the costs that are easy to overlook, and explains the trade-offs in everyday language. It cannot remove every uncertainty, but it can help families know which questions to ask before enrolling.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="border-t-4 border-primary pt-5">
              <ShieldCheck className="size-7 text-primary" aria-hidden />
              <h2 className="mt-3 text-2xl font-bold">Independent</h2>
              <p className="mt-2">No insurer pays us to rank their plans higher.</p>
            </article>
            <article className="border-t-4 border-accent pt-5">
              <Heart className="size-7 text-primary" aria-hidden />
              <h2 className="mt-3 text-2xl font-bold">Free, always</h2>
              <p className="mt-2">No accounts, no paywalls, no upsells.</p>
            </article>
            <article className="border-t-4 border-success pt-5">
              <BookOpenText className="size-7 text-primary" aria-hidden />
              <h2 className="mt-3 text-2xl font-bold">Plain language</h2>
              <p className="mt-2">Every estimate shows the trade-offs it left out.</p>
            </article>
          </div>

          <section className="mt-12">
            <h2 className="text-3xl font-bold">How we fund this site</h2>
            <div className="mt-4 space-y-3 text-lg leading-relaxed">
              <p>MedicareChoice is paid for only by donations from visitors. We take no money from insurance companies, show no ads, and earn no commissions.</p>
              <p>Donations pay for website hosting, the AI tools behind the plan search and drug checker, and the time it takes to update plan data each year.</p>
              <p>Donors have no say in how plans are ranked or what the site says. Every visitor sees the same results, whether they give or not. <Link to="/methodology" className="font-bold text-primary underline">See how we compare plans</Link>.</p>
            </div>
          </section>

          <div className="mt-12 border-l-4 border-accent bg-secondary p-6">
            <h2 className="text-2xl font-bold">A women-owned resource</h2>
            <p className="mt-2 text-lg">Donations support this women-owned business and help keep MedicareChoice free, independent, and up to date.</p>
            <div className="mt-5 flex flex-wrap gap-4">
              <Link to="/guide" className="rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground">Start the guided questions</Link>
              <Link to="/donate" className="rounded-lg border-2 border-primary px-5 py-3 font-bold text-primary">Support MedicareChoice</Link>
            </div>
          </div>
        </section>
      </main>
      <Disclaimer />
    </div>
  );
}