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
  accountId?: string,
  supabaseClient?: any
): Promise<DailyAlert | null> {
  try {
    console.log(`🚀 Starting AI daily alert generation for user: ${userId}, alertType: ${alertType}, accountId: ${accountId}`);
    
    const supabase = supabaseClient || createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // Fetch the user's Facebook account and access token
    console.log(`🔍 Fetching Facebook accounts for user: ${userId}`);
    
    // First, let's check if the user exists and get their info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log(`👤 Current user:`, {
      userId: user?.id,
      email: user?.email,
      userError: userError?.message || 'none'
    });
    
    // Check if the passed userId matches the current user
    if (user?.id !== userId) {
      console.log(`⚠️ User ID mismatch: passed=${userId}, current=${user?.id}`);
    }
    
    // Try querying without is_active filter first
    const { data: allFbAccounts, error: allFbError } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', userId);
    
    console.log(`📊 All Facebook accounts (including inactive):`, {
      count: allFbAccounts?.length || 0,
      error: allFbError?.message || 'none',
      accounts: allFbAccounts?.map((acc: any) => ({ 
        id: acc.facebook_account_id, 
        name: acc.account_name, 
        is_active: acc.is_active 
      })) || []
    });
    
    const { data: fbAccounts, error: fbError } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    console.log(`📊 Facebook accounts found:`, {
      count: fbAccounts?.length || 0,
      error: fbError?.message || 'none',
      accounts: fbAccounts?.map((acc: any) => ({ id: acc.facebook_account_id, name: acc.account_name })) || []
    });
    
    if (fbError || !fbAccounts || fbAccounts.length === 0) {
      console.log(`❌ No Facebook accounts found - returning fallback message`);
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
    console.log(`🔍 Selecting account - requested accountId: ${accountId}`);
    const account = accountId
      ? fbAccounts.find((acc: any) => acc.facebook_account_id === accountId)
      : fbAccounts[0];
    
    console.log(`📊 Selected account:`, {
      found: !!account,
      accountId: account?.facebook_account_id,
      accountName: account?.account_name,
      hasAccessToken: !!account?.access_token
    });
    
    if (!account) {
      console.log(`❌ No matching account found - returning fallback message`);
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
    console.log(`🔧 Creating Facebook client for account: ${account.facebook_account_id}`);
    const facebookClient = createFacebookClient(account.access_token);
    
    // Fetch campaigns for the account
    console.log(`📊 Fetching campaigns for account: ${account.facebook_account_id}`);
    let campaigns: any[] = [];
    let lastError = null;
    const accountIdFormats = [
      account.facebook_account_id,
      account.facebook_account_id.startsWith('act_') ? account.facebook_account_id : `act_${account.facebook_account_id}`,
      account.facebook_account_id.replace('act_', ''),
      `act_${account.facebook_account_id.replace('act_', '')}`
    ];
    
    console.log(`🔍 Trying account ID formats:`, accountIdFormats);
    
    for (const accId of accountIdFormats) {
      try {
        console.log(`📊 Attempting to fetch campaigns with account ID: ${accId}`);
        campaigns = await facebookClient.getCampaigns(accId);
        console.log(`✅ Campaigns fetched with ${accId}:`, campaigns.length);
        if (campaigns.length > 0) break;
      } catch (error) {
        console.log(`❌ Failed to fetch campaigns with ${accId}:`, error instanceof Error ? error.message : 'Unknown error');
        lastError = error;
        continue;
      }
    }
    
    console.log(`📊 Final campaign count: ${campaigns.length}`);
    if (!campaigns || campaigns.length === 0) {
      console.log(`❌ No campaigns found - returning fallback message`);
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
    console.log(`🔍 Enriching ${campaigns.length} campaigns with insights...`);
    const enrichedCampaigns = await Promise.all(
      campaigns.map(async (campaign) => {
        let insights = null;
        try {
          console.log(`📊 Fetching insights for campaign: ${campaign.id} - ${campaign.name}`);
          insights = await facebookClient.getCampaignInsights(campaign.id);
          if (insights) {
            console.log(`✅ Insights loaded for ${campaign.name}:`, {
              impressions: insights.impressions,
              clicks: insights.clicks,
              spend: insights.spend,
              ctr: insights.ctr,
              cpc: insights.cpc
            });
          } else {
            console.log(`❌ No insights data for ${campaign.name}`);
          }
        } catch (error) {
          console.error(`❌ Error fetching insights for ${campaign.name}:`, error instanceof Error ? error.message : 'Unknown error');
          // fallback to zeroed insights
        }
        if (!insights) {
          console.log(`📊 Providing fallback data for campaign ${campaign.name}`);
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
        
        const enrichedCampaign = {
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
        
        console.log(`📈 Enriched campaign ${campaign.name}:`, {
          spend: enrichedCampaign.spend,
          impressions: enrichedCampaign.impressions,
          clicks: enrichedCampaign.clicks,
          status: enrichedCampaign.status
        });
        
        return enrichedCampaign;
      })
    );
    // Filter to campaigns that exist and are not deleted
    console.log(`🔍 Filtering campaigns...`);
    console.log(`📊 Total campaigns before filtering: ${enrichedCampaigns.length}`);
    
    enrichedCampaigns.forEach((campaign, index) => {
      console.log(`📈 Campaign ${index + 1} - ${campaign.name}:`, {
        spend: campaign.spend,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        status: campaign.status,
        hasData: campaign.spend > 0 || campaign.impressions > 0 || campaign.clicks > 0
      });
    });
    
    // Include campaigns that exist, even if they don't have recent data
    // This is more lenient than requiring spend/impressions/clicks > 0
    const activeCampaigns = enrichedCampaigns.filter(campaign => 
      campaign.status !== 'DELETED' && campaign.status !== 'ARCHIVED'
    );
    
    console.log(`✅ Active campaigns after filtering: ${activeCampaigns.length}`);
    
    if (activeCampaigns.length === 0) {
      console.log(`⚠️ No active campaigns found - returning fallback message`);
      return {
        content: `Good ${alertType}! No active campaigns found at the moment. Connect your Facebook account to start receiving AI-powered insights about your ad performance.`,
        summary: `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} update - No campaigns`,
        campaignCount: 0,
        totalSpend: 0,
        shouldSendAlert: true,
        alertType,
      };
    }
    
    // Check if campaigns have any performance data
    const campaignsWithData = activeCampaigns.filter(campaign => 
      campaign.spend > 0 || campaign.impressions > 0 || campaign.clicks > 0
    );
    
    if (campaignsWithData.length === 0) {
      console.log(`⚠️ Campaigns exist but no recent performance data - returning data message`);
      return {
        content: `Good ${alertType}! You have ${activeCampaigns.length} campaign(s) in your account, but no recent performance data is available. Your campaigns may be paused or waiting for activity. Check your Facebook Ads Manager for the latest status.`,
        summary: `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} update - ${activeCampaigns.length} campaigns, no recent data`,
        campaignCount: activeCampaigns.length,
        totalSpend: 0,
        shouldSendAlert: true,
        alertType,
      };
    }
    // Calculate summary statistics using campaigns with data
    const totalSpend = campaignsWithData.reduce((sum, c) => sum + (c.spend || 0), 0);
    const totalImpressions = campaignsWithData.reduce((sum, c) => sum + (c.impressions || 0), 0);
    const totalClicks = campaignsWithData.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
    // Prepare campaign data for AI analysis
    const campaignData = campaignsWithData.map(campaign => ({
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
      campaignCount: campaignsWithData.length,
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