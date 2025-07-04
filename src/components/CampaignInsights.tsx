'use client';

import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface CampaignInsight {
  id: string;
  campaign_id: string;
  insight_type: 'performance' | 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

interface CampaignInsightsProps {
  campaign: any;
  className?: string;
}

export default function CampaignInsights({ campaign, className = '' }: CampaignInsightsProps) {
  const [insights, setInsights] = useState<CampaignInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [lastCampaignId, setLastCampaignId] = useState<string>('');

  useEffect(() => {
    // Only generate insights if campaign ID has changed
    if (campaign.id !== lastCampaignId) {
      setLastCampaignId(campaign.id);
      generateAIInsights();
    }
  }, [campaign.id, lastCampaignId]);

  const generateAIInsights = async () => {
    setLoading(true);
    console.log('🔍 Generating AI insights for campaign:', campaign.name);
    
    try {
      // Prepare campaign data for AI analysis
      const campaignData = {
        name: campaign.name || 'Unknown Campaign',
        status: campaign.status || 'UNKNOWN',
        objective: campaign.objective || 'UNKNOWN',
        spend: Number(campaign.spend) || 0,
        clicks: Number(campaign.clicks) || 0,
        impressions: Number(campaign.impressions) || 0,
        reach: Number(campaign.reach) || 0,
        frequency: Number(campaign.frequency) || 0,
        ctr: Number(campaign.ctr) || 0,
        cpc: Number(campaign.cpc) || 0,
        cpm: Number(campaign.cpm) || 0,
        daily_budget: Number(campaign.daily_budget) || 0
      };

      console.log('📊 Campaign data prepared:', campaignData);

      // Add a small delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 100));

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

      console.log('🤖 AI API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.insight || '';
        console.log('✅ AI response received:', aiResponse.substring(0, 100) + '...');
        setAiInsight(aiResponse);
        
        // Parse AI response to create structured insights
        const parsedInsights = parseAIResponse(aiResponse, campaignData);
        console.log('📝 Parsed insights:', parsedInsights);
        setInsights(parsedInsights);
      } else {
        console.log('❌ AI API failed, using fallback');
        // Fallback to basic insights if AI fails
        const fallbackInsights = generateFallbackInsights(campaignData);
        setInsights(fallbackInsights);
        setAiInsight('Your campaign is running. Check the details below for performance insights.');
      }
    } catch (error) {
      console.error('❌ Error generating AI insights:', error);
      const fallbackInsights = generateFallbackInsights(campaign);
      setInsights(fallbackInsights);
      setAiInsight('Your campaign is running. Check the details below for performance insights.');
    }
    
    setLoading(false);
  };

  const parseAIResponse = (aiResponse: string, campaignData: any): CampaignInsight[] => {
    const insights: CampaignInsight[] = [];
    
    console.log('🔍 Parsing AI response for campaign:', campaignData.name);
    console.log('📊 Campaign data:', campaignData);
    
    // Analyze campaign performance data first
    const spend = Number(campaignData.spend) || 0;
    const clicks = Number(campaignData.clicks) || 0;
    const impressions = Number(campaignData.impressions) || 0;
    const ctr = Number(campaignData.ctr) || 0;
    const cpc = Number(campaignData.cpc) || 0;
    const status = campaignData.status;
    
    console.log('📈 Performance metrics:', { spend, clicks, impressions, ctr, cpc, status });
    
    // Check if campaign has no data
    if (impressions === 0 && clicks === 0 && spend === 0) {
      insights.push({
        id: 'no-data',
        campaign_id: campaignData.name,
        insight_type: 'warning',
        title: 'No Performance Data',
        description: 'This campaign has no performance data yet. It may be paused or not yet started.',
        recommendation: 'Activate the campaign and wait for data to accumulate before analyzing performance.',
        priority: 'medium'
      });
      console.log('📝 Created no-data insight');
      return insights;
    }
    
    // Check campaign status
    if (status === 'PAUSED') {
      insights.push({
        id: 'campaign-paused',
        campaign_id: campaignData.name,
        insight_type: 'warning',
        title: 'Campaign is Paused',
        description: 'This campaign is currently paused and not running.',
        recommendation: 'Consider activating the campaign if you want to continue advertising.',
        priority: 'high'
      });
      console.log('📝 Created paused campaign insight');
    }
    
    // Analyze CTR performance
    if (ctr > 0) {
      if (ctr >= 2.0) {
        insights.push({
          id: 'excellent-ctr',
          campaign_id: campaignData.name,
          insight_type: 'success',
          title: 'Excellent Click Rate',
          description: `Your click rate of ${ctr.toFixed(2)}% is very good! People are interested in your ad.`,
          recommendation: 'This is performing well. Consider increasing your budget to reach more people.',
          priority: 'low'
        });
        console.log('📝 Created excellent CTR insight');
      } else if (ctr >= 1.0) {
        insights.push({
          id: 'good-ctr',
          campaign_id: campaignData.name,
          insight_type: 'success',
          title: 'Good Click Rate',
          description: `Your click rate of ${ctr.toFixed(2)}% is performing well.`,
          recommendation: 'Try testing different ad images to improve engagement further.',
          priority: 'medium'
        });
        console.log('📝 Created good CTR insight');
      } else if (ctr < 0.5) {
        insights.push({
          id: 'low-ctr',
          campaign_id: campaignData.name,
          insight_type: 'warning',
          title: 'Low Click Rate',
          description: `Your click rate of ${ctr.toFixed(2)}% is below average. People are seeing your ad but not clicking.`,
          recommendation: 'Try making your ad more appealing with better images or clearer messaging.',
          priority: 'high'
        });
        console.log('📝 Created low CTR insight');
      }
    }
    
    // Analyze CPC performance
    if (cpc > 0) {
      if (cpc <= 0.5) {
        insights.push({
          id: 'excellent-cpc',
          campaign_id: campaignData.name,
          insight_type: 'success',
          title: 'Excellent Cost Per Click',
          description: `You're paying only $${cpc.toFixed(2)} per click, which is very efficient!`,
          recommendation: 'This is working great. Consider scaling up your budget to reach more people.',
          priority: 'low'
        });
        console.log('📝 Created excellent CPC insight');
      } else if (cpc <= 1.0) {
        insights.push({
          id: 'good-cpc',
          campaign_id: campaignData.name,
          insight_type: 'success',
          title: 'Good Cost Per Click',
          description: `You're paying $${cpc.toFixed(2)} per click, which is reasonable.`,
          recommendation: 'Your costs are good. Focus on improving your ad creative to get more clicks.',
          priority: 'medium'
        });
        console.log('📝 Created good CPC insight');
      } else if (cpc > 2.0) {
        insights.push({
          id: 'high-cpc',
          campaign_id: campaignData.name,
          insight_type: 'warning',
          title: 'High Cost Per Click',
          description: `You're paying $${cpc.toFixed(2)} per click, which might be too expensive.`,
          recommendation: 'Try improving your ad quality or testing different audiences to reduce costs.',
          priority: 'high'
        });
        console.log('📝 Created high CPC insight');
      }
    }
    
    // If no insights were created from performance data, create a general one based on AI response
    if (insights.length === 0) {
      console.log('⚠️ No performance-based insights created, using AI response');
      const sentences = aiResponse.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
      const firstSentence = sentences[0]?.trim() || aiResponse.substring(0, 100);
      
      // Determine insight type based on AI response content
      let insightType: 'performance' | 'opportunity' | 'warning' | 'success' = 'performance';
      let priority: 'high' | 'medium' | 'low' = 'medium';
      
      if (aiResponse.toLowerCase().includes('good') || aiResponse.toLowerCase().includes('well') || aiResponse.toLowerCase().includes('excellent')) {
        insightType = 'success';
        priority = 'low';
      } else if (aiResponse.toLowerCase().includes('problem') || aiResponse.toLowerCase().includes('issue') || aiResponse.toLowerCase().includes('concern')) {
        insightType = 'warning';
        priority = 'high';
      } else if (aiResponse.toLowerCase().includes('improve') || aiResponse.toLowerCase().includes('better') || aiResponse.toLowerCase().includes('optimize')) {
        insightType = 'opportunity';
        priority = 'medium';
      }
      
      insights.push({
        id: 'ai-general-insight',
        campaign_id: campaignData.name,
        insight_type: insightType,
        title: 'AI Analysis',
        description: firstSentence.length > 100 ? firstSentence.substring(0, 100) + '...' : firstSentence,
        recommendation: 'Monitor your campaign regularly and adjust based on performance.',
        priority: priority
      });
      console.log('📝 Created AI-based insight');
    }
    
    console.log('📝 Final parsed insights:', insights);
    return insights;
  };

  const generateFallbackInsights = (campaignData: any): CampaignInsight[] => {
    const insights: CampaignInsight[] = [];
    
    // Basic performance analysis as fallback
    const spend = Number(campaignData.spend) || 0;
    const clicks = Number(campaignData.clicks) || 0;
    const impressions = Number(campaignData.impressions) || 0;
    
    if (spend > 0 && clicks > 0) {
      const cpc = spend / clicks;
      if (cpc > 1.0) {
        insights.push({
          id: 'fallback-cpc-high',
          campaign_id: campaignData.name,
          insight_type: 'warning',
          title: 'High Cost Per Click',
          description: `You're paying $${cpc.toFixed(2)} for each click, which might be too expensive.`,
          recommendation: 'Try improving your ad quality or testing different audiences.',
          priority: 'high'
        });
      } else {
        insights.push({
          id: 'fallback-cpc-good',
          campaign_id: campaignData.name,
          insight_type: 'success',
          title: 'Good Cost Per Click',
          description: `You're paying $${cpc.toFixed(2)} per click, which is reasonable.`,
          recommendation: 'Your campaign is performing well. Consider increasing your budget.',
          priority: 'low'
        });
      }
    }
    
    if (impressions > 0 && clicks > 0) {
      const ctr = (clicks / impressions) * 100;
      if (ctr < 1.0) {
        insights.push({
          id: 'fallback-ctr-low',
          campaign_id: campaignData.name,
          insight_type: 'warning',
          title: 'Low Click Rate',
          description: `Only ${ctr.toFixed(1)}% of people who see your ad are clicking on it.`,
          recommendation: 'Try making your ad more appealing or testing different images.',
          priority: 'medium'
        });
      }
    }
    
    return insights;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'opportunity':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <LightBulbIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <SparklesIcon className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">AI Campaign Insights</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="h-6 w-6 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">AI Campaign Insights</h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          {insights.length} insights
        </span>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No insights available yet. The AI is analyzing your campaign data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.insight_type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                  <div className="flex items-center gap-2">
                    <LightBulbIcon className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium text-blue-900">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200">
            View Details
          </button>
          <button className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full hover:bg-green-200">
            Optimize Campaign
          </button>
          <button className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full hover:bg-purple-200">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
} 