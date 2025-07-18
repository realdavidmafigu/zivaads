'use client';

import React, { useState } from 'react';
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function TestAIAlertsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testAIAlert = async (alertType: 'morning' | 'afternoon' | 'evening') => {
    try {
      setLoading(true);
      setError('');
      setResult(null);

      const response = await fetch('/api/alerts/ai-daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertType,
          forceSend: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to generate AI alert');
      }
    } catch (error) {
      console.error('Error testing AI alert:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center mb-4 sm:mb-6">
            <BellIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AI Alerts Test Page</h1>
          </div>

          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            Test the AI-powered daily alerts system. This will generate a brief, jargon-free notification about your campaign performance.
          </p>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <button
              onClick={() => testAIAlert('morning')}
              disabled={loading}
              className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
            >
              <span className="mr-1 sm:mr-2">🌅</span>
              <span className="hidden sm:inline">Test Morning Alert</span>
              <span className="sm:hidden">Morning</span>
            </button>
            <button
              onClick={() => testAIAlert('afternoon')}
              disabled={loading}
              className="bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
            >
              <span className="mr-1 sm:mr-2">☀️</span>
              <span className="hidden sm:inline">Test Afternoon Alert</span>
              <span className="sm:hidden">Afternoon</span>
            </button>
            <button
              onClick={() => testAIAlert('evening')}
              disabled={loading}
              className="bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
            >
              <span className="mr-1 sm:mr-2">🌙</span>
              <span className="hidden sm:inline">Test Evening Alert</span>
              <span className="sm:hidden">Evening</span>
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base">Generating AI alert...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center">
                <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2" />
                <span className="text-red-700 font-medium text-sm sm:text-base">Error:</span>
              </div>
              <p className="text-red-600 mt-1 text-sm">{error}</p>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                <span className="text-green-700 font-medium text-sm sm:text-base">AI Alert Generated Successfully!</span>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Alert Content:</h3>
                  <div className="bg-white p-3 sm:p-4 rounded border">
                    <p className="text-gray-800 text-sm sm:text-base">{result.alert?.content}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 capitalize">{result.alert?.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Campaigns</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">{result.alert?.campaignCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Spend</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">${result.alert?.totalSpend?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">WhatsApp Sent</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">{result.alert?.shouldSendAlert ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Summary:</h3>
                  <p className="text-xs sm:text-sm text-gray-700">{result.alert?.summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-blue-900 mb-2">How to Test:</h3>
            <ol className="text-xs sm:text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Click one of the test buttons above</li>
              <li>The system will generate an AI-powered alert</li>
              <li>If you have a phone number configured, it will attempt to send via WhatsApp</li>
              <li>Check the result below to see the generated content</li>
            </ol>
          </div>

          {/* Troubleshooting */}
          <div className="mt-4 sm:mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-yellow-900 mb-2">Troubleshooting:</h3>
            <ul className="text-xs sm:text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>If you get "No campaign data", that's normal - the system will send a fallback message</li>
              <li>If WhatsApp fails, check that you've added your phone number in the AI Alerts settings</li>
              <li>Make sure your WhatsApp integration is properly configured</li>
              <li>Check the browser console for detailed error messages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 