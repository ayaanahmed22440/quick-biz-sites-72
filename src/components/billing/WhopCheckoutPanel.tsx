import { lazy, Suspense } from "react";

const CheckoutEmbed = lazy(async () => {
  const module = await import("@whop/checkout/react");
  return { default: module.WhopCheckoutEmbed };
});

type WhopCheckoutPanelProps = {
  sessionId: string;
  email: string;
  returnUrl: string;
  onComplete: (receiptId: string | undefined) => void;
  onError: (message: string) => void;
};

export function WhopCheckoutPanel({
  sessionId,
  email,
  returnUrl,
  onComplete,
  onError,
}: WhopCheckoutPanelProps) {
  return (
    <Suspense fallback={<div className="min-h-80 animate-pulse rounded-md bg-muted" />}>
      <CheckoutEmbed
        sessionId={sessionId}
        theme="light"
        prefill={{ email }}
        disableEmail
        returnUrl={returnUrl}
        onComplete={(_planId, receiptId) => onComplete(receiptId)}
        onPaymentError={(error) => onError(error.message)}
      />
    </Suspense>
  );
}