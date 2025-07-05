import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { createFacebookClient } from '@/lib/facebook';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
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

    // Get all users with connected Facebook accounts
    const { data: fbAccounts, error: fbAccountsError } = await supabase
      .from('facebook_accounts')
      .select('user_id, access_token, facebook_account_id, id')
      .eq('is_active', true);

    if (fbAccountsError) {
      console.error('Error fetching Facebook accounts:', fbAccountsError);
      return NextResponse.json({ error: 'Failed to fetch Facebook accounts' }, { status: 500 });
    }

    let totalCampaigns = 0;
    let totalMetrics = 0;
    let totalErrors = 0;
    let errors: string[] = [];

    // For each Facebook account, fetch campaigns and upsert
    for (const account of fbAccounts || []) {
      try {
        const facebookClient = createFacebookClient(account.access_token);
        const campaigns = await facebookClient.getCampaigns(account.facebook_account_id);

        // Upsert campaigns into Supabase
        if (campaigns && campaigns.length > 0) {
          for (const campaign of campaigns) {
            try {
              // Get campaign insights for metrics
              const insights = await facebookClient.getCampaignInsights(campaign.id);
              
              // Upsert campaign metadata (NO performance metrics here)
              const { data: campaignData, error: campaignError } = await supabase
                .from('campaigns')
                .upsert({
                  user_id: account.user_id,
                  facebook_account_id: account.id,
                  facebook_campaign_id: campaign.id,
                  name: campaign.name,
                  status: campaign.status,
                  objective: campaign.objective,
                  created_time: campaign.created_time,
                  start_time: campaign.start_time,
                  stop_time: campaign.stop_time,
                  daily_budget: campaign.daily_budget,
                  lifetime_budget: campaign.lifetime_budget,
                  spend_cap: campaign.spend_cap,
                  special_ad_categories: campaign.special_ad_categories,
                  last_sync_at: new Date().toISOString(),
                }, { onConflict: 'facebook_account_id,facebook_campaign_id' })
                .select('id')
                .single();

              if (campaignError) {
                totalErrors++;
                errors.push(`Campaign upsert error for ${campaign.name}: ${campaignError.message}`);
                console.error('Campaign upsert error:', campaignError);
                continue;
              }

              totalCampaigns++;

              // Store performance metrics in campaign_metrics table
              if (insights && campaignData) {
                const now = new Date();
                const currentHour = now.getHours();
                const currentDate = now.toISOString().split('T')[0];

                // Calculate additional metrics
                let link_clicks = 0;
                let whatsapp_clicks = 0;
                let cpc_link = 0;
                let cpc_whatsapp = 0;

                if (insights.actions) {
                  const linkClickAction = insights.actions.find((action: any) => action.action_type === 'link_click');
                  if (linkClickAction && Number(linkClickAction.value) > 0) {
                    link_clicks = Number(linkClickAction.value);
                    cpc_link = Number(insights.spend) / link_clicks;
                  }
                  const waClickAction = insights.actions.find((action: any) => action.action_type === 'click_to_whatsapp');
                  if (waClickAction && Number(waClickAction.value) > 0) {
                    whatsapp_clicks = Number(waClickAction.value);
                    cpc_whatsapp = Number(insights.spend) / whatsapp_clicks;
                  }
                }

                const { error: metricsError } = await supabase
                  .from('campaign_metrics')
                  .upsert({
                    campaign_id: campaignData.id,
                    metric_timestamp: now.toISOString(),
                    metric_date: currentDate,
                    metric_hour: currentHour,
                    impressions: insights.impressions || 0,
                    clicks: insights.clicks || 0,
                    ctr: insights.ctr || 0,
                    cpc: insights.cpc || 0,
                    cpm: insights.cpm || 0,
                    spend: insights.spend || 0,
                    reach: insights.reach || 0,
                    frequency: insights.frequency || 0,
                    conversions: insights.actions?.find((action: any) => action.action_type === 'purchase')?.value || 0,
                    link_clicks,
                    whatsapp_clicks,
                    cpc_link,
                    cpc_whatsapp,
                    data_source: 'facebook_api',
                    is_latest: true // This will be managed by the trigger
                  }, { onConflict: 'campaign_id,metric_date,metric_hour' });

                if (metricsError) {
                  console.error(`Error storing metrics for campaign ${campaign.name}:`, metricsError);
                } else {
                  totalMetrics++;
                }
              }

            } catch (campaignError) {
              totalErrors++;
              errors.push(`Error processing campaign ${campaign.name}: ${campaignError instanceof Error ? campaignError.message : 'Unknown error'}`);
              console.error('Error processing campaign:', campaignError);
            }
          }
        }
      } catch (err: any) {
        totalErrors++;
        errors.push(`Error syncing campaigns for user ${account.user_id}: ${err.message}`);
        console.error('Error syncing campaigns:', err);
      }
    }

    return NextResponse.json({
      success: true,
      totalCampaigns,
      totalMetrics,
      totalErrors,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in sync-facebook-campaigns cron job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for manual triggering
export async function GET(request: NextRequest) {
  return POST(request);
} 