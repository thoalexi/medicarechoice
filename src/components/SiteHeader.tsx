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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="min-w-0 whitespace-nowrap font-display text-[22px] font-bold text-primary sm:text-2xl">PlainPlanGuide</Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link to="/feedback" className="hidden min-h-12 items-center gap-2 font-bold hover:text-primary sm:inline-flex">
            <MessageSquareHeart className="size-4" aria-hidden />
            Feedback
          </Link>
          <Link to="/donate" className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-primary px-3 font-bold text-primary transition sm:px-4 hover:bg-primary/10">
            <Heart className="hidden size-4 sm:block" aria-hidden />
            Donate
          </Link>
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
      </div>
      <nav aria-label="Main" className="hidden border-t bg-background/60 lg:block">
        <ul className="mx-auto flex max-w-6xl items-center justify-center gap-8 px-6">
          {LINKS.map((l) => (
            <li key={l.to}><Link to={l.to} className="inline-flex min-h-12 items-center whitespace-nowrap border-b-2 border-transparent text-[15px] font-bold hover:text-primary" activeProps={{ className: "border-primary text-primary", "aria-current": "page" }}>{l.label}</Link></li>
          ))}
        </ul>
      </nav>
      {open && (
        <nav id="mobile-menu" aria-label="Main" className="border-t px-4 pb-4 lg:hidden">
          <ul className="flex flex-col text-lg font-bold">
            {LINKS.map((l) => (
              <li key={l.to}><Link to={l.to} onClick={() => setOpen(false)} className="flex min-h-14 items-center border-b" activeProps={{ className: "text-primary underline underline-offset-4" }}>{l.label}</Link></li>
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
        <p>PlainPlanGuide is an independent website. It is not affiliated with, endorsed by, or connected to Medicare, the Centers for Medicare &amp; Medicaid Services (CMS), or any government agency. For official information, visit Medicare.gov or call 1-800-MEDICARE.</p>
        <p>We don't sell insurance, enroll anyone in plans, or receive payment from any insurance company. Plans are never ranked based on who offers them.</p>
        <p>
          Plans and prices shown are estimates based on official CMS data, not quotes. Figures marked 2026 are last year’s and will be updated when CMS announces 2027 amounts. “Worst case” is not a limit on every expense — it leaves out non-covered care, drugs not on the plan’s list and most out-of-network bills. Plans that cover prescriptions each have their own formulary (list of covered drugs) — confirm your medications are covered, and at what cost, in the plan’s formulary before enrolling. Confirm details at Medicare.gov or with Michigan's free MMAP counselors (1-800-803-7174) before enrolling.
        </p>
        <nav aria-label="Footer" className="flex text-base flex-wrap gap-x-6">
          {([["/privacy", "Privacy"], ["/methodology", "Methodology"], ["/about", "About"], ["/feedback", "Feedback"]] as const).map(([to, label]) => (
            <Link key={to} to={to} className="inline-flex min-h-12 items-center font-bold text-primary underline">{label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
