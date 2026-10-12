// Shared plan criteria used by Compare, the AI-assisted search and Guided Questions.
// One filter implementation so every entry point narrows plans the same way.
import { PLANS, type Plan, type PlanType } from "./plans";

/** Plan structure from the CMS plan type (separate from Special Needs eligibility). */
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
/** Exact CMS classification without the Special Needs suffix (e.g. "PPO D-SNP" -> "PPO"). */
export const exactTypeOf = (p: Plan) => (p.cmsType ?? "").replace(/\s+[CDI]-SNP$/, "");

export type Cov = "all" | "ma" | "orig" | "medigap";
export const COVS: Cov[] = ["all", "ma", "orig", "medigap"];
export const COV_LABEL: Record<Cov, string> = { all: "All coverage options", ma: "Medicare Advantage", orig: "Original Medicare", medigap: "Original Medicare + Medigap" };

export type Net = "any" | "hmo" | "ppo" | "other";
export const NETS: Net[] = ["any", "hmo", "ppo", "other"];
export const NET_LABEL: Record<Net, string> = { any: "Any network type", hmo: "HMO", ppo: "PPO", other: "Other plan types" };
export type NetMode = "only" | "prefer";
export const netMatches = (p: Plan, n: Net) => {
  const s = structureOf(p);
  return n === "any" || (n === "hmo" ? s === "HMO" : n === "ppo" ? s === "PPO" : s === "HMO-POS" || s === "PFFS");
};
/** Exact classifications offered in Advanced filters, only as refinements of the chosen network type. */
export const EXACT_FOR: Record<Net, string[]> = { any: [], hmo: [], ppo: ["Regional PPO"], other: ["HMO-POS", "PFFS"] };

export type Benefit = "dental" | "vision" | "hearing" | "fitness";
export const BENEFITS: Benefit[] = ["dental", "vision", "hearing", "fitness"];
export const BENEFIT_LABEL: Record<Benefit, string> = { dental: "Dental", vision: "Vision", hearing: "Hearing", fitness: "Fitness" };

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
export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

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

/**
 * Insurer suggestions for the single search box. Each suggestion says what text is left in the
 * box after the insurer becomes a filter chip, so the same insurer is never applied twice.
 */
export function carrierSuggestions(draft: string, available: string[]): { carrier: string; rest: string }[] {
  const t = norm(draft);
  if (t.length < 2) return [];
  const out = new Map<string, string>();
  for (const g of ALIAS_GROUPS) {
    const hit = g.words.find((w) => ` ${t} `.includes(` ${w} `));
    if (hit && available.includes(g.carrier)) out.set(g.carrier, norm(` ${t} `.replace(` ${hit} `, " ")));
  }
  for (const c of available) {
    if (out.has(c)) continue;
    const n = norm(c);
    if (n.includes(t) || n.split(" ").some((w) => w.length >= 3 && w.startsWith(t))) out.set(c, "");
    else {
      const first = n.split(" ")[0]!;
      if (first.length >= 4 && ` ${t} `.includes(` ${first} `)) out.set(c, norm(` ${t} `.replace(` ${first} `, " ")));
    }
  }
  return [...out].slice(0, 5).map(([carrier, rest]) => ({ carrier, rest }));
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

/** Non-sensitive, shareable criteria (kept in the web address). */
export interface UrlCriteria {
  county: string;
  cov: Cov;
  net: Net;
  netMode: NetMode;
  /** Advanced: exact CMS classifications refining the network type. */
  cms: string[];
  /** Advanced: include Special Needs Plans (eligibility rules apply). */
  snp: boolean;
  carriers: string[];
  q: string;
  /** Benefits set to "Required". */
  req: Benefit[];
  noRef: boolean;
  maxPremium: number | null;
  sort: "total" | "premium" | "oop" | "";
}

export const EMPTY_CRITERIA: Omit<UrlCriteria, "county"> = { cov: "all", net: "any", netMode: "only", cms: [], snp: false, carriers: [], q: "", req: [], noRef: false, maxPremium: null, sort: "" };

const ADV: PlanType[] = ["Advantage HMO", "Advantage PPO", "Other Advantage"];
export function typesFor(c: Pick<UrlCriteria, "cov" | "snp">): PlanType[] {
  const base: PlanType[] = c.cov === "ma" ? ADV : c.cov === "orig" ? ["Original only"] : c.cov === "medigap" ? ["Original + Medigap"] : ["Original + Medigap", ...ADV, "Original only"];
  return c.snp && (c.cov === "all" || c.cov === "ma") ? [...base, "Special Needs (SNP)"] : base;
}
/** Network type only applies to Medicare Advantage. */
export const netActive = (c: Pick<UrlCriteria, "cov" | "net">) => c.cov === "ma" && c.net !== "any";

/** Every clause is separate and ANDed: insurer choice and keyword never replace each other. */
export function applyFilters(plans: Plan[], c: UrlCriteria): Plan[] {
  const types = typesFor(c);
  const netOnly = netActive(c) && c.netMode === "only";
  const exact = netActive(c) ? c.cms.filter((x) => EXACT_FOR[c.net].includes(x)) : [];
  return plans.filter((p) =>
    types.includes(p.type)
    && (!netOnly || netMatches(p, c.net))
    && (exact.length === 0 || exact.includes(exactTypeOf(p)))
    && (c.carriers.length === 0 || c.carriers.includes(p.carrier))
    && matchKeyword(p, c.q)
    && (c.maxPremium === null || p.monthlyPremium <= c.maxPremium)
    && c.req.every((b) => p[b] !== false)
    && (!c.noRef || !p.referralsNeeded));
}

/** Translate old shared links (types / structure / must) into the current criteria, once. */
export function fromLegacy(sp: { types?: string; structure?: string; must?: string }): Partial<UrlCriteria> {
  const out: Partial<UrlCriteria> = {};
  const list = (v?: string) => (v ? v.split("|").filter(Boolean) : []);
  const t = list(sp.types);
  if (t.length) {
    const adv = t.some((x) => x.startsWith("Advantage") || x === "Other Advantage");
    const orig = t.includes("Original only"), gap = t.includes("Original + Medigap");
    out.cov = adv && !orig && !gap ? "ma" : !adv && orig && !gap ? "orig" : !adv && gap && !orig ? "medigap" : "all";
    if (t.includes("Special Needs (SNP)")) out.snp = true;
  }
  const s = list(sp.structure);
  if (s.length === 1) {
    out.cov = "ma"; out.netMode = "only";
    out.net = s[0] === "HMO" ? "hmo" : s[0] === "PPO" ? "ppo" : "other";
    if (s[0] === "HMO-POS" || s[0] === "PFFS") out.cms = [s[0]];
  }
  const m = list(sp.must);
  const req = m.filter((x): x is Benefit => (BENEFITS as string[]).includes(x));
  if (req.length) out.req = req;
  if (m.includes("noReferrals")) out.noRef = true;
  return out;
}
