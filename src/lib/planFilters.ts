// Shared plan criteria used by Compare, the AI plan search and the questionnaire hand-off.
// One filter implementation so every entry point narrows plans the same way.
import { PLANS, type Plan, type PlanType } from "./plans";
import partialData from "./mi-partial-counties.json";

export const TYPES: PlanType[] = ["Original + Medigap", "Advantage HMO", "Advantage PPO", "Other Advantage", "Original only", "Special Needs (SNP)"];
export const DEFAULT_TYPES: PlanType[] = TYPES.filter((t) => t !== "Special Needs (SNP)");

/** Plan structure (separate from Special Needs eligibility). */
export const STRUCTURES = ["HMO", "HMO-POS", "PPO", "PFFS"] as const;
export type Structure = (typeof STRUCTURES)[number];
export function structureOf(p: Plan): Structure | null {
  const t = p.cmsType ?? "";
  if (t.startsWith("HMO-POS")) return "HMO-POS";
  if (t.startsWith("HMO")) return "HMO";
  if (t.includes("PPO")) return "PPO"; // includes Regional PPO
  if (t.startsWith("PFFS")) return "PFFS";
  return null;
}

export const CARRIERS: string[] = Array.from(new Set(PLANS.filter((p) => p.real).map((p) => p.carrier))).sort();

/**
 * Nicknames → exact insurer names from the CMS data. Related but legally separate insurers are
 * never merged; they are offered as a suggestion instead.
 */
const ALIAS_GROUPS: { words: string[]; carrier: string; related?: string[] }[] = [
  { words: ["blue cross blue shield", "blue cross", "bcbsm", "bcbs", "blue shield"], carrier: "Blue Cross Blue Shield of Michigan", related: ["Blue Care Network"] },
  { words: ["blue care network", "blue care", "bcn"], carrier: "Blue Care Network", related: ["Blue Cross Blue Shield of Michigan"] },
  { words: ["health alliance plan", "henry ford", "hap"], carrier: "Health Alliance Plan by Henry Ford Health", related: ["HAP CareSource MI Coordinated Health"] },
  { words: ["unitedhealthcare", "united healthcare", "united health", "uhc", "aarp"], carrier: "UnitedHealthcare" },
  { words: ["aetna"], carrier: "Aetna Medicare", related: ["Aetna Medicare HIDE"] },
  { words: ["priority health", "priority"], carrier: "Priority Health Medicare" },
  { words: ["upper peninsula health plan", "uphp"], carrier: "Upper Peninsula Health Plan (UPHP) MI Coordinated Health" },
];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Resolve free text (e.g. "BCBS", "Humana") to exact insurer names + related suggestions. */
export function resolveCarriers(text: string): { carriers: string[]; related: string[] } {
  const t = ` ${norm(text)} `;
  const carriers = new Set<string>();
  const related = new Set<string>();
  let rest = t;
  for (const g of ALIAS_GROUPS) {
    const hit = g.words.find((w) => rest.includes(` ${w} `));
    if (hit && CARRIERS.includes(g.carrier)) {
      carriers.add(g.carrier);
      g.related?.forEach((r) => CARRIERS.includes(r) && related.add(r));
      rest = rest.replace(` ${hit} `, " ");
    }
  }
  for (const c of CARRIERS) {
    const first = norm(c).split(" ")[0]!;
    if (first.length >= 4 && rest.includes(` ${first} `) && !ALIAS_GROUPS.some((g) => g.carrier === c)) carriers.add(c);
  }
  carriers.forEach((c) => related.delete(c));
  return { carriers: [...carriers], related: [...related] };
}

/** Case-insensitive partial match on insurer (incl. nicknames), plan name, plan type and benefits. */
export function matchKeyword(p: Plan, q: string): boolean {
  const k = norm(q);
  if (!k) return true;
  const { carriers } = resolveCarriers(k);
  if (carriers.length && carriers.includes(p.carrier)) return true;
  const hay = norm([p.name, p.carrier, p.type, p.cmsType ?? "", structureOf(p) ?? "", p.id,
    p.dental ? "dental" : "", p.vision ? "vision" : "", p.hearing ? "hearing" : "", p.fitness ? "fitness gym" : "",
    p.drugCoverage ? "drug coverage part d" : "", p.type === "Special Needs (SNP)" ? "special needs snp" : ""].join(" "));
  return k.split(" ").every((w) => hay.includes(w));
}

export type Must = "dental" | "vision" | "hearing" | "noReferrals";
export const MUSTS: Must[] = ["dental", "vision", "hearing", "noReferrals"];

/** Non-sensitive, shareable criteria (kept in the web address). */
export interface UrlCriteria {
  county: string;
  types: PlanType[];
  structure: Structure | "";
  carriers: string[];
  q: string;
  must: Must[];
  maxPremium: number | null;
  sort: "total" | "premium" | "oop" | "";
}

/** Every clause is separate and ANDed: insurer choice and keyword never replace each other. */
export function applyFilters(plans: Plan[], c: UrlCriteria): Plan[] {
  return plans.filter((p) =>
    c.types.includes(p.type)
    && (!c.structure || (p.real ? structureOf(p) === c.structure : false))
    && (c.carriers.length === 0 || c.carriers.includes(p.carrier))
    && matchKeyword(p, c.q)
    && (c.maxPremium === null || p.monthlyPremium <= c.maxPremium)
    && (!c.must.includes("dental") || p.dental !== false)
    && (!c.must.includes("vision") || p.vision !== false)
    && (!c.must.includes("hearing") || p.hearing !== false)
    && (!c.must.includes("noReferrals") || !p.referralsNeeded));
}

const PARTIAL = (partialData as { partial: Record<string, string[]>; notInFile: string[]; period: string });
export const PARTIAL_PERIOD = PARTIAL.period;
/** "partial" = CMS says this contract covers only part of the county; "unknown" = contract not yet in the CMS file. */
export function coverageFlag(p: Plan, county: string): "partial" | "unknown" | null {
  if (!p.real) return null;
  const contract = p.id.split("_")[0] ?? "";
  if (PARTIAL.partial[contract]?.includes(county)) return "partial";
  if (PARTIAL.notInFile.includes(contract)) return "unknown";
  return null;
}
