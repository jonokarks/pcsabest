"use client";

const services = [
  {
    id: "pool-inspection",
    name: "Pool Safety Inspection",
    price: 210,
    description: "Comprehensive pool safety inspection to ensure compliance with current regulations.",
    features: [
      "Full safety barrier inspection",
      "Detailed compliance report",
      "Professional recommendations",
      "Certificate of compliance (if passed)",
      "Valid for 2 years",
    ],
  },
];

export default function BookCompliancePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Book Pool Compliance Inspection</h1>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    {services[0].name}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {services[0].description}
                  </p>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  ${services[0].price}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  What's Included
                </h3>
                <ul className="space-y-4">
                  {services[0].features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="h-6 w-6 text-teal-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => window.location.href = "/checkout"}
                  className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition duration-300"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Important Information
            </h2>
            <div className="prose prose-teal">
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Inspections are typically conducted within 3-5 business days of booking</li>
                <li>A responsible adult must be present during the inspection</li>
                <li>The inspection takes approximately 45-60 minutes to complete</li>
                <li>Results and certificates (if applicable) are provided within 24 hours</li>
                <li>Reinspections (if required) can be booked at a discounted rate</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
