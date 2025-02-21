"use client";

import { useEffect, useState } from "react";
import PaymentIcons from "./PaymentIcons";
import { loadStripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements as StripeElements,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import type { Appearance, PaymentRequest } from '@stripe/stripe-js';
import { useRouter } from "next/navigation";
import Image from 'next/image';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSubmit: () => Promise<{ clientSecret: string }>;
}

function PaymentFormContent({ amount, onSubmit, clientSecret }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  // Initialize Express Checkout
  useEffect(() => {
    if (!stripe || !elements) return;

    const pr = stripe.paymentRequest({
      country: 'AU',
      currency: 'aud',
      total: {
        label: 'Pool Safety Inspection',
        amount: Math.round(amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
      disableWallets: ['link'],
      // Enable both Apple Pay and Google Pay
      wallets: ['applePay', 'googlePay']
    });

    // Check device compatibility
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    // Handle Express Checkout payment
    pr.on('paymentmethod', async (event) => {
      if (isProcessing) {
        event.complete('fail');
        return;
      }

      try {
        setError(null);
        setIsProcessing(true);

        // Get the payment intent client secret
        const { clientSecret: confirmedSecret } = await onSubmit();

        // Confirm the payment
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          confirmedSecret,
          {
            payment_method: event.paymentMethod.id,
            receipt_email: event.payerEmail,
          },
          { handleActions: false } // Let us handle next actions
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        // Handle next actions if needed (like 3D Secure)
        if (paymentIntent.status === 'requires_action') {
          const { error: actionError } = await stripe.confirmCardPayment(confirmedSecret);
          if (actionError) {
            throw new Error(actionError.message);
          }
        }

        if (paymentIntent.status === 'succeeded') {
          event.complete('success');
          router.push("/checkout/success");
        } else {
          throw new Error('Payment failed');
        }
      } catch (error: any) {
        setError(error.message || 'Payment failed. Please try again.');
        event.complete('fail');
      } finally {
        setIsProcessing(false);
      }
    });

    return () => {
      pr.off('paymentmethod');
    };
  }, [stripe, elements, amount, onSubmit, clientSecret, router, isProcessing]);

  // Update Express Checkout amount
  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.update({
        total: {
          label: 'Pool Safety Inspection',
          amount: Math.round(amount * 100),
        },
      });
    }
  }, [amount, paymentRequest]);

  // Handle standard checkout
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || isProcessing) {
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);

      // Submit the form first
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Get the payment intent client secret
      const { clientSecret: confirmedSecret } = await onSubmit();

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: confirmedSecret,
        confirmParams: {
          return_url: window.location.origin + "/checkout/success",
        },
        redirect: "if_required",
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        router.push("/checkout/success");
      } else if (paymentIntent.status === 'requires_action') {
        // Let Stripe handle 3D Secure
        const { error: actionError } = await stripe.confirmPayment({
          elements,
          clientSecret: confirmedSecret,
          confirmParams: {
            return_url: window.location.origin + "/checkout/success",
          },
        });
        if (actionError) {
          throw new Error(actionError.message);
        }
      } else {
        throw new Error('Payment failed');
      }
    } catch (error: any) {
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Image
            src="/images/stripe-badge.png"
            alt="Powered by Stripe"
            width={120}
            height={32}
            className="h-8 w-auto"
          />
          <div className="flex items-center">
            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-600">SSL Secure Payment</span>
          </div>
        </div>
        <PaymentIcons />
      </div>

      {paymentRequest && (
        <div className="mb-6">
          <div className="mb-4 text-sm font-medium text-gray-700">
            Express Checkout
          </div>
          <PaymentRequestButtonElement
            options={{
              paymentRequest,
              style: {
                paymentRequestButton: {
                  type: 'buy',
                  theme: 'dark',
                  height: '48px',
                },
              },
            }}
          />
          <div className="relative mt-6 mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or pay with card</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded mb-6">
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

      <PaymentElement
        options={{
          layout: "tabs",
          defaultValues: {
            billingDetails: {
              name: '',
            }
          },
          wallets: {
            applePay: 'auto',
            googlePay: 'auto'
          }
        }}
      />

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className={`w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition duration-300 ${
          (!stripe || !elements || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isProcessing ? 'Processing...' : `Pay $${amount}`}
      </button>

      <div className="text-sm text-gray-500 flex items-center justify-center mt-4">
        <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 116 0z" clipRule="evenodd" />
        </svg>
        Your card information is encrypted and secure
      </div>
    </form>
  );
}

export default function PaymentForm(props: PaymentFormProps) {
  const appearance: Appearance = {
    theme: 'stripe',
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

  return (
    <StripeElements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance,
      }}
    >
      <PaymentFormContent {...props} />
    </StripeElements>
  );
}
