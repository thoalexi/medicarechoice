export type PlanType = "Original + Medigap" | "Advantage HMO" | "Advantage PPO" | "Original only";
export type Region = "detroit" | "grandrapids" | "lansing" | "up" | "other";

export const REGION_LABELS: Record<Region, string> = {
  detroit: "Detroit Metro (Wayne, Oakland, Macomb)",
  grandrapids: "West Michigan (Kent, Ottawa)",
  lansing: "Mid-Michigan (Ingham, Eaton, Clinton)",
  up: "Upper Peninsula",
  other: "Other area (national averages)",
};

export function regionFromZip(zip: string): Region {
  const p = parseInt(zip.slice(0, 3), 10);
  if (p >= 480 && p <= 483) return "detroit";
  if (p >= 493 && p <= 495) return "grandrapids";
  if (p >= 488 && p <= 489) return "lansing";
  if (p >= 498 && p <= 499) return "up";
  return "other";
}

export const PART_B_MONTHLY = 202.9;
export const PART_D_OOP_CAP = 2100;

export interface Plan {
  id: string;
  name: string;
  carrier: string;
  type: PlanType;
  regions: Region[];
  monthlyPremium: number; // plan premium, on top of Part B
  deductible: number;
  oopMax: number | null; // null = no cap (Original only)
  coinsurance: number; // share of medical costs paid until OOP max
  drugCoverage: boolean;
  drugPremium: number; // standalone Part D monthly if needed
  networkSize: "Any Medicare doctor" | "Large" | "Medium" | "Small";
  referralsNeeded: boolean;
  dental: boolean;
  vision: boolean;
  hearing: boolean;
  starRating: number;
  hospitals: string[];
  summary: string;
}

const MI_HOSP = {
  detroit: ["Henry Ford Health", "Corewell Health East", "Trinity Health", "Detroit Medical Center", "Michigan Medicine"],
  grandrapids: ["Corewell Health West", "Trinity Health Grand Rapids", "University of Michigan Health-West"],
  lansing: ["Sparrow (UM Health)", "McLaren Greater Lansing"],
  up: ["UP Health System", "Aspirus", "War Memorial Hospital"],
  other: ["Most Medicare-accepting hospitals"],
};
const all = (rs: Region[]) => rs.flatMap((r) => MI_HOSP[r]);
const ALL: Region[] = ["detroit", "grandrapids", "lansing", "up", "other"];

export const PLANS: Plan[] = [
  { id: "orig", name: "Original Medicare (A + B) only", carrier: "Medicare", type: "Original only", regions: ALL, monthlyPremium: 0, deductible: 283, oopMax: null, coinsurance: 0.2, drugCoverage: false, drugPremium: 38, networkSize: "Any Medicare doctor", referralsNeeded: false, dental: false, vision: false, hearing: false, starRating: 0, hospitals: all(ALL), summary: "Go to any doctor that takes Medicare, but you pay 20% with no yearly limit. Risky without extra coverage." },
  { id: "medigap-g", name: "Medigap Plan G + Part D", carrier: "Lakeshore Mutual", type: "Original + Medigap", regions: ALL, monthlyPremium: 168, deductible: 283, oopMax: 283, coinsurance: 0, drugCoverage: false, drugPremium: 38, networkSize: "Any Medicare doctor", referralsNeeded: false, dental: false, vision: false, hearing: false, starRating: 0, hospitals: all(ALL), summary: "Highest peace of mind. After the small Part B deductible, nearly everything is covered. Higher monthly cost." },
  { id: "medigap-n", name: "Medigap Plan N + Part D", carrier: "Great Lakes Assurance", type: "Original + Medigap", regions: ALL, monthlyPremium: 122, deductible: 283, oopMax: 900, coinsurance: 0.03, drugCoverage: false, drugPremium: 38, networkSize: "Any Medicare doctor", referralsNeeded: false, dental: false, vision: false, hearing: false, starRating: 0, hospitals: all(ALL), summary: "Cheaper than Plan G, with small copays ($20 office / $50 ER). Still use any Medicare doctor." },
  { id: "hmo-detroit", name: "Motor City Advantage HMO", carrier: "Wolverine Health", type: "Advantage HMO", regions: ["detroit"], monthlyPremium: 0, deductible: 0, oopMax: 5900, coinsurance: 0.12, drugCoverage: true, drugPremium: 0, networkSize: "Medium", referralsNeeded: true, dental: true, vision: true, hearing: true, starRating: 4, hospitals: ["Henry Ford Health", "Detroit Medical Center"], summary: "$0 premium with dental, vision and hearing. Must use network doctors and get referrals." },
  { id: "ppo-detroit", name: "Metro Choice PPO", carrier: "Peninsula Care", type: "Advantage PPO", regions: ["detroit", "lansing"], monthlyPremium: 49, deductible: 250, oopMax: 7400, coinsurance: 0.15, drugCoverage: true, drugPremium: 0, networkSize: "Large", referralsNeeded: false, dental: true, vision: true, hearing: false, starRating: 4.5, hospitals: ["Corewell Health East", "Michigan Medicine", "Trinity Health", "Sparrow (UM Health)"], summary: "Low premium, large network, can see out-of-network doctors at higher cost. No referrals." },
  { id: "hmo-gr", name: "West Shore Advantage HMO", carrier: "Wolverine Health", type: "Advantage HMO", regions: ["grandrapids"], monthlyPremium: 0, deductible: 0, oopMax: 4900, coinsurance: 0.1, drugCoverage: true, drugPremium: 0, networkSize: "Medium", referralsNeeded: true, dental: true, vision: true, hearing: true, starRating: 4.5, hospitals: ["Corewell Health West"], summary: "Highly rated $0 plan tied to Corewell Health West. Referrals required." },
  { id: "ppo-gr", name: "Lakeshore Flex PPO", carrier: "Peninsula Care", type: "Advantage PPO", regions: ["grandrapids", "lansing"], monthlyPremium: 35, deductible: 0, oopMax: 6700, coinsurance: 0.14, drugCoverage: true, drugPremium: 0, networkSize: "Large", referralsNeeded: false, dental: true, vision: false, hearing: false, starRating: 4, hospitals: ["Corewell Health West", "Trinity Health Grand Rapids", "University of Michigan Health-West", "McLaren Greater Lansing"], summary: "Flexible network across West and Mid-Michigan. Dental included, no vision." },
  { id: "hmo-lansing", name: "Capital Area HMO", carrier: "Spartan Senior Plans", type: "Advantage HMO", regions: ["lansing"], monthlyPremium: 0, deductible: 0, oopMax: 5500, coinsurance: 0.12, drugCoverage: true, drugPremium: 0, networkSize: "Small", referralsNeeded: true, dental: true, vision: true, hearing: false, starRating: 3.5, hospitals: ["Sparrow (UM Health)"], summary: "$0 premium, small network centered on Sparrow. Good if your doctors are there." },
  { id: "ppo-up", name: "Yooper Rural PPO", carrier: "Northwoods Health", type: "Advantage PPO", regions: ["up"], monthlyPremium: 29, deductible: 0, oopMax: 6200, coinsurance: 0.13, drugCoverage: true, drugPremium: 0, networkSize: "Medium", referralsNeeded: false, dental: true, vision: true, hearing: true, starRating: 4, hospitals: ["UP Health System", "Aspirus", "War Memorial Hospital"], summary: "Built for the U.P.—covers travel distances with out-of-network coverage." },
  { id: "ppo-national", name: "National Select PPO", carrier: "Heartland Benefits", type: "Advantage PPO", regions: ["other", "up"], monthlyPremium: 19, deductible: 300, oopMax: 8300, coinsurance: 0.16, drugCoverage: true, drugPremium: 0, networkSize: "Large", referralsNeeded: false, dental: true, vision: true, hearing: false, starRating: 3.5, hospitals: ["Most Medicare-accepting hospitals"], summary: "Widely available PPO with low premium but high out-of-pocket maximum." },
];

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
    if (plan.hospitals.includes(a.hospital) || plan.networkSize === "Any Medicare doctor") reasons.push(`Includes ${a.hospital}.`);
    else { score -= 3000; cautions.push(`${a.hospital} may be out of network.`); }
  }
  if (a.priority === "peace" && plan.oopMax !== null && plan.oopMax < 1000) { score += 3000; reasons.push("Very predictable costs—almost no surprise bills."); }
  if (a.priority === "low-premium" && plan.monthlyPremium === 0) { score += 1500; reasons.push("$0 plan premium."); }
  if (a.travels && plan.type === "Advantage HMO") { score -= 1500; cautions.push("Limited coverage when traveling outside the area."); }
  if (a.travels && plan.networkSize === "Any Medicare doctor") reasons.push("Works anywhere in the U.S.");
  (["dental", "vision", "hearing"] as const).forEach((x) => {
    if (a.extras[x]) { if (plan[x]) { score += 400; reasons.push(`Includes ${x}.`); } else cautions.push(`No ${x} coverage—you'd buy it separately.`); }
  });
  if (plan.referralsNeeded) cautions.push("Referrals needed to see specialists.");
  if (plan.oopMax && plan.oopMax > 6000) cautions.push(`In a bad year you could pay up to $${plan.oopMax.toLocaleString()} for medical care.`);
  return { plan, cost, score, reasons, cautions };
}

export const money = (n: number) => "$" + Math.round(n).toLocaleString();
