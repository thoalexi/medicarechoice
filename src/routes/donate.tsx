import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Support ClearCover — keep free Medicare guidance going" },
      { name: "description", content: "ClearCover is free and ad-free. If it helped you make sense of Medicare, a small donation keeps it running." },
      { property: "og:title", content: "Support ClearCover — like what we do? Please keep it going!" },
      { property: "og:description", content: "Free, ad-free Medicare guidance with no commissions from insurers. Reader donations keep it running." },
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

  const gift = custom ? Math.max(0, Math.round(Number(custom) || 0)) : amount;
  const sel = "mt-1 block w-full rounded-lg border-2 border-input bg-card p-2";

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
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
            <Heart className="size-7" aria-hidden />
          </span>
          <h1 className="text-4xl font-bold">Like what we do? Please keep it going!</h1>
        </div>

        <p className="mt-6 text-xl text-muted-foreground">
          ClearCover is free for everyone — no ads, no account, and no commissions from insurance companies.
          Everything we earn goes back into clearer plain-language Medicare guidance. If this saved you an hour of
          confusion, a small gift keeps it going.
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

          <label className={`mt-4 block font-bold text-lg ${sel.replace("block w-full", "block")}`}>
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

          <button
            type="button"
            disabled
            className="mt-4 w-full cursor-not-allowed rounded-xl bg-primary/40 px-6 py-4 text-xl font-bold text-primary-foreground"
          >
            Donate ${gift || 0} {freq === "monthly" ? "monthly" : "now"}
          </button>

          <p className="mt-3 rounded-xl border-2 border-dashed border-accent bg-secondary p-4 text-lg">
            Secure checkout isn't connected yet, so no money changes hands today. Until it is, passing ClearCover to
            someone who's still untangling Medicare helps just as much.
          </p>

          <button
            type="button"
            onClick={share}
            className="mt-4 w-full rounded-xl border-2 border-primary px-6 py-3 text-lg font-bold text-primary transition hover:bg-primary/10"
          >
            {copied ? "Link copied — thank you!" : "Copy a link to share ClearCover"}
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
