import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

export const reportSchema = z.object({
  planName: z.string().nullable(),
  drugs: z.array(
    z.object({
      name: z.string(),
      status: z.enum(["found", "not_found", "unclear"]),
      matchedAs: z.string().nullable(),
      tier: z.string().nullable(),
      restrictions: z.array(z.string()),
      statedCost: z.string().nullable(),
      page: z.string().nullable(),
      note: z.string(),
    }),
  ),
  gaps: z.array(z.string()),
  verify: z.array(z.string()),
});
export type FormularyReport = z.infer<typeof reportSchema>;

const INSTRUCTIONS = `You help Medicare shoppers read an official plan formulary (drug list) PDF.
For each medication the user lists, search the document and report:
- status: "found" if listed, "not_found" if clearly absent, "unclear" if the document is ambiguous or incomplete.
- matchedAs: the exact entry name (brand/generic) you matched, or null.
- tier: the drug tier as stated (e.g. "Tier 2 – Preferred generic"), or null.
- restrictions: stated requirements such as Prior Authorization (PA), Step Therapy (ST), Quantity Limit (QL) with the limit, B/D, LA (limited access). Spell abbreviations out in plain words.
- statedCost: only cost information the document itself states (copay/coinsurance for that tier). Never invent amounts; null if not stated.
- page: the page number(s) where found, or null.
- note: one short plain-language sentence for a senior reader.
Then list possible gaps (not covered, specialty/high tier, restrictions needing doctor action, generic-only coverage) and a short checklist of what to verify before enrolling. Only use facts from the document. Write plainly at a 6th-grade reading level.`;

export class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function analyzeFormulary(input: {
  drugs: { name: string; dose: string | null }[];
  planName: string | null;
  fileName: string;
  pdfBase64: string;
}): Promise<FormularyReport> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new GatewayError(500, "The drug checker isn't set up yet.");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const list = input.drugs.map((d, i) => `${i + 1}. ${d.name}${d.dose ? ` (${d.dose})` : ""}`).join("\n");
  let failure: unknown;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: INSTRUCTIONS,
    output: Output.object({ schema: reportSchema }),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: `Plan: ${input.planName ?? "not specified"}\nMy medications:\n${list}` },
          { type: "file", filename: input.fileName, data: input.pdfBase64, mediaType: "application/pdf" },
        ],
      },
    ],
    onError: ({ error }) => { failure = error; },
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  try {
    const output = await result.output;
    return output;
  } catch (e) {
    const err = (failure ?? e) as { statusCode?: number; message?: string };
    const status = err.statusCode ?? 500;
    const msg =
      status === 429 ? "The checker is busy right now. Please try again in a minute."
      : status === 402 ? "The drug checker is temporarily unavailable (out of AI credits)."
      : status === 403 ? "The drug checker can't read this document right now."
      : status === 400 ? "We couldn't read that file. Please make sure it's the plan's formulary PDF."
      : "Something went wrong reading the document. Please try again.";
    console.error("formulary analysis failed", status, err.message);
    throw new GatewayError(status, msg);
  }
}
