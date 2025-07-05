import { NextRequest, NextResponse } from 'next/server';
import { WHATSAPP_CONFIG } from '@/config/whatsapp';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/config/supabase';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// WhatsApp webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('🔗 WhatsApp webhook verification request:', { mode, token, challenge });

  // Verify the webhook
  if (mode === 'subscribe' && token === WHATSAPP_CONFIG.verifyToken) {
    console.log('✅ WhatsApp webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  console.log('❌ WhatsApp webhook verification failed');
  return new NextResponse('Forbidden', { status: 403 });
}

// Handle incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📱 Incoming WhatsApp message:', JSON.stringify(body, null, 2));

    // Handle webhook verification
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages) {
        for (const message of value.messages) {
          await handleIncomingMessage(message);
        }
      }

      return NextResponse.json({ status: 'ok' });
    }

    return NextResponse.json({ status: 'ignored' });
  } catch (error) {
    console.error('❌ Error processing WhatsApp webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleIncomingMessage(message: any) {
  const { from, text, timestamp } = message;
  const phoneNumber = from.replace('263', '+263'); // Format phone number
  const messageText = text?.body?.toLowerCase() || '';

  console.log(`📨 Processing message from ${phoneNumber}:`, messageText);

  try {
    // Store user interaction for 24-hour session
    await storeUserInteraction(phoneNumber, messageText, timestamp);

    // Parse the message and respond accordingly
    const response = await parseAndRespond(messageText, phoneNumber);
    
    // Send the response
    await sendWhatsAppMessage({
      messaging_product: 'whatsapp',
      to: phoneNumber.replace('+', ''),
      type: 'text',
      text: { body: response }
    });

  } catch (error) {
    console.error(`❌ Error handling message from ${phoneNumber}:`, error);
    
    // Send error message
    await sendWhatsAppMessage({
      messaging_product: 'whatsapp',
      to: phoneNumber.replace('+', ''),
      type: 'text',
      text: { 
        body: `Sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.` 
      }
    });
  }
}

async function storeUserInteraction(phoneNumber: string, messageText: string, timestamp: string) {
  try {
    // Check if user exists in subscribers table
    const { data: existingUser } = await supabase
      .from('whatsapp_subscribers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingUser) {
      // Update existing user's last message time
      await supabase
        .from('whatsapp_subscribers')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: existingUser.message_count + 1
        })
        .eq('phone_number', phoneNumber);
    } else {
      // Add new user
      await supabase
        .from('whatsapp_subscribers')
        .insert({
          phone_number: phoneNumber,
          first_message: messageText,
          subscribed_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          is_active: true,
          message_count: 1
        });
    }
  } catch (error) {
    console.error('Error storing user interaction:', error);
  }
}

async function parseAndRespond(messageText: string, phoneNumber: string): Promise<string> {
  // Handle different types of requests
  if (messageText.includes('help') || messageText.includes('menu')) {
    return getHelpMessage();
  }

  if (messageText.includes('insights') || messageText.includes('campaign')) {
    return await getCampaignInsights(messageText);
  }

  if (messageText.includes('spend') || messageText.includes('cost')) {
    return await getSpendSummary();
  }

  if (messageText.includes('performance') || messageText.includes('health')) {
    return await getPerformanceSummary();
  }

  if (messageText.includes('stop') || messageText.includes('unsubscribe')) {
    return await handleUnsubscribe(phoneNumber);
  }

  // Default welcome message for new users or unrecognized commands
  return getWelcomeMessage();
}

function getHelpMessage(): string {
  return `🎯 *ZivaAds WhatsApp Bot - Available Commands*

📊 *INSIGHTS* - Get AI insights for a specific campaign
💰 *SPEND* - View total spend across all campaigns  
📈 *PERFORMANCE* - Get overall performance health score
❓ *HELP* - Show this menu
🛑 *STOP* - Unsubscribe from messages

*Example:* Send "insights for Glow Hair Promo" to get AI analysis for that campaign.

Need help? Reply with any of these commands! 🌟`;
}

function getWelcomeMessage(): string {
  return `🎉 *Welcome to ZivaAds WhatsApp Bot!*

I'm your AI-powered Facebook Ads assistant. I can help you with:

📊 *Campaign Insights* - Get AI analysis for any campaign
💰 *Spend Tracking* - Monitor your advertising costs
📈 *Performance Health* - Overall campaign performance
🎯 *Optimization Tips* - AI-powered recommendations

*Try these commands:*
• "insights for [campaign name]"
• "spend summary"
• "performance health"
• "help" for full menu

Your 24-hour messaging session is now active! ⏰`;
}

async function getCampaignInsights(messageText: string): Promise<string> {
  try {
    // Extract campaign name from message
    const campaignMatch = messageText.match(/insights?\s+(?:for\s+)?(.+)/i);
    if (!campaignMatch) {
      return `Please specify which campaign you'd like insights for. 

*Example:* "insights for Glow Hair Promo"

Or send "spend" to see all your campaigns.`;
    }

    const campaignName = campaignMatch[1].trim();
    
    // Find the campaign in the database
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_metrics!inner(
          impressions,
          clicks,
          ctr,
          cpc,
          cpm,
          spend,
          reach,
          frequency,
          conversions,
          is_latest
        )
      `)
      .ilike('name', `%${campaignName}%`)
      .eq('campaign_metrics.is_latest', true)
      .limit(1);

    if (error || !campaigns || campaigns.length === 0) {
      return `❌ Campaign "${campaignName}" not found. 

Please check the campaign name and try again, or send "spend" to see all your campaigns.`;
    }

    const campaign = campaigns[0];
    const metrics = campaign.campaign_metrics?.[0] || campaign;

    // Generate AI insights
    const insights = await generateCampaignInsights(campaign, metrics);
    
    return formatCampaignInsights(campaign, metrics, insights);

  } catch (error) {
    console.error('Error getting campaign insights:', error);
    return `❌ Sorry, I couldn't get insights for that campaign right now. Please try again later.`;
  }
}

async function generateCampaignInsights(campaign: any, metrics: any): Promise<string> {
  try {
    // Prepare campaign data for AI analysis
    const campaignData = {
      name: campaign.name || 'Unknown Campaign',
      status: campaign.status || 'UNKNOWN',
      objective: campaign.objective || 'UNKNOWN',
      spend: Number(metrics.spend) || 0,
      clicks: Number(metrics.clicks) || 0,
      impressions: Number(metrics.impressions) || 0,
      reach: Number(metrics.reach) || 0,
      frequency: Number(metrics.frequency) || 0,
      ctr: Number(metrics.ctr) || 0,
      cpc: Number(metrics.cpc) || 0,
      cpm: Number(metrics.cpm) || 0,
      daily_budget: Number(campaign.daily_budget) || 0
    };

    // Call AI insights API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-explain`, {
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
      return data.insight || 'Campaign is running. Monitor performance regularly.';
    } else {
      // Fallback to basic insights
      return generateBasicInsights(campaignData);
    }

  } catch (error) {
    console.error('Error generating AI insights:', error);
    return generateBasicInsights(campaign);
  }
}

function generateBasicInsights(campaignData: any): string {
  const ctr = Number(campaignData.ctr) || 0;
  const cpc = Number(campaignData.cpc) || 0;
  const spend = Number(campaignData.spend) || 0;
  const clicks = Number(campaignData.clicks) || 0;

  let insights = [];

  if (ctr > 2.0) {
    insights.push("Excellent click rate! People love your ad.");
  } else if (ctr > 1.0) {
    insights.push("Good click rate. Consider testing new creatives.");
  } else if (ctr > 0) {
    insights.push("Low click rate. Try improving your ad image or copy.");
  }

  if (cpc < 0.5) {
    insights.push("Very efficient cost per click!");
  } else if (cpc < 1.0) {
    insights.push("Reasonable cost per click.");
  } else if (cpc > 0) {
    insights.push("High cost per click. Consider optimizing targeting.");
  }

  if (spend > 0 && clicks === 0) {
    insights.push("Spending money but no clicks. Review your ad quality.");
  }

  return insights.length > 0 ? insights.join(' ') : "Campaign is running. Monitor performance regularly.";
}

function formatCampaignInsights(campaign: any, metrics: any, aiInsight: string): string {
  const ctr = Number(metrics.ctr) || 0;
  const cpc = Number(metrics.cpc) || 0;
  const spend = Number(metrics.spend) || 0;
  const clicks = Number(metrics.clicks) || 0;
  const impressions = Number(metrics.impressions) || 0;

  return `🎯 *Campaign: ${campaign.name}*

📊 *Performance Metrics:*
• CTR: ${ctr > 0 ? `${ctr.toFixed(2)}%` : 'N/A'}
• CPC: ${cpc > 0 ? `$${cpc.toFixed(2)}` : 'N/A'}
• Spend: ${spend > 0 ? `$${spend.toFixed(2)}` : 'N/A'}
• Clicks: ${clicks > 0 ? clicks.toLocaleString() : 'N/A'}
• Impressions: ${impressions > 0 ? impressions.toLocaleString() : 'N/A'}

🤖 *AI Insight:*
${aiInsight}

💡 *Quick Actions:*
• Send "spend" for cost overview
• Send "performance" for health score
• Send "help" for more options

Status: ${campaign.status || 'ACTIVE'} 📈`;
}

async function getSpendSummary(): Promise<string> {
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_metrics!inner(
          spend,
          is_latest
        )
      `)
      .eq('campaign_metrics.is_latest', true);

    if (error || !campaigns) {
      return `❌ Couldn't fetch spend data. Please try again later.`;
    }

    const totalSpend = campaigns.reduce((sum, campaign) => {
      const spend = Number(campaign.campaign_metrics?.[0]?.spend) || 0;
      return sum + spend;
    }, 0);

    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
    const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED').length;

    return `💰 *Spend Summary*

📊 *Total Spend:* $${totalSpend.toFixed(2)}
📈 *Active Campaigns:* ${activeCampaigns}
⏸️ *Paused Campaigns:* ${pausedCampaigns}
📋 *Total Campaigns:* ${campaigns.length}

💡 *Top Spenders:*
${campaigns
  .sort((a, b) => {
    const spendA = Number(a.campaign_metrics?.[0]?.spend) || 0;
    const spendB = Number(b.campaign_metrics?.[0]?.spend) || 0;
    return spendB - spendA;
  })
  .slice(0, 3)
  .map(campaign => {
    const spend = Number(campaign.campaign_metrics?.[0]?.spend) || 0;
    return `• ${campaign.name}: $${spend.toFixed(2)}`;
  })
  .join('\n')}

Send "insights for [campaign name]" for detailed analysis! 🎯`;
  } catch (error) {
    console.error('Error getting spend summary:', error);
    return `❌ Couldn't fetch spend data. Please try again later.`;
  }
}

async function getPerformanceSummary(): Promise<string> {
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_metrics!inner(
          ctr,
          cpc,
          spend,
          clicks,
          impressions,
          is_latest
        )
      `)
      .eq('campaign_metrics.is_latest', true);

    if (error || !campaigns) {
      return `❌ Couldn't fetch performance data. Please try again later.`;
    }

    // Calculate overall health score
    let totalCTR = 0;
    let totalCPC = 0;
    let totalSpend = 0;
    let totalClicks = 0;
    let totalImpressions = 0;
    let campaignCount = 0;

    campaigns.forEach(campaign => {
      const metrics = campaign.campaign_metrics?.[0];
      if (metrics) {
        const ctr = Number(metrics.ctr) || 0;
        const cpc = Number(metrics.cpc) || 0;
        const spend = Number(metrics.spend) || 0;
        const clicks = Number(metrics.clicks) || 0;
        const impressions = Number(metrics.impressions) || 0;

        if (ctr > 0) totalCTR += ctr;
        if (cpc > 0) totalCPC += cpc;
        totalSpend += spend;
        totalClicks += clicks;
        totalImpressions += impressions;
        campaignCount++;
      }
    });

    const avgCTR = campaignCount > 0 ? totalCTR / campaignCount : 0;
    const avgCPC = campaignCount > 0 ? totalCPC / campaignCount : 0;
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Calculate health score (0-100)
    let healthScore = 50; // Base score

    if (avgCTR > 2.0) healthScore += 20;
    else if (avgCTR > 1.0) healthScore += 10;
    else if (avgCTR < 0.5) healthScore -= 20;

    if (avgCPC < 0.5) healthScore += 20;
    else if (avgCPC < 1.0) healthScore += 10;
    else if (avgCPC > 2.0) healthScore -= 20;

    if (totalSpend > 0 && totalClicks > 0) healthScore += 10;

    healthScore = Math.max(0, Math.min(100, healthScore));

    // Health status
    let healthStatus = '🟢 Excellent';
    let healthEmoji = '🌟';
    if (healthScore < 30) {
      healthStatus = '🔴 Needs Attention';
      healthEmoji = '⚠️';
    } else if (healthScore < 60) {
      healthStatus = '🟡 Good';
      healthEmoji = '📈';
    }

    return `📈 *Performance Health Score*

${healthEmoji} *Overall Health:* ${healthScore}/100 (${healthStatus})

📊 *Key Metrics:*
• Average CTR: ${avgCTR.toFixed(2)}%
• Average CPC: $${avgCPC.toFixed(2)}
• Total Spend: $${totalSpend.toFixed(2)}
• Total Clicks: ${totalClicks.toLocaleString()}
• Total Impressions: ${totalImpressions.toLocaleString()}

🎯 *Recommendations:*
${healthScore < 30 ? '• Focus on improving ad quality and targeting' : 
  healthScore < 60 ? '• Test new creatives and optimize budgets' : 
  '• Great performance! Consider scaling successful campaigns'}

Send "insights for [campaign name]" for specific recommendations! 💡`;
  } catch (error) {
    console.error('Error getting performance summary:', error);
    return `❌ Couldn't fetch performance data. Please try again later.`;
  }
}

async function handleUnsubscribe(phoneNumber: string): Promise<string> {
  try {
    await supabase
      .from('whatsapp_subscribers')
      .update({ is_active: false })
      .eq('phone_number', phoneNumber);

    return `✅ You've been unsubscribed from ZivaAds notifications.

You can always message us again to resubscribe and get campaign insights!

Thank you for using ZivaAds! 🌟`;
  } catch (error) {
    console.error('Error handling unsubscribe:', error);
    return `❌ Couldn't process unsubscribe. Please try again or contact support.`;
  }
}

async function sendWhatsAppMessage(message: any) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    );

    const result = await response.json();
    
    if (result.error) {
      console.error('❌ WhatsApp API Error:', result.error);
      throw new Error(result.error.message);
    }

    console.log('✅ WhatsApp message sent successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    throw error;
  }
} 