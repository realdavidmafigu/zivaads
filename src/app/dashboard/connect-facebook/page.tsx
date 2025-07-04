'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateFacebookOAuthUrl } from '@/lib/facebook';

export default function ConnectFacebookPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Check URL parameters for success/error messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const successParam = urlParams.get('success');
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
    
    if (successParam) {
      setSuccess(decodeURIComponent(successParam));
    }
  }, []);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.authenticated) {
          router.push('/login?redirectTo=/dashboard/connect-facebook');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirectTo=/dashboard/connect-facebook');
      }
    };
    
    checkAuth();
  }, [router]);

  const handleConnectFacebook = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      console.log('Starting Facebook connection process...');
      
      // Generate Facebook OAuth URL
      const oauthUrl = generateFacebookOAuthUrl();
      console.log('Generated OAuth URL:', oauthUrl);
      
      // Redirect to Facebook OAuth
      console.log('Redirecting to Facebook OAuth...');
      window.location.href = oauthUrl;
    } catch (err) {
      console.error('Facebook connection error:', err);
      setError('Failed to initiate Facebook connection. Please try again.');
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-500 mr-2">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Connect Your Facebook Business Account</h1>
        <p className="text-gray-600 mt-2">
          Connect your Facebook Business account to start monitoring your ad performance in real-time.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
          <strong>Success:</strong> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Connection Steps */}
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Prepare Your Facebook Account</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Ensure you have admin access to a Facebook Business account</p>
              <p>• Make sure your account has active ad campaigns</p>
              <p>• Verify your account is in good standing</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Grant Permissions</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Click "Connect Facebook Account" below</p>
              <p>• You'll be redirected to Facebook to authorize ZivaAds</p>
              <p>• Grant the following permissions:</p>
              <ul className="ml-4 space-y-1">
                <li>• <strong>ads_management</strong> - Manage your ad campaigns</li>
                <li>• <strong>ads_read</strong> - Read ad performance data</li>
                <li>• <strong>business_management</strong> - Access business accounts</li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Start Monitoring</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Once connected, your campaigns will appear in the dashboard</p>
              <p>• Real-time performance data will be synced automatically</p>
              <p>• Set up alerts for performance issues</p>
            </div>
          </div>

          {/* Connect Button */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to Connect?</h3>
                <p className="text-sm text-gray-600">Connect your Facebook Business account now</p>
              </div>
            </div>
            <button
              onClick={handleConnectFacebook}
              disabled={isConnecting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </div>
              ) : (
                'Connect Facebook Account'
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Information */}
        <div className="space-y-6">
          {/* Benefits */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What You'll Get</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Real-time Performance Monitoring</h4>
                  <p className="text-sm text-gray-600">Track your ad performance with live updates</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Smart Alerts</h4>
                  <p className="text-sm text-gray-600">Get notified when campaigns need attention</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Performance Insights</h4>
                  <p className="text-sm text-gray-600">AI-powered recommendations to improve your ads</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Local Market Data</h4>
                  <p className="text-sm text-gray-600">Zimbabwe-specific insights and recommendations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-blue-900">Security & Privacy</h3>
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Your data is encrypted and secure</p>
              <p>• We only access the permissions you grant</p>
              <p>• You can disconnect your account anytime</p>
              <p>• We never store your Facebook password</p>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">What permissions does ZivaAds need?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  We need access to read your ad data and manage campaigns. We never post on your behalf.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Can I disconnect later?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Yes, you can disconnect your Facebook account anytime from your settings.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Is my data secure?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Absolutely. We use industry-standard encryption and never share your data with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 