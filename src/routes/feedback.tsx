import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { MessageSquareHeart, CheckCircle2 } from "lucide-react";
import { submitFeedback } from "@/lib/feedback.functions";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Give feedback — PlainPlanGuide" },
      { name: "description", content: "PlainPlanGuide is a work in progress. Tell us what you've noticed — issues, ideas, or anything confusing — so we can fix it and grow." },
      { property: "og:title", content: "Give feedback — PlainPlanGuide" },
      { property: "og:description", content: "We can't grow and be better without your help. Let us know things you've noticed!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Feedback,
});

const CATEGORIES = [
  { value: "broken", label: "Something's broken" },
  { value: "idea", label: "I have an idea" },
  { value: "confusing", label: "Something confused me" },
  { value: "other", label: "Something else" },
] as const;

function Feedback() {
  const [category, setCategory] = useState<string>("broken");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorText("");
    try {
      await submitFeedback({
        data: {
          category: category as "broken" | "idea" | "confusing" | "other",
          message,
          email: email || undefined,
          page: document.referrer || undefined,
        },
      });
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorText(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
            <MessageSquareHeart className="size-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-4xl font-bold">We are a work in progress!</h1>
          </div>
        </div>

        <p className="mt-6 text-xl text-muted-foreground">
          We can't grow and be better without your help. Please let us know things you've noticed!
          If you don't tell us, we can't fix it. We appreciate your help!
        </p>

        {status === "sent" ? (
          <div className="mt-10 rounded-2xl border-2 border-primary/30 bg-secondary p-8 text-center">
            <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl font-bold">Thank you!</h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Your feedback was received. We read every message, and it genuinely shapes what we fix and build next.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 space-y-8">
            <fieldset>
              <legend className="text-xl font-bold">What kind of feedback do you have?</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {CATEGORIES.map((c) => (
                  <label
                    key={c.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-lg font-bold transition ${
                      category === c.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={c.value}
                      checked={category === c.value}
                      onChange={() => setCategory(c.value)}
                      className="size-5 accent-primary"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="feedback-message" className="text-xl font-bold">
                Tell us more
              </label>
              <textarea
                id="feedback-message"
                required
                maxLength={2000}
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What did you notice? What were you trying to do?"
                className="mt-3 w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="feedback-email" className="text-xl font-bold">
                Your email <span className="font-normal text-muted-foreground">(optional — only if you'd like a reply)</span>
              </label>
              <input
                id="feedback-email"
                type="email"
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-3 w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-lg focus:border-primary focus:outline-none"
              />
            </div>

            {status === "error" && (
              <p role="alert" className="rounded-xl border-2 border-destructive/40 bg-destructive/10 px-4 py-3 text-lg text-destructive">
                {errorText}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending" || !message.trim()}
              className="w-full rounded-xl bg-primary px-6 py-4 text-xl font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Send feedback"}
            </button>
          </form>
        )}
      </main>
      <Disclaimer />
    </div>
  );
}
