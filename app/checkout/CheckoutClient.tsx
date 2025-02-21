"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import PaymentForm from "../../components/PaymentForm";

const defaultService = {
  id: "pool-inspection",
  name: "Pool Safety Inspection",
  price: 210,
  description: "Comprehensive pool safety inspection to ensure compliance with current regulations."
};

const cprSignService = {
  id: "cpr-sign",
  name: "CPR Sign",
  price: 30,
  description: "CPR Sign for pool safety"
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
  const [currentTotal, setCurrentTotal] = useState(defaultService.price);
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  const [formValid, setFormValid] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
  } = useForm<FormData>({
    mode: 'onChange',
  });

  // Calculate total whenever checkbox changes
  useEffect(() => {
    const newTotal = defaultService.price + (includeCprSign ? cprSignService.price : 0);
    setCurrentTotal(newTotal);
    console.log('Total updated:', newTotal, includeCprSign ? '(including CPR sign)' : '(base price only)');
  }, [includeCprSign]);

  // Watch all form fields for changes
  useEffect(() => {
    const subscription = watch(() => {
      const values = getValues();
      const isComplete = Object.keys(values).every(key => {
        if (key === 'notes') return true; // Notes are optional
        return values[key as keyof FormData];
      });
      setFormValid(isComplete);
      if (isComplete) {
        setFormData(values);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues]);

  // Payment intent update
  const updatePaymentIntent = useCallback(
    async (amount: number, items: any[], includeCprSign: boolean, customerDetails: any | null, paymentIntentId: string | null) => {
      try {
        const response = await fetch('/.netlify/functions/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            items,
            includeCprSign,
            customerDetails,
            paymentIntentId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update payment intent');
        }

        const data = await response.json();
        
        if (data.clientSecret && data.paymentIntentId) {
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
        } else {
          throw new Error('No client secret or payment intent ID in response');
        }
      } catch (error) {
        console.error('Error updating payment intent:', error);
        setError('Error updating payment. Please refresh the page and try again.');
      }
    },
    [setClientSecret, setPaymentIntentId, setError]
  );

  // Update payment intent when total or form data changes
  useEffect(() => {
    if (!formValid || !formData) return; // Only update if form is valid and has data

    const items = [
      defaultService,
      ...(includeCprSign ? [cprSignService] : [])
    ];

    updatePaymentIntent(
      currentTotal,
      items,
      includeCprSign,
      formData,
      paymentIntentId // Keep existing payment intent ID
    );
  }, [currentTotal, includeCprSign, formData, formValid, paymentIntentId, updatePaymentIntent]);

  const createOrUpdatePaymentIntent = useCallback(async (
    amount: number,
    items: any[],
    includeCprSign: boolean,
    customerDetails: any,
    isExpressCheckout: boolean = false,
    existingPaymentIntentId: string | null = null
  ) => {
    const response = await fetch('/.netlify/functions/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        items,
        includeCprSign,
        customerDetails,
        isExpressCheckout,
        paymentIntentId: existingPaymentIntentId,
      }),
    });

    if (!response.ok) {
      console.error('Failed to create/update payment intent:', response.status, response.statusText);
      throw new Error('Failed to process payment');
    }

    const result = await response.json();
    if (result.error) {
      console.error('Payment intent error:', result.error);
      throw new Error(result.error);
    }

    return result;
  }, []);

  const handleExpressPayment = async (data: { name?: string; email?: string; paymentMethod?: string }) => {
    if (!formValid || !formData) {
      throw new Error('Please fill in all required fields before proceeding with payment');
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const items = [
        defaultService,
        ...(includeCprSign ? [cprSignService] : [])
      ];

      console.log('Processing express payment with total:', currentTotal);

      const result = await createOrUpdatePaymentIntent(
        currentTotal,
        items,
        includeCprSign,
        { ...formData, ...data },
        true
      );

      return { clientSecret: result.clientSecret };
    } catch (error: any) {
      setError(error.message || 'Error processing your payment. Please try again.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const items = [
        defaultService,
        ...(includeCprSign ? [cprSignService] : [])
      ];

      console.log('Processing standard payment with total:', currentTotal);

      const { clientSecret: newClientSecret, paymentIntentId: newPaymentIntentId } = await createOrUpdatePaymentIntent(
        currentTotal,
        items,
        includeCprSign,
        data,
        false,
        paymentIntentId
      );

      // Update state with new values
      setClientSecret(newClientSecret);
      setPaymentIntentId(newPaymentIntentId);

      if (!window.confirmStripePayment) {
        throw new Error('Payment form not initialized');
      }
      
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
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Secure Checkout</h1>
            <div className="mt-4">
              <div className="flex items-center justify-between max-w-2xl">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-teal-600 rounded-full">
                    <span className="text-white font-semibold">1</span>
                  </div>
                  <span className="ml-2 font-medium text-teal-600">Your Details</span>
                </div>
                <div className="hidden sm:block w-24 h-0.5 bg-gray-200"></div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-teal-600 rounded-full">
                    <span className="text-white font-semibold">2</span>
                  </div>
                  <span className="ml-2 font-medium text-teal-600">Payment</span>
                </div>
                <div className="hidden sm:block w-24 h-0.5 bg-gray-200"></div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                    <span className="text-gray-600 font-semibold">3</span>
                  </div>
                  <span className="ml-2 font-medium text-gray-600">Confirmation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Main Content */}
            <div className="space-y-8">
              {/* CPR Sign Alert */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Legal Requirement: CPR Sign</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Australian law requires all pool owners to have a compliant CPR sign. Add one to your order if you don't have a current, compliant sign.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Pool Safety Inspection</span>
                    <span>${defaultService.price}</span>
                  </div>
                  {includeCprSign && (
                    <div className="flex justify-between text-teal-600">
                      <span>CPR Sign</span>
                      <span>${cprSignService.price}</span>
                    </div>
                  )}
                  <div className="border-t pt-4 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${currentTotal}</span>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">100% Satisfaction Guarantee</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">Fast & Professional Service</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm">Secure Payment</span>
                  </div>
                </div>
              </div>

              {/* Contact Form and Payment Section */}
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-semibold">Contact Information</h2>
                    <p className="text-gray-500 text-sm mt-1">We'll use these details to contact you about your inspection</p>
                  </div>

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

                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="cprSign"
                      checked={includeCprSign}
                      onChange={(e) => setIncludeCprSign(e.target.checked)}
                      className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                    <label htmlFor="cprSign" className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Add CPR Sign (+$30)</div>
                      <p className="text-sm text-gray-500">Required by law for all pool owners</p>
                    </label>
                  </div>

                  {/* Payment Section */}
                  {formValid && clientSecret && (
                    <div className="border-t pt-6">
                      <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
                      <PaymentForm
                        clientSecret={clientSecret}
                        amount={currentTotal}
                        onSubmit={handleExpressPayment}
                      />
                    </div>
                  )}

                  {!formValid && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Please fill in all required fields to proceed with payment.
                      </p>
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

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting || !formValid}
                      className={`w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition duration-300 ${
                        (isSubmitting || !formValid) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? 'Processing...' : `Pay $${currentTotal}`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
