const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;
  return (
    <div className="w-full border-b border-accent bg-secondary px-4 py-2 text-center text-sm text-secondary-foreground">
      Test mode: donations made in the preview don't charge real money. Use card 4242 4242 4242 4242.
    </div>
  );
}
