import React, { useState } from 'react';
import Link from 'next/link';
import { FacebookCampaign, FacebookInsights } from '@/types';

interface CampaignCardProps {
  campaign: FacebookCampaign;
  insights?: FacebookInsights;
  simpleMode?: boolean;
}

// Performance ribbon colors and text
const getPerformanceRibbon = (ctr: number, cpc: number) => {
  if (ctr === 0 || cpc === 0) return { color: 'bg-gray-100 text-gray-600', text: 'No Data', emoji: '❓' };
  if (ctr > 2 && cpc < 0.5) return { color: 'bg-green-100 text-green-700', text: 'Great Performance', emoji: '🟢' };
  if (ctr > 1 && cpc < 1) return { color: 'bg-yellow-100 text-yellow-700', text: 'Moderate', emoji: '🟡' };
  return { color: 'bg-red-100 text-red-700', text: 'Poor', emoji: '🔴' };
};

// Campaign type detection
const getCampaignType = (objective: string) => {
  const obj = objective?.toLowerCase() || '';
  if (obj.includes('engagement')) return { icon: '📈', label: 'Engagement' };
  if (obj.includes('conversion')) return { icon: '🛒', label: 'Conversion' };
  if (obj.includes('message')) return { icon: '💬', label: 'Messages' };
  if (obj.includes('awareness')) return { icon: '👁️', label: 'Awareness' };
  if (obj.includes('traffic')) return { icon: '🚗', label: 'Traffic' };
  return { icon: '📊', label: 'Campaign' };
};

// Campaign duration calculation
const getCampaignDuration = (startTime?: string) => {
  if (!startTime) return 'Unknown duration';
  const start = new Date(startTime);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Started today';
  if (diffDays < 7) return `Running for ${diffDays} days`;
  if (diffDays < 30) return `Running for ${Math.floor(diffDays / 7)} weeks`;
  return `Running for ${Math.floor(diffDays / 30)} months`;
};

// Health score calculation (1-100)
const calculateHealthScore = (ctr: number, cpc: number, status: string) => {
  if (ctr === 0 || cpc === 0) return 0;
  
  let score = 0;
  
  // CTR scoring (0-40 points)
  if (ctr > 3) score += 40;
  else if (ctr > 2) score += 30;
  else if (ctr > 1) score += 20;
  else if (ctr > 0.5) score += 10;
  
  // CPC scoring (0-40 points) - lower is better
  if (cpc < 0.5) score += 40;
  else if (cpc < 1) score += 30;
  else if (cpc < 2) score += 20;
  else if (cpc < 5) score += 10;
  
  // Status scoring (0-20 points)
  if (status === 'ACTIVE') score += 20;
  else if (status === 'LEARNING') score += 15;
  else if (status === 'PAUSED') score += 5;
  
  return Math.min(100, score);
};

// Recommended action based on performance
const getRecommendedAction = (ctr: number, cpc: number, status: string, healthScore: number) => {
  if (status === 'PAUSED' && healthScore > 60) {
    return { action: 'Reactivate & Scale Budget', icon: '✅', color: 'bg-green-100 text-green-700' };
  }
  if (ctr < 1 && cpc > 2) {
    return { action: 'Change Image', icon: '🔄', color: 'bg-blue-100 text-blue-700' };
  }
  if (healthScore > 70) {
    return { action: 'Scale Budget', icon: '📈', color: 'bg-green-100 text-green-700' };
  }
  if (healthScore < 30) {
    return { action: 'Pause & Optimize', icon: '⏸️', color: 'bg-red-100 text-red-700' };
  }
  return { action: 'Monitor', icon: '👀', color: 'bg-gray-100 text-gray-700' };
};

// Simple sparkline component
const Sparkline = ({ data, color = 'blue' }: { data: number[], color?: string }) => {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg className="w-16 h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={`var(--tw-color-${color}-500)`}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
};

// Tooltip component
const Tooltip = ({ children, content }: { children: React.ReactNode, content: string }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-10 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap -top-8 left-1/2 transform -translate-x-1/2">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, insights, simpleMode = false }) => {
  // Always convert possible string values to numbers
  const ctr = Number(campaign.ctr ?? insights?.ctr) || 0;
  const cpc = Number(campaign.cpc) || 0;
  const cpm = Number(campaign.cpm ?? insights?.cpm) || 0;
  const impressions = Number(campaign.impressions ?? insights?.impressions) || 0;
  const clicks = Number(campaign.clicks ?? insights?.clicks) || 0;
  const reach = Number(campaign.reach ?? insights?.reach) || 0;
  const frequency = Number(campaign.frequency ?? insights?.frequency) || 0;
  const conversions = Number(campaign.conversions) || 0;
  const spent = Number(campaign.spend ?? insights?.spend) || 0;
  
  // Calculate derived values
  const performanceRibbon = getPerformanceRibbon(ctr, cpc);
  const campaignType = getCampaignType(campaign.objective);
  const duration = getCampaignDuration(campaign.start_time);
  const healthScore = calculateHealthScore(ctr, cpc, campaign.status);
  const recommendedAction = getRecommendedAction(ctr, cpc, campaign.status, healthScore);
  
  // Mock trend data (in real app, this would come from historical data)
  const ctrTrend = [1.2, 1.5, 1.8, 2.1, 2.3, 2.0, 1.9, 2.2];
  const spendTrend = [10, 15, 12, 18, 20, 16, 14, 17];
  
  // Check if account has payment issues
  const hasPaymentIssue = campaign.facebook_account_id && 
    campaign.account_name && 
    campaign.payment_status === 'unsettled';

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md ${
      hasPaymentIssue ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`}>
      {/* Performance Ribbon */}
      <div className={`px-4 py-2 ${performanceRibbon.color} flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{performanceRibbon.emoji}</span>
          <span className="font-medium text-sm">{performanceRibbon.text}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs">Health Score:</span>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-sm ${i < Math.floor(healthScore / 20) ? 'text-yellow-500' : 'text-gray-300'}`}>
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Payment Issue Alert */}
        {hasPaymentIssue && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-red-700">Account Payment Issue</span>
            </div>
          </div>
        )}

        {/* Campaign Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 truncate pr-2" title={campaign.name}>
              {campaign.name || 'Zimbabwe Business Campaign'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
              {campaign.status || 'ACTIVE'}
            </span>
          </div>
          
          {/* Campaign Type & Duration */}
          <div className="flex items-center space-x-3 text-sm text-gray-600 mb-3">
            <span className="flex items-center space-x-1">
              <span>{campaignType.icon}</span>
              <span>{campaignType.label} Campaign</span>
            </span>
            <span>•</span>
            <span>{duration}</span>
          </div>
        </div>

        {/* Key Metrics with Visual Hierarchy */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Key Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Tooltip content="Click-through-rate. This shows how many people clicked after seeing your ad.">
                <div className="text-xs text-gray-600 mb-1">CTR</div>
              </Tooltip>
              <div className="text-2xl font-bold text-blue-600">
                {ctr > 0 ? `${ctr.toFixed(2)}%` : 'N/A'}
              </div>
              <Sparkline data={ctrTrend} color="blue" />
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Tooltip content="Cost per click. This shows how much you pay for each click on your ad.">
                <div className="text-xs text-gray-600 mb-1">CPC</div>
              </Tooltip>
              <div className="text-2xl font-bold text-green-600">
                {cpc > 0 ? `$${cpc.toFixed(2)}` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {clicks > 0 ? `${clicks.toLocaleString()} clicks` : 'No clicks'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
            <div className="text-center">
              <div className="text-gray-600">Spend</div>
              <div className="font-semibold">{spent ? `$${spent.toFixed(2)}` : 'N/A'}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Impressions</div>
              <div className="font-semibold">{impressions ? impressions.toLocaleString() : 'N/A'}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Reach</div>
              <div className="font-semibold">{reach ? reach.toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">🔍 AI Insights</h4>
          <div className="space-y-2 text-sm">
            {ctr > 2 ? (
              <div className="flex items-start space-x-2">
                <span className="text-green-500">✓</span>
                <span>Excellent Click Rate – People like your ad.</span>
              </div>
            ) : ctr > 1 ? (
              <div className="flex items-start space-x-2">
                <span className="text-yellow-500">⚠</span>
                <span>Average Click Rate – Consider testing new creatives.</span>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <span className="text-red-500">✗</span>
                <span>Low Click Rate – Try a new image or improve your ad.</span>
              </div>
            )}
            
            {cpc < 0.5 ? (
              <div className="flex items-start space-x-2">
                <span className="text-green-500">✓</span>
                <span>Very Low CPC – You're getting great value.</span>
              </div>
            ) : cpc < 1 ? (
              <div className="flex items-start space-x-2">
                <span className="text-yellow-500">⚠</span>
                <span>Moderate CPC – Consider optimizing your targeting.</span>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <span className="text-red-500">✗</span>
                <span>High CPC – Review your targeting and ad quality.</span>
              </div>
            )}
            
            {campaign.status === 'PAUSED' && (
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">ℹ</span>
                <span>Campaign is Paused – Consider reactivating.</span>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Action */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">🎯 Suggested Action</h4>
          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg ${recommendedAction.color}`}>
            <span>{recommendedAction.icon}</span>
            <span className="font-medium">{recommendedAction.action}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link 
            href={`/dashboard/campaigns/${campaign.id}`}
            className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            🔍 View Details
          </Link>
          <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            ⚙️ Optimize
          </button>
          <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            📄 Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard; 