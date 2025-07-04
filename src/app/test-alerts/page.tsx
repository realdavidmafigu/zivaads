'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BellIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  CogIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function TestAlertsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUserAndCampaigns() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch user's campaigns
        const { data: campaignsData } = await supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', user.id);
        setCampaigns(campaignsData || []);
      }
    }
    fetchUserAndCampaigns();
  }, []);

  const runTest = async (testType: string) => {
    setLoading(true);
    setResults(null);

    try {
      let response;
      
      switch (testType) {
        case 'generate_alerts':
          response = await fetch('/api/alerts/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forceGenerate: true }),
          });
          break;
          
        case 'test_whatsapp':
          response = await fetch('/api/alerts/test', {
            method: 'POST',
          });
          break;
          
        case 'check_campaigns':
          response = await fetch('/api/cron/check-campaigns', {
            method: 'POST',
          });
          break;
          
        default:
          throw new Error('Unknown test type');
      }

      const data = await response.json();
      setResults({ testType, success: response.ok, data });
      
      if (response.ok) {
        alert(`${testType.replace('_', ' ')} test completed successfully!`);
      } else {
        alert(`Test failed: ${data.error}`);
      }
    } catch (error: unknown) {
      console.error('Test error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setResults({ testType, success: false, error: errorMsg });
      alert(`Test failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <BellIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Alert System Testing
                </h1>
                <p className="mt-2 text-gray-600">
                  Test and debug the alert system for user: {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Campaigns</p>
              <p className="text-sm">{campaigns.length} campaigns found</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Campaigns</p>
              <p className="text-sm">{campaigns.filter(c => c.status === 'ACTIVE').length} active</p>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => runTest('generate_alerts')}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Alerts'}
            </button>
            
            <button
              onClick={() => runTest('test_whatsapp')}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <BellIcon className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Test WhatsApp'}
            </button>
            
            <button
              onClick={() => runTest('check_campaigns')}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              <CogIcon className="h-4 w-4 mr-2" />
              {loading ? 'Checking...' : 'Check Campaigns'}
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
            <div className={`p-4 rounded-lg ${
              results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                {results.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                )}
                <span className={`font-medium ${
                  results.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {results.testType.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(results.data || results.error, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/dashboard/alerts')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <BellIcon className="h-4 w-4 mr-2" />
              View Alerts Page
            </button>
            <button
              onClick={() => router.push('/dashboard/settings/alerts')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <CogIcon className="h-4 w-4 mr-2" />
              Alert Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 