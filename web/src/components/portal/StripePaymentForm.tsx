"use client";

import { useState, useCallback, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type PaymentFormInnerProps = {
  clientSecret: string;
  registrationId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  onCancel: () => void;
};

function PaymentFormInner({ clientSecret, registrationId, onSuccess, onError, onCancel }: PaymentFormInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setLoading(true);
      try {
        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/portal/dashboard?paid=${registrationId}`,
            payment_method_data: {
              billing_details: {
                name: undefined,
                email: undefined,
              },
            },
          },
        });
        if (error) {
          onError(error.message ?? "Payment failed");
          setLoading(false);
          return;
        }
        onSuccess();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Payment failed");
      } finally {
        setLoading(false);
      }
    },
    [stripe, elements, clientSecret, registrationId, onSuccess, onError]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="rounded-lg bg-accentGold px-4 py-2 text-sm font-semibold text-background disabled:opacity-50 hover:bg-accentGold/90"
        >
          {loading ? "Processing…" : "Pay now"}
        </button>
      </div>
    </form>
  );
}

type StripePaymentFormProps = {
  registrationId: string;
  getToken: () => Promise<string>;
  onSuccess: () => void;
  onClose: () => void;
};

export default function StripePaymentForm({ registrationId, getToken, onSuccess, onClose }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ registrationId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Failed to start payment");
          setLoading(false);
          return;
        }
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Invalid response from server");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load payment form");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [registrationId, getToken]);

  if (!stripePromise) {
    return (
      <div className="rounded-lg border border-white/10 bg-background p-6 text-white">
        <p className="text-sm text-red-400">Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.</p>
        <button type="button" onClick={onClose} className="mt-4 rounded-lg bg-accentGold px-4 py-2 text-sm text-background">
          Close
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-background p-6 text-white">
        <p className="text-sm text-white/70">Loading payment form…</p>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="rounded-lg border border-white/10 bg-background p-6 text-white">
        <p className="text-sm text-red-400">{error ?? "Could not start payment"}</p>
        <button type="button" onClick={onClose} className="mt-4 rounded-lg bg-accentGold px-4 py-2 text-sm text-background">
          Close
        </button>
      </div>
    );
  }

  const options = { clientSecret, appearance: { theme: "night" as const } };

  return (
    <div className="rounded-lg border border-white/10 bg-background p-6 text-white">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">Confirm and pay</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <Elements stripe={stripePromise} options={options}>
        <PaymentFormInner
          clientSecret={clientSecret}
          registrationId={registrationId}
          onSuccess={onSuccess}
          onError={setError}
          onCancel={onClose}
        />
      </Elements>
    </div>
  );
}
