import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";
import { COUNTIES } from "../plans";

export const prefsSchema = z.object({
  county: z.string().nullable(),
  outsideMichigan: z.boolean(),
  health: z.enum(["healthy", "some", "chronic"]),
  keepAnyDoctor: z.boolean(),
  hospital: z.string().nullable(),
  drugsMonthly: z.number(),
  priority: z.enum(["low-premium", "balanced", "peace"]),
  dental: z.boolean(),
  vision: z.boolean(),
  hearing: z.boolean(),
  fitness: z.boolean(),
  travels: z.boolean(),
  maxMonthlyPremium: z.number().nullable(),
  wantsAdvantage: z.boolean().nullable(),
  followUpQuestion: z.string().nullable(),
});
export type SearchPrefs = z.infer<typeof prefsSchema>;

const INSTRUCTIONS = `You turn a Medicare shopper's plain-language description into structured preferences. Do not recommend plans.
- county: one Michigan county name from this exact list, inferred from any city, town, ZIP or county mentioned (e.g. Lansing -> Ingham, Detroit -> Wayne, Grand Rapids -> Kent). Null if no location given. List: ${COUNTIES.join(", ")}.
- outsideMichigan: true only if they clearly live outside Michigan.
- health: "healthy" (rarely see doctors), "some" (a few visits / a condition), "chronic" (many visits, serious conditions). Default "some".
- keepAnyDoctor: true if they insist on keeping a specific doctor or freedom to see any doctor.
- hospital: a named hospital/health system, or null.
- drugsMonthly: rough retail monthly prescription cost in dollars: 0 if none, ~30 a few generics, ~150 several meds, ~600+ brand/specialty. Default 50 if unknown.
- priority: "low-premium" if they stress low monthly cost, "peace" if they stress predictability/no surprise bills, else "balanced".
- dental/vision/hearing/fitness: true if they ask for it.
- travels: true if they travel or spend time out of state.
- maxMonthlyPremium: dollar limit if stated, else null.
- wantsAdvantage: true if they ask for Medicare Advantage/HMO/PPO/extras-in-one, false if they ask for Medigap/supplement/Original Medicare, else null.
- followUpQuestion: if no location at all is given, ask one short friendly question for their Michigan county or ZIP; otherwise null.`;

export class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function extractPrefs(query: string): Promise<SearchPrefs> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new GatewayError(500, "The plan search isn't set up yet.");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  let failure: unknown;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: INSTRUCTIONS,
    output: Output.object({ schema: prefsSchema }),
    prompt: query,
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
    return await result.output;
  } catch (e) {
    const err = (failure ?? e) as { statusCode?: number; message?: string };
    const status = err.statusCode ?? 500;
    const msg =
      status === 429 ? "The search is busy right now. Please try again in a minute."
      : status === 402 ? "The plan search is temporarily unavailable (out of AI credits)."
      : status === 403 ? "The plan search can't answer that right now."
      : "Something went wrong. Please try again or use the filters below.";
    console.error("plan search failed", status, err.message);
    throw new GatewayError(status, msg);
  }
}
