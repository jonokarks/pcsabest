"use client";

import { useState } from "react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-teal-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {activeTab === 'login' ? 'Login to Your Account' : 'Create an Account'}
          </h1>
          <p className="text-xl">
            {activeTab === 'login' 
              ? 'Access your Pool Compliance SA dashboard'
              : 'Join Pool Compliance SA to manage your inspections'}
          </p>
        </div>
      </div>

      {/* Login/Register Forms */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 text-center font-semibold ${
                activeTab === 'login'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              className={`flex-1 py-3 text-center font-semibold ${
                activeTab === 'register'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>

          <div className="p-6">
            {/* Login Form */}
            {activeTab === 'login' && (
              <form className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="password">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>

                  <a href="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700">
                    Forgot your password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition duration-300"
                >
                  Sign In
                </button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="firstName">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="lastName">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="registerEmail">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="registerEmail"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    required
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="registerPassword">
                    Password
                  </label>
                  <input
                    type="password"
                    id="registerPassword"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="terms"
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                    I agree to the{" "}
                    <a href="/terms" className="text-teal-600 hover:text-teal-700">
                      Terms and Conditions
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition duration-300"
                >
                  Create Account
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
