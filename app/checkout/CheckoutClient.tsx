"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import PaymentForm from "../../components/PaymentForm";

const SERVICES = {
  poolInspection: {
    id: "pool-inspection",
    name: "Pool Safety Inspection",
    price: 210,
    description: "Comprehensive pool safety inspection to ensure compliance with current regulations."
  },
  cprSign: {
    id: "cpr-sign",
    name: "CPR Sign",
    price: 30,
    description: "CPR Sign for pool safety"
  }
} as const;

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
  const [isLoading, setIsLoading] = useState(false);
  const [includeCprSign, setIncludeCprSign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [total, setTotal] = useState<number>(SERVICES.poolInspection.price);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const {
    register,
    formState: { errors, isValid },
    watch,
  } = useForm<FormData>({
    mode: 'onChange',
  });

  // Watch form changes
  const formData = watch();

  // Calculate total when CPR sign option changes
  const updateTotal = (includeCpr: boolean) => {
    const newTotal = SERVICES.poolInspection.price + (includeCpr ? SERVICES.cprSign.price : 0);
    setTotal(newTotal);
  };

  // Create payment intent
  const createPaymentIntent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/.netlify/functions/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          items: [
            SERVICES.poolInspection,
            ...(includeCprSign ? [SERVICES.cprSign] : [])
          ],
          includeCprSign,
          customerDetails: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize payment');
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      return data.clientSecret;
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCprSignChange = (checked: boolean) => {
    setIncludeCprSign(checked);
    updateTotal(checked);
  };

  const handleReviewOrder = () => {
    if (isLoading || !isValid) return;
    setShowConfirmation(true);
  };

  const handleProceedToPayment = async () => {
    if (isLoading || !isValid) return;
    
    try {
      const secret = await createPaymentIntent();
      setClientSecret(secret);
      setShowPayment(true);
    } catch (err) {
      // Error already handled in createPaymentIntent
      setShowPayment(false);
    }
  };

  // Handle payment submission (both Express and Standard)
  const handlePaymentSubmission = async () => {
    if (!clientSecret) return { clientSecret };

    try {
      setError(null);
      return { clientSecret };
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      throw err;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Progress Steps */}
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
                  <div className={`flex items-center justify-center w-8 h-8 ${showPayment ? 'bg-teal-600' : 'bg-gray-200'} rounded-full`}>
                    <span className={`${showPayment ? 'text-white' : 'text-gray-600'} font-semibold`}>2</span>
                  </div>
                  <span className={`ml-2 font-medium ${showPayment ? 'text-teal-600' : 'text-gray-600'}`}>Payment</span>
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

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>{SERVICES.poolInspection.name}</span>
                  <span>${SERVICES.poolInspection.price}</span>
                </div>
                {includeCprSign && (
                  <div className="flex justify-between text-teal-600">
                    <span>{SERVICES.cprSign.name}</span>
                    <span>${SERVICES.cprSign.price}</span>
                  </div>
                )}
                <div className="border-t pt-4 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total}</span>
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

            {/* Contact Form */}
            {!showPayment && (
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
                <form className="space-y-6">
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
                      onChange={(e) => handleCprSignChange(e.target.checked)}
                      className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                    <label htmlFor="cprSign" className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Add CPR Sign (+$30)</div>
                      <p className="text-sm text-gray-500">Required by law for all pool owners</p>
                    </label>
                  </div>

                  {/* Review Order Button */}
                  {isValid && !showConfirmation && (
                    <button
                      type="button"
                      onClick={handleReviewOrder}
                      disabled={isLoading || !isValid}
                      className={`w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors ${
                        (isLoading || !isValid) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading ? 'Loading...' : 'Review Order'}
                    </button>
                  )}

                  {/* Order Confirmation */}
                  {showConfirmation && (
                    <div className="border-t pt-6">
                      <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold mb-4">Order Confirmation</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Pool Safety Inspection</span>
                            <span>${SERVICES.poolInspection.price}</span>
                          </div>
                          {includeCprSign && (
                            <div className="flex justify-between text-teal-600">
                              <span>CPR Sign</span>
                              <span>${SERVICES.cprSign.price}</span>
                            </div>
                          )}
                          <div className="border-t pt-3 flex justify-between font-semibold">
                            <span>Final Total</span>
                            <span>${total}</span>
                          </div>
                        </div>
                        <div className="mt-6 flex space-x-4">
                          <button
                            type="button"
                            onClick={() => setShowConfirmation(false)}
                            disabled={isLoading}
                            className={`flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors ${
                              isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            Edit Order
                          </button>
                          <button
                            type="button"
                            onClick={handleProceedToPayment}
                            disabled={isLoading}
                            className={`flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors ${
                              isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {isLoading ? 'Loading...' : 'Proceed to Payment'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Payment Section */}
            {showPayment && (
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
                <div className="border-b pb-4">
                  <h2 className="text-xl font-semibold">Payment Details</h2>
                  <p className="text-gray-500 text-sm mt-1">Complete your booking with a secure payment</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Total to be charged</p>
                      <p className="text-2xl font-bold text-blue-900">${total}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPayment(false);
                        setShowConfirmation(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit Order
                    </button>
                  </div>
                </div>

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

                {clientSecret ? (
                  <PaymentForm
                    clientSecret={clientSecret}
                    amount={total}
                    onSubmit={handlePaymentSubmission}
                  />
                ) : (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Loading payment options...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
