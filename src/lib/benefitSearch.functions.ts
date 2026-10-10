import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ServiceChip = { asked: string; key: string | null };

export const matchServices = createServerFn({ method: "POST" })
  .validator((d) => z.object({ text: z.string().trim().min(2).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const { matchBenefits, } = await import("./ai/benefitMatch.server");
    const { GatewayError } = await import("./ai/planSearch.server");
    try {
      const r = await matchBenefits(data.text);
      if (!r.onTopic || r.items.length === 0) {
        return { ok: false as const, error: "This box only looks up health services. Try something like “MRI, physical therapy, and blood work.”" };
      }
      return { ok: true as const, items: r.items.slice(0, 10) as ServiceChip[] };
    } catch (e) {
      return { ok: false as const, error: e instanceof GatewayError ? e.message : "Something went wrong. Please try again." };
    }
  });
