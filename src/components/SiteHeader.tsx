import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-2xl font-bold text-primary">ClearCover</Link>
        <nav className="flex gap-6 text-base font-bold">
          <Link to="/guide" className="hover:text-primary">Guided questions</Link>
          <Link to="/compare" className="hover:text-primary">Compare plans</Link>
        </nav>
      </div>
    </header>
  );
}

export function Disclaimer() {
  return (
    <p className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
      Plans and prices shown are illustrative estimates for planning purposes, not official quotes. Confirm details at Medicare.gov or with Michigan's free MMAP counselors (1-800-803-7174) before enrolling.
    </p>
  );
}
