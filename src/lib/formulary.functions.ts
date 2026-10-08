import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  drugs: z
    .array(z.object({ name: z.string().trim().min(1).max(100), dose: z.string().trim().max(100).nullable() }))
    .min(1)
    .max(30),
  planName: z.string().trim().max(200).nullable(),
  fileName: z.string().trim().min(1).max(200),
  pdfBase64: z.string().min(100).max(28_000_000),
});

export const checkFormulary = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const { analyzeFormulary, GatewayError } = await import("./ai/formulary.server");
    try {
      return { ok: true as const, report: await analyzeFormulary(data) };
    } catch (e) {
      const message = e instanceof GatewayError ? e.message : "Something went wrong. Please try again.";
      return { ok: false as const, error: message };
    }
  });
