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
  const [state, setState] = useState<"checking" | "ready" | "expired" | "none">("checking");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let done = false;
    const ok = () => { done = true; setState("ready"); };
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) ok(); });
    (async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const query = new URLSearchParams(window.location.search);
      if (hash.get("error_code") || query.get("error_code")) { setState("expired"); return; }
      const at = hash.get("access_token"), rt = hash.get("refresh_token");
      if (at && rt) {
        const { error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
        if (!error) { history.replaceState(null, "", "/reset-password"); return ok(); }
      }
      const code = query.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) { history.replaceState(null, "", "/reset-password"); return ok(); }
      }
      const { data: d } = await supabase.auth.getSession();
      if (d.session) return ok();
      setTimeout(() => { if (!done) setState(at || code ? "expired" : "none"); }, 1500);
    })();
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

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false); setSent(true);
  }

  const input = "mt-1 h-12 w-full rounded-md border border-input bg-card px-3 text-base";
  const btn = "h-12 w-full rounded-md bg-primary font-bold text-primary-foreground";
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold">Set your password</h1>
        {state === "checking" && <p className="mt-4">Checking your link…</p>}
        {state === "ready" && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block"><span className="font-bold">New password</span>
              <input type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} /></label>
            {msg && <p role="alert" className="text-destructive">{msg}</p>}
            <button disabled={busy} className={btn}>{busy ? "Saving…" : "Save password"}</button>
          </form>
        )}
        {(state === "expired" || state === "none") && (
          sent ? <p className="mt-4" role="status">A new link is on its way. Open the newest email and tap its button — older links stop working.</p> : (
          <form onSubmit={sendLink} className="mt-6 space-y-4">
            <p>{state === "expired" ? "That link has expired or was already used. Each link works only once." : "To set your password, we'll email you a link."} Enter your email and we'll send a new one.</p>
            <label className="block"><span className="font-bold">Email</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
            <button disabled={busy} className={btn}>{busy ? "Sending…" : "Email me a new link"}</button>
          </form>)
        )}
      </main>
    </div>
  );
}
