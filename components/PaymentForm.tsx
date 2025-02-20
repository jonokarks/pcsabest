"use client";

import { useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { Appearance } from '@stripe/stripe-js';

// Load Stripe outside of component to avoid recreation
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Define the options type
type PaymentElementOptions = {
  clientSecret: string;
  appearance?: Appearance;
};

type StripePaymentResult = {
  id: string;
  status: string;
  client_secret?: string;
};

declare global {
  interface Window {
    confirmStripePayment: undefined | (() => Promise<StripePaymentResult>);
  }
}

interface PaymentFormProps {
  clientSecret: string;
}

function PaymentFormContent() {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!stripe || !elements) return;

    window.confirmStripePayment = async () => {
      if (!stripe || !elements) {
        throw new Error("Stripe not initialized");
      }

      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      const { id, status, client_secret } = result.paymentIntent;
      return {
        id,
        status,
        client_secret: client_secret || undefined,
      };
    };

    return () => {
      window.confirmStripePayment = undefined;
    };
  }, [stripe, elements]);

  return (
    <div className="space-y-4">
      <PaymentElement />
    </div>
  );
}

export default function PaymentForm({ clientSecret }: PaymentFormProps) {
  const appearance: Appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: "#0d9488",
      colorBackground: "#ffffff",
      colorText: "#1f2937",
      colorDanger: "#ef4444",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "8px",
    },
  };

  const options: PaymentElementOptions = {
    clientSecret,
    appearance,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormContent />
    </Elements>
  );
}