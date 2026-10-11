// Personal preferences shared by the questionnaire, AI search and Compare filters.
// Kept only in this browser tab (sessionStorage) and never in the web address, logs or our server.
// Deliberately minimal: general choices only — no ZIP, hospital name, diagnoses or medicine names.
import { useSyncExternalStore } from "react";
import type { Health } from "./plans";

export type Source = "questionnaire" | "search" | "you";
export type DrugBand = 0 | 50 | 300 | 1500;
export const DRUG_BANDS: { v: DrugBand; label: string }[] = [
  { v: 0, label: "None" }, { v: 50, label: "Under $100 (generics)" }, { v: 300, label: "$100–$500" }, { v: 1500, label: "Over $500 (brand / specialty)" },
];
export const toBand = (n: number): DrugBand => (n <= 0 ? 0 : n < 100 ? 50 : n <= 500 ? 300 : 1500);

export interface Prefs {
  health: Health;
  drugs: DrugBand;
  keepAnyDoctor: boolean;
  priority: "low-premium" | "balanced" | "peace";
  wants: { dental: boolean; vision: boolean; hearing: boolean };
  travels: boolean;
  /** Where each active choice came from (field name → source), for the preferences strip. */
  sources: Record<string, Source>;
}

export const DEFAULT_PREFS: Prefs = {
  health: "some", drugs: 50, keepAnyDoctor: false, priority: "balanced",
  wants: { dental: false, vision: false, hearing: false }, travels: false, sources: {},
};

const KEY = "ppg-compare-prefs";
let state: Prefs = DEFAULT_PREFS;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Prefs>;
      state = {
        ...DEFAULT_PREFS,
        health: p.health === "healthy" || p.health === "chronic" ? p.health : "some",
        drugs: toBand(Number(p.drugs ?? 50)),
        keepAnyDoctor: !!p.keepAnyDoctor,
        priority: p.priority === "low-premium" || p.priority === "peace" ? p.priority : "balanced",
        wants: { dental: !!p.wants?.dental, vision: !!p.wants?.vision, hearing: !!p.wants?.hearing },
        travels: !!p.travels,
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
    if (k === "wants" && patch.wants) for (const w of Object.keys(patch.wants)) sources[w] = source;
    else sources[k] = source;
  }
  state = { ...state, ...patch, wants: { ...state.wants, ...(patch.wants ?? {}) }, sources };
  try { window.sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
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
