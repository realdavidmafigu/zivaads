"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, FileText, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  const lastUpdated = "December 2024";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ZivaAds
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white mx-auto mb-6">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms and Conditions
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-12"
          >
            <div className="prose prose-lg max-w-none">
              <div className="space-y-8">
                {/* Introduction */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Shield className="w-6 h-6 text-blue-600 mr-2" />
                    1. Introduction
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Welcome to ZivaAds. These Terms and Conditions ("Terms") govern your use of our website and services. 
                    By accessing or using ZivaAds, you agree to be bound by these Terms. If you disagree with any part of these terms, 
                    then you may not access our service.
                  </p>
                </div>

                {/* Service Description */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                    2. Service Description
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    ZivaAds provides AI-powered Facebook advertising analytics and insights. Our service includes:
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Real-time Facebook ad performance tracking</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>AI-powered insights and recommendations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>WhatsApp notifications and alerts</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Multi-account management for agencies</span>
                    </li>
                  </ul>
                </div>

                {/* User Accounts */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      When you create an account with us, you must provide accurate, complete, and current information. 
                      You are responsible for safeguarding the password and for all activities that occur under your account.
                    </p>
                    <p>
                      You agree not to disclose your password to any third party and to take sole responsibility for any activities 
                      or actions under your account, whether or not you have authorized such activities or actions.
                    </p>
                  </div>
                </div>

                {/* Privacy and Data */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Privacy and Data Protection</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, 
                      which is incorporated into these Terms by reference.
                    </p>
                    <p>
                      We implement appropriate security measures to protect your data. However, no method of transmission over the internet 
                      or electronic storage is 100% secure, and we cannot guarantee absolute security.
                    </p>
                  </div>
                </div>

                {/* Acceptable Use */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>
                  <p className="text-gray-600 mb-4">You agree not to use our service to:</p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Violate any applicable laws or regulations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Infringe upon the rights of others</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Transmit harmful, offensive, or inappropriate content</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Attempt to gain unauthorized access to our systems</span>
                    </li>
                  </ul>
                </div>

                {/* Subscription and Billing */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Subscription and Billing</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      ZivaAds offers various subscription plans. By subscribing, you agree to pay the applicable fees for your chosen plan.
                    </p>
                    <p>
                      Subscriptions are billed in advance on a monthly or annual basis. You may cancel your subscription at any time, 
                      and you will continue to have access to the service until the end of your current billing period.
                    </p>
                    <p>
                      We reserve the right to modify our pricing with 30 days' notice. Price changes will not affect your current 
                      subscription period.
                    </p>
                  </div>
                </div>

                {/* Intellectual Property */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      The service and its original content, features, and functionality are owned by ZivaAds and are protected by 
                      international copyright, trademark, patent, trade secret, and other intellectual property laws.
                    </p>
                    <p>
                      You retain ownership of your data and content. By using our service, you grant us a limited license to process 
                      your data to provide our services.
                    </p>
                  </div>
                </div>

                {/* Limitation of Liability */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      In no event shall ZivaAds, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable 
                      for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of 
                      profits, data, use, goodwill, or other intangible losses.
                    </p>
                    <p>
                      Our total liability to you for any claims arising from the use of our service shall not exceed the amount you 
                      paid us in the 12 months preceding the claim.
                    </p>
                  </div>
                </div>

                {/* Termination */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      We may terminate or suspend your account and bar access to the service immediately, without prior notice or 
                      liability, under our sole discretion, for any reason whatsoever and without limitation.
                    </p>
                    <p>
                      Upon termination, your right to use the service will cease immediately. If you wish to terminate your account, 
                      you may simply discontinue using the service.
                    </p>
                  </div>
                </div>

                {/* Changes to Terms */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
                  <p className="text-gray-600">
                    We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide 
                    at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be 
                    determined at our sole discretion.
                  </p>
                </div>

                {/* Contact Information */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
                  <p className="text-gray-600">
                    If you have any questions about these Terms and Conditions, please contact us at:
                  </p>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">
                      <strong>Email:</strong> support@zivaads.com<br />
                      <strong>Address:</strong> [Your Business Address]<br />
                      <strong>Phone:</strong> [Your Phone Number]
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">
              © 2024 ZivaAds. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 