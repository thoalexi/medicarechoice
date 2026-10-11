import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ next: typeof s['next'] === "string" && s['next'].startsWith("/") && !s['next'].startsWith("//") ? s['next'] : "/admin/cms-updates" }),
  head: () => ({
    meta: [
      { title: "Owner sign-in — PlainPlanGuide" },
      { name: "description", content: "Private sign-in for the PlainPlanGuide site owner." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Owner sign-in — PlainPlanGuide" },
      { property: "og:description", content: "Private sign-in for the site owner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setErr("Sign-in didn't work. Check your email and password.");
    navigate({ to: next });
  }
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold">Owner sign-in</h1>
        <p className="mt-2 text-muted-foreground">This area is only for the site owner. Readers don't need an account.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block"><span className="font-bold">Email</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-12 w-full rounded-md border border-input bg-card px-3 text-base" /></label>
          <label className="block"><span className="font-bold">Password</span>
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-12 w-full rounded-md border border-input bg-card px-3 text-base" /></label>
          {err && <p role="alert" className="text-destructive">{err}</p>}
          <button disabled={busy} className="h-12 w-full rounded-md bg-primary font-bold text-primary-foreground">{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </main>
    </div>
  );
}
