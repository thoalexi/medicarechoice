import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { COUNTIES } from "./plans";
import { resolveCarriers, BENEFITS, type Benefit, type Cov, type Net, type NetMode } from "./planFilters";
import type { Priority } from "./comparePrefs";

/** Structured criteria the AI-assisted search hands to the shared Compare filters. It never ranks plans. */
export type SearchCriteria = {
  county: string;
  carriers: string[];
  related: string[];
  unknownInsurers: string[];
  cov: Cov | null;
  net: Net;
  netMode: NetMode;
  cms: string[];
  snp: boolean;
  maxPremium: number | null;
  req: Benefit[];
  prefs: { keepAnyDoctor: boolean; travels: boolean; priority: Priority; preferred: Record<Benefit, boolean> };
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
      const net: Net = p.planType === "HMO" ? "hmo" : p.planType === "PPO" ? "ppo" : p.planType ? "other" : "any";
      const cms = p.planType === "HMO-POS" || p.planType === "PFFS" ? [p.planType] : [];
      const cov: Cov | null = net !== "any" || carriers.size ? "ma" : p.coverage;
      const maxPremium = p.maxMonthlyPremium === null ? null : Math.max(0, Math.min(1000, Math.round(p.maxMonthlyPremium)));
      const level = (b: Benefit) => p[b];
      const criteria: SearchCriteria = {
        county, carriers: [...carriers], related: [...related], unknownInsurers, cov, net, netMode: p.planTypeMode, cms,
        snp: p.includeSpecialNeeds, maxPremium,
        req: BENEFITS.filter((b) => level(b) === "required"),
        prefs: {
          keepAnyDoctor: p.keepAnyDoctor || p.priority === "flex", travels: p.travels, priority: p.priority,
          preferred: Object.fromEntries(BENEFITS.map((b) => [b, level(b) === "preferred"])) as Record<Benefit, boolean>,
        },
      };
      return { ok: true as const, needsLocation: !county, criteria };
    } catch (e) {
      return { ok: false as const, error: e instanceof GatewayError ? e.message : "Something went wrong. Please try again." };
    }
  });
