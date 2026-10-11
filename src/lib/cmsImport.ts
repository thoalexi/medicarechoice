// Deterministic CMS file parsing and validation. No AI, no guessing: values are copied or rejected.
import cms from "./cms2027-mi.json";
import type { StarsPayload, FiguresPayload, FigureKey } from "./plans";

export type Report = { ok: boolean; errors: string[]; warnings: string[]; summary: Record<string, number>; changes: string[] };

/** Minimal RFC-4180 CSV parser (quotes, commas, newlines in quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const h = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const MI_CONTRACTS = Array.from(new Set(cms.plans.map((p) => p.id.split("_")[0]!))).sort();

/** Parse the CMS "Star Ratings Data Table - Summary Ratings" CSV. Throws on a layout it doesn't recognize. */
export function parseStarsCsv(text: string): StarsPayload {
  const rows = parseCsv(text);
  const hi = rows.findIndex((r) => r.some((c) => c.trim() === "Contract Number"));
  if (hi < 0) throw new Error("This doesn't look like the CMS Summary Ratings file (no 'Contract Number' column).");
  const hdr = rows[hi]!.map((h) => h.trim());
  const overallCol = hdr.find((h) => /^\d{4} Overall$/.test(h));
  if (!overallCol) throw new Error("Missing the '<year> Overall' column.");
  const year = Number(overallCol.slice(0, 4));
  const cols = [[`${year} Overall`, "overall"], [`${year} Part D Summary`, "partD"], [`${year} Part C Summary`, "partC"]] as const;
  const ci = hdr.indexOf("Contract Number");
  const idx = cols.map(([n]) => hdr.indexOf(n));
  if (idx.some((i) => i < 0)) throw new Error(`Missing one of: ${cols.map((c) => c[0]).join(", ")}.`);
  const ratings: StarsPayload["ratings"] = {}; const unavailable: StarsPayload["unavailable"] = {};
  for (const r of rows.slice(hi + 1)) {
    const c = (r[ci] ?? "").trim();
    if (!c) continue;
    if (!/^[EHRS]\d{4}$/.test(c)) throw new Error(`Unexpected contract number "${c}".`);
    if (ratings[c] || unavailable[c]) throw new Error(`Contract ${c} appears twice.`);
    let reason: string | null = null;
    for (let k = 0; k < cols.length; k++) {
      const v = (r[idx[k]!] ?? "").trim();
      const n = Number(v);
      if (v !== "" && Number.isFinite(n)) {
        if (n < 1 || n > 5) throw new Error(`Rating out of range for ${c}: ${v}`);
        ratings[c] = { stars: n, category: cols[k]![1] }; break;
      }
      if (v && v !== "Not Applicable" && !reason) reason = v;
    }
    if (!ratings[c]) unavailable[c] = reason ?? "Not available";
  }
  if (Object.keys(ratings).length < 100) throw new Error("Too few ratings found — file looks incomplete.");
  return { year, ratings, unavailable };
}

export function validateStars(next: StarsPayload, current: StarsPayload, expectedYear: number): Report {
  const errors: string[] = []; const warnings: string[] = []; const changes: string[] = [];
  if (next.year !== expectedYear) errors.push(`File is for ${next.year} ratings; expected ${expectedYear}.`);
  const missing = MI_CONTRACTS.filter((c) => !next.ratings[c] && !next.unavailable[c]);
  if (missing.length) warnings.push(`Michigan contracts not in this file (will fall back to 2026 rating if any): ${missing.join(", ")}`);
  for (const c of MI_CONTRACTS) {
    const a = current.ratings[c]?.stars ?? null; const b = next.ratings[c]?.stars ?? null;
    if (a !== b) changes.push(`${c}: ${a ?? "no rating"} → ${b ?? next.unavailable[c] ?? "not in file"}`);
  }
  const rated = MI_CONTRACTS.filter((c) => next.ratings[c]).length;
  return { ok: errors.length === 0, errors, warnings, changes,
    summary: { contractsInFile: Object.keys(next.ratings).length + Object.keys(next.unavailable).length, michiganContracts: MI_CONTRACTS.length, michiganRated: rated, michiganUnavailable: MI_CONTRACTS.length - rated - missing.length } };
}

const FIG_KEYS: FigureKey[] = ["partDOopCap", "partDStandardDeductible", "partBMonthly", "partBDeductible"];
export function validateFigures(next: FiguresPayload, current: FiguresPayload): Report {
  const errors: string[] = []; const warnings: string[] = []; const changes: string[] = [];
  for (const k of FIG_KEYS) {
    const f = next.figures[k];
    if (!f) { errors.push(`Missing ${k}.`); continue; }
    if (!Number.isFinite(f.value) || f.value <= 0 || f.value > 20000) errors.push(`${f.label}: value must be a positive dollar amount.`);
    if (!/^https:\/\/(www\.)?cms\.gov\//.test(f.source)) errors.push(`${f.label}: source must be an official cms.gov link.`);
    if (f.confirmed && f.year !== next.coverageYear) errors.push(`${f.label}: marked confirmed but the year (${f.year}) isn't ${next.coverageYear}.`);
    if (!f.confirmed) warnings.push(`${f.label} stays labeled as a ${f.year} figure.`);
    const o = current.figures[k];
    if (o && (o.value !== f.value || o.year !== f.year || o.confirmed !== f.confirmed)) changes.push(`${f.label}: $${o.value} (${o.year}${o.confirmed ? "" : ", unconfirmed"}) → $${f.value} (${f.year}${f.confirmed ? "" : ", unconfirmed"})`);
  }
  return { ok: errors.length === 0, errors, warnings, changes, summary: { figures: FIG_KEYS.length } };
}

/** Datasets whose newest file is found by scanning official CMS pages. */
export const WATCHED = [
  { key: "landscape", page: "https://www.cms.gov/medicare/coverage/prescription-drug-coverage", pattern: /\/files\/zip\/cy(\d{4})-landscape-[\w-]+\.zip/gi, current: "/files/zip/cy2027-landscape-202609-1.zip" },
  { key: "pbp", page: "https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data/benefits-data", pattern: /benefits-data\/(?:pbp-benefits-\d{4}(?:-q\d)?|\d{4}-pbp-benefits(?:-q\d)?)(?=")/gi, current: "benefits-data/pbp-benefits-2027" },
  { key: "stars", page: "https://www.cms.gov/medicare/health-drug-plans/part-c-d-performance-data", pattern: /\/files\/zip\/(\d{4})-star-ratings-data-tables[\w-]*\.zip/gi, current: "/files/zip/2027-star-ratings-data-tables-oct-8-2026.zip" },
] as const;

/** Pick the link for the highest year >= the current year; deterministic (sorted). */
export function newestLink(html: string, pattern: RegExp, minYear: number): string | null {
  const found = Array.from(new Set(Array.from(html.matchAll(pattern)).map((m) => m[0]))).filter((l) => Number(/(\d{4})/.exec(l)?.[1]) >= minYear).sort();
  if (!found.length) return null;
  const maxYear = Math.max(...found.map((l) => Number(/(\d{4})/.exec(l)![1])));
  return found.filter((l) => l.includes(String(maxYear))).sort().at(-1)!;
}
