import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — PlainPlanGuide" },
      { name: "description", content: "What PlainPlanGuide does with the information you type in: no accounts, nothing sold or shared, and most answers never leave your browser." },
      { property: "og:title", content: "Privacy at PlainPlanGuide" },
      { property: "og:description", content: "A plain-language list of what the site collects, what it keeps, and who else sees it." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://plainplanguide.com/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://plainplanguide.com/privacy" }],
  }),
  component: Privacy,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 text-lg leading-relaxed">{children}</div>
    </section>
  );
}

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="font-bold uppercase text-primary">Privacy</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">What happens to the information you type in</h1>
        <p className="mt-3 text-muted-foreground">Last updated: October 10, 2026</p>

        <div className="mt-8 rounded-2xl border-2 border-primary bg-card p-5 text-lg">
          <ul className="list-disc space-y-2 pl-5">
            <li>There are no accounts. You never sign in or create a profile.</li>
            <li>We don't sell or share your personal information.</li>
            <li>There are no ads and no ad trackers.</li>
            <li>Most of what you enter stays in your browser and is gone when you close the page.</li>
          </ul>
        </div>

        <Section title="Guided questions, Compare page and hospital search">
          <p>Your answers (ZIP code, health use, doctors, hospital, drug spending, priorities and extras), your filters and the plans you pick stay in your open browser tab. We don't save them. The cost math runs on your own device. Your county is added to the Compare page's web address so your choice carries over.</p>
          <p>The hospital search looks through a built-in list. What you type isn't sent anywhere.</p>
        </Section>

        <Section title="AI plan search and “Search this plan's benefits”">
          <p>When you use these boxes, the text you type is sent to Lovable AI, which uses OpenAI, to work out what you're asking. We don't save what you type.</p>
          <p className="rounded-xl bg-secondary p-4 font-bold">Please don't enter names, Medicare numbers, birth dates, addresses or other details that identify you. Just describe what you need, like “Genesee County, I see a heart doctor and want dental.”</p>
        </Section>

        <Section title="Check my drugs">
          <p>Your list of medicines, and any formulary PDF you upload, is sent to Lovable AI (using OpenAI) for that one check. We don't save your medicines or your PDF.</p>
          <p>To find a plan's official drug list, we send the plan's name to Firecrawl, a web-search service. We save the public web address of that plan's official formulary so the next search is faster. It contains nothing about you.</p>
        </Section>

        <Section title="Feedback form">
          <p>If you send feedback, we keep the category you chose, your message, the page you sent it from, and your email address only if you give one. It's stored in our database with Lovable Cloud, our hosting provider. It isn't public, and there is no automatic deletion date.</p>
          <p>Want your feedback deleted? Ask us through the feedback form.</p>
        </Section>

        <Section title="Donations">
          <p>Donations are handled by Stripe, a payment company. You type your card, name and email into Stripe's secure form. We never see or store your card number. Stripe keeps the payment record and emails your receipt. Stripe's form may set its own cookies to help prevent fraud.</p>
        </Section>

        <Section title="Cookies, browser storage and site statistics">
          <p>We don't set any cookies of our own. We save one setting in your browser: whether you closed the donation banner. Clearing your browser data removes it.</p>
          <p>Our hosting provider, Lovable, keeps basic visit statistics (pages viewed, the website you came from and rough device type). If a page breaks, an error report goes to Lovable so the problem can be fixed. When the AI or search service fails, our servers note the error code only, not what you typed. We also use Google Analytics to count visits, which pages are viewed, which main buttons are clicked, whether the guided questions are finished, and which ad or website brought you here. Google Analytics sets its own cookies for this. It never receives your ZIP code, answers, medicines or anything you type. We don't use Facebook pixels or mailing lists.</p>
        </Section>

        <Section title="Who else sees information">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Lovable</strong>: hosting, database, visit statistics and error reports</li>
            <li><strong>Lovable AI and OpenAI</strong>: text typed into the AI search, benefit search and drug checker</li>
            <li><strong>Firecrawl</strong>: plan names, to find official drug lists</li>
            <li><strong>Stripe</strong>: donation payments</li>
          </ul>
        </Section>

        <Section title="Questions about privacy">
          <p>Send us a note through the <Link to="/feedback" className="font-bold text-primary underline">feedback form</Link>. Choose “Other” and start your message with “Privacy question.” If you'd like a reply, include your email.</p>
        </Section>
      </main>
      <Disclaimer />
    </div>
  );
}
