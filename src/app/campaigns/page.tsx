import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/supabase';

// Mock campaign data
const mockCampaigns = [
  {
    id: '1',
    name: 'Summer Sale 2024',
    status: 'active',
    budget: 5000,
    spent: 3200,
    impressions: 45000,
    clicks: 1200,
    ctr: 2.67,
    cpc: 2.67,
    conversions: 45,
    startDate: '2024-06-01',
    endDate: '2024-08-31',
  },
  {
    id: '2',
    name: 'Local Business Promotion',
    status: 'paused',
    budget: 3000,
    spent: 1800,
    impressions: 28000,
    clicks: 850,
    ctr: 3.04,
    cpc: 2.12,
    conversions: 32,
    startDate: '2024-05-15',
    endDate: '2024-07-15',
  },
  {
    id: '3',
    name: 'Harare Market Reach',
    status: 'active',
    budget: 7500,
    spent: 4200,
    impressions: 65000,
    clicks: 2100,
    ctr: 3.23,
    cpc: 2.00,
    conversions: 78,
    startDate: '2024-06-10',
    endDate: '2024-09-10',
  },
];

export default async function CampaignsPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceEmoji = (ctr: number, cpc: number) => {
    if (ctr > 3 && cpc < 2) return '😄';
    if (ctr > 2 && cpc < 3) return '🙂';
    if (ctr > 1.5 && cpc < 4) return '😐';
    return '😞';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor your Facebook advertising campaigns
          </p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Create Campaign
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockCampaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* Campaign Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {campaign.name}
                </h3>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
              </div>
              <div className="text-2xl ml-2">
                {getPerformanceEmoji(campaign.ctr, campaign.cpc)}
              </div>
            </div>

            {/* Budget Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Budget</span>
                <span>${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">CTR</p>
                <p className="text-lg font-semibold text-gray-900">{campaign.ctr}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CPC</p>
                <p className="text-lg font-semibold text-gray-900">${campaign.cpc}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Impressions</p>
                <p className="text-lg font-semibold text-gray-900">{campaign.impressions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-lg font-semibold text-gray-900">{campaign.conversions}</p>
              </div>
            </div>

            {/* Campaign Dates */}
            <div className="text-sm text-gray-500 mb-4">
              <p>Started: {new Date(campaign.startDate).toLocaleDateString()}</p>
              <p>Ends: {new Date(campaign.endDate).toLocaleDateString()}</p>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors">
                View Details
              </button>
              <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {mockCampaigns.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first Facebook advertising campaign.
          </p>
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Create Your First Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 