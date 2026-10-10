import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Disclaimer } from "@/components/SiteHeader";
import { money, PART_D_OOP_CAP } from "@/lib/plans";

export const Route = createFileRoute("/what-does-medicare-cover")({
  head: () => ({
    meta: [
      { title: "What Does Medicare Cover? Dental, Vision, Hearing & More — MedicareChoice" },
      { name: "description", content: "Plain-language answers: does Medicare cover dental, vision, hearing aids, cataract surgery, and prescriptions? What Original Medicare, Part D, Medigap, and Medicare Advantage each cover — and how to compare plans in your county." },
      { property: "og:title", content: "What Does Medicare Cover? — MedicareChoice" },
      { property: "og:description", content: "Plain-language answers on dental, vision, hearing aids, cataract surgery, and prescription drugs under Original Medicare, Part D, Medigap, and Medicare Advantage." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://medicarechoice.app/what-does-medicare-cover" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://medicarechoice.app/what-does-medicare-cover" }],
  }),
  component: WhatDoesMedicareCover,
});

const SECTIONS = [
  { id: "basics", label: "The basics" },
  { id: "dental", label: "Dental" },
  { id: "vision", label: "Vision" },
  { id: "hearing", label: "Hearing aids" },
  { id: "preventive", label: "Preventive care" },
  { id: "cataract", label: "Cataract surgery" },
  { id: "summary", label: "Quick summary" },
];

function JumpPills() {
  return (
    <nav aria-label="Jump to a topic" className="mt-6 flex flex-wrap gap-2">
      {SECTIONS.map((s) => (
        <a key={s.id} href={`#${s.id}`} className="rounded-full border-2 border-primary bg-card px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10">
          {s.label}
        </a>
      ))}
    </nav>
  );
}

function CompareCta({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-xl border-2 border-primary bg-primary/5 p-4 text-base">
      {children}{" "}
      <Link to="/compare" className="font-bold text-primary underline">Compare plans in your county →</Link>
    </p>
  );
}

function WhatDoesMedicareCover() {
  return (
    <>
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-base font-bold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        Back to home
      </Link>
      <h1 className="mt-4 font-display text-4xl font-bold">What does Medicare cover?</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The honest answer is: it depends on which kind of Medicare you have. Here's what Original Medicare,
        Part D, Medigap, and Medicare Advantage each cover for the things people ask about most — including
        prescriptions — in plain language.
      </p>
      <JumpPills />

      <section id="basics" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">The basics: the four parts, and one add-on</h2>
        <p className="mt-4 text-lg">Medicare comes in four parts — A, B, C and D — plus one optional add-on policy, Medigap. Here's how they fit together:</p>
        <ul className="mt-4 list-disc space-y-3 pl-6 text-lg">
          <li><strong>Original Medicare (Parts A & B)</strong> covers hospital stays and medical care like doctor visits. It does <em>not</em> cover most dental, routine vision, hearing aids, or prescriptions.</li>
          <li><strong>Part D (prescription drugs)</strong> is a separate plan sold by private insurers. Your yearly drug costs are capped ({money(PART_D_OOP_CAP)} in 2026; 2027 not yet confirmed) — but only for drugs on that plan's own list. <Link to="/formulary-check" className="font-bold text-primary underline">Check your medications here</Link>.</li>
          <li><strong>Medicare Advantage (Part C)</strong> plans are run by private insurers. They must cover everything Original Medicare does, most include Part D drug coverage, and many add extras like dental, vision, and hearing — but the details vary plan by plan and county by county.</li>
          <li><strong>Medigap</strong> is add-on insurance that helps pay what Original Medicare leaves behind. It doesn't add benefits like dental, vision, or drug coverage, and it can't be used with a Medicare Advantage plan.</li>
        </ul>
      </section>

      <section id="dental" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Does Medicare cover dental?</h2>
        <p className="mt-4 text-lg"><strong>Original Medicare: essentially no.</strong> It doesn't cover cleanings, fillings, extractions, dentures, or implants. It only pays for dental work that's part of a covered medical procedure — for example, a tooth extraction needed before jaw surgery.</p>
        <p className="mt-4 text-lg"><strong>Medicare Advantage: often yes.</strong> Most plans include some dental, but there's a big difference between "cleanings only" and coverage that includes fillings, crowns, and dentures. Check each plan's Summary of Benefits for annual dollar limits and which services are covered.</p>
        <CompareCta>Dental coverage varies enormously between plans in the same county.</CompareCta>
      </section>

      <section id="vision" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Does Medicare cover vision?</h2>
        <p className="mt-4 text-lg"><strong>Original Medicare: mostly no.</strong> Routine eye exams and glasses aren't covered. It does cover eye care for medical conditions — glaucoma tests for people at risk, diabetic eye exams, and treatment for macular degeneration.</p>
        <p className="mt-4 text-lg"><strong>Medicare Advantage: often yes.</strong> Many plans include a yearly routine eye exam and an allowance toward glasses or contact lenses. The allowance amount differs by plan.</p>
        <CompareCta>If glasses or contacts matter to you, compare each plan's eyewear allowance.</CompareCta>
      </section>

      <section id="hearing" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Does Medicare cover hearing aids?</h2>
        <p className="mt-4 text-lg"><strong>Original Medicare: no.</strong> Hearing aids and the exams to fit them are not covered — one of the biggest gaps in Original Medicare, since hearing aids can cost thousands of dollars.</p>
        <p className="mt-4 text-lg"><strong>Medicare Advantage: sometimes.</strong> Many plans include hearing exams and a hearing aid benefit, but the allowance and how often you can use it vary widely. Some plans offer a set dollar amount every one to three years; others use copays through specific suppliers.</p>
        <CompareCta>Hearing benefits differ more than almost any other extra — worth comparing closely.</CompareCta>
      </section>

      <section id="preventive" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Does Medicare cover preventive care like mammograms?</h2>
        <p className="mt-4 text-lg"><strong>Yes — usually at $0.</strong> Original Medicare (Part B) covers many preventive services with no deductible and no copay, as long as your provider accepts Medicare. Medicare Advantage plans must cover them at $0 too when you use an in-network provider.</p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-lg">
          <li><strong>Screening mammograms</strong> once every 12 months for women 40 and older</li>
          <li><strong>Colorectal cancer screenings</strong>, including colonoscopies</li>
          <li><strong>Yearly "Wellness" visit</strong> to make a prevention plan with your doctor</li>
          <li><strong>Flu, COVID-19, pneumonia and hepatitis B shots</strong> (shingles and some others are covered under Part D)</li>
          <li><strong>Other screenings</strong> such as bone density, diabetes, heart disease, depression, and lung cancer for people who qualify</li>
        </ul>
        <p className="mt-4 rounded-xl border-2 border-accent bg-accent/10 p-4 text-lg"><strong>Watch for this surprise bill:</strong> a test is free when it's a routine <em>screening</em>. If it's <em>diagnostic</em> — checking a lump, a symptom, or an earlier abnormal result — your normal deductible and 20% share (or plan copay) can apply. The same goes if a polyp is removed during a screening colonoscopy, or if you bring up a new health problem during your free Wellness visit. When in doubt, ask the office before your appointment: "Will this be billed as preventive?"</p>
        <CompareCta>Preventive care is covered no matter which kind of Medicare you choose.</CompareCta>
      </section>

      <section id="cataract" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Does Medicare cover cataract surgery?</h2>
        <p className="mt-4 text-lg"><strong>Yes — this one is covered.</strong> Cataract surgery is medical care, not routine vision, so Original Medicare Part B covers it (you pay the Part B deductible and typically 20% of the approved amount). Medicare even covers one pair of glasses or contact lenses after the surgery.</p>
        <p className="mt-4 text-lg"><strong>With Medicare Advantage,</strong> cataract surgery is also covered, but your copay or coinsurance is set by the plan, and you'll usually need to use the plan's network. A Medigap plan paired with Original Medicare can cover most or all of that 20%.</p>
        <CompareCta>If surgery is on the horizon, compare each plan's outpatient surgery copay.</CompareCta>
      </section>

      <section id="summary" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Quick summary</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border-2">
          <table className="w-full text-left text-base">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 font-bold"></th>
                <th className="p-3 font-bold">Original Medicare</th>
                <th className="p-3 font-bold">Medigap</th>
                <th className="p-3 font-bold">Medicare Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr><th className="p-3 font-bold">Prescriptions</th><td className="p-3">No — needs a separate Part D plan</td><td className="p-3">No</td><td className="p-3">Usually included</td></tr>
              <tr><th className="p-3 font-bold">Routine dental</th><td className="p-3">No</td><td className="p-3">No</td><td className="p-3">Often — varies by plan</td></tr>
              <tr><th className="p-3 font-bold">Eye exams & glasses</th><td className="p-3">No</td><td className="p-3">No</td><td className="p-3">Often — varies by plan</td></tr>
              <tr><th className="p-3 font-bold">Hearing aids</th><td className="p-3">No</td><td className="p-3">No</td><td className="p-3">Sometimes — varies by plan</td></tr>
              <tr><th className="p-3 font-bold">Cataract surgery</th><td className="p-3">Yes (Part B)</td><td className="p-3">Helps pay your share</td><td className="p-3">Yes — plan copay applies</td></tr>
              <tr><th className="p-3 font-bold">Preventive screenings (mammograms, etc.)</th><td className="p-3">Yes — $0 when routine</td><td className="p-3">Not needed — already $0</td><td className="p-3">Yes — $0 in-network</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-lg">
          Because Medicare Advantage extras vary plan by plan and county by county, the only way to know what's
          available to you is to look at the plans where you live.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link to="/compare" className="rounded-full bg-primary px-6 py-3 text-lg font-bold text-primary-foreground transition hover:opacity-90">Compare plans in your county</Link>
          <Link to="/guide" className="rounded-full border-2 border-primary px-6 py-3 text-lg font-bold text-primary transition hover:bg-primary/10">Answer a few questions instead</Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border-2 border-input px-6 py-3 text-lg font-bold text-muted-foreground transition hover:border-primary hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </Link>
        </div>
      </section>
    </main>
    <Disclaimer />
    </>
  );
}
