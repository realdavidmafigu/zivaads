"use client";
import React, { useEffect, useState } from 'react';
import StatsCard from '@/components/StatsCard';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/supabase';
import { hasFacebookConnection } from '../../utils/facebookUtils';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import AIInsights from '@/components/AIInsights';
import CampaignCard from '@/components/CampaignCard';
import CampaignInsights from '@/components/CampaignInsights';
import AIPerformanceReports from '@/components/AIPerformanceReports';
import LocalInsights from '@/components/LocalInsights';
import APICallMonitor from '@/components/APICallMonitor';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  EyeIcon, 
  CursorArrowRaysIcon,
  BellIcon,
  CogIcon,
  PlusIcon,
  DocumentChartBarIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { getRecentAIDailyAlerts } from '@/lib/ai-daily-alerts';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const [userName, setUserName] = useState('User');
  const [hasFacebook, setHasFacebook] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [viewAll, setViewAll] = useState(false);
  const [dateRange, setDateRange] = useState('last_7_days');
  const [simpleMode, setSimpleMode] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState<boolean>(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [aiReports, setAiReports] = useState<any[]>([]);
  const [aiReportsLoading, setAiReportsLoading] = useState<boolean>(true);
  const [recentAIAlerts, setRecentAIAlerts] = useState<any[]>([]);

  // Function to get personalized greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Function to get AI-generated performance summary
  const [aiSummary, setAiSummary] = useState<string>("Loading your campaign summary...");
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  const generateAISummary = async () => {
    if (campaigns.length === 0) {
      setAiSummary("Connect your Facebook ads to get started with performance insights.");
      setSummaryLoading(false);
      return;
    }

    try {
      const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
      const totalSpend = campaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
      const totalClicks = campaigns.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);

      // Create a simple, concise summary without calling the AI API
      let summary = "";
      
      if (activeCampaigns === 0) {
        summary = "All campaigns are paused. Consider activating your best performers to drive results.";
      } else if (activeCampaigns === 1) {
        summary = `You have 1 active campaign running with $${totalSpend.toFixed(2)} spend. Keep monitoring performance!`;
      } else {
        summary = `You have ${activeCampaigns} active campaigns with $${totalSpend.toFixed(2)} total spend. ${totalClicks > 0 ? 'Great engagement so far!' : 'Ready to see results!'}`;
      }
      
      setAiSummary(summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
      const totalSpend = campaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
      setAiSummary(`You have ${activeCampaigns} active campaigns with $${totalSpend.toFixed(2)} spend.`);
    }
    setSummaryLoading(false);
  };

  // Generate AI summary when campaigns change
  useEffect(() => {
    if (campaigns.length > 0 && !campaignsLoading) {
      generateAISummary();
    } else if (campaigns.length === 0 && !campaignsLoading) {
      setAiSummary("Connect your Facebook ads to get started with performance insights.");
      setSummaryLoading(false);
    }
  }, [campaigns, campaignsLoading]);

  // Load selected account from localStorage on component mount
  useEffect(() => {
    const savedAccount = localStorage.getItem('dashboard-selected-account');
    if (savedAccount) {
      console.log('🔄 Loading saved account from localStorage:', savedAccount);
      setSelectedAccount(savedAccount);
    } else {
      console.log('🔄 No saved account found, defaulting to "all"');
      setSelectedAccount('all');
    }
  }, []);

  // Save selected account to localStorage whenever it changes
  const handleAccountChange = (accountId: string) => {
    console.log('🔄 Account selection changed to:', accountId);
    setSelectedAccount(accountId);
    localStorage.setItem('dashboard-selected-account', accountId);
  };

  // Debounced campaign fetching to prevent multiple rapid calls
  useEffect(() => {
    if (selectedAccount === null) {
      console.log('🔄 Skipping campaign fetch - selectedAccount not yet loaded');
      return;
    }
    
    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      console.log('🔄 fetchCampaigns called with selectedAccount:', selectedAccount);
      setCampaignsLoading(true);
      setCampaignsError(null);
      
      const fetchCampaigns = async () => {
        try {
          const params = [];
          if (selectedAccount !== 'all') params.push(`account_id=${selectedAccount}`);
          const res = await fetch(`/api/facebook/campaigns?${params.join('&')}`);
          const data = await res.json();
          if (res.ok) {
            console.log('🔄 Campaigns fetched successfully:', data.data?.length || 0, 'campaigns');
            setCampaigns(data.data || []);
          } else {
            console.log('❌ Campaigns fetch failed:', data.error);
            setCampaignsError(data.error || 'Failed to fetch campaigns');
          }
        } catch (err) {
          console.log('❌ Campaigns fetch error:', err);
          setCampaignsError('Failed to fetch campaigns');
        }
        setCampaignsLoading(false);
      };
      
      fetchCampaigns();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [selectedAccount]);

  useEffect(() => {
    async function fetchUserAndFacebook() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User');
        const fbConnected = await hasFacebookConnection(user.id);
        setHasFacebook(fbConnected);
      }
      setLoading(false);
    }
    fetchUserAndFacebook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function fetchAccounts() {
      setAccountsLoading(true);
      setAccountsError(null);
      try {
        const res = await fetch('/api/debug/facebook-accounts');
        const data = await res.json();
        if (res.ok) {
          setAccounts(data.activeAccounts || []);
        } else {
          setAccountsError(data.error || 'Failed to fetch accounts');
        }
      } catch (err) {
        setAccountsError('Failed to fetch accounts');
      }
      setAccountsLoading(false);
    }
    fetchAccounts();
  }, []);

  useEffect(() => {
    async function fetchAIReports() {
      setAiReportsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('ai_performance_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('generated_at', { ascending: false })
          .limit(3);
        
        if (!error) {
          setAiReports(data || []);
        }
      } catch (err) {
        console.error('Error fetching AI reports:', err);
      }
      setAiReportsLoading(false);
    }
    fetchAIReports();
  }, []);

  useEffect(() => {
    fetchRecentAIAlerts();
  }, []);

  const fetchRecentAIAlerts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const alerts = await getRecentAIDailyAlerts(user.id, 3);
    setRecentAIAlerts(alerts);
  };

  const handleTestAlert = async () => {
    try {
      const response = await fetch('/api/alerts/test', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Test alert sent! Check your WhatsApp.');
      } else {
        alert('Failed to send test alert. Please check your WhatsApp settings.');
      }
    } catch (error) {
      console.error('Error sending test alert:', error);
      alert('Failed to send test alert');
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceGenerate: true }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Generated ${result.alerts.length} alerts! Check your alerts page.`);
      } else {
        const error = await response.json();
        alert(`Failed to generate alerts: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating alerts:', error);
      alert('Failed to generate alerts');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalSpend = campaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + (Number(c.impressions) || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {getGreeting()}, {userName}! 👋
              </h1>
              <p className="text-gray-600 text-sm mt-0.5 max-w-xl truncate">
                {summaryLoading ? "Loading your campaign summary..." : aiSummary}
              </p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => router.push('/test-ai-alerts')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium"
              >
                <SparklesIcon className="h-4 w-4" />
                <span>AI Reports</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/settings/alerts')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <CogIcon className="h-4 w-4 text-gray-600" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">




        {/* Account Selection & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
              <div className="flex flex-col w-full sm:w-auto">
                <label className="font-medium text-gray-700 mb-1">Ad Account:</label>
                {selectedAccount === null ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-full rounded"></div>
                ) : (
                  <select 
                    value={selectedAccount || 'all'} 
                    onChange={e => handleAccountChange(e.target.value)} 
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                    disabled={accountsLoading}
                  >
                    <option value="all">All Accounts</option>
                    {accounts.map(acc => (
                      <option key={acc.facebook_account_id} value={acc.facebook_account_id}>
                        {acc.account_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex flex-col w-full sm:w-auto">
                <label className="font-medium text-gray-700 mb-1">Period:</label>
                <select 
                  value={dateRange} 
                  onChange={e => setDateRange(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={simpleMode} 
                  onChange={e => setSimpleMode(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Simple Mode</span>
              </label>
              <div className="h-4 w-px bg-gray-300"></div>
              <button
                onClick={() => router.push('/dashboard/connect-facebook')}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {hasFacebook ? 'Reconnect Facebook' : 'Connect Facebook'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spend</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.length > 0 ? `$${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '--'}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{activeCampaigns}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.length > 0 ? totalClicks.toLocaleString() : '--'}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <CursorArrowRaysIcon className="w-5 h-5 text-white" />
              </div>
                  </div>
                </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Performance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.length > 0 ? (activeCampaigns > 0 ? 'Good' : 'Needs Work') : 'Ready'}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
            </div>
              </div>
        </div>

      {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Campaigns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Campaign Performance</h2>
                  </div>
                  <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full">
                    {campaigns.length} Campaigns
                  </span>
                </div>
              </div>
              <div className="p-6">
                {campaignsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                    <p className="text-gray-600 mb-4">Connect your Facebook account to see your campaigns here.</p>
                    <button
                      onClick={() => router.push('/dashboard/connect-facebook')}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Connect Facebook</span>
                    </button>
                  </div>
                ) : (
        <div className="space-y-6">
                    {campaigns.slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="space-y-4">
                        <CampaignCard campaign={campaign} simpleMode={simpleMode} />
                        <CampaignInsights campaign={campaign} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Facebook Connection Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className={`px-6 py-4 ${hasFacebook ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
                <div className="flex items-center space-x-3">
                  {hasFacebook ? (
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  ) : (
                    <ClockIcon className="h-6 w-6 text-white" />
                  )}
                  <h3 className="text-lg font-bold text-white">
                    {hasFacebook ? 'Facebook Connected' : 'Connect Facebook'}
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  {hasFacebook 
                    ? 'Your Facebook Business account is connected and data is being synced automatically.'
                    : 'Connect your Facebook Business account to start monitoring your ad performance in real-time.'
                  }
                </p>
                <div className="space-y-2">
                <button
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  onClick={() => hasFacebook ? router.push('/dashboard/connect-facebook') : router.push('/dashboard/connect-facebook')}
                >
                    {hasFacebook ? 'Manage Account' : 'Connect Account'}
                </button>
                  {hasFacebook && (
                <button
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  onClick={() => router.push('/dashboard/settings/alerts')}
                >
                  Settings
                </button>
                  )}
                </div>
              </div>
            </div>

            {/* Recent AI Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Recent AI Alerts</h3>
              </div>
              {recentAIAlerts.length === 0 ? (
                <div className="text-center py-4">
                  <BellIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No AI alerts yet</p>
                </div>
              ) : (
              <div className="space-y-3">
                  {recentAIAlerts.map((alert) => (
                    <div key={alert.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{alert.alert_type === 'morning' ? '🌅' : alert.alert_type === 'afternoon' ? '☀️' : alert.alert_type === 'evening' ? '🌙' : '📊'}</span>
                          <span className="text-sm font-medium text-gray-900 capitalize">{alert.alert_type} Alert</span>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(alert.generated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-gray-700 mb-1 line-clamp-2">{alert.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{alert.campaign_count} campaigns</span>
                        <span>${alert.total_spend?.toFixed(2) ?? '0.00'} spent</span>
                  </div>
            </div>
                  ))}
                </div>
                )}
            </div>

            {/* Local Market Insights */}
            <LocalInsights />
        </div>
      </div>
      </div>
      
      {/* API Call Monitor - only show in development */}
      {process.env.NODE_ENV === 'development' && <APICallMonitor />}
    </div>
  );
} 