import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import figures from "@/lib/medicare-figures.json";

// Weekly scheduled check (database cron). Only records "update available"; never publishes.
export const Route = createFileRoute("/api/public/cms-check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runCmsCheck } = await import("@/lib/cmsCheck.server");
        const results = await runCmsCheck(supabaseAdmin as never, figures.coverageYear);
        return Response.json({ ok: true, results: results.map((r) => ({ key: r.key, updateAvailable: r.updateAvailable })) });
      },
    },
  },
});
