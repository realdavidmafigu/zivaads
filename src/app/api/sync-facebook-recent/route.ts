import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { createFacebookClient } from '@/lib/facebook';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Recent Facebook sync triggered');
    
    // Set a timeout for the entire sync process (5 minutes)
    const syncTimeout = setTimeout(() => {
      console.error('⏰ Sync timeout reached - forcing completion');
    }, 5 * 60 * 1000);
    
    // Get the user from the session
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
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      clearTimeout(syncTimeout);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Get user's Facebook accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (accountsError || !accounts || accounts.length === 0) {
      clearTimeout(syncTimeout);
      return NextResponse.json(
        { error: 'No active Facebook accounts found' },
        { status: 404 }
      );
    }

    console.log(`📊 Found ${accounts.length} active Facebook accounts`);

    let totalCampaigns = 0;
    let campaignsWithData = 0;
    let campaignsWithoutData = 0;
    let errors: string[] = [];
    let campaignsToUpsert: any[] = [];

    // Process each account
    for (const account of accounts) {
      try {
        console.log(`🔄 Processing account: ${account.account_name || account.facebook_account_id}`);
        
        const facebookClient = createFacebookClient(account.access_token);
        
        // Fetch campaigns
        const campaigns = await facebookClient.getCampaigns(account.facebook_account_id);
        
        if (!campaigns || campaigns.length === 0) {
          console.log(`⚠️ No campaigns found for account ${account.account_name}`);
          continue;
        }

        console.log(`📊 Found ${campaigns.length} campaigns for ${account.account_name}`);

        // Process each campaign with optimized insights approach
        for (const campaign of campaigns) {
          try {
            totalCampaigns++;
            
            // OPTIMIZED: Use the new efficient getCampaignInsights method
            let insights = null;
            
            try {
              // Single API call per campaign - much faster than the old 5-strategy approach
              insights = await facebookClient.getCampaignInsights(campaign.id, 'last_30d');
              
              if (insights) {
                console.log(`✅ Got insights for ${campaign.name}:`, {
                  impressions: insights.impressions,
                  clicks: insights.clicks,
                  spend: insights.spend,
                  data_type: 'optimized_single_call'
                });
                campaignsWithData++;
              } else {
                console.log(`⚠️ No insights data available for ${campaign.name}`);
                campaignsWithoutData++;
              }
            } catch (insightsError) {
              const errorMessage = insightsError instanceof Error ? insightsError.message : 'Unknown error';
              console.log(`❌ Insights fetch failed for ${campaign.name}:`, errorMessage);
              
              // Check if it's a permission error
              if (errorMessage.includes('permission') || errorMessage.includes('(#100)')) {
                console.log(`🚫 Permission issue for campaign ${campaign.name} - skipping insights`);
              }
              
              campaignsWithoutData++;
            }

            // OPTIMIZED: Batch database operations instead of individual upserts
            campaignsToUpsert.push({
              user_id: user.id,
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
              last_sync_at: new Date().toISOString()
            });

            // Store insights if available
            if (insights) {
              try {
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

                // Get the campaign ID for metrics storage
                const { data: campaignData } = await supabase
                  .from('campaigns')
                  .select('id')
                  .eq('facebook_account_id', account.id)
                  .eq('facebook_campaign_id', campaign.id)
                  .single();

                if (campaignData) {
                  await supabase
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
                      is_latest: true
                    }, { onConflict: 'campaign_id,metric_date,metric_hour' });
                }
              } catch (metricsError) {
                console.error(`❌ Error storing metrics for campaign ${campaign.name}:`, metricsError);
              }
            }

          } catch (campaignError) {
            console.error(`❌ Error processing campaign ${campaign.name}:`, campaignError);
            const errorMessage = campaignError instanceof Error ? campaignError.message : 'Unknown error';
            errors.push(`Campaign ${campaign.name}: ${errorMessage}`);
          }
        }

        // OPTIMIZED: Batch upsert all campaigns for this account
        if (campaignsToUpsert.length > 0) {
          const { error: batchError } = await supabase
            .from('campaigns')
            .upsert(campaignsToUpsert, { onConflict: 'facebook_account_id,facebook_campaign_id' });

          if (batchError) {
            console.error(`❌ Error batch storing campaigns for account ${account.account_name}:`, batchError);
          } else {
            console.log(`✅ Successfully stored ${campaignsToUpsert.length} campaigns for account ${account.account_name}`);
          }
          
          // Clear the batch for next account
          campaignsToUpsert = [];
        }

        // Update account last sync time
        await supabase
          .from('facebook_accounts')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', account.id);

      } catch (accountError) {
        console.error(`❌ Error processing account ${account.account_name}:`, accountError);
        const errorMessage = accountError instanceof Error ? accountError.message : 'Unknown error';
        
        // Check if it's a permission error and provide specific guidance
        if (errorMessage.includes('permission') || errorMessage.includes('(#100)')) {
          errors.push(`Account ${account.account_name}: Permission denied. Please reconnect your Facebook account to refresh permissions.`);
        } else {
          errors.push(`Account ${account.account_name}: ${errorMessage}`);
        }
      }
    }

    console.log('✅ Recent sync finished');
    clearTimeout(syncTimeout);

    return NextResponse.json({
      success: true,
      message: 'Recent Facebook sync completed successfully',
      results: {
        totalAccounts: accounts.length,
        totalCampaigns,
        campaignsWithData,
        campaignsWithoutData,
        dataAvailability: `${campaignsWithData}/${totalCampaigns} campaigns have performance data`,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('❌ Recent sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error during recent sync' },
      { status: 500 }
    );
  }
} 