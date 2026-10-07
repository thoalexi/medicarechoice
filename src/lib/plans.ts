import cms from "./cms2027-mi.json";
import extrasData from "./cms2027-mi-extras.json";
import zipCounty from "./mi-zip-county.json";

// Official CMS CY2027 Landscape (file 202609.1) — every Medicare Advantage plan sold in Michigan.
// Premiums, out-of-pocket limits, star ratings and county availability are real CMS figures.
// Dental/vision/hearing come from the CMS CY2027 PBP Benefits file (scripts/build-mi-extras.py).
// Medical spending, coinsurance and drug spending are still estimates.
export const DATA_SOURCE = "CMS CY2027 Medicare Advantage Landscape & Plan Benefit Package files";

export type PlanType = "Original + Medigap" | "Advantage HMO" | "Advantage PPO" | "Special Needs (SNP)" | "Other Advantage" | "Original only";
/** A Michigan county name, or "" when the ZIP is outside Michigan / unknown. */
export type Region = string;

const ZIPS = zipCounty as Record<string, string>;
export const COUNTIES: string[] = Array.from(new Set(cms.plans.flatMap((p) => p.counties))).sort();
export const REGION_LABELS: Record<string, string> = Object.fromEntries(COUNTIES.map((c) => [c, `${c} County`]));

export function regionFromZip(zip: string): Region {
  return ZIPS[zip] ?? "";
}
export const regionLabel = (r: Region) => (r ? `${r} County, Michigan` : "Outside Michigan — showing Original Medicare & Medigap only");

export const PART_B_MONTHLY = 202.9; // 2026 figure; update when CMS announces 2027 Part B
export const PART_D_OOP_CAP = 2100;
const PDP_PREMIUM = Math.round(cms.pdpMedian); // median 2027 Michigan stand-alone Part D premium

export interface Plan {
  id: string;
  name: string;
  carrier: string;
  type: PlanType;
  cmsType?: string;
  regions: Region[] | "all";
  monthlyPremium: number;
  deductible: number;
  oopMax: number | null;
  coinsurance: number;
  drugCoverage: boolean;
  drugPremium: number;
  networkSize: "Any Medicare doctor" | "Plan network" | "Network + out-of-network";
  referralsNeeded: boolean;
  /** From CMS Plan Benefit Package data; null = not reported */
  dental: boolean | null;
  vision: boolean | null;
  hearing: boolean | null;
  extrasDetail?: { dental: string; vision: string; hearing: string };
  starRating: number;
  hospitals: string[];
  summary: string;
  real: boolean;
}

function mapType(t: string, snp: boolean): PlanType {
  if (snp) return "Special Needs (SNP)";
  if (t.startsWith("HMO")) return "Advantage HMO";
  if (t.includes("PPO")) return "Advantage PPO";
  return "Other Advantage";
}

type Extra = { dental: boolean; dentalComprehensive?: boolean; dentalMax?: number | null; dentalOptional?: boolean; vision: boolean; visionExam?: boolean; eyewear?: boolean; eyewearMax?: number | null; hearing: boolean; hearingExam?: boolean; hearingAids?: boolean; hearingAidMax?: number | null };
const EXTRAS = extrasData as Record<string, Extra>;
const usd = (n: number) => "$" + n.toLocaleString();

function extrasDetail(e: Extra | undefined): Plan["extrasDetail"] {
  if (!e) return undefined;
  return {
    dental: e.dental ? `${e.dentalComprehensive ? "Cleanings + fillings/crowns" : "Cleanings & X-rays"}${e.dentalMax ? `, up to ${usd(e.dentalMax)}/yr` : ""}` : e.dentalOptional ? "Optional add-on (extra cost)" : "Not covered",
    vision: e.vision ? `${e.visionExam ? "Eye exam" : ""}${e.visionExam && e.eyewear ? " + " : ""}${e.eyewear ? `glasses/contacts${e.eyewearMax ? ` up to ${usd(e.eyewearMax)}/yr` : ""}` : ""}` : "Not covered",
    hearing: e.hearing ? `${e.hearingExam ? "Hearing exam" : ""}${e.hearingExam && e.hearingAids ? " + " : ""}${e.hearingAids ? `hearing aids${e.hearingAidMax ? ` up to ${usd(e.hearingAidMax)}` : " (copay)"}` : ""}` : "Not covered",
  };
}

const cmsPlans: Plan[] = cms.plans.map((p) => {
  const type = mapType(p.cmsType, p.snp);
  const hmo = p.cmsType.startsWith("HMO");
  const pos = p.cmsType.includes("POS");
  const x = EXTRAS[p.id];
  const snpNote = p.snp ? " Special Needs Plan — only for people who qualify (e.g. Medicare + Medicaid, certain chronic conditions, or nursing-home care)." : "";
  const net = hmo ? (pos ? "HMO with some out-of-network coverage (POS)." : "Must use network doctors, except emergencies.") : "PPO: see out-of-network doctors at higher cost.";
  return {
    id: p.id,
    name: p.name,
    carrier: p.carrier,
    type,
    cmsType: p.cmsType,
    regions: p.counties,
    monthlyPremium: p.premium,
    deductible: 0,
    oopMax: p.moop ?? 9250,
    coinsurance: hmo ? 0.12 : 0.15,
    drugCoverage: p.rx,
    drugPremium: p.rx ? 0 : PDP_PREMIUM,
    networkSize: hmo && !pos ? "Plan network" : "Network + out-of-network",
    referralsNeeded: hmo && !pos,
    dental: x ? x.dental : null, vision: x ? x.vision : null, hearing: x ? x.hearing : null,
    extrasDetail: extrasDetail(x),
    starRating: p.stars,
    hospitals: [],
    summary: `${net}${p.rx ? "" : " Does not include drug coverage."}${snpNote}`,
    real: true,
  };
});

const originalPlans: Plan[] = [
  { id: "orig", name: "Original Medicare (A + B) + Part D", carrier: "Medicare", type: "Original only", regions: "all", monthlyPremium: 0, deductible: 283, oopMax: null, coinsurance: 0.2, drugCoverage: false, drugPremium: PDP_PREMIUM, networkSize: "Any Medicare doctor", referralsNeeded: false, dental: false, vision: false, hearing: false, starRating: 0, hospitals: [], summary: "Go to any doctor that takes Medicare, but you pay 20% with no yearly limit. Risky without extra coverage.", real: false },
  { id: "medigap-g", name: "Medigap Plan G + Part D", carrier: "Various insurers (typical price)", type: "Original + Medigap", regions: "all", monthlyPremium: 168, deductible: 283, oopMax: 283, coinsurance: 0, drugCoverage: false, drugPremium: PDP_PREMIUM, networkSize: "Any Medicare doctor", referralsNeeded: false, dental: false, vision: false, hearing: false, starRating: 0, hospitals: [], summary: "Highest peace of mind. After the small Part B deductible, nearly everything is covered. Price shown is a typical estimate.", real: false },
  { id: "medigap-n", name: "Medigap Plan N + Part D", carrier: "Various insurers (typical price)", type: "Original + Medigap", regions: "all", monthlyPremium: 122, deductible: 283, oopMax: 900, coinsurance: 0.03, drugCoverage: false, drugPremium: PDP_PREMIUM, networkSize: "Any Medicare doctor", referralsNeeded: false, dental: false, vision: false, hearing: false, starRating: 0, hospitals: [], summary: "Cheaper than Plan G, with small copays ($20 office / $50 ER). Still use any Medicare doctor. Price shown is a typical estimate.", real: false },
];

export const PLANS: Plan[] = [...originalPlans, ...cmsPlans];
export const plansFor = (r: Region) => PLANS.filter((p) => p.regions === "all" || (r !== "" && p.regions.includes(r)));

export type Health = "healthy" | "some" | "chronic";
export const MEDICAL_SPEND: Record<Health, number> = { healthy: 1500, some: 8000, chronic: 30000 };

export interface Answers {
  zip: string;
  health: Health;
  doctorsFlex: "any" | "network-ok";
  hospital: string;
  drugsMonthly: number; // retail monthly cost of prescriptions
  priority: "low-premium" | "balanced" | "peace";
  extras: { dental: boolean; vision: boolean; hearing: boolean };
  travels: boolean;
}

export function estimateAnnual(plan: Plan, health: Health, drugsMonthly: number) {
  const premiums = (plan.monthlyPremium + PART_B_MONTHLY) * 12;
  const drugPrem = plan.drugCoverage ? 0 : plan.drugPremium * 12;
  const spend = MEDICAL_SPEND[health];
  let medical = Math.min(spend, plan.deductible) + Math.max(0, spend - plan.deductible) * plan.coinsurance;
  if (plan.oopMax !== null) medical = Math.min(medical, plan.oopMax);
  const drugRetail = drugsMonthly * 12;
  const drugs = plan.type === "Original only" && !plan.drugCoverage && drugsMonthly === 0 ? 0 : Math.min(drugRetail * 0.3, PART_D_OOP_CAP);
  const worstCase = plan.oopMax === null ? null : premiums + drugPrem + plan.oopMax + PART_D_OOP_CAP;
  return { premiums: premiums + drugPrem, medical: Math.round(medical), drugs: Math.round(drugs), total: Math.round(premiums + drugPrem + medical + drugs), worstCase };
}

export function scorePlan(plan: Plan, a: Answers) {
  const cost = estimateAnnual(plan, a.health, a.drugsMonthly);
  let score = 10000 - cost.total;
  const reasons: string[] = [];
  const cautions: string[] = [];
  if (plan.type === "Original only") { score -= 6000; cautions.push("No limit on what you could pay in a bad year."); }
  if (a.doctorsFlex === "any") {
    if (plan.networkSize === "Any Medicare doctor") { score += 2500; reasons.push("Lets you keep any doctor who takes Medicare."); }
    else if (plan.type === "Advantage HMO") { score -= 2500; cautions.push("You'd need to use network doctors only."); }
  }
  if (a.hospital && a.hospital !== "none") {
    if (plan.networkSize === "Any Medicare doctor") reasons.push(`Includes ${a.hospital}.`);
    else if (plan.referralsNeeded) { score -= 1500; cautions.push(`Confirm ${a.hospital} is in this plan's network before enrolling.`); }
    else cautions.push(`Check that ${a.hospital} is in network (out-of-network costs more).`);
  }
  if (a.priority === "peace" && plan.oopMax !== null && plan.oopMax < 1000) { score += 3000; reasons.push("Very predictable costs—almost no surprise bills."); }
  if (a.priority === "low-premium" && plan.monthlyPremium === 0) { score += 1500; reasons.push("$0 plan premium."); }
  if (plan.type === "Special Needs (SNP)") { score -= 4000; cautions.push("Only for people who qualify for this Special Needs Plan."); }
  if (a.travels && plan.type === "Advantage HMO") { score -= 1500; cautions.push("Limited coverage when traveling outside the area."); }
  if (a.travels && plan.networkSize === "Any Medicare doctor") reasons.push("Works anywhere in the U.S.");
  (["dental", "vision", "hearing"] as const).forEach((x) => {
    if (a.extras[x]) { if (plan[x] === null) cautions.push(`Check the plan's Summary of Benefits for ${x} coverage.`); else if (plan[x]) { score += 400; reasons.push(`Includes ${x}.`); } else cautions.push(`No ${x} coverage—you'd buy it separately.`); }
  });
  if (plan.referralsNeeded) cautions.push("Referrals needed to see specialists.");
  if (plan.oopMax && plan.oopMax > 6000) cautions.push(`In a bad year you could pay up to $${plan.oopMax.toLocaleString()} for medical care.`);
  return { plan, cost, score, reasons, cautions };
}

export const money = (n: number) => "$" + Math.round(n).toLocaleString();
