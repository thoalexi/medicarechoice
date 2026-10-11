import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { COUNTIES, type PlanType } from "./plans";
import { resolveCarriers, DEFAULT_TYPES, type Structure } from "./planFilters";

/** Structured criteria the AI search hands to the shared Compare filters. It never ranks plans. */
export type SearchCriteria = {
  county: string;
  carriers: string[];
  related: string[];
  unknownInsurers: string[];
  structure: Structure | "";
  types: PlanType[];
  maxPremium: number | null;
  prefs: { keepAnyDoctor: boolean; travels: boolean; priority: "low-premium" | "balanced" | "peace"; wants: { dental: boolean; vision: boolean; hearing: boolean } };
};

export const searchPlans = createServerFn({ method: "POST" })
  .validator((d) => z.object({ query: z.string().trim().min(3).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const { extractPrefs, GatewayError } = await import("./ai/planSearch.server");
    try {
      const p = await extractPrefs(data.query);
      if (!p.onTopic) {
        return { ok: false as const, error: "This search only helps you find Medicare plans. Try describing your doctors, budget, insurer, or the extras you want." };
      }
      if (p.outsideMichigan) {
        return { ok: false as const, error: "We only cover Michigan plans right now. For other states, use Medicare.gov's Plan Finder or call 1-800-MEDICARE." };
      }
      const county = p.county && COUNTIES.includes(p.county) ? p.county : "";
      const carriers = new Set<string>();
      const related = new Set<string>();
      const unknownInsurers: string[] = [];
      for (const w of p.insurerWords.slice(0, 5)) {
        const r = resolveCarriers(w.slice(0, 60));
        if (r.carriers.length === 0) unknownInsurers.push(w.slice(0, 40));
        r.carriers.forEach((c) => carriers.add(c));
        r.related.forEach((c) => related.add(c));
      }
      carriers.forEach((c) => related.delete(c));
      const structure: Structure | "" = p.planType ?? "";
      let types: PlanType[] = [...DEFAULT_TYPES];
      if (p.wantsAdvantage === false && !structure) types = ["Original + Medigap", "Original only"];
      else if (p.wantsAdvantage || structure || carriers.size) types = ["Advantage HMO", "Advantage PPO", "Other Advantage"];
      if (p.includeSpecialNeeds) types = [...types, "Special Needs (SNP)"];
      const maxPremium = p.maxMonthlyPremium === null ? null : Math.max(0, Math.min(1000, Math.round(p.maxMonthlyPremium)));
      const criteria: SearchCriteria = {
        county, carriers: [...carriers], related: [...related], unknownInsurers, structure, types, maxPremium,
        prefs: { keepAnyDoctor: p.keepAnyDoctor, travels: p.travels, priority: p.priority, wants: { dental: p.dental, vision: p.vision, hearing: p.hearing } },
      };
      return { ok: true as const, needsLocation: !county, criteria };
    } catch (e) {
      return { ok: false as const, error: e instanceof GatewayError ? e.message : "Something went wrong. Please try again." };
    }
  });
