"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../config/supabase';
import EnhancedCampaignCard from '@/components/EnhancedCampaignCard';
import { 
  ChartBarIcon, 
  ArrowLeftIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function CampaignsPage() {
  const router = useRouter();
  const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState<boolean>(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [useCache, setUseCache] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<string>('database');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Load selected account from localStorage on component mount
  useEffect(() => {
    const savedAccount = localStorage.getItem('dashboard-selected-account');
    if (savedAccount) {
      setSelectedAccount(savedAccount);
    } else {
      setSelectedAccount('all');
    }
  }, []);

  // Fetch campaigns
  useEffect(() => {
    if (selectedAccount === null) return;
    
    const fetchCampaigns = async () => {
      try {
        setCampaignsLoading(true);
        setCampaignsError(null);
        
        const params = [];
        if (selectedAccount !== 'all') params.push(`account_id=${selectedAccount}`);
        params.push(`use_cache=${useCache}`);
        if (!useCache) params.push('force_refresh=true');
        
        const res = await fetch(`/api/facebook/campaigns?${params.join('&')}`);
        const data = await res.json();
        
        if (res.ok) {
          setCampaigns(data.data || []);
          setDataSource(data.data_source || 'unknown');
          setLastUpdated(new Date().toLocaleTimeString());
        } else {
          setCampaignsError(data.error || 'Failed to fetch campaigns');
        }
      } catch (err) {
        setCampaignsError('Failed to fetch campaigns');
      }
      setCampaignsLoading(false);
    };
    
    fetchCampaigns();
  }, [selectedAccount, useCache]);

  // Filter campaigns based on search and status
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.id?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const totalSpend = campaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);

  const handleRefresh = () => {
    setUseCache(false);
    setTimeout(() => setUseCache(true), 100); // Reset after a brief moment
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">All Campaigns</h1>
                <p className="text-gray-600 mt-1">Manage and monitor your Facebook ad campaigns</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Data Source Indicator */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <ClockIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  {dataSource === 'database' ? 'Cached Data' : 'Live Data'}
                </span>
                {lastUpdated && (
                  <span className="text-xs text-blue-600">
                    • {lastUpdated}
                  </span>
                )}
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={campaignsLoading}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 ${campaignsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={() => router.push('/dashboard/connect-facebook')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Connect Facebook</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Source Toggle */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Data Source</h3>
              <p className="text-sm text-gray-600">
                Choose between cached data (faster) or live data from Facebook API
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={useCache}
                  onChange={() => setUseCache(true)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Cached (Recommended)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={!useCache}
                  onChange={() => setUseCache(false)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Live Data</span>
              </label>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-white" />
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
                <p className="text-sm text-gray-600">Total Spend</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalClicks.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="DELETED">Deleted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">Campaign Performance</h2>
              </div>
              <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full">
                {filteredCampaigns.length} campaigns
              </span>
            </div>
          </div>

          {/* Loading State */}
          {campaignsLoading && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center space-x-2">
                <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin" />
                <span className="text-gray-600">Loading campaigns...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {campaignsError && (
            <div className="p-8 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{campaignsError}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Campaigns Grid */}
          {!campaignsLoading && !campaignsError && (
            <div className="p-6">
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Connect your Facebook account to see your campaigns'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <button
                      onClick={() => router.push('/dashboard/connect-facebook')}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Connect Facebook Account</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCampaigns.map((campaign) => (
                    <EnhancedCampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      simpleMode={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 