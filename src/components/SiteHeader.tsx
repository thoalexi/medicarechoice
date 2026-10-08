import { Link } from "@tanstack/react-router";
import { Heart, MessageSquareHeart } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-2xl font-bold text-primary">MedicareChoice</Link>
        <nav className="flex items-center gap-6 text-base font-bold">
          <Link to="/what-does-medicare-cover" className="hover:text-primary">What's covered?</Link>
          <Link to="/guide" className="hover:text-primary">Guided questions</Link>
          <Link to="/compare" className="hover:text-primary">Compare plans</Link>
          <Link to="/formulary-check" className="hover:text-primary">Check my drugs</Link>
          <Link to="/feedback" className="inline-flex items-center gap-2 hover:text-primary">
            <MessageSquareHeart className="size-4" aria-hidden />
            Feedback
          </Link>
          <Link
            to="/donate"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-4 py-1.5 text-primary transition hover:bg-primary/10"
          >
            <Heart className="size-4" aria-hidden />
            Donate
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Disclaimer() {
  return (
    <p className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
      Plans and prices shown are illustrative estimates for planning purposes, not official quotes. Plans that cover prescriptions each have their own formulary (list of covered drugs) — confirm your medications are covered, and at what cost, in the plan’s formulary before enrolling. Confirm details at Medicare.gov or with Michigan's free MMAP counselors (1-800-803-7174) before enrolling.
    </p>
  );
}
