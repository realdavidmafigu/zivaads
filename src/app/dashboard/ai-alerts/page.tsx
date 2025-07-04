'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { BellIcon, ClockIcon, CheckIcon, XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';
import AIAlertPreferences from '@/components/AIAlertPreferences';
import { getRecentAIDailyAlerts } from '@/lib/ai-daily-alerts';

interface AIAlert {
  id: string;
  alert_type: string;
  content: string;
  summary: string;
  campaign_count: number;
  total_spend: number;
  generated_at: string;
}

export default function AIAlertsPage() {
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [recentAIAlerts, setRecentAIAlerts] = useState<any[]>([]);

  const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  useEffect(() => {
    fetchAccounts();
    fetchAlerts();
    fetchRecentAIAlerts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('facebook_accounts')
        .select('id, facebook_account_id, account_name')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (!error && data && data.length > 0) {
        setAccounts(data);
        setSelectedAccount(data[0].facebook_account_id);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch('/api/alerts/ai-daily');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAIAlerts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const alerts = await getRecentAIDailyAlerts(user.id, 5);
    setRecentAIAlerts(alerts);
  };

  const testAlert = async (alertType: 'morning' | 'afternoon' | 'evening') => {
    try {
      setTestLoading(true);
      const response = await fetch('/api/alerts/ai-daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertType,
          forceSend: true,
          accountId: selectedAccount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`${alertType.charAt(0).toUpperCase() + alertType.slice(1)} test alert sent! Check your WhatsApp.`);
        setTimeout(() => setMessage(''), 5000);
        fetchAlerts(); // Refresh the alerts list
      } else {
        setMessage('Failed to send test alert');
      }
    } catch (error) {
      console.error('Error sending test alert:', error);
      setMessage('Error sending test alert');
    } finally {
      setTestLoading(false);
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'morning':
        return '🌅';
      case 'afternoon':
        return '☀️';
      case 'evening':
        return '🌙';
      default:
        return '📊';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BellIcon className="h-8 w-8 mr-3 text-blue-600" />
                AI Daily Alerts
              </h1>
              <p className="mt-2 text-gray-600">
                Get brief, jargon-free updates about your campaign performance
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Ad Account Selector */}
              {accounts.length > 0 && (
                <select
                  value={selectedAccount}
                  onChange={e => setSelectedAccount(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {accounts.map(acc => (
                    <option key={acc.facebook_account_id} value={acc.facebook_account_id}>
                      {acc.account_name || acc.facebook_account_id}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => testAlert('morning')}
                disabled={testLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                {testLoading ? 'Sending...' : 'Test Morning'}
              </button>
              <button
                onClick={() => testAlert('afternoon')}
                disabled={testLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                {testLoading ? 'Sending...' : 'Test Afternoon'}
              </button>
              <button
                onClick={() => testAlert('evening')}
                disabled={testLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                {testLoading ? 'Sending...' : 'Test Evening'}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md flex items-center ${
            message.includes('Error') || message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message.includes('Error') || message.includes('Failed') ? (
              <XMarkIcon className="h-5 w-5 mr-2" />
            ) : (
              <CheckIcon className="h-5 w-5 mr-2" />
            )}
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alert Preferences */}
          <div>
            <AIAlertPreferences />
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Recent AI Alerts</h3>
            </div>

            {recentAIAlerts.length === 0 ? (
              <div className="text-center py-8">
                <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No AI alerts generated yet</p>
                <p className="text-sm text-gray-400 mt-2">Test an alert to see how it works</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAIAlerts.map((alert) => (
                  <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{getAlertTypeIcon(alert.alert_type)}</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {alert.alert_type} Alert
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(alert.generated_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{alert.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{alert.campaign_count} campaigns</span>
                      <span>${alert.total_spend?.toFixed(2) ?? '0.00'} spent</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How AI Daily Alerts Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🤖</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-600">
                Our AI analyzes your campaign data and identifies key insights
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💬</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Simple Language</h4>
              <p className="text-sm text-gray-600">
                Get brief, jargon-free updates that anyone can understand
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📱</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">WhatsApp Delivery</h4>
              <p className="text-sm text-gray-600">
                Receive alerts directly on WhatsApp at your preferred times
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 