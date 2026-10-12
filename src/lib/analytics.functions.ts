import { createServerFn } from "@tanstack/react-start";

/** GA4 measurement IDs are public by design; this just reads the stored value. */
export const getGaId = createServerFn({ method: "GET" }).handler(async () => {
  const id = process.env["GOOGLE_ANALYTICS_MEASUREMENT_ID"] ?? "";
  return /^G-[A-Z0-9]+$/.test(id.trim()) ? id.trim() : null;
});
