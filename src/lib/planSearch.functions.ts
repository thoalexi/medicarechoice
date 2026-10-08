import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { plansFor, scorePlan, COUNTIES } from "./plans";

export type PlanMatch = { id: string; name: string; type: string; carrier: string; monthlyPremium: number; total: number; worstCase: number | null; reasons: string[]; cautions: string[] };

export const searchPlans = createServerFn({ method: "POST" })
  .validator((d) => z.object({ query: z.string().trim().min(3).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const { extractPrefs, GatewayError } = await import("./ai/planSearch.server");
    try {
      const p = await extractPrefs(data.query);
      const county = p.county && COUNTIES.includes(p.county) ? p.county : "";
      if (!county && !p.outsideMichigan) {
        return { ok: true as const, followUp: p.followUpQuestion ?? "Which Michigan county or ZIP code do you live in?", county: null, matches: [] as PlanMatch[] };
      }
      const answers = {
        zip: "", health: p.health, doctorsFlex: p.keepAnyDoctor ? "any" : "network-ok", hospital: p.hospital ?? "",
        drugsMonthly: Math.max(0, Math.min(5000, p.drugsMonthly)), priority: p.priority,
        extras: { dental: p.dental, vision: p.vision, hearing: p.hearing }, travels: p.travels,
      } as const;
      const matches = plansFor(county)
        .filter((pl) => pl.type !== "Special Needs (SNP)")
        .filter((pl) => p.maxMonthlyPremium === null || pl.monthlyPremium <= p.maxMonthlyPremium)
        .filter((pl) => p.wantsAdvantage === null || (p.wantsAdvantage ? pl.type.startsWith("Advantage") || pl.type === "Other Advantage" : pl.type === "Original + Medigap" || pl.type === "Original only"))
        .map((pl) => {
          const s = scorePlan(pl, { ...answers });
          let score = s.score;
          const reasons = [...s.reasons];
          if (p.fitness) { if (pl.fitness) { score += 400; reasons.push("Includes a gym/fitness benefit."); } }
          if (pl.monthlyPremium === 0 && !reasons.includes("$0 plan premium.")) reasons.push("$0 plan premium.");
          return { score, m: { id: pl.id, name: pl.name, type: pl.type, carrier: pl.carrier, monthlyPremium: pl.monthlyPremium, total: s.cost.total, worstCase: s.cost.worstCase, reasons: reasons.slice(0, 3), cautions: s.cautions.slice(0, 2) } };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((x) => x.m);
      return { ok: true as const, followUp: null, county: county || null, matches };
    } catch (e) {
      return { ok: false as const, error: e instanceof GatewayError ? e.message : "Something went wrong. Please try again." };
    }
  });
