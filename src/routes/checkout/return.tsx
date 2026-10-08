import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string | undefined } => ({
    session_id: typeof search["session_id"] === "string" ? (search["session_id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Thank you for supporting MedicareChoice" },
      { name: "description", content: "Thank you for your gift — it keeps free Medicare guidance going and supports this women-owned business." },
      { property: "og:title", content: "Thank you for supporting MedicareChoice" },
      { property: "og:description", content: "Your donation supports a free, independent, women-owned Medicare guide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary/12 text-primary">
          <Heart className="size-8" aria-hidden />
        </span>
        {session_id ? (
          <>
            <h1 className="mt-6 text-4xl font-bold">Thank you — truly.</h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Your gift keeps MedicareChoice free and ad-free, and it supports this women-owned business. A receipt is
              on its way to your email.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-4xl font-bold">We couldn't find your donation</h1>
            <p className="mt-4 text-xl text-muted-foreground">If you meant to give, you can try again any time.</p>
          </>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="rounded-xl bg-primary px-6 py-3 text-lg font-bold text-primary-foreground">Back to home</Link>
          <Link to="/donate" className="rounded-xl border-2 border-primary px-6 py-3 text-lg font-bold text-primary">Donate page</Link>
        </div>
      </main>
      <Disclaimer />
    </div>
  );
}
