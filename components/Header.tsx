"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-teal-600">
            Pool Compliance SA
          </Link>

          <div className="hidden md:flex space-x-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition duration-150"
            >
              Home
            </Link>
            <Link
              href="/book-compliance"
              className="text-gray-600 hover:text-gray-900 transition duration-150"
            >
              Book Inspection
            </Link>
            <Link
              href="/about-us"
              className="text-gray-600 hover:text-gray-900 transition duration-150"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-gray-900 transition duration-150"
            >
              Contact
            </Link>
          </div>

        </div>

        {/* Mobile Menu */}
        <div className="md:hidden mt-4 space-y-2">
          <Link
            href="/"
            className="block text-gray-600 hover:text-gray-900 transition duration-150"
          >
            Home
          </Link>
          <Link
            href="/book-compliance"
            className="block text-gray-600 hover:text-gray-900 transition duration-150"
          >
            Book Inspection
          </Link>
          <Link
            href="/about-us"
            className="block text-gray-600 hover:text-gray-900 transition duration-150"
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className="block text-gray-600 hover:text-gray-900 transition duration-150"
          >
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}
