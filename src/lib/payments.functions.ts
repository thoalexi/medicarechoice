import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

const schema = z.object({
  amountInCents: z.number().int().min(100).max(1_000_000),
  frequency: z.enum(["once", "monthly"]),
  returnUrl: z.string().url().max(500),
  environment: z.enum(["sandbox", "live"]),
});

export const createDonationCheckout = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }): Promise<{ clientSecret: string } | { error: string }> => {
    try {
      const stripe = createStripeClient(data.environment);
      const monthly = data.frequency === "monthly";
      const name = monthly ? "Monthly donation to MedicareChoice" : "Donation to MedicareChoice";
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name,
                description: "Supports a free, independent, women-owned Medicare guide.",
              },
              unit_amount: data.amountInCents,
              ...(monthly && { recurring: { interval: "month" as const } }),
            },
            quantity: 1,
          },
        ],
        mode: monthly ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        submit_type: monthly ? undefined : "donate",
        ...(!monthly && { payment_intent_data: { description: name } }),
        metadata: { kind: "donation", frequency: data.frequency },
      });
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
