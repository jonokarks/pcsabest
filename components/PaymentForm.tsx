"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements as StripeElements,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import type { Appearance } from '@stripe/stripe-js';
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

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
  amount: number;
  onSubmit: (data: {
    name?: string;
    email?: string;
    paymentMethod?: string;
  }) => Promise<void>;
}

function PaymentFormContent({ amount, onSubmit }: { 
  amount: number;
  onSubmit: PaymentFormProps['onSubmit'];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [paymentRequest, setPaymentRequest] = useState(null);

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

    const pr = stripe.paymentRequest({
      country: 'AU',
      currency: 'aud',
      total: {
        label: 'Pool Safety Inspection',
        amount: amount * 100, // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Handle payment request button events
    pr.on('paymentmethod', async (event) => {
      try {
        // Pass payer details to parent component
        await onSubmit({
          name: event.payerName || '',
          email: event.payerEmail || '',
          paymentMethod: event.paymentMethod.type,
        });

        // Complete the payment
        event.complete('success');
      } catch (error: any) {
        console.error('Express payment error:', error);
        event.complete('fail');
      }
    });

    // Check if the Payment Request is available
    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr as any);
      }
    });

    return () => {
      window.confirmStripePayment = undefined;
    };
  }, [stripe, elements, amount, onSubmit, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <img
            src="https://b.stripecdn.com/site-srv/assets/img/v3/home/powered_by_stripe-f3c0a8c0e4da1c07adb12502a6f6e6ab.png"
            alt="Powered by Stripe"
            className="h-8"
          />
          <div className="flex items-center">
            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15l-4-4h8l-4 4z" />
            </svg>
            <span className="text-sm text-gray-600">SSL Secure Payment</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <img
            src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg"
            alt="Visa"
            className="h-6"
          />
          <img
            src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg"
            alt="Mastercard"
            className="h-6"
          />
          <img
            src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg"
            alt="American Express"
            className="h-6"
          />
        </div>
      </div>

      {paymentRequest && (
        <div className="mb-4">
          <PaymentRequestButtonElement
            options={{
              paymentRequest,
              style: {
                paymentRequestButton: {
                  type: 'default',
                  theme: 'dark',
                  height: '44px',
                },
              },
            }}
          />
          <div className="mt-4 text-center text-sm text-gray-500">
            Or pay with card below
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Your payment is protected by industry-leading security standards. We never store your card details.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <PaymentElement 
          options={{
            defaultValues: {
              billingDetails: {
                name: '',
              }
            }
          }}
          onChange={(event) => {
            if (event.value.type) {
              setPaymentMethod(event.value.type);
            }
          }}
        />
      </div>

      {paymentMethod === 'card' && (
        <div className="text-sm text-gray-500 flex items-center">
          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 116 0z" clipRule="evenodd" />
          </svg>
          Your card information is encrypted and secure
        </div>
      )}
    </div>
  );
}

export default function PaymentForm({ clientSecret, amount, onSubmit }: PaymentFormProps) {
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
    rules: {
      '.Input': {
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      '.Input:focus': {
        border: '1px solid #0d9488',
        boxShadow: '0 0 0 1px #0d9488',
      },
    },
  };

  const options: PaymentElementOptions = {
    clientSecret,
    appearance,
  };

  return (
    <StripeElements stripe={stripePromise} options={options}>
      <PaymentFormContent amount={amount} onSubmit={onSubmit} />
    </StripeElements>
  );
}
