"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Lock, CheckCircle, ArrowLeft, Eye, Database, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
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
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
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
                    At ZivaAds, we are committed to protecting your privacy and ensuring the security of your personal information. 
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                    Facebook advertising analytics platform.
                  </p>
                </div>

                {/* Information We Collect */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Database className="w-6 h-6 text-blue-600 mr-2" />
                    2. Information We Collect
                  </h2>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Name, email address, and phone number when you create an account</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Facebook account credentials (stored securely and encrypted)</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Payment information for subscription services</span>
                      </li>
                    </ul>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mt-6">Facebook Ad Data</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Campaign performance metrics and analytics</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Ad spend, impressions, clicks, and conversion data</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Audience demographics and targeting information</span>
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold text-gray-900 mt-6">Usage Information</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>IP address and device information</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Browser type and version</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Pages visited and features used</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* How We Use Your Information */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Eye className="w-6 h-6 text-blue-600 mr-2" />
                    3. How We Use Your Information
                  </h2>
                  <div className="space-y-4 text-gray-600">
                    <p>We use the information we collect to:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Provide and maintain our Facebook advertising analytics service</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Generate AI-powered insights and recommendations</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Send WhatsApp alerts and notifications about your campaigns</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Process payments and manage subscriptions</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Improve our service and develop new features</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Provide customer support and respond to inquiries</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Data Sharing and Disclosure */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Service Providers:</strong> With trusted third-party service providers who help us operate our service (payment processors, hosting providers, etc.)</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Consent:</strong> With your explicit consent for specific purposes</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Data Security */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Lock className="w-6 h-6 text-blue-600 mr-2" />
                    5. Data Security
                  </h2>
                  <div className="space-y-4 text-gray-600">
                    <p>We implement industry-standard security measures to protect your information:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>End-to-end encryption for all data transmission</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Secure cloud infrastructure with regular security audits</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Access controls and authentication mechanisms</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Regular security updates and vulnerability assessments</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* WhatsApp Integration */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <MessageCircle className="w-6 h-6 text-blue-600 mr-2" />
                    6. WhatsApp Integration
                  </h2>
                  <div className="space-y-4 text-gray-600">
                    <p>Our WhatsApp integration allows us to send you alerts about your Facebook ad performance. By using this feature:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>We store your phone number securely for sending notifications</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Messages are sent through WhatsApp's Business API</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>You can opt out of WhatsApp notifications at any time</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>WhatsApp's privacy policy applies to messages sent through their platform</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Your Rights */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>You have the following rights regarding your personal information:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Access:</strong> Request a copy of your personal data</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Correction:</strong> Update or correct inaccurate information</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Deletion:</strong> Request deletion of your personal data</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Portability:</strong> Export your data in a machine-readable format</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Objection:</strong> Object to processing of your data</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Data Retention */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>We retain your personal information for as long as necessary to provide our services and comply with legal obligations:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Facebook Ad Data:</strong> Retained for 2 years for analytics purposes</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Payment Information:</strong> Retained as required by financial regulations</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p><strong>Email:</strong> privacy@zivaads.com</p>
                      <p><strong>WhatsApp:</strong> +263 77 123 4567</p>
                      <p><strong>Address:</strong> Harare, Zimbabwe</p>
                    </div>
                  </div>
                </div>

                {/* Changes to Privacy Policy */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                      Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy 
                      Policy periodically for any changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 