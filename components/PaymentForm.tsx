"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import debounce from 'lodash/debounce';

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
  }) => Promise<{ clientSecret: string }>;
}

function PaymentFormContent({ amount, onSubmit, clientSecret }: { 
  amount: number;
  onSubmit: PaymentFormProps['onSubmit'];
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentRequestVisible, setIsPaymentRequestVisible] = useState(false);
  const prRef = useRef<any>(null);

  // Debounced visibility update
  const updatePaymentRequestVisibility = useCallback(
    debounce((shouldShow: boolean) => {
      setIsPaymentRequestVisible(shouldShow);
    }, 500),
    []
  );

  // Create payment request instance
  const createPaymentRequest = useCallback(() => {
    if (!stripe) return null;
    console.log('Creating payment request with amount:', amount);
    const pr = stripe.paymentRequest({
      country: 'AU',
      currency: 'aud',
      total: {
        label: amount === 240 ? 'Pool Safety Inspection with CPR Sign' : 'Pool Safety Inspection',
        amount: amount * 100,
      },
      requestShipping: false,
      requestPayerName: true,
      requestPayerEmail: true,
      disableWallets: ['link'],
    });
    console.log('Payment request created:', pr);
    return pr;
  }, [stripe, amount]);

  // Initialize payment request
  useEffect(() => {
    if (!stripe || !elements) return;
    let mounted = true;

    const initializePaymentRequest = async () => {
      try {
        console.log('Initializing payment request with amount:', amount);
        
        // Clear existing payment request
        if (prRef.current) {
          console.log('Cleaning up existing payment request');
          prRef.current.removeAllListeners();
          prRef.current = null;
        }
        setPaymentRequest(null);
        updatePaymentRequestVisibility(false);

        // Create new payment request with current amount
        const pr = createPaymentRequest();
        if (!pr) {
          console.log('Failed to create payment request');
          return;
        }

        console.log('Checking if payment method is available');
        const result = await pr.canMakePayment();
        console.log('Can make payment result:', result);
        
        if (!mounted) {
          console.log('Component unmounted, aborting initialization');
          return;
        }

        if (result) {
          console.log('Payment method is available, setting up request');
          prRef.current = pr;
          setPaymentRequest(pr);
          updatePaymentRequestVisibility(true);

          // Handle payment request button events
          pr.on('paymentmethod', async (event: any) => {
            console.log('Payment method event received:', event);
            try {
              setError(null);
              console.log('Submitting payment with amount:', amount);
              const { clientSecret: newClientSecret } = await onSubmit({
                name: event.payerName || '',
                email: event.payerEmail || '',
                paymentMethod: event.paymentMethod.type,
              });

              console.log('Confirming payment with new client secret');
              const { error: confirmError } = await stripe.confirmCardPayment(
                newClientSecret || clientSecret,
                {
                  payment_method: event.paymentMethod.id,
                  receipt_email: event.payerEmail,
                }
              );

              if (confirmError) {
                console.error('Payment confirmation error:', confirmError);
                event.complete('fail');
                throw new Error(confirmError.message);
              }

              console.log('Payment successful, redirecting');
              event.complete('success');
              router.push("/checkout/success");
            } catch (error: any) {
              console.error('Express payment error:', error);
              setError(error.message || 'Payment failed. Please try again.');
              event.complete('fail');
            }
          });
        } else {
          console.log('Payment method is not available');
        }
      } catch (error: any) {
        console.error('Error initializing payment request:', error);
        setError('Error initializing payment. Please try again.');
      }
    };

    initializePaymentRequest();

    return () => {
      mounted = false;
      updatePaymentRequestVisibility(false);
    };
  }, [stripe, elements, amount, onSubmit, router, clientSecret, updatePaymentRequestVisibility, createPaymentRequest]);

  useEffect(() => {
    if (!stripe || !elements) return;

    window.confirmStripePayment = async () => {
      if (!stripe || !elements) {
        throw new Error("Stripe not initialized");
      }

      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: window.location.origin + "/checkout/success",
        },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {/* Stripe Badge */}
          <img
            src="https://stripe.com/img/documentation/checkout/marketplace.png"
            alt="Powered by Stripe"
            className="h-8 w-auto"
          />
          <div className="flex items-center">
            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15l-4-4h8l-4 4z" />
            </svg>
            <span className="text-sm text-gray-600">SSL Secure Payment</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Payment Method Icons */}
          <img
            src="https://js.stripe.com/v3/fingerprinted/img/visa-365725566f9578a9589553aa9296d178.svg"
            alt="Visa"
            className="h-6 w-auto"
          />
          <img
            src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg"
            alt="Mastercard"
            className="h-6 w-auto"
          />
          <img
            src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg"
            alt="American Express"
            className="h-6 w-auto"
          />
        </div>
      </div>

      {paymentRequest && isPaymentRequestVisible && (
        <div className="mb-4">
          <PaymentRequestButtonElement
            options={{
              paymentRequest,
              style: {
                paymentRequestButton: {
                  type: 'buy',
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

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg">
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
      <PaymentFormContent amount={amount} onSubmit={onSubmit} clientSecret={clientSecret} />
    </StripeElements>
  );
}
