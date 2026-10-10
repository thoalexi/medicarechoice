import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, X } from "lucide-react";

const DISMISS_KEY = "clearcover-donate-banner-dismissed";

export function DonateBanner() {
  // Start hidden so server and client render the same thing, then reveal
  // after mount once we know whether this visitor already closed it.
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    setMounted(true);
  }, []);

  const close = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (!mounted || dismissed) return null;

  return (
    <aside aria-label="Support PlainPlanGuide" className="border-b border-primary/25 bg-secondary">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
            <Heart className="size-6" aria-hidden />
          </span>
          <div>
            <p className="text-xl font-bold">Like what we do? Please keep it going!</p>
            <p className="mt-1 text-base text-muted-foreground">
              PlainPlanGuide is free, has no ads, and takes no commissions from insurers. Reader donations keep it running
              — and support this women-owned business.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:ml-auto">
          <Link
            to="/donate"
            className="rounded-xl bg-primary px-6 py-3 text-lg font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Donate
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Hide this message"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-background hover:text-foreground"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}
