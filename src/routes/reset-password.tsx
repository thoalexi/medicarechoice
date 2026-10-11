import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set your password — PlainPlanGuide" },
      { name: "description", content: "Set a password for the PlainPlanGuide owner sign-in." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Set your password — PlainPlanGuide" },
      { property: "og:description", content: "Owner password setup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) setReady(true); });
    supabase.auth.getSession().then(({ data: d }) => { if (d.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 10) return setMsg("Please use at least 10 characters.");
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMsg("That password couldn't be saved. Try a longer or less common one.");
    navigate({ to: "/admin/cms-updates" });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold">Set your password</h1>
        {!ready ? (
          <p className="mt-4">Open this page from the link in your email. If the link has expired, use “Forgot password?” on the sign-in page to get a new one.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block"><span className="font-bold">New password</span>
              <input type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-12 w-full rounded-md border border-input bg-card px-3 text-base" /></label>
            {msg && <p role="alert" className="text-destructive">{msg}</p>}
            <button disabled={busy} className="h-12 w-full rounded-md bg-primary font-bold text-primary-foreground">{busy ? "Saving…" : "Save password"}</button>
          </form>
        )}
      </main>
    </div>
  );
}
