'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { BellIcon, ClockIcon, CheckIcon, XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';
import AIAlertPreferences from '@/components/AIAlertPreferences';

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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch recent AI alerts from the database
      const { data, error } = await supabase
        .from('ai_daily_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent AI alerts:', error);
      } else {
        setRecentAIAlerts(data || []);
      }
    } catch (error) {
      console.error('Error fetching recent AI alerts:', error);
    }
  };

  const testAlert = async (alertType: 'morning' | 'afternoon' | 'evening') => {
    try {
      setTestLoading(true);
      setMessage('');
      
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
        console.log('Test alert response:', data);
        
        if (data.success) {
          setMessage(`${alertType.charAt(0).toUpperCase() + alertType.slice(1)} test alert generated successfully! Check the recent alerts below.`);
          // Refresh the alerts list
          await fetchRecentAIAlerts();
        } else {
          setMessage('Failed to generate test alert: ' + (data.error || 'Unknown error'));
        }
      } else {
        const errorData = await response.json();
        setMessage('Failed to send test alert: ' + (errorData.error || 'Server error'));
      }
    } catch (error) {
      console.error('Error sending test alert:', error);
      setMessage('Error sending test alert: ' + (error as Error).message);
    } finally {
      setTestLoading(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <BellIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-blue-600" />
                AI Daily Alerts
              </h1>
              <p className="mt-2 text-gray-600 text-sm sm:text-base">
                Get brief, jargon-free updates about your campaign performance
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
              <div className="grid grid-cols-3 gap-2 sm:flex sm:space-x-2">
                <button
                  onClick={() => testAlert('morning')}
                  disabled={testLoading}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <PlayIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{testLoading ? 'Sending...' : 'Test Morning'}</span>
                  <span className="sm:hidden">🌅</span>
                </button>
                <button
                  onClick={() => testAlert('afternoon')}
                  disabled={testLoading}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  <PlayIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{testLoading ? 'Sending...' : 'Test Afternoon'}</span>
                  <span className="sm:hidden">☀️</span>
                </button>
                <button
                  onClick={() => testAlert('evening')}
                  disabled={testLoading}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <PlayIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{testLoading ? 'Sending...' : 'Test Evening'}</span>
                  <span className="sm:hidden">🌙</span>
                </button>
              </div>
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Alert Preferences */}
          <div>
            <AIAlertPreferences />
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent AI Alerts</h3>
              </div>
              <button
                onClick={fetchRecentAIAlerts}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>

            {recentAIAlerts.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <BellIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">No AI alerts generated yet</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">Test an alert to see how it works</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentAIAlerts.map((alert) => (
                  <div key={alert.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center min-w-0 flex-1">
                        <span className="text-xl sm:text-2xl mr-2 flex-shrink-0">{getAlertTypeIcon(alert.alert_type)}</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize truncate">
                          {alert.alert_type} Alert
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatDate(alert.generated_at)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">{alert.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{alert.campaign_count || 0} campaigns</span>
                      <span>${alert.total_spend?.toFixed(2) ?? '0.00'} spent</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">How AI Daily Alerts Work</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <span className="text-xl sm:text-2xl">🤖</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">AI Analysis</h4>
              <p className="text-xs sm:text-sm text-gray-600">
                Our AI analyzes your campaign data and identifies key insights
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <span className="text-xl sm:text-2xl">💬</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Simple Language</h4>
              <p className="text-xs sm:text-sm text-gray-600">
                Get brief, jargon-free updates that anyone can understand
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <span className="text-xl sm:text-2xl">📱</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">WhatsApp Delivery</h4>
              <p className="text-xs sm:text-sm text-gray-600">
                Receive alerts directly on WhatsApp at your preferred times
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 