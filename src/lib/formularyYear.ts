export const COVERAGE_YEAR = 2027;
/** Year stated in a formulary's title or address, or null when none or more than one is stated. */
export function formularyYear(url: string, title?: string | null): number | null {
  const years = new Set(Array.from(`${title ?? ""} ${decodeURIComponent(url)}`.matchAll(/(?<!\d)(20\d{2})(?!\d)/g)).map((m) => Number(m[1])));
  return years.size === 1 ? [...years][0]! : null;
}
