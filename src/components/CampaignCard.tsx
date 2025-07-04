import React from 'react';
import Link from 'next/link';
import { FacebookCampaign, FacebookInsights } from '@/types';

interface CampaignCardProps {
  campaign: FacebookCampaign;
  insights?: FacebookInsights;
  simpleMode?: boolean;
}

// Helper for status color
const statusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-700';
    case 'PAUSED': return 'bg-yellow-100 text-yellow-700';
    case 'LEARNING': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// Helper for performance face
const getPerformanceFace = (ctr: number, cpc: number) => {
  if (ctr === 0 || cpc === 0) return '❓'; // No data
  if (ctr > 2 && cpc < 0.5) return '😊';
  if (ctr > 1 && cpc < 1) return '😐';
  return '😟';
};

const metricIcon = (label: string) => {
  switch (label) {
    case 'CTR':
      return <span title="Click Through Rate">📈</span>;
    case 'CPC':
      return <span title="Cost per Click">💵</span>;
    case 'CPM':
      return <span title="Cost per 1000 Impressions">📊</span>;
    case 'Impressions':
      return <span title="Impressions">👁️</span>;
    case 'Clicks':
      return <span title="Clicks">🖱️</span>;
    case 'Reach':
      return <span title="Reach">🌍</span>;
    case 'Spend':
      return <span title="Spend">💸</span>;
    case 'Budget':
      return <span title="Budget">💰</span>;
    case 'Frequency':
      return <span title="Frequency">🔁</span>;
    case 'Conversions':
      return <span title="Conversions">✅</span>;
    case 'WhatsApp Clicks':
      return <span title="WhatsApp Clicks">🟢</span>;
    default:
      return null;
  }
};

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, insights, simpleMode = false }) => {
  // Always convert possible string values to numbers
  const ctr = Number(campaign.ctr ?? insights?.ctr) || 0;
  const cpc = Number(campaign.cpc) || 0;
  const cpc_link = Number(campaign.cpc_link) || 0;
  const cpc_whatsapp = Number(campaign.cpc_whatsapp) || 0;
  const cpm = Number(campaign.cpm ?? insights?.cpm) || 0;
  const impressions = Number(campaign.impressions ?? insights?.impressions) || 0;
  const clicks = Number(campaign.clicks ?? insights?.clicks) || 0;
  const reach = Number(campaign.reach ?? insights?.reach) || 0;
  const frequency = Number(campaign.frequency ?? insights?.frequency) || 0;
  const conversions = Number(campaign.conversions) || 0;
  // Spend and budget
  const spent = Number(campaign.spend ?? insights?.spend) || (insights ? Number(insights.spend) || 25 : 25);
  let dailyBudget = 'No data';
  if (typeof campaign.daily_budget === 'number' && campaign.daily_budget > 0) {
    dailyBudget = `$${(campaign.daily_budget / 100).toLocaleString()}`;
  } else if (typeof campaign.lifetime_budget === 'number' && campaign.lifetime_budget > 0) {
    dailyBudget = `$${(campaign.lifetime_budget / 100).toLocaleString()} (lifetime)`;
  }
  // WhatsApp Clicks: extract from insights.actions if available
  let whatsappClicks = 0;
  if (insights && Array.isArray(insights.actions)) {
    const wa = insights.actions.find((a: any) => a.action_type === 'click_to_whatsapp');
    if (wa && wa.value) whatsappClicks = Number(wa.value);
  }
  // Extract new CPC and click metrics
  const link_clicks = Number(campaign.link_clicks) || 0;
  const whatsapp_clicks = Number(campaign.whatsapp_clicks) || 0;

  // Check if account has payment issues
  const hasPaymentIssue = campaign.facebook_account_id && 
    campaign.account_name && 
    campaign.payment_status === 'unsettled';

  const face = getPerformanceFace(ctr, cpc);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 flex flex-col justify-between h-full ${
      hasPaymentIssue ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`}>
      <div>
        {/* Payment Issue Alert */}
        {hasPaymentIssue && (
          <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium text-red-700">Account Payment Issue</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 truncate" title={campaign.name}>
            {campaign.name || 'Zimbabwe Business Campaign'}
          </h2>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(campaign.status)}`}>
            {campaign.status || 'ACTIVE'}
          </span>
        </div>
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">{face}</span>
          <span className="text-xs text-gray-500">
            {ctr === 0 && cpc === 0 ? 'No performance data' :
              face === '😊' ? 'Great performance' :
              face === '😐' ? 'Average performance' :
              face === '😟' ? 'Needs improvement' : 'No data'}
          </span>
          {(campaign.insights_loaded === false || (clicks === 0 && conversions === 0)) && (
            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
              No Data
            </span>
          )}
        </div>
        {simpleMode ? (
          <div className="text-sm mb-4">
            <div className="mb-2"><span className="font-medium">Summary:</span> {ctr === 0 && cpc === 0 ? 'No performance data' :
              face === '😊' ? 'This ad is doing well.' :
              face === '😐' ? 'Performance is average.' :
              face === '😟' ? 'Try a new image or improve your ad.' : 'No data'}</div>
            <div className="mb-2"><span className="font-medium">Key Metrics:</span> CTR: {typeof ctr === 'number' && !isNaN(ctr) ? `${ctr.toFixed(2)}%` : 'No data'}, CPC: {typeof cpc === 'number' && !isNaN(cpc) && cpc > 0 ? `$${cpc.toFixed(2)}` : 'No data'}, Impressions: {impressions ? impressions.toLocaleString() : 'No data'}, Clicks: {clicks ? clicks.toLocaleString() : 'No data'}, Spend: {spent}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
            <div className="flex items-center space-x-1">
              {metricIcon('CTR')}<span className="text-gray-500">CTR</span>
            </div>
            <div className="font-medium">{typeof ctr === 'number' && !isNaN(ctr) ? `${ctr.toFixed(2)}%` : 'No data'}</div>
            {/* Default Facebook CPC */}
            <div className="flex items-center space-x-1">
              {metricIcon('CPC')}<span className="text-gray-500">CPC (All Clicks)</span>
            </div>
            <div className="font-medium">{typeof cpc === 'number' && !isNaN(cpc) && cpc > 0 ? `$${cpc.toFixed(2)}` : 'No data'}</div>
            {/* Link Click CPC */}
            <div className="flex items-center space-x-1">
              {metricIcon('CPC')}<span className="text-gray-500">CPC (Link Click)</span>
            </div>
            <div className="font-medium">{typeof cpc_link === 'number' && !isNaN(cpc_link) && cpc_link > 0 ? `$${cpc_link.toFixed(2)}` : 'No data'}</div>
            {/* WhatsApp Click CPC */}
            <div className="flex items-center space-x-1">
              {metricIcon('CPC')}<span className="text-gray-500">CPC (WhatsApp)</span>
            </div>
            <div className="font-medium">{typeof cpc_whatsapp === 'number' && !isNaN(cpc_whatsapp) && cpc_whatsapp > 0 ? `$${cpc_whatsapp.toFixed(2)}` : 'No data'}</div>
            <div className="flex items-center space-x-1">
              {metricIcon('CPM')}<span className="text-gray-500">CPM</span>
            </div>
            <div className="font-medium">{typeof cpm === 'number' && !isNaN(cpm) ? `$${cpm.toFixed(2)}` : 'No data'}</div>
            <div className="flex items-center space-x-1">
              {metricIcon('Impressions')}<span className="text-gray-500">Impressions</span>
            </div>
            <div className="font-medium">{impressions ? impressions.toLocaleString() : 'No data'}</div>
            <div className="flex items-center space-x-1">
              {metricIcon('Clicks')}<span className="text-gray-500">Clicks</span>
            </div>
            <div className="font-medium">{clicks ? clicks.toLocaleString() : 'No data'}</div>
            <div className="flex items-center space-x-1">
              {metricIcon('Reach')}<span className="text-gray-500">Reach</span>
            </div>
            <div className="font-medium">{reach ? reach.toLocaleString() : 'No data'}</div>
            <div className="flex items-center space-x-1">
              {metricIcon('Spend')}<span className="text-gray-500">Spend</span>
            </div>
            <div className="font-medium">{spent}</div>
            <div className="flex items-center space-x-1">
              {metricIcon('Budget')}<span className="text-gray-500">Budget</span>
            </div>
            <div className="font-medium">{dailyBudget}</div>
            <div className="flex items-center space-x-1">
              {metricIcon('Frequency')}<span className="text-gray-500">Frequency</span>
            </div>
            <div className="font-medium">{typeof frequency === 'number' && !isNaN(frequency) ? frequency.toFixed(2) : 'No data'}</div>
            <div className="flex items-center space-x-1">
              {metricIcon('Conversions')}<span className="text-gray-500">Conversions</span>
            </div>
            <div className="font-medium">{conversions ? conversions.toLocaleString() : 'No data'}</div>
            {/* Link Clicks */}
            <div className="flex items-center space-x-1">
              {metricIcon('Clicks')}<span className="text-gray-500">Link Clicks</span>
            </div>
            <div className="font-medium">{link_clicks ? link_clicks.toLocaleString() : 'No data'}</div>
            {/* WhatsApp Clicks */}
            <div className="flex items-center space-x-1">
              {metricIcon('WhatsApp Clicks')}<span className="text-gray-500">WhatsApp Clicks</span>
            </div>
            <div className="font-medium">{whatsapp_clicks ? whatsapp_clicks.toLocaleString() : 'No data'}</div>
          </div>
        )}
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        Campaign ID: {campaign.id}
      </div>
    </div>
  );
};

export default CampaignCard; 