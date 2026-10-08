import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { Heart } from "lucide-react";
import { DonationCheckout } from "@/components/DonationCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { paymentsConfigured } from "@/lib/stripe";


export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Support MedicareChoice — keep free Medicare guidance going" },
      { name: "description", content: "MedicareChoice is free and ad-free, and donations support this women-owned business. If it helped you make sense of Medicare, a small gift keeps it running." },
      { property: "og:title", content: "Support MedicareChoice — like what we do? Please keep it going!" },
      { property: "og:description", content: "Free, ad-free Medicare guidance with no commissions from insurers. Donations support this women-owned business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Donate,
});

const AMOUNTS = [5, 15, 35, 50];

function Donate() {
  const [freq, setFreq] = useState<"once" | "monthly">("monthly");
  const [amount, setAmount] = useState(15);
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkout, setCheckout] = useState<{ cents: number; freq: "once" | "monthly" } | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(paymentsConfigured()), []);

  const gift = custom ? Math.max(0, Math.round(Number(custom) || 0)) : amount;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.replace("/donate", "/"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PaymentTestModeBanner />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
            <Heart className="size-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-4xl font-bold">Like what we do? Please keep it going!</h1>
            <span className="mt-3 inline-block rounded-full bg-accent px-4 py-1 text-base font-bold text-accent-foreground">
              Donations support this women-owned business
            </span>
          </div>
        </div>

        <p className="mt-6 text-xl text-muted-foreground">
          MedicareChoice is free for everyone — no ads, no account, and no commissions from insurance companies.
          Everything we earn goes back into clearer plain-language Medicare guidance. If this saved you an hour of
          confusion, a small gift keeps this women-owned business going.
        </p>

        <div className="mt-10 rounded-2xl border-2 bg-card p-6">
          <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Donation frequency">
            {([["monthly", "Monthly"], ["once", "One-time"]] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={freq === value}
                onClick={() => setFreq(value)}
                className={`rounded-xl border-2 p-4 text-lg font-bold transition ${freq === value ? "border-primary bg-primary/10" : "bg-card hover:border-primary/50"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Donation amount">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={!custom && amount === a}
                onClick={() => {
                  setAmount(a);
                  setCustom("");
                }}
                className={`rounded-xl border-2 p-4 text-xl font-bold transition ${!custom && amount === a ? "border-primary bg-primary/10" : "bg-card hover:border-primary/50"}`}
              >
                ${a}
                <span className="block text-sm font-normal text-muted-foreground">{freq === "monthly" ? "each month" : "one time"}</span>
              </button>
            ))}
          </div>

          <label className="mt-4 block text-lg font-bold">
            Or another amount
            <span className="flex items-center gap-2">
              <span aria-hidden className="text-2xl">$</span>
              <input
                inputMode="numeric"
                maxLength={5}
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
                placeholder="25"
                className="w-32 rounded-lg border-2 border-input bg-card p-2 text-xl"
              />
            </span>
          </label>

          <p className="mt-6 text-lg">
            Your gift: <span className="font-display text-3xl font-bold text-primary">${gift}</span>{" "}
            <span className="text-muted-foreground">{freq === "monthly" ? "each month" : "one time"}</span>
          </p>

          {checkout ? (
            <>
              <DonationCheckout key={`${checkout.freq}-${checkout.cents}`} amountInCents={checkout.cents} frequency={checkout.freq} />
              <button type="button" onClick={() => setCheckout(null)} className="mt-3 text-lg font-bold text-primary underline">
                Change amount
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!ready || gift < 1}
                onClick={() => setCheckout({ cents: gift * 100, freq })}
                className="mt-4 w-full rounded-xl bg-primary px-6 py-4 text-xl font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Donate ${gift || 0} {freq === "monthly" ? "monthly" : "now"}
              </button>
              <p className="mt-3 text-base text-muted-foreground">
                {ready
                  ? "Secure checkout by Stripe. You'll get an email receipt. Monthly gifts can be cancelled any time."
                  : "Secure checkout is being switched on — please check back soon. Sharing MedicareChoice helps just as much!"}
              </p>
            </>
          )}

          <button
            type="button"
            onClick={share}
            className="mt-4 w-full rounded-xl border-2 border-primary px-6 py-3 text-lg font-bold text-primary transition hover:bg-primary/10"
          >
            {copied ? "Link copied — thank you!" : "Copy a link to share MedicareChoice"}
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Independent", "No insurer pays us to rank their plans higher."],
            ["Free, always", "No accounts, no paywalls, no upsells."],
            ["Plain language", "Every estimate shows the trade-offs it left out."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border bg-card p-5">
              <div className="font-display text-xl font-bold text-primary">{t}</div>
              <p className="mt-2">{d}</p>
            </div>
          ))}
        </div>
      </main>
      <Disclaimer />
    </div>
  );
}
