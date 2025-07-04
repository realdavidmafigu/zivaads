import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { OPENAI_API_KEY } from '@/config/openai';
import OpenAI from 'openai';
import { createFacebookClient } from '@/lib/facebook';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export interface DailyAlert {
  content: string;
  summary: string;
  campaignCount: number;
  totalSpend: number;
  shouldSendAlert: boolean;
  alertType: 'morning' | 'afternoon' | 'evening';
}

export async function generateAIDailyAlert(
  userId: string, 
  alertType: 'morning' | 'afternoon' | 'evening',
  accountId?: string
): Promise<DailyAlert | null> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // Fetch the user's Facebook account and access token
    const { data: fbAccounts, error: fbError } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (fbError || !fbAccounts || fbAccounts.length === 0) {
      return {
        content: `Good ${alertType}! No Facebook account connected. Connect your Facebook account to start receiving AI-powered insights about your ad performance.`,
        summary: `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} update - No Facebook account`,
        campaignCount: 0,
        totalSpend: 0,
        shouldSendAlert: true,
        alertType,
      };
    }
    // Find the selected account
    const account = accountId
      ? fbAccounts.find(acc => acc.facebook_account_id === accountId)
      : fbAccounts[0];
    if (!account) {
      return {
        content: `Good ${alertType}! No matching Facebook ad account found.`,
        summary: `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} update - No ad account`,
        campaignCount: 0,
        totalSpend: 0,
        shouldSendAlert: true,
        alertType,
      };
    }
    // Create Facebook client
    const facebookClient = createFacebookClient(account.access_token);
    // Fetch campaigns for the account
    let campaigns: any[] = [];
    let lastError = null;
    const accountIdFormats = [
      account.facebook_account_id,
      account.facebook_account_id.startsWith('act_') ? account.facebook_account_id : `act_${account.facebook_account_id}`,
      account.facebook_account_id.replace('act_', ''),
      `act_${account.facebook_account_id.replace('act_', '')}`
    ];
    for (const accId of accountIdFormats) {
      try {
        campaigns = await facebookClient.getCampaigns(accId);
        if (campaigns.length > 0) break;
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    if (!campaigns || campaigns.length === 0) {
      return {
        content: `Good ${alertType}! No campaigns found in your Facebook account.`,
        summary: `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} update - No campaigns`,
        campaignCount: 0,
        totalSpend: 0,
        shouldSendAlert: true,
        alertType,
      };
    }
    // Enrich campaigns with insights
    const enrichedCampaigns = await Promise.all(
      campaigns.map(async (campaign) => {
        let insights = null;
        try {
          insights = await facebookClient.getCampaignInsights(campaign.id);
        } catch (error) {
          // fallback to zeroed insights
        }
        if (!insights) {
          insights = {
            impressions: '0',
            clicks: '0',
            spend: '0',
            ctr: '0',
            cpc: '0',
            cpm: '0',
            reach: '0',
            frequency: '0'
          };
        }
        return {
          ...campaign,
          spend: Number(insights.spend) || 0,
          impressions: Number(insights.impressions) || 0,
          clicks: Number(insights.clicks) || 0,
          ctr: Number(insights.ctr) || 0,
          cpc: Number(insights.cpc) || 0,
          cpm: Number(insights.cpm) || 0,
          reach: Number(insights.reach) || 0,
          frequency: Number(insights.frequency) || 0,
        };
      })
    );
    // Filter to only campaigns with meaningful data
    const activeCampaigns = enrichedCampaigns.filter(campaign => 
      campaign.spend > 0 || campaign.impressions > 0 || campaign.clicks > 0
    );
    if (activeCampaigns.length === 0) {
      return {
        content: `Good ${alertType}! No active campaigns found at the moment. Connect your Facebook account to start receiving AI-powered insights about your ad performance.`,
        summary: `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} update - No campaigns`,
        campaignCount: 0,
        totalSpend: 0,
        shouldSendAlert: true,
        alertType,
      };
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
    // Generate AI alert based on time of day
    const alert = await generateAIAlert(campaignData, alertType, {
      totalSpend,
      totalImpressions,
      totalClicks,
      avgCTR,
      avgCPC,
    });
    return {
      content: alert.content,
      summary: alert.summary,
      campaignCount: activeCampaigns.length,
      totalSpend,
      shouldSendAlert: alert.shouldSendAlert,
      alertType,
    };
  } catch (error) {
    const fallbackMessages = {
      morning: "Good morning! We're having trouble accessing your campaign data right now. Please check your Facebook connection and try again later.",
      afternoon: "Afternoon update: There was an issue retrieving your campaign data. Your ads are likely still running - check your Facebook Ads Manager for details.",
      evening: "Evening summary: We couldn't access your campaign data at the moment. Your ads should still be active - review your Facebook Ads Manager for today's performance."
    };
    return {
      content: fallbackMessages[alertType],
      summary: `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} update - Data unavailable`,
      campaignCount: 0,
      totalSpend: 0,
      shouldSendAlert: true,
      alertType,
    };
  }
}

async function generateAIAlert(
  campaigns: any[], 
  alertType: 'morning' | 'afternoon' | 'evening',
  stats: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    avgCTR: number;
    avgCPC: number;
  }
) {
  const timeContext = {
    morning: "Good morning! Here's a quick update on how your ads are performing to start your day.",
    afternoon: "Afternoon check-in! Here's how your ads are doing during peak hours.",
    evening: "Evening wrap-up! Here's today's ad performance summary."
  };
  const prompt = `You are a helpful advertising expert creating a brief, jargon-free alert about Facebook ad performance.

${timeContext[alertType]}

Campaign Data:
${campaigns.map(c => `
- ${c.name} (${c.status}):
  * Spend: $${c.spend.toFixed(2)}
  * Impressions: ${c.impressions.toLocaleString()}
  * Clicks: ${c.clicks.toLocaleString()}
  * CTR: ${c.ctr.toFixed(2)}%
  * CPC: $${c.cpc.toFixed(2)}
`).join('')}

Overall Performance:
- Total Spend: $${stats.totalSpend.toFixed(2)}
- Total Impressions: ${stats.totalImpressions.toLocaleString()}
- Total Clicks: ${stats.totalClicks.toLocaleString()}
- Average CTR: ${stats.avgCTR.toFixed(2)}%
- Average CPC: $${stats.avgCPC.toFixed(2)}

Create a brief, friendly alert message (max 2-3 sentences) that:
1. Uses simple, non-technical language
2. Focuses on the most important insight
3. Is encouraging and actionable
4. Avoids jargon like "CTR", "CPC", "impressions" - use plain English
5. Mentions if there's something that needs attention

Also provide a very short summary (1 sentence) and whether this should trigger an alert notification.

Format your response as JSON:
{
  "content": "Your brief alert message here",
  "summary": "One sentence summary",
  "shouldSendAlert": true/false
}`;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful advertising expert. Create brief, friendly alerts using simple language without technical jargon."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }
    try {
      const parsed = JSON.parse(response);
      return {
        content: parsed.content || 'Your ads are running. Check your dashboard for details.',
        summary: parsed.summary || `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} performance update`,
        shouldSendAlert: parsed.shouldSendAlert || false,
      };
    } catch (parseError) {
      return {
        content: response,
        summary: `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} performance update`,
        shouldSendAlert: false,
      };
    }
  } catch (error) {
    const fallbackMessages = {
      morning: "Good morning! Your ads are running smoothly. Check your dashboard for the latest performance details.",
      afternoon: "Afternoon update: Your ads are performing well. Keep an eye on your dashboard for any changes.",
      evening: "Evening summary: Your ads had a good day. Review your dashboard for tomorrow's planning."
    };
    return {
      content: fallbackMessages[alertType],
      summary: `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} performance update`,
      shouldSendAlert: false,
    };
  }
} 