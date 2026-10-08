import { useEffect, useMemo, useRef, useState } from "react";
import HOSPITALS from "@/lib/mi-hospitals.json";

const MAX_SHOWN = 8;

/** Higher = better match. Name first, then city, then county / hospital type. */
function rank(h: { name: string; city: string; county: string; type: string }, q: string) {
  const name = h.name.toLowerCase();
  const city = h.city.toLowerCase();
  if (name.startsWith(q)) return 4;
  if (name.includes(q)) return 3;
  if (city.includes(q)) return 2;
  if (h.county.toLowerCase().includes(q) || h.type.toLowerCase().includes(q)) return 1;
  return 0;
}

export function HospitalPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const closeTimer = useRef<number | undefined>(undefined);
  const query = value === "none" ? "" : value;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return HOSPITALS.map((h) => ({ h, s: rank(h, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.h.name.localeCompare(b.h.name))
      .slice(0, MAX_SHOWN)
      .map((x) => x.h);
  }, [query]);

  // Keep the highlighted row on screen when using the arrow keys.
  useEffect(() => {
    document.getElementById(`hospital-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (name: string) => {
    onChange(name.trim() ? name : "none");
    setOpen(false);
    setActive(0);
  };

  const showList = open && query.trim().length > 0;

  return (
    <div className="relative">
      <input
        id="hospital-input"
        role="combobox"
        aria-expanded={showList}
        aria-controls="hospital-options"
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `hospital-opt-${active}` : undefined}
        autoComplete="off"
        value={query}
        maxLength={120}
        placeholder="No preference"
        onChange={(e) => {
          onChange(e.target.value.trim() ? e.target.value : "none");
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.clearTimeout(closeTimer.current);
          closeTimer.current = window.setTimeout(() => setOpen(false), 130);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") return setOpen(false);
          if (!results.length) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => (e.key === "ArrowDown" ? Math.min(i + 1, results.length - 1) : Math.max(i - 1, 0)));
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            pick(results[active].name);
          }
        }}
        className="mt-2 block w-full rounded-xl border-2 border-input bg-card p-4 text-lg"
      />
      {showList && (
        <ul
          id="hospital-options"
          role="listbox"
          aria-label="Matching hospitals"
          onMouseDown={() => window.clearTimeout(closeTimer.current)}
          className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-xl border-2 border-input bg-card shadow-lg"
        >
          {results.length === 0 ? (
            <li className="p-4 text-lg text-muted-foreground">
              No match in our Michigan list — that's okay, keep what you typed.
            </li>
          ) : (
            results.map((h, i) => (
              <li
                key={h.name + h.city}
                id={`hospital-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(h.name)}
                className={`flex min-h-14 cursor-pointer flex-col justify-center border-b px-4 py-3 last:border-b-0 ${
                  i === active ? "bg-primary/10" : ""
                }`}
              >
                <span className="text-lg font-bold">{h.name}</span>
                <span className="text-sm text-muted-foreground">
                  {h.city}, {h.county} County
                </span>
              </li>
            ))
          )}
          <li className="border-t bg-secondary px-4 py-3 text-base text-muted-foreground">
            Not the one you meant? Keep typing, or use{" "}
            <button
              type="button"
              onClick={() => pick(query.trim())}
              className="font-bold text-primary underline underline-offset-4"
            >
              “{query.trim()}”
            </button>
            .
          </li>
        </ul>
      )}
    </div>
  );
}
