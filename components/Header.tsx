"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside
  const closeMenu = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-white shadow-sm" onClick={closeMenu}>
      <nav className="container mx-auto px-4 py-4 relative">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-teal-600">
            Pool Compliance SA
          </Link>

          {/* Hamburger Menu Button */}
          <button
            type="button"
            className="md:hidden w-10 h-10 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 relative z-50 cursor-pointer"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <div className="w-6 h-4 flex flex-col justify-between">
              <span className={`block w-full h-0.5 bg-gray-600 transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block w-full h-0.5 bg-gray-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-full h-0.5 bg-gray-600 transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>

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
        {/* Mobile Menu Backdrop */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-200"
            style={{ top: '72px' }}
            onClick={closeMenu}
          />
        )}

        {/* Mobile Menu */}
        <div 
          className={`md:hidden absolute left-0 right-0 top-full bg-white shadow-lg border-t transition-all duration-200 ease-in-out z-50 ${
            isMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-4 space-y-2">
            <Link
              href="/"
              className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg transition duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/book-compliance"
              className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg transition duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              Book Inspection
            </Link>
            <Link
              href="/about-us"
              className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg transition duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg transition duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
