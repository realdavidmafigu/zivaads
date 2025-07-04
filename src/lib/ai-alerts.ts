import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { createFacebookClient } from './facebook';
import { OPENAI_API_KEY } from '@/config/openai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export interface PerformanceReport {
  content: string;
  summary: string;
  recommendations: string[];
  campaignCount: number;
  totalSpend: number;
  shouldSendAlert: boolean;
  reportType: 'morning' | 'afternoon' | 'evening';
}

export async function generateAIPerformanceReport(
  userId: string, 
  reportType: 'morning' | 'afternoon' | 'evening'
): Promise<PerformanceReport | null> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Get user's campaigns with recent data
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('spend', { ascending: false });

    console.log(`AI Reports: Found ${campaigns?.length || 0} campaigns in Supabase for user ${userId}`);
    console.log('AI Reports: Campaigns data:', campaigns);

    if (error || !campaigns || campaigns.length === 0) {
      console.log(`No campaign data for user ${userId}`);
      return null;
    }

    // Filter to only campaigns with meaningful data (remove the 24-hour restriction)
    const activeCampaigns = campaigns.filter(campaign => 
      campaign.spend > 0 || campaign.impressions > 0 || campaign.clicks > 0
    );

    console.log(`AI Reports: ${activeCampaigns.length} campaigns have meaningful data`);

    if (activeCampaigns.length === 0) {
      console.log(`No active campaigns with data for user ${userId}`);
      return null;
    }

    // Calculate summary statistics
    const totalSpend = activeCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
    const totalImpressions = activeCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    const totalClicks = activeCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

    // Prepare campaign data for AI analysis
    const campaignData = activeCampaigns.map(campaign => ({
      name: campaign.name,
      status: campaign.status,
      spend: campaign.spend || 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      ctr: campaign.ctr || 0,
      cpc: campaign.cpc || 0,
      cpm: campaign.cpm || 0,
      reach: campaign.reach || 0,
      frequency: campaign.frequency || 0,
      daily_budget: campaign.daily_budget,
      objective: campaign.objective,
    }));

    // Generate AI report based on time of day
    const report = await generateAIReport(campaignData, reportType, {
      totalSpend,
      totalImpressions,
      totalClicks,
      avgCTR,
      avgCPC,
    });

    return {
      content: report.content,
      summary: report.summary,
      recommendations: report.recommendations,
      campaignCount: activeCampaigns.length,
      totalSpend,
      shouldSendAlert: report.shouldSendAlert,
      reportType,
    };

  } catch (error) {
    console.error('Error generating AI performance report:', error);
    return null;
  }
}

async function generateAIReport(
  campaigns: any[], 
  reportType: 'morning' | 'afternoon' | 'evening',
  stats: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    avgCTR: number;
    avgCPC: number;
  }
) {
  const timeContext = {
    morning: "This is your morning report to help you start your day with insights about your ad performance.",
    afternoon: "This is your afternoon update to check how your ads are performing during peak hours.",
    evening: "This is your evening summary to review today's ad performance and plan for tomorrow."
  };

  const prompt = `You are a helpful advertising expert analyzing Facebook ad campaign performance. 

${timeContext[reportType]}

Campaign Data:
${campaigns.map(c => `
- ${c.name} (${c.status}):
  * Spend: $${c.spend.toFixed(2)}
  * Impressions: ${c.impressions.toLocaleString()}
  * Clicks: ${c.clicks.toLocaleString()}
  * CTR: ${c.ctr.toFixed(2)}%
  * CPC: $${c.cpc.toFixed(2)}
  * CPM: $${c.cpm.toFixed(2)}
  * Daily Budget: ${c.daily_budget ? '$' + c.daily_budget : 'Not set'}
`).join('')}

Overall Performance:
- Total Spend: $${stats.totalSpend.toFixed(2)}
- Total Impressions: ${stats.totalImpressions.toLocaleString()}
- Total Clicks: ${stats.totalClicks.toLocaleString()}
- Average CTR: ${stats.avgCTR.toFixed(2)}%
- Average CPC: $${stats.avgCPC.toFixed(2)}

Please provide a ${reportType} performance report with:

1. A brief summary (2-3 sentences) of overall performance
2. Key insights about what's working well
3. Areas that need attention
4. 2-3 specific, actionable recommendations
5. Whether this report should trigger an alert (true/false)

Use simple, clear language. Avoid technical jargon. Focus on business impact and actionable insights.

Format your response as JSON:
{
  "summary": "brief summary here",
  "content": "detailed analysis here",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "shouldSendAlert": true/false
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful advertising expert. Provide clear, actionable insights without technical jargon."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(response);
      return {
        content: parsed.content || 'No detailed analysis available',
        summary: parsed.summary || 'Performance report generated',
        recommendations: parsed.recommendations || ['Review campaign performance regularly'],
        shouldSendAlert: parsed.shouldSendAlert || false,
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        content: response,
        summary: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} performance report generated`,
        recommendations: ['Review campaign performance', 'Check budget utilization', 'Monitor key metrics'],
        shouldSendAlert: false,
      };
    }

  } catch (error) {
    console.error('Error calling OpenAI:', error);
    
    // Fallback response
    return {
      content: `Your ${reportType} ad performance report:\n\nTotal spend: $${stats.totalSpend.toFixed(2)}\nTotal clicks: ${stats.totalClicks.toLocaleString()}\nAverage CTR: ${stats.avgCTR.toFixed(2)}%\n\nYour campaigns are running and collecting data.`,
      summary: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} performance report - ${stats.totalSpend > 0 ? 'Active campaigns with spend' : 'Campaigns monitoring'}`,
      recommendations: [
        'Monitor your campaign performance regularly',
        'Check if your ads are reaching your target audience',
        'Review your budget allocation'
      ],
      shouldSendAlert: stats.totalSpend > 10, // Only alert if significant spend
    };
  }
}

// Get recent AI performance reports for a user
export async function getRecentAIReports(userId: string, limit: number = 10) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase
      .from('ai_performance_reports')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching AI reports:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting recent AI reports:', error);
    return [];
  }
} 