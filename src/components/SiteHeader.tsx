import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Menu, MessageSquareHeart, X } from "lucide-react";

const LINKS = [
  { to: "/michigan-medicare-2027", label: "Michigan 2027" },
  { to: "/what-does-medicare-cover", label: "What's covered?" },
  { to: "/guide", label: "Guided questions" },
  { to: "/compare", label: "Compare plans" },
  { to: "/formulary-check", label: "Check my drugs" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="shrink-0 whitespace-nowrap font-display text-2xl font-bold text-primary">MedicareChoice</Link>
        <nav className="hidden items-center gap-6 text-base font-bold lg:flex">
          {LINKS.map((l) => <Link key={l.to} to={l.to} className="hover:text-primary">{l.label}</Link>)}
          <Link to="/feedback" className="inline-flex items-center gap-2 hover:text-primary">
            <MessageSquareHeart className="size-4" aria-hidden />
            Feedback
          </Link>
          <Link to="/donate" className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-4 py-1.5 text-primary transition hover:bg-primary/10">
            <Heart className="size-4" aria-hidden />
            Donate
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border-2 lg:hidden"
        >
          {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" className="border-t px-4 pb-4 lg:hidden">
          <ul className="flex flex-col text-lg font-bold">
            {LINKS.map((l) => (
              <li key={l.to}><Link to={l.to} onClick={() => setOpen(false)} className="flex min-h-14 items-center border-b">{l.label}</Link></li>
            ))}
            <li><Link to="/feedback" onClick={() => setOpen(false)} className="flex min-h-14 items-center gap-2 border-b"><MessageSquareHeart className="size-5" aria-hidden />Feedback</Link></li>
            <li className="pt-4"><Link to="/donate" onClick={() => setOpen(false)} className="flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-primary text-primary"><Heart className="size-5" aria-hidden />Donate</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export function Disclaimer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p>MedicareChoice is an independent website. It is not affiliated with, endorsed by, or connected to Medicare, the Centers for Medicare &amp; Medicaid Services (CMS), or any government agency. For official information, visit Medicare.gov or call 1-800-MEDICARE.</p>
        <p>We don't sell insurance, enroll anyone in plans, or receive payment from any insurance company. Plans are never ranked based on who offers them.</p>
        <p>
          Plans and prices shown are estimates based on official CMS data, not quotes. Dollar limits marked 2026 will be updated when CMS confirms 2027 figures. Plans that cover prescriptions each have their own formulary (list of covered drugs) — confirm your medications are covered, and at what cost, in the plan’s formulary before enrolling. Confirm details at Medicare.gov or with Michigan's free MMAP counselors (1-800-803-7174) before enrolling.
        </p>
        <nav aria-label="Footer" className="flex text-base flex-wrap gap-x-6">
          {([["/privacy", "Privacy"], ["/how-we-compare", "How we compare plans"], ["/about", "About"], ["/feedback", "Feedback"]] as const).map(([to, label]) => (
            <Link key={to} to={to} className="inline-flex min-h-12 items-center font-bold text-primary underline">{label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
