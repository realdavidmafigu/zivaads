'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugInsightsPage() {
  const [campaignId, setCampaignId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testInsights = async () => {
    if (!campaignId) {
      setError('Please enter a campaign ID');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const params = new URLSearchParams({ campaign_id: campaignId });
      if (accountId) {
        params.append('account_id', accountId);
      }

      const response = await fetch(`/api/debug/facebook-insights?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch insights');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Facebook Insights Debug Tool</h1>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign ID *
              </label>
              <input
                type="text"
                id="campaignId"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="e.g., 120224615264320405"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-2">
                Account ID (optional)
              </label>
              <input
                type="text"
                id="accountId"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g., act_1440930823227903"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={testInsights}
              disabled={loading || !campaignId}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Testing...' : 'Test Insights Fetching'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Campaign Info</h3>
                <p><span className="font-medium">ID:</span> {results.campaignId}</p>
                <p><span className="font-medium">Account:</span> {results.accountName}</p>
                <p><span className="font-medium">Account ID:</span> {results.accountId}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
                <p><span className="font-medium">Total Strategies:</span> {results.summary.totalStrategies}</p>
                <p><span className="font-medium">Successful:</span> {results.summary.successfulStrategies}</p>
                <p><span className="font-medium">Has Result:</span> {results.summary.hasFinalResult ? '✅ Yes' : '❌ No'}</p>
                <p><span className="font-medium">Best Strategy:</span> {results.summary.bestStrategy}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Strategy Results</h3>
              {results.strategies.map((strategy: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{strategy.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      strategy.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {strategy.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  
                  {strategy.success && strategy.data && (
                    <div className="bg-green-50 p-3 rounded-md">
                      <h5 className="font-medium text-green-900 mb-2">Data Retrieved:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div><span className="font-medium">Impressions:</span> {strategy.data.impressions || '0'}</div>
                        <div><span className="font-medium">Clicks:</span> {strategy.data.clicks || '0'}</div>
                        <div><span className="font-medium">Spend:</span> ${strategy.data.spend || '0'}</div>
                        <div><span className="font-medium">CTR:</span> {strategy.data.ctr || '0'}%</div>
                        <div><span className="font-medium">CPC:</span> ${strategy.data.cpc || '0'}</div>
                        <div><span className="font-medium">CPM:</span> ${strategy.data.cpm || '0'}</div>
                        <div><span className="font-medium">Reach:</span> {strategy.data.reach || '0'}</div>
                        <div><span className="font-medium">Frequency:</span> {strategy.data.frequency || '0'}</div>
                      </div>
                    </div>
                  )}
                  
                  {!strategy.success && strategy.error && (
                    <div className="bg-red-50 p-3 rounded-md">
                      <h5 className="font-medium text-red-900 mb-2">Error:</h5>
                      <p className="text-red-800 text-sm">{strategy.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {results.finalResult && (
              <div className="mt-6 bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-blue-900 mb-2">Final Result (Best Available Data)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><span className="font-medium">Impressions:</span> {results.finalResult.impressions || '0'}</div>
                  <div><span className="font-medium">Clicks:</span> {results.finalResult.clicks || '0'}</div>
                  <div><span className="font-medium">Spend:</span> ${results.finalResult.spend || '0'}</div>
                  <div><span className="font-medium">CTR:</span> {results.finalResult.ctr || '0'}%</div>
                  <div><span className="font-medium">CPC:</span> ${results.finalResult.cpc || '0'}</div>
                  <div><span className="font-medium">CPM:</span> ${results.finalResult.cpm || '0'}</div>
                  <div><span className="font-medium">Reach:</span> {results.finalResult.reach || '0'}</div>
                  <div><span className="font-medium">Frequency:</span> {results.finalResult.frequency || '0'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 