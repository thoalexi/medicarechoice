import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  drugs: z
    .array(z.object({ name: z.string().trim().min(1).max(100), dose: z.string().trim().max(100).nullable() }))
    .min(1)
    .max(30),
  planName: z.string().trim().max(200).nullable(),
  planId: z.string().trim().max(40).nullable().default(null),
  fileName: z.string().trim().min(1).max(200).nullable().default(null),
  pdfBase64: z.string().min(100).max(28_000_000).nullable().default(null),
});

export type FormularySource = { url: string; title: string } | null;

export const checkFormulary = createServerFn({ method: "POST" })
  .validator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const { analyzeFormulary, GatewayError } = await import("./ai/formulary.server");
    try {
      let fileName = data.fileName;
      let pdfBase64 = data.pdfBase64;
      let source: FormularySource = null;
      if (!pdfBase64) {
        const { PLANS } = await import("./plans");
        const { CARRIER_FORMULARY_URLS } = await import("./formulary-links");
        const plan = PLANS.find((p) => p.id === data.planId);
        if (!plan || !plan.real) return { ok: false as const, notFound: true, error: "Please choose a plan from the list." };
        const { findFormulary } = await import("./ai/formularyFetch.server");
        const found = await findFormulary({ id: plan.id, name: plan.name, carrierUrl: CARRIER_FORMULARY_URLS[plan.carrier] }).catch((e) => {
          console.error("formulary lookup failed", e);
          return null;
        });
        if (!found) return { ok: false as const, notFound: true, error: "We couldn't find and confirm this plan's 2027 drug list online. Use the plan's official lookup below, or upload the PDF." };
        fileName = found.fileName;
        pdfBase64 = found.pdfBase64;
        source = { url: found.url, title: found.title };
      }
      const report = await analyzeFormulary({ drugs: data.drugs, planName: data.planName, fileName: fileName ?? "formulary.pdf", pdfBase64 });
      return { ok: true as const, report, source };
    } catch (e) {
      const message = e instanceof GatewayError ? e.message : "Something went wrong. Please try again.";
      return { ok: false as const, notFound: false, error: message };
    }
  });
