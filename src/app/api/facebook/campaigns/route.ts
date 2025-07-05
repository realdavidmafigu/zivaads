import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createFacebookClient } from '@/lib/facebook';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

export async function GET(request: NextRequest) {
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Facebook accounts
    const { data: facebookAccounts, error: accountsError } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (accountsError) {
      console.error('Error fetching Facebook accounts:', accountsError);
      return NextResponse.json(
        { error: 'Failed to fetch Facebook accounts' },
        { status: 500 }
      );
    }

    if (!facebookAccounts || facebookAccounts.length === 0) {
      return NextResponse.json(
        { error: 'No Facebook accounts found. Please connect your Facebook Business account first.' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const useCache = searchParams.get('use_cache') !== 'false'; // Default to true
    const forceRefresh = searchParams.get('force_refresh') === 'true';

    // Filter accounts if account_id is specified
    const accountsToProcess = accountId 
      ? facebookAccounts.filter(acc => acc.facebook_account_id === accountId)
      : facebookAccounts;

    if (accountId && accountsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'Facebook account not found' },
        { status: 404 }
      );
    }

    const allCampaigns = [];
    const errors = [];

    // Fetch campaigns for each account
    for (const account of accountsToProcess) {
      try {
        // Check if token is expired
        if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
          errors.push(`Access token expired for account ${account.account_name}`);
          continue;
        }

        // If using cache and not forcing refresh, try to get from database first
        if (useCache && !forceRefresh) {
          console.log(`📊 Fetching campaigns from database for account ${account.account_name}`);
          
          const { data: dbCampaigns, error: dbError } = await supabase
            .from('campaigns')
            .select(`
              *,
              campaign_metrics!inner(
                impressions, clicks, ctr, cpc, cpm, spend, reach, frequency, conversions,
                link_clicks, whatsapp_clicks, cpc_link, cpc_whatsapp,
                metric_timestamp, is_latest
              )
            `)
            .eq('facebook_account_id', account.id)
            .eq('campaign_metrics.is_latest', true);

          if (!dbError && dbCampaigns && dbCampaigns.length > 0) {
            console.log(`✅ Found ${dbCampaigns.length} campaigns in database`);
            
            // Transform database data to match API response format
            const transformedCampaigns = dbCampaigns.map(campaign => {
              const latestMetrics = campaign.campaign_metrics?.[0] || {};
              return {
                id: campaign.facebook_campaign_id,
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
                facebook_account_id: account.facebook_account_id,
                account_name: account.account_name,
                // Performance metrics from campaign_metrics table
                impressions: latestMetrics.impressions || 0,
                clicks: latestMetrics.clicks || 0,
                ctr: latestMetrics.ctr || 0,
                cpc: latestMetrics.cpc || 0,
                cpc_link: latestMetrics.cpc_link || 0,
                cpc_whatsapp: latestMetrics.cpc_whatsapp || 0,
                cpm: latestMetrics.cpm || 0,
                spend: latestMetrics.spend || 0,
                reach: latestMetrics.reach || 0,
                frequency: latestMetrics.frequency || 0,
                conversions: latestMetrics.conversions || 0,
                whatsapp_clicks: latestMetrics.whatsapp_clicks || 0,
                link_clicks: latestMetrics.link_clicks || 0,
                insights_loaded: true,
                data_source: 'database',
                last_updated: latestMetrics.metric_timestamp,
                payment_status: account.payment_status || 'active'
              };
            });

            allCampaigns.push(...transformedCampaigns);
            continue; // Skip API call if we have cached data
          }
        }

        // Create Facebook client for API calls
        const facebookClient = createFacebookClient(account.access_token);

        // Fetch campaigns - try different account ID formats
        let campaigns: any[] = [];
        let lastError: Error | null = null;
        
        // Try multiple account ID formats
        const accountIdFormats = [
          account.facebook_account_id,
          account.facebook_account_id.startsWith('act_') ? account.facebook_account_id : `act_${account.facebook_account_id}`,
          account.facebook_account_id.replace('act_', ''),
          `act_${account.facebook_account_id.replace('act_', '')}`
        ];
        
        for (const accountId of accountIdFormats) {
          try {
            console.log(`Trying account ID format: ${accountId} for ${account.account_name}`);
            campaigns = await facebookClient.getCampaigns(accountId);
            console.log(`✅ Success with account ID: ${accountId}`);
            break; // Exit loop if successful
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.log(`❌ Failed with account ID: ${accountId} - ${error instanceof Error ? error.message : 'Unknown error'}`);
            continue;
          }
        }
        
        if (campaigns.length === 0) {
          throw lastError || new Error('All account ID formats failed');
        }

        // Transform and enrich campaign data
        console.log(`📊 Processing ${campaigns.length} campaigns for account ${account.account_name}`);
        
        const enrichedCampaigns = await Promise.all(
          campaigns.map(async (campaign) => {
            // Get campaign insights (will return null if it fails)
            let insights = null;
            let insightsError = null;
            try {
              console.log(`🔍 Fetching insights for campaign: ${campaign.id} - ${campaign.name}`);
              insights = await facebookClient.getCampaignInsights(campaign.id);
              
              if (insights) {
                console.log(`✅ Insights loaded for ${campaign.name}:`, {
                  impressions: insights.impressions,
                  clicks: insights.clicks,
                  spend: insights.spend,
                  ctr: insights.ctr,
                  cpc: insights.cpc,
                  cpm: insights.cpm
                });
              } else {
                console.log(`❌ No insights data for ${campaign.name}`);
              }
            } catch (error) {
              insightsError = error instanceof Error ? error.message : 'Unknown error';
              console.error(`❌ Error fetching insights for ${campaign.name}:`, insightsError);
              
              // Log specific error types for debugging
              if (insightsError.includes('(#100)')) {
                console.log(`📊 Campaign ${campaign.name} has no activity data`);
              } else if (insightsError.includes('(#190)')) {
                console.log(`🔑 Token issue for campaign ${campaign.name}`);
              } else if (insightsError.includes('permission')) {
                console.log(`🚫 Permission issue for campaign ${campaign.name}`);
              }
            }
            
            // Log detailed insights status
            const insightsStatus = insights ? '✅ Loaded' : '❌ Failed';
            const insightsData = insights ? {
              impressions: insights.impressions,
              clicks: insights.clicks,
              spend: insights.spend,
              ctr: insights.ctr
            } : 'No data';
            
            // Provide fallback data for campaigns with no insights
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
            
            console.log(`📈 Campaign ${campaign.name}:`, {
              id: campaign.id,
              status: campaign.status,
              objective: campaign.objective,
              daily_budget: campaign.daily_budget,
              insights: insightsStatus,
              insightsData
            });
            
            // Fallback: If campaign budget is missing, try ad set budget
            let daily_budget = campaign.daily_budget;
            let lifetime_budget = campaign.lifetime_budget;
            if (!daily_budget && !lifetime_budget) {
              try {
                const adSets = await facebookClient.getAdSets(campaign.id);
                if (adSets && adSets.length > 0) {
                  daily_budget = adSets[0].daily_budget;
                  lifetime_budget = adSets[0].lifetime_budget;
                }
              } catch (adSetError) {
                console.error(`Error fetching ad sets for campaign ${campaign.name}:`, adSetError);
              }
            }

            // Calculate CPCs
            let cpc = insights?.cpc || 0;
            let cpc_link = 0;
            let cpc_whatsapp = 0;
            let link_clicks = 0;
            let whatsapp_clicks = 0;
            if (insights?.actions) {
              const linkClickAction = insights.actions.find((a: any) => a.action_type === 'link_click');
              if (linkClickAction && Number(linkClickAction.value) > 0) {
                link_clicks = Number(linkClickAction.value);
                cpc_link = Number(insights.spend) / link_clicks;
              }
              const waClickAction = insights.actions.find((a: any) => a.action_type === 'click_to_whatsapp');
              if (waClickAction && Number(waClickAction.value) > 0) {
                whatsapp_clicks = Number(waClickAction.value);
                cpc_whatsapp = Number(insights.spend) / whatsapp_clicks;
              }
            }

            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              objective: campaign.objective,
              created_time: campaign.created_time,
              start_time: campaign.start_time,
              stop_time: campaign.stop_time,
              daily_budget, // use fallback if needed
              lifetime_budget, // use fallback if needed
              spend_cap: campaign.spend_cap,
              special_ad_categories: campaign.special_ad_categories,
              facebook_account_id: account.facebook_account_id,
              account_name: account.account_name,
              // Performance metrics from insights (with fallbacks)
              impressions: insights?.impressions || 0,
              clicks: insights?.clicks || 0,
              ctr: insights?.ctr || 0,
              cpc, // Facebook's default CPC
              cpc_link, // CPC for link clicks
              cpc_whatsapp, // CPC for WhatsApp clicks
              cpm: insights?.cpm || 0,
              spend: insights?.spend || 0,
              reach: insights?.reach || 0,
              frequency: insights?.frequency || 0,
              conversions: insights?.actions?.find((action: any) => action.action_type === 'purchase')?.value || 0,
              whatsapp_clicks, // WhatsApp click count
              link_clicks, // Link click count
              // Add insights status for debugging
              insights_loaded: !!insights,
              data_source: 'facebook_api',
              last_updated: new Date().toISOString(),
              // Payment status from account
              payment_status: account.payment_status || 'active'
            };
          })
        );

        allCampaigns.push(...enrichedCampaigns);

        // Store campaigns and metrics in database
        if (enrichedCampaigns.length > 0) {
          await storeCampaignsAndMetrics(supabase, user.id, account, enrichedCampaigns);
        }

        // Update last sync time
        await supabase
          .from('facebook_accounts')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', account.id);

      } catch (error) {
        console.error(`Error fetching campaigns for account ${account.account_name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to fetch campaigns for ${account.account_name}: ${errorMessage}`);
        
        // If it's a permission error, add it to the response
        if (errorMessage.includes('permission') || errorMessage.includes('access')) {
          console.log(`Permission error for account ${account.account_name}:`, errorMessage);
        }
      }
    }

    // Support filtering by campaign_id
    const campaignId = searchParams.get('campaign_id');
    let filteredCampaigns = allCampaigns;
    if (campaignId) {
      filteredCampaigns = allCampaigns.filter(c => c.id === campaignId);
    }
    const paginatedCampaigns = filteredCampaigns.slice(offset, offset + limit);

    // Log sync
    await supabase
      .from('sync_logs')
      .insert({
        user_id: user.id,
        facebook_account_id: accountsToProcess[0]?.id,
        sync_type: 'campaigns',
        status: errors.length > 0 ? 'partial' : 'success',
        records_processed: allCampaigns.length,
        records_updated: paginatedCampaigns.length,
        records_created: 0,
        error_message: errors.length > 0 ? errors.join('; ') : null,
        completed_at: new Date().toISOString()
      });

    return NextResponse.json({
      data: paginatedCampaigns,
      pagination: {
        total: allCampaigns.length,
        limit,
        offset,
        hasMore: offset + limit < allCampaigns.length
      },
      errors: errors.length > 0 ? errors : undefined,
      data_source: useCache && !forceRefresh ? 'database' : 'facebook_api'
    });

  } catch (error) {
    console.error('Error in campaigns API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to store campaigns and metrics in database
async function storeCampaignsAndMetrics(supabase: any, userId: string, account: any, campaigns: any[]) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDate = now.toISOString().split('T')[0];

  for (const campaign of campaigns) {
    try {
      // First, upsert campaign metadata
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .upsert({
          user_id: userId,
          facebook_account_id: account.id,
          facebook_campaign_id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          daily_budget: campaign.daily_budget,
          lifetime_budget: campaign.lifetime_budget,
          spend_cap: campaign.spend_cap,
          created_time: campaign.created_time,
          start_time: campaign.start_time,
          stop_time: campaign.stop_time,
          special_ad_categories: campaign.special_ad_categories,
          last_sync_at: now.toISOString()
        }, { onConflict: 'facebook_account_id,facebook_campaign_id' })
        .select('id')
        .single();

      if (campaignError) {
        console.error(`Error upserting campaign ${campaign.name}:`, campaignError);
        continue;
      }

      // Then, store performance metrics in campaign_metrics table
      const { error: metricsError } = await supabase
        .from('campaign_metrics')
        .upsert({
          campaign_id: campaignData.id,
          metric_timestamp: now.toISOString(),
          metric_date: currentDate,
          metric_hour: currentHour,
          impressions: campaign.impressions || 0,
          clicks: campaign.clicks || 0,
          ctr: campaign.ctr || 0,
          cpc: campaign.cpc || 0,
          cpm: campaign.cpm || 0,
          spend: campaign.spend || 0,
          reach: campaign.reach || 0,
          frequency: campaign.frequency || 0,
          conversions: campaign.conversions || 0,
          link_clicks: campaign.link_clicks || 0,
          whatsapp_clicks: campaign.whatsapp_clicks || 0,
          cpc_link: campaign.cpc_link || 0,
          cpc_whatsapp: campaign.cpc_whatsapp || 0,
          data_source: campaign.data_source || 'facebook_api',
          is_latest: true // This will be managed by the trigger
        }, { onConflict: 'campaign_id,metric_date,metric_hour' });

      if (metricsError) {
        console.error(`Error upserting metrics for campaign ${campaign.name}:`, metricsError);
      }

    } catch (error) {
      console.error(`Error processing campaign ${campaign.name}:`, error);
    }
  }
} 