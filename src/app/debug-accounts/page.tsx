'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

export default function DebugAccountsPage() {
  const [accounts, setAccounts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/debug/facebook-accounts');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch accounts');
      }

      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshAccounts = () => {
    setLoading(true);
    fetchAccounts();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Facebook Account Debug</h1>
        <button
          onClick={refreshAccounts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {accounts && (
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">User Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">User ID:</span>
                <p className="font-mono text-sm">{accounts.user.id}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-mono text-sm">{accounts.user.email}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Account Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{accounts.summary.totalAccounts}</div>
                <div className="text-sm text-gray-500">Total Accounts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{accounts.summary.activeAccounts}</div>
                <div className="text-sm text-gray-500">Active Accounts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{accounts.summary.inactiveAccounts}</div>
                <div className="text-sm text-gray-500">Inactive Accounts</div>
              </div>
            </div>
          </div>

          {/* All Accounts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">All Facebook Accounts</h2>
            {accounts.allAccounts.length === 0 ? (
              <p className="text-gray-500">No Facebook accounts found.</p>
            ) : (
              <div className="space-y-4">
                {accounts.allAccounts.map((account: any, index: number) => (
                  <div key={account.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{account.account_name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.account_status === 1 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          Status: {account.account_status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Account ID:</span>
                        <p className="font-mono">{account.facebook_account_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Business Name:</span>
                        <p>{account.business_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Currency:</span>
                        <p>{account.currency}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Sync:</span>
                        <p>{account.last_sync_at ? new Date(account.last_sync_at).toLocaleString() : 'Never'}</p>
                      </div>
                    </div>
                    {account.access_token && (
                      <div className="mt-2">
                        <span className="text-gray-500 text-sm">Access Token:</span>
                        <p className="font-mono text-xs bg-gray-50 p-2 rounded mt-1">
                          {account.access_token.substring(0, 20)}...
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Accounts Only */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Active Facebook Accounts Only</h2>
            {accounts.activeAccounts.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900">No active Facebook accounts</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This is why you're seeing "Connect Account" on the campaigns page.
                </p>
                <div className="mt-6">
                  <a
                    href="/dashboard/connect-facebook"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Connect Facebook Account
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.activeAccounts.map((account: any, index: number) => (
                  <div key={account.id} className="border border-green-200 bg-green-50 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-green-800">{account.account_name}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-600">Account ID:</span>
                        <p className="font-mono">{account.facebook_account_id}</p>
                      </div>
                      <div>
                        <span className="text-green-600">Business Name:</span>
                        <p>{account.business_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 