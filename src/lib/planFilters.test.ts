import { describe, expect, it } from "vitest";
import { applyFilters, carrierSuggestions, fromLegacy, netMatches, structureOf, EMPTY_CRITERIA, type UrlCriteria } from "./planFilters";
import { COUNTIES, plansFor, estimateAnnual, scorePlan } from "./plans";

const base = (county: string, p: Partial<UrlCriteria> = {}): UrlCriteria => ({ ...EMPTY_CRITERIA, county, ...p });
const G = "Genesee";

describe("coverage and network filters", () => {
  it("All coverage matches the previous default list (no Special Needs) in every county", () => {
    for (const co of COUNTIES) {
      const area = plansFor(co);
      expect(applyFilters(area, base(co)).length).toBe(area.filter((p) => p.type !== "Special Needs (SNP)").length);
    }
  });
  it("PPO only returns only regular PPOs (including Regional PPO), never HMO or Special Needs", () => {
    const r = applyFilters(plansFor(G), base(G, { cov: "ma", net: "ppo", netMode: "only" }));
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => structureOf(p) === "PPO" && p.type !== "Special Needs (SNP)")).toBe(true);
  });
  it("HMO only excludes HMO-POS", () => {
    const r = applyFilters(plansFor(G), base(G, { cov: "ma", net: "hmo", netMode: "only" }));
    expect(r.every((p) => structureOf(p) === "HMO")).toBe(true);
  });
  it("Other groups HMO-POS and PFFS but keeps their exact types", () => {
    const r = applyFilters(plansFor(G), base(G, { cov: "ma", net: "other", netMode: "only" }));
    expect(r.every((p) => ["HMO-POS", "PFFS"].includes(structureOf(p) ?? ""))).toBe(true);
    const exact = applyFilters(plansFor(G), base(G, { cov: "ma", net: "other", netMode: "only", cms: ["HMO-POS"] }));
    expect(exact.every((p) => p.cmsType === "HMO-POS")).toBe(true);
  });
  it("PPO preferred hides nothing", () => {
    const all = applyFilters(plansFor(G), base(G, { cov: "ma" }));
    expect(applyFilters(plansFor(G), base(G, { cov: "ma", net: "ppo", netMode: "prefer" })).length).toBe(all.length);
  });
  it("Network type never applies to Original Medicare or Medigap", () => {
    const r = applyFilters(plansFor(G), base(G, { cov: "orig", net: "ppo", netMode: "only" }));
    expect(r.map((p) => p.type)).toEqual(["Original only"]);
    expect(applyFilters(plansFor(G), base(G, { cov: "medigap" })).every((p) => p.type === "Original + Medigap")).toBe(true);
  });
  it("Required benefit excludes confirmed 'no' but keeps unknown", () => {
    const area = plansFor(G);
    const r = applyFilters(area, base(G, { req: ["dental"] }));
    expect(r.every((p) => p.dental !== false)).toBe(true);
    expect(r.length).toBe(area.filter((p) => p.type !== "Special Needs (SNP)" && p.dental !== false).length);
  });
  it("Insurer and keyword are separate clauses", () => {
    const r = applyFilters(plansFor(G), base(G, { carriers: ["Blue Cross Blue Shield of Michigan"], cov: "ma", net: "ppo", netMode: "only" }));
    expect(r.every((p) => p.carrier === "Blue Cross Blue Shield of Michigan" && netMatches(p, "ppo"))).toBe(true);
  });
});

describe("search suggestions", () => {
  it("keeps Blue Cross and Blue Care Network distinct and strips the insurer words", () => {
    const s = carrierSuggestions("blue cross ppo", ["Blue Cross Blue Shield of Michigan", "Blue Care Network"]);
    expect(s[0]).toEqual({ carrier: "Blue Cross Blue Shield of Michigan", rest: "ppo" });
    expect(s.some((x) => x.carrier === "Blue Care Network")).toBe(false);
  });
});

describe("old links", () => {
  it("translates legacy params", () => {
    expect(fromLegacy({ structure: "PPO", must: "dental|noReferrals" })).toMatchObject({ cov: "ma", net: "ppo", netMode: "only", req: ["dental"], noRef: true });
    expect(fromLegacy({ types: "Original + Medigap" })).toMatchObject({ cov: "medigap" });
  });
});

describe("cost estimates unchanged by preferences", () => {
  it("scorePlan cost equals estimateAnnual regardless of priority, doctors, travel or extras", () => {
    for (const p of plansFor(G)) {
      const s = scorePlan(p, { zip: "", health: "some", doctorsFlex: "any", hospital: "none", drugsMonthly: 300, priority: "flex", extras: { dental: true, vision: false, hearing: true, fitness: true }, travels: true });
      expect(s.cost).toEqual(estimateAnnual(p, "some", 300));
    }
  });
});
