'use client';

import React, { useState } from 'react';

export default function TestAIPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-ai');
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Test failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🤖 AI Integration Test</h1>
          
          <div className="mb-6">
            <button
              onClick={testAI}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Testing AI...' : 'Test AI Integration'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-green-800 font-semibold mb-2">✅ AI Test Successful</h3>
                <p className="text-green-700">Model: {result.model}</p>
                <p className="text-green-700">Timestamp: {result.timestamp}</p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-gray-800 font-semibold mb-2">📊 Test Campaign Data</h3>
                <pre className="text-sm text-gray-700 overflow-auto">
                  {JSON.stringify(result.testCampaign, null, 2)}
                </pre>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-blue-800 font-semibold mb-2">🤖 AI Response</h3>
                <div className="text-blue-700 whitespace-pre-wrap">
                  {result.aiResponse}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-yellow-800 font-semibold mb-2">ℹ️ What This Tests</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• OpenAI API connectivity with GPT-4o model</li>
              <li>• Campaign data analysis capabilities</li>
              <li>• Structured response parsing</li>
              <li>• Error handling and fallbacks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 