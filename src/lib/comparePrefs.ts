// Personal preferences shared by Guided Questions, AI-assisted search and Compare filters.
// Kept only in this browser tab (sessionStorage) and never in the web address, logs or our server.
// Deliberately minimal: general choices only — no ZIP, hospital name, diagnoses or medicine names.
import { useSyncExternalStore } from "react";
import type { Health } from "./plans";
import type { Benefit } from "./planFilters";

export type Source = "questionnaire" | "search" | "you";
export type DrugBand = 0 | 50 | 300 | 1500;
export const DRUG_BANDS: { v: DrugBand; label: string }[] = [
  { v: 0, label: "None" }, { v: 50, label: "Under $100 (generics)" }, { v: 300, label: "$100–$500" }, { v: 1500, label: "Over $500 (brand / specialty)" },
];
export const toBand = (n: number): DrugBand => (n <= 0 ? 0 : n < 100 ? 50 : n <= 500 ? 300 : 1500);

export type Priority = "low-premium" | "peace" | "flex" | "balanced";
export const PRIORITY_LABEL: Record<Priority, string> = {
  "low-premium": "Lower monthly premiums",
  peace: "Lower potential medical expenses",
  flex: "More freedom to choose doctors",
  balanced: "A balance of cost and flexibility",
};
export type Travel = "yes" | "no" | "unsure";

export interface Prefs {
  health: Health;
  drugs: DrugBand;
  /** Independent of priority: a person can want low premiums and still keep their doctors. */
  keepAnyDoctor: boolean;
  priority: Priority;
  /** Benefits marked "Preferred" (Required ones live in the web address). */
  preferred: Record<Benefit, boolean>;
  travels: Travel;
  /** Where each active choice came from (field name → source), for Current Preferences. */
  sources: Record<string, Source>;
}

const NO_BENEFITS: Record<Benefit, boolean> = { dental: false, vision: false, hearing: false, fitness: false };
export const DEFAULT_PREFS: Prefs = {
  health: "some", drugs: 50, keepAnyDoctor: false, priority: "balanced",
  preferred: NO_BENEFITS, travels: "unsure", sources: {},
};

const KEY = "ppg-compare-prefs";
let state: Prefs = DEFAULT_PREFS;
let loaded = false;
const subs = new Set<() => void>();
const save = () => { try { window.sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ } };

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Prefs> & { wants?: Partial<Record<Benefit, boolean>>; travels?: unknown };
      const pref = p.preferred ?? p.wants ?? {};
      state = {
        ...DEFAULT_PREFS,
        health: p.health === "healthy" || p.health === "chronic" ? p.health : "some",
        drugs: toBand(Number(p.drugs ?? 50)),
        keepAnyDoctor: !!p.keepAnyDoctor,
        priority: p.priority === "low-premium" || p.priority === "peace" || p.priority === "flex" ? p.priority : "balanced",
        preferred: { dental: !!pref.dental, vision: !!pref.vision, hearing: !!pref.hearing, fitness: !!pref.fitness },
        travels: p.travels === "yes" || p.travels === true ? "yes" : p.travels === "no" ? "no" : "unsure",
        sources: typeof p.sources === "object" && p.sources ? p.sources : {},
      };
    }
  } catch { /* ignore unreadable storage */ }
}

/** Merge a change; the newest write wins per field and records its source. */
export function setPrefs(patch: Partial<Omit<Prefs, "sources">>, source: Source, extraSources: Record<string, Source> = {}) {
  load();
  const sources = { ...state.sources, ...extraSources };
  for (const k of Object.keys(patch)) {
    if (k === "preferred" && patch.preferred) for (const w of Object.keys(patch.preferred)) sources[w] = source;
    else sources[k] = source;
  }
  state = { ...state, ...patch, preferred: { ...state.preferred, ...(patch.preferred ?? {}) }, sources };
  save();
  subs.forEach((f) => f());
}

/** Record where a web-address filter (county, network, insurer…) came from. */
export function markSources(s: Record<string, Source>) {
  load();
  state = { ...state, sources: { ...state.sources, ...s } };
  save();
  subs.forEach((f) => f());
}

export function resetPrefs() {
  load();
  state = DEFAULT_PREFS;
  try { window.sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

/** Server and first client render use defaults; stored choices apply right after hydration. */
export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => { load(); return state; },
    () => DEFAULT_PREFS,
  );
}
