import type { SupabaseClient } from "@supabase/supabase-js";
import { WATCHED, newestLink } from "./cmsImport";

export type CheckResult = { key: string; foundUrl: string | null; updateAvailable: boolean; note: string };

/** Scan official CMS pages for a newer file than the one in use. Records "last checked" only; never publishes. */
export async function runCmsCheck(db: SupabaseClient, coverageYear: number): Promise<CheckResult[]> {
  const out: CheckResult[] = [];
  for (const w of WATCHED) {
    let r: CheckResult;
    try {
      const res = await fetch(w.page, { headers: { "user-agent": "Mozilla/5.0 PlainPlanGuide update check" } });
      if (!res.ok) throw new Error(`CMS page returned ${res.status}`);
      const link = newestLink(await res.text(), new RegExp(w.pattern.source, "gi"), coverageYear);
      const updateAvailable = !!link && link !== w.current;
      r = { key: w.key, foundUrl: link ? new URL(link.startsWith("/") ? link : `/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data/${link}`, "https://www.cms.gov").toString() : null,
        updateAvailable, note: link ? (updateAvailable ? "Newer CMS file found — review before using." : "No newer file than the one in use.") : "No file for this year found on the CMS page." };
    } catch (e) {
      r = { key: w.key, foundUrl: null, updateAvailable: false, note: `Could not reach CMS: ${(e as Error).message}` };
    }
    out.push(r);
    await db.from("dataset_checks").upsert({ dataset_key: w.key, last_checked_at: new Date().toISOString(), found_url: r.foundUrl, update_available: r.updateAvailable, note: r.note });
  }
  return out;
}
