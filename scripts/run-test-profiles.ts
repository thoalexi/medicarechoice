// Run the saved test profiles through the site's own ranking code and save the results.
// Usage: bun scripts/run-test-profiles.ts   (re-run after any data import or scoring change)
// Writes src/lib/test-profile-results.json, shown on /admin/validation for hand-checking
// against Medicare.gov Plan Finder.
import { writeFileSync } from "node:fs";
import { plansFor, regionFromZip, scorePlan, rankPlans, type Answers } from "../src/lib/plans";

type Profile = { id: number; name: string; who: string; drugs: string; answers: Answers };
const base: Omit<Answers, "zip"> = { health: "some", doctorsFlex: "network-ok", hospital: "none", drugsMonthly: 0, priority: "balanced", extras: { dental: false, vision: false, hearing: false }, travels: false };
const p = (id: number, name: string, who: string, drugs: string, zip: string, a: Partial<Answers>): Profile =>
  ({ id, name, who, drugs, answers: { ...base, zip, ...a } });

export const PROFILES: Profile[] = [
  p(1, "Healthy, no drugs", "Rarely sees a doctor, takes no prescriptions.", "None", "48101", { health: "healthy", drugsMonthly: 0 }),
  p(2, "Healthy, a few generics", "Rarely sees a doctor; 2–3 common generics.", "e.g. atorvastatin, lisinopril, metformin (~$30/mo retail)", "48009", { health: "healthy", drugsMonthly: 30 }),
  p(3, "Some care, several generics", "A few visits a year for one condition.", "Several generics (~$150/mo retail)", "49301", { health: "some", drugsMonthly: 150 }),
  p(4, "One expensive brand drug", "A few visits a year; one brand-name drug.", "e.g. Eliquis (~$600/mo retail)", "48420", { health: "some", drugsMonthly: 600 }),
  p(5, "Insulin user", "Diabetes, regular visits.", "Insulin (Part D cost capped at $35/mo) plus generics (~$70/mo)", "48103", { health: "some", drugsMonthly: 70 }),
  p(6, "Frequent specialist visits", "About 14 specialist visits a year (site's high-use level), few drugs.", "A few generics (~$30/mo)", "48819", { health: "chronic", drugsMonthly: 30 }),
  p(7, "Chronic conditions, high drug use", "Many visits, a hospital stay likely.", "Several brand drugs (~$900/mo retail)", "48415", { health: "chronic", drugsMonthly: 900 }),
  p(8, "Peace of mind, keeps own doctors", "Wants to keep any doctor and avoid surprise bills.", "Several generics (~$100/mo)", "49001", { doctorsFlex: "any", priority: "peace", drugsMonthly: 100 }),
  p(9, "Lowest premium, wants dental and vision", "Budget first; wants dental and vision included.", "A few generics (~$30/mo)", "49808", { priority: "low-premium", drugsMonthly: 30, extras: { dental: true, vision: true, hearing: false } }),
  p(10, "Travels out of state", "Spends winters out of state.", "Several generics (~$100/mo)", "49637", { travels: true, drugsMonthly: 100 }),
];

const results = PROFILES.map((pr) => {
  const county = regionFromZip(pr.answers.zip);
  const ranked = rankPlans(plansFor(county).map((pl) => scorePlan(pl, pr.answers)));
  return {
    ...pr, county,
    top: ranked.slice(0, 3).map((s) => ({ id: s.plan.id, name: s.plan.name, type: s.plan.type, monthlyPremium: s.plan.monthlyPremium, total: s.cost.total, medical: s.cost.medical, drugs: s.cost.drugs, worstCase: s.cost.worstCase })),
  };
});
writeFileSync("src/lib/test-profile-results.json", JSON.stringify({ ranAt: new Date().toISOString().slice(0, 10), results }, null, 1));
for (const r of results) console.log(r.id, r.county, r.top.map((t) => `${t.name} $${t.total}`).join(" | "));
