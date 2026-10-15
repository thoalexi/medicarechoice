import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { deriveStatus, compareRelease, STATUS_TEXT, WATCHED } from "./cmsImport";
import { formularyYear } from "./formularyYear";
import { FIGURES, applyLiveData, partBFallbackLabel, PLANS, estimateAnnual, type FiguresPayload } from "./plans";
import figures from "./medicare-figures.json";

const ok = { last_checked_at: "2026-10-15", last_success_at: "2026-10-15", last_error: null, update_available: false, contents_compared: false };

describe("freshness status", () => {
  it("failed check is never green", () => {
    expect(deriveStatus({ ...ok, last_error: "CMS page returned 500" })).toBe("failed");
  });
  it("metadata-only says so and never 'verified current'", () => {
    expect(STATUS_TEXT[deriveStatus(ok)]).toBe("No newer release found — metadata only");
    expect(Object.values(STATUS_TEXT).join(" ")).not.toMatch(/verified current/i);
  });
  it("known unpublished update stays visible even after a failed re-check", () => {
    expect(deriveStatus({ ...ok, update_available: true, last_error: "timeout" })).toBe("update");
  });
  it("same file name with changed contents is an update", () => {
    expect(compareRelease("a.zip", "a.zip", { checksum: "111" }, "222")).toEqual({ update: true, compared: true });
    expect(compareRelease("a.zip", "a.zip", { checksum: "111" }, "111")).toEqual({ update: false, compared: true });
    expect(compareRelease("a.zip", "a.zip", { checksum: null }, null).compared).toBe(false);
  });
  it("newer release than the version serving the site is an update", () => {
    expect(compareRelease("b.zip", "a.zip").update).toBe(true);
  });
  it("benefits and service-level data share one check", () => {
    const pbp = WATCHED.filter((w) => w.covers.includes("services") || w.covers.includes("pbp"));
    expect(pbp).toHaveLength(1);
    expect(new Set(WATCHED.map((w) => w.key)).size).toBe(WATCHED.length);
  });
  it("no scheduled check route remains", () => {
    expect(() => readFileSync("src/routes/api/public/cms-check.ts")).toThrow();
  });
});

describe("drug list coverage year", () => {
  it("accepts only a single stated 2027", () => {
    expect(formularyYear("https://x.com/2027-formulary.pdf")).toBe(2027);
    expect(formularyYear("https://x.com/formulary.pdf", "2026 Drug List")).toBe(2026);
    expect(formularyYear("https://x.com/formulary.pdf", "Drug List")).toBeNull();
    expect(formularyYear("https://x.com/2026-2027.pdf")).toBeNull();
  });
});

describe("publish requires exact-version validation", () => {
  const sql = readFileSync("drizzle/migrations/0004_cms_freshness_status.sql", "utf8");
  it("checks staged status and the validated checksum of the same row", () => {
    expect(sql).toMatch(/st <> 'staged'/);
    expect(sql).toMatch(/vsha IS NULL OR vsha <> sha/);
  });
});

describe("Part B 2026 fallback", () => {
  it("labels estimates while unconfirmed, and math + label switch together", () => {
    const plan = PLANS.find((p) => p.real)!;
    expect(FIGURES.partBMonthly.year).toBe(2026);
    expect(partBFallbackLabel()).toMatch(/2026 Part B/);
    const before = estimateAnnual(plan, "some").total;
    const next = JSON.parse(JSON.stringify(figures)) as FiguresPayload;
    next.figures.partBMonthly = { ...next.figures.partBMonthly, value: 300, year: 2027, confirmed: true };
    applyLiveData({ figures: next, publishedAt: {} });
    expect(partBFallbackLabel()).toBeNull();
    expect(estimateAnnual(plan, "some").total).toBeCloseTo(before + (300 - 202.9) * 12, 0);
  });
});
