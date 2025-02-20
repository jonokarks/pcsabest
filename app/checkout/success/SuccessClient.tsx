"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get("payment_intent");

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-green-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for booking your pool compliance inspection. We will be in
              touch shortly to confirm your inspection date and time.
            </p>
            {paymentIntentId && (
              <p className="text-sm text-gray-500 mb-6">
                Payment Reference: {paymentIntentId}
              </p>
            )}
            <div className="space-y-4">
              <p className="text-gray-600">
                A confirmation email has been sent to your email address with your booking details.
              </p>
              <p className="text-gray-600">
                If you have any questions about your booking, please don't hesitate to contact us.
              </p>
            </div>
            <div className="mt-8 space-y-4">
              <Link
                href="/"
                className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition duration-300"
              >
                Return Home
              </Link>
              <p className="text-sm text-gray-500">
                You can also track your booking status in your confirmation email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessClient() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
