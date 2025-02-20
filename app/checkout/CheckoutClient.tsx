"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import PaymentForm from "@/components/PaymentForm";

const defaultService = {
  id: "pool-inspection",
  name: "Pool Safety Inspection",
  price: 210,
  description: "Comprehensive pool safety inspection to ensure compliance with current regulations."
};

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  suburb: string;
  postcode: string;
  preferredDate: string;
  notes: string;
}

export default function CheckoutClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeCprSign, setIncludeCprSign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const basePrice = defaultService.price;
  const cprSignPrice = 30;
  const total = basePrice + (includeCprSign ? cprSignPrice : 0);

  // Create initial payment intent
  useEffect(() => {
    let mounted = true;

    const createInitialPaymentIntent = async () => {
      if (!mounted) return;
      
      setError(null);
      
      try {
        const response = await fetch('/.netlify/functions/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: total,
            items: [
              defaultService,
              ...(includeCprSign ? [{
                id: "cpr-sign",
                name: "CPR Sign",
                price: cprSignPrice,
                description: "CPR Sign for pool safety"
              }] : [])
            ],
            includeCprSign,
          }),
        });

        if (!mounted) return;

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        
        if (data.clientSecret && data.paymentIntentId) {
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
        } else {
          throw new Error('No client secret or payment intent ID in response');
        }
      } catch (error) {
        if (mounted) {
          setError('Error initializing payment. Please refresh the page and try again.');
        }
      }
    };

    createInitialPaymentIntent();

    return () => {
      mounted = false;
    };
  }, [includeCprSign, total]); // Re-create payment intent when CPR sign is toggled or total changes

  // Update payment intent when CPR sign is toggled
  useEffect(() => {
    if (!paymentIntentId) return;

    const updatePaymentIntent = async () => {
      try {
        await fetch('/.netlify/functions/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: total,
            items: [
              defaultService,
              ...(includeCprSign ? [{
                id: "cpr-sign",
                name: "CPR Sign",
                price: cprSignPrice,
                description: "CPR Sign for pool safety"
              }] : [])
            ],
            includeCprSign,
            paymentIntentId,
          }),
        });
      } catch (error) {
        console.error('Error updating payment intent:', error);
      }
    };

    updatePaymentIntent();
  }, [includeCprSign, total, paymentIntentId]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Update payment intent with customer details
      const response = await fetch('/.netlify/functions/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          items: [
            defaultService,
            ...(includeCprSign ? [{
              id: "cpr-sign",
              name: "CPR Sign",
              price: cprSignPrice,
              description: "CPR Sign for pool safety"
            }] : [])
          ],
          includeCprSign,
          customerDetails: data,
          paymentIntentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment intent');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!window.confirmStripePayment) {
        throw new Error('Payment form not initialized');
      }
      
      // Confirm the payment
      const paymentResult = await window.confirmStripePayment();
      
      if (paymentResult.status === 'succeeded') {
        router.push("/checkout/success");
      } else {
        throw new Error('Payment failed');
      }
    } catch (error: any) {
      setError(error.message || 'Error processing your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      {...register("firstName", { required: "First name is required" })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.firstName ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      {...register("lastName", { required: "Last name is required" })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.lastName ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    {...register("phone", {
                      required: "Phone number is required",
                      pattern: {
                        value: /^(?:\+?61|0)[2-478](?:[ -]?[0-9]){8}$/,
                        message: "Invalid Australian phone number",
                      },
                    })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.phone ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    {...register("address", { required: "Address is required" })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.address ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
                    <input
                      {...register("suburb", { required: "Suburb is required" })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.suburb ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.suburb && (
                      <p className="mt-1 text-sm text-red-600">{errors.suburb.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                    <input
                      {...register("postcode", {
                        required: "Postcode is required",
                        pattern: {
                          value: /^[0-9]{4}$/,
                          message: "Invalid postcode",
                        },
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.postcode ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.postcode && (
                      <p className="mt-1 text-sm text-red-600">{errors.postcode.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    {...register("preferredDate", { required: "Preferred date is required" })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.preferredDate ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.preferredDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.preferredDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    {...register("notes")}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="cprSign"
                    checked={includeCprSign}
                    onChange={(e) => setIncludeCprSign(e.target.checked)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="cprSign" className="ml-2 block text-sm text-gray-900">
                    Include CPR Sign (+$30)
                  </label>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition duration-300 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : `Pay $${total}`}
                  </button>
                </div>
              </form>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
                {clientSecret && (
                  <PaymentForm
                    clientSecret={clientSecret}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
