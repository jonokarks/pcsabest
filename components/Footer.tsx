export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Pool Compliance SA</h3>
            <p className="text-gray-400 mb-4">
              Professional pool safety inspections across Adelaide and surrounding areas.
            </p>
            <div className="space-y-2">
              <p className="text-gray-400">
                <span className="font-semibold text-white">Phone:</span> 0400 000 000
              </p>
              <p className="text-gray-400">
                <span className="font-semibold text-white">Email:</span>{" "}
                info@poolcompliancesa.com.au
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/book-compliance"
                  className="text-gray-400 hover:text-white transition duration-150"
                >
                  Book Inspection
                </a>
              </li>
              <li>
                <a
                  href="/about-us"
                  className="text-gray-400 hover:text-white transition duration-150"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-gray-400 hover:text-white transition duration-150"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Service Areas</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Adelaide Metropolitan Area</li>
              <li>Adelaide Hills</li>
              <li>Barossa Valley</li>
              <li>Fleurieu Peninsula</li>
              <li>McLaren Vale</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Pool Compliance SA. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-6">
                <li>
                  <a
                    href="/privacy-policy"
                    className="text-gray-400 hover:text-white text-sm transition duration-150"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-gray-400 hover:text-white text-sm transition duration-150"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
