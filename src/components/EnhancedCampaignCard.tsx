import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FacebookCampaign, FacebookInsights } from '@/types';

interface EnhancedCampaignCardProps {
  campaign: FacebookCampaign;
  insights?: FacebookInsights;
  simpleMode?: boolean;
}

interface AIInsight {
  performance: string;
  recommendation: string;
  action: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Performance ribbon calculation
const getPerformanceRibbon = (ctr: number, cpc: number) => {
  if (ctr > 2 && cpc < 0.5) return { emoji: '🚀', text: 'Excellent Performance', color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' };
  if (ctr > 1.5 && cpc < 1) return { emoji: '📈', text: 'Good Performance', color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' };
  if (ctr > 1 && cpc < 2) return { emoji: '⚠️', text: 'Needs Attention', color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' };
  return { emoji: '🔴', text: 'Poor Performance', color: 'bg-gradient-to-r from-red-500 to-pink-500 text-white' };
};

// Health score calculation
const calculateHealthScore = (ctr: number, cpc: number, status: string): number => {
  let score = 50; // Base score
  
  // CTR scoring
  if (ctr > 2) score += 25;
  else if (ctr > 1.5) score += 15;
  else if (ctr > 1) score += 5;
  else if (ctr < 0.5) score -= 20;
  
  // CPC scoring
  if (cpc < 0.5) score += 20;
  else if (cpc < 1) score += 10;
  else if (cpc > 2) score -= 15;
  
  // Status scoring
  if (status === 'PAUSED') score -= 10;
  else if (status === 'ACTIVE') score += 5;
  
  return Math.max(0, Math.min(100, score));
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
const getCampaignDuration = (startTime: string) => {
  if (!startTime) return 'Unknown duration';
  const start = new Date(startTime);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Started today';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  return `${Math.floor(diffDays / 30)} months`;
};

// Recommended action based on performance
const getRecommendedAction = (ctr: number, cpc: number, status: string, healthScore: number) => {
  if (status === 'PAUSED' && healthScore > 60) {
    return { action: 'Reactivate', icon: '✅', color: 'bg-green-100 text-green-700' };
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

const EnhancedCampaignCard: React.FC<EnhancedCampaignCardProps> = ({ campaign, insights, simpleMode = false }) => {
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
  
  // AI Insights state
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Calculate derived values
  const performanceRibbon = getPerformanceRibbon(ctr, cpc);
  const campaignType = getCampaignType(campaign.objective || '');
  const duration = getCampaignDuration(campaign.start_time || '');
  const healthScore = calculateHealthScore(ctr, cpc, campaign.status);
  const recommendedAction = getRecommendedAction(ctr, cpc, campaign.status, healthScore);
  
  // Check if account has payment issues
  const hasPaymentIssue = campaign.facebook_account_id && 
    campaign.account_name && 
    campaign.payment_status === 'unsettled';

  // Fetch AI insights
  const fetchAIInsights = async () => {
    if (simpleMode || aiLoading || aiInsight) return;
    
    setAiLoading(true);
    setAiError(null);
    
    try {
      const campaignData = {
        name: campaign.name || 'Unknown Campaign',
        status: campaign.status || 'UNKNOWN',
        objective: campaign.objective || 'UNKNOWN',
        spend: spent,
        clicks: clicks,
        impressions: impressions,
        reach: reach,
        frequency: frequency,
        ctr: ctr,
        cpc: cpc,
        cpm: cpm,
        daily_budget: Number(campaign.daily_budget) || 0
      };

      const response = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: {
            singleCampaign: true,
            campaignData: campaignData
          },
          campaigns: [campaignData]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.insight || '';
        
        // Parse AI response to extract structured insights
        const parsedInsight = parseAIResponse(aiResponse, campaignData);
        setAiInsight(parsedInsight);
      } else {
        throw new Error('Failed to fetch AI insights');
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setAiError('AI insights unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  // Parse AI response into structured format
  const parseAIResponse = (aiResponse: string, campaignData: any): AIInsight => {
    const response = aiResponse.toLowerCase();
    
    // Determine sentiment based on keywords
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (response.includes('excellent') || response.includes('great') || response.includes('good') || response.includes('well') || response.includes('strong')) {
      sentiment = 'positive';
    } else if (response.includes('problem') || response.includes('issue') || response.includes('low') || response.includes('poor') || response.includes('needs improvement')) {
      sentiment = 'negative';
    }
    
    // Parse structured response format
    let performance = 'Campaign is running';
    let recommendation = 'Monitor performance regularly';
    let action = 'Continue optimizing';
    
    // Try to extract from structured format
    const performanceMatch = aiResponse.match(/PERFORMANCE:\s*(.+?)(?=\n|RECOMMENDATION:|$)/i);
    const recommendationMatch = aiResponse.match(/RECOMMENDATION:\s*(.+?)(?=\n|ACTION:|$)/i);
    const actionMatch = aiResponse.match(/ACTION:\s*(.+?)(?=\n|$)/i);
    
    // Fallback: extract sentences if structured format fails
    const sentences = aiResponse.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (performanceMatch) {
      performance = performanceMatch[1].trim();
    } else if (sentences.length > 0) {
      performance = sentences[0].trim();
    }
    
    if (recommendationMatch) {
      recommendation = recommendationMatch[1].trim();
    } else if (sentences.length > 1) {
      recommendation = sentences[1].trim();
    }
    
    if (actionMatch) {
      action = actionMatch[1].trim();
    } else if (sentences.length > 2) {
      action = sentences[2].trim();
    }
    
    return {
      performance: performance,
      recommendation: recommendation,
      action: action,
      sentiment
    };
  };

  // Fetch AI insights when component mounts (only once, and only for active campaigns)
  useEffect(() => {
    if (!simpleMode && !aiInsight && !aiLoading && campaign.status !== 'PAUSED') {
      fetchAIInsights();
    }
  }, [simpleMode, aiInsight, aiLoading, campaign.status]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md ${
      hasPaymentIssue ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`}>
      {/* Performance Ribbon */}
      <div className={`px-3 py-2 ${performanceRibbon.color} flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <span className="text-base">{performanceRibbon.emoji}</span>
          <span className="font-medium text-xs sm:text-sm">{performanceRibbon.text}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs">Health:</span>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-xs ${i < Math.floor(healthScore / 20) ? 'text-yellow-300' : 'text-gray-300'}`}>
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Payment Issue Alert */}
        {hasPaymentIssue && (
          <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium text-red-700">Payment Issue</span>
            </div>
          </div>
        )}

        {/* Campaign Header */}
        <div className="mb-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900 truncate pr-2 flex-1" title={campaign.name}>
              {campaign.name || 'Campaign'}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
              campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 
              'bg-gray-100 text-gray-700'
            }`}>
              {campaign.status || 'ACTIVE'}
            </span>
          </div>
          
          {/* Campaign Type & Duration */}
          <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
            <span className="flex items-center space-x-1">
              <span>{campaignType.icon}</span>
              <span>{campaignType.label}</span>
            </span>
            <span>•</span>
            <span>{duration}</span>
          </div>
        </div>

        {/* Key Metrics - Mobile Responsive Grid */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">📊 Key Metrics</h4>
          
          {/* Primary Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">CTR</div>
              <div className="text-lg font-bold text-blue-600">
                {ctr > 0 ? `${ctr.toFixed(2)}%` : 'N/A'}
              </div>
            </div>
            
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">CPC</div>
              <div className="text-lg font-bold text-green-600">
                {cpc > 0 ? `$${cpc.toFixed(2)}` : 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Secondary Metrics */}
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="text-center p-1">
              <div className="text-gray-600">Spend</div>
              <div className="font-semibold">{spent ? `$${spent.toFixed(0)}` : 'N/A'}</div>
            </div>
            <div className="text-center p-1">
              <div className="text-gray-600">Clicks</div>
              <div className="font-semibold">{clicks ? clicks.toLocaleString() : 'N/A'}</div>
            </div>
            <div className="text-center p-1">
              <div className="text-gray-600">Reach</div>
              <div className="font-semibold">{reach ? reach.toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Campaign Status Summary - Shows different content based on campaign status */}
        <div className="mb-4">
          {campaign.status === 'PAUSED' ? (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-1">⏸️</span>
                Campaign Status
              </h4>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-500 text-sm">⏸️</span>
                  <div className="text-xs">
                    <div className="font-medium text-yellow-800 mb-1">This ad is paused</div>
                    {spent > 0 && clicks > 0 ? (
                      <div className="text-yellow-700">
                        When active, it was performing with {ctr > 0 ? `${ctr.toFixed(2)}%` : 'N/A'} click rate and ${cpc > 0 ? cpc.toFixed(2) : 'N/A'} cost per click.
                      </div>
                    ) : (
                      <div className="text-yellow-700">
                        No performance data available while paused.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-1">🤖</span>
                AI Review
                {aiLoading && (
                  <span className="ml-1 text-xs text-blue-500 animate-pulse">Loading...</span>
                )}
              </h4>
              
              {aiError ? (
                <div className="space-y-1 text-xs">
                  <div className="flex items-start space-x-1">
                    <span className="text-gray-500">⚠</span>
                    <span className="text-gray-600">AI review temporarily unavailable</span>
                  </div>
                  {/* Fallback to basic insights */}
                  {ctr > 2 ? (
                    <div className="flex items-start space-x-1">
                      <span className="text-green-500">✓</span>
                      <span>Excellent CTR - People love your ad</span>
                    </div>
                  ) : ctr > 1 ? (
                    <div className="flex items-start space-x-1">
                      <span className="text-yellow-500">⚠</span>
                      <span>Good CTR - Test new creatives</span>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-1">
                      <span className="text-red-500">✗</span>
                      <span>Low CTR - Try new image</span>
                    </div>
                  )}
                </div>
              ) : aiInsight ? (
                <div className="space-y-2 text-xs">
                  <div className={`p-2 rounded-lg ${
                    aiInsight.sentiment === 'positive' ? 'bg-green-50 border border-green-200' :
                    aiInsight.sentiment === 'negative' ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-start space-x-1 mb-1">
                      <span className={`${
                        aiInsight.sentiment === 'positive' ? 'text-green-500' :
                        aiInsight.sentiment === 'negative' ? 'text-red-500' :
                        'text-blue-500'
                      }`}>
                        {aiInsight.sentiment === 'positive' ? '✓' : 
                         aiInsight.sentiment === 'negative' ? '✗' : '💡'}
                      </span>
                      <span className={`font-medium ${
                        aiInsight.sentiment === 'positive' ? 'text-green-700' :
                        aiInsight.sentiment === 'negative' ? 'text-red-700' :
                        'text-blue-700'
                      }`}>
                        {aiInsight.performance}
                      </span>
                    </div>
                    <div className="text-gray-600 ml-4">
                      {aiInsight.recommendation}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-1">
                    <span className="text-purple-500">🎯</span>
                    <span className="text-gray-700">{aiInsight.action}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  <div className="flex items-start space-x-1">
                    <span className="text-gray-400">⏳</span>
                    <span className="text-gray-500">Analyzing campaign performance...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Link 
            href={`/dashboard/campaigns/${campaign.id}`}
            className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            🔍 Details
          </Link>
          <button 
            onClick={() => {
              const campaignName = encodeURIComponent(campaign.name || 'Unknown Campaign');
              const message = encodeURIComponent(`Send me insights for Campaign: ${campaign.name || 'Unknown Campaign'}`);
              const whatsappUrl = `https://wa.me/263771555468?text=${message}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-1"
          >
            <span>📲</span>
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCampaignCard;