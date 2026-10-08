import { useCallback } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createDonationCheckout } from "@/lib/payments.functions";

export function DonationCheckout({ amountInCents, frequency }: { amountInCents: number; frequency: "once" | "monthly" }) {
  const fetchClientSecret = useCallback(async () => {
    const result = await createDonationCheckout({
      data: {
        amountInCents,
        frequency,
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Checkout could not start. Please try again.");
    return result.clientSecret;
  }, [amountInCents, frequency]);

  return (
    <div id="checkout" className="mt-6 overflow-hidden rounded-xl border-2 bg-card">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
