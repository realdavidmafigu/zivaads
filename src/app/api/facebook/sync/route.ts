import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createFacebookClient } from '@/lib/facebook';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../../config/supabase';

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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { account_id, sync_type = 'all' } = body;

    // Get user's Facebook accounts
    const { data: facebookAccounts, error: accountsError } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq(account_id ? 'facebook_account_id' : 'id', account_id || 'id');

    if (accountsError) {
      console.error('Error fetching Facebook accounts:', accountsError);
      return NextResponse.json(
        { error: 'Failed to fetch Facebook accounts' },
        { status: 500 }
      );
    }

    if (!facebookAccounts || facebookAccounts.length === 0) {
      return NextResponse.json(
        { error: 'No Facebook accounts found' },
        { status: 404 }
      );
    }

    const syncResults = {
      accounts_processed: 0,
      campaigns_synced: 0,
      ad_sets_synced: 0,
      ads_synced: 0,
      insights_synced: 0,
      errors: [] as string[]
    };

    // Process each account
    for (const account of facebookAccounts) {
      try {
        syncResults.accounts_processed++;

        // Check if token is expired
        if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
          syncResults.errors.push(`Access token expired for account ${account.account_name}`);
          continue;
        }

        const facebookClient = createFacebookClient(account.access_token);

        // Sync campaigns
        if (sync_type === 'all' || sync_type === 'campaigns') {
          try {
            const campaigns = await facebookClient.getCampaigns(account.facebook_account_id);
            
            for (const campaign of campaigns) {
              try {
                // Get campaign insights
                const insights = await facebookClient.getCampaignInsights(campaign.id);
                
                // Upsert campaign metadata (NO performance metrics here)
                const { data: campaignData, error: campaignError } = await supabase
                  .from('campaigns')
                  .upsert({
                    user_id: user.id,
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
                    last_sync_at: new Date().toISOString()
                  }, { onConflict: 'facebook_account_id,facebook_campaign_id' })
                  .select('id')
                  .single();

                if (campaignError) {
                  syncResults.errors.push(`Failed to sync campaign ${campaign.name}: ${campaignError.message}`);
                } else {
                  syncResults.campaigns_synced++;
                }

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

                  if (!metricsError) {
                    syncResults.insights_synced++;
                  } else {
                    console.error(`Error storing metrics for campaign ${campaign.name}:`, metricsError);
                  }
                }

                // Sync ad sets if requested
                if ((sync_type === 'all' || sync_type === 'ad_sets') && campaignData) {
                  try {
                    const adSets = await facebookClient.getAdSets(campaign.id);
                    
                    for (const adSet of adSets) {
                      // Upsert ad set metadata
                      const { data: adSetData, error: adSetError } = await supabase
                        .from('ad_sets')
                        .upsert({
                          campaign_id: campaignData.id, // Use the campaign UUID
                          facebook_ad_set_id: adSet.id,
                          name: adSet.name,
                          status: adSet.status,
                          daily_budget: adSet.daily_budget,
                          lifetime_budget: adSet.lifetime_budget,
                          optimization_goal: adSet.optimization_goal,
                          bid_amount: adSet.bid_amount,
                          targeting: adSet.targeting,
                          created_time: adSet.created_time,
                          start_time: adSet.start_time,
                          end_time: adSet.end_time,
                          last_sync_at: new Date().toISOString()
                        }, { onConflict: 'campaign_id,facebook_ad_set_id' })
                        .select('id')
                        .single();

                      if (adSetError) {
                        syncResults.errors.push(`Failed to sync ad set ${adSet.name}: ${adSetError.message}`);
                      } else {
                        syncResults.ad_sets_synced++;
                      }

                      // Sync ads if requested
                      if ((sync_type === 'all' || sync_type === 'ads') && adSetData) {
                        try {
                          const ads = await facebookClient.getAds(adSet.id);
                          
                          for (const ad of ads) {
                            const { error: adError } = await supabase
                              .from('ads')
                              .upsert({
                                ad_set_id: adSetData.id, // Use the ad set UUID
                                facebook_ad_id: ad.id,
                                name: ad.name,
                                status: ad.status,
                                creative: ad.creative,
                                created_time: ad.created_time,
                                last_sync_at: new Date().toISOString()
                              }, { onConflict: 'ad_set_id,facebook_ad_id' });

                            if (adError) {
                              syncResults.errors.push(`Failed to sync ad ${ad.name}: ${adError.message}`);
                            } else {
                              syncResults.ads_synced++;
                            }
                          }
                        } catch (adError) {
                          syncResults.errors.push(`Failed to fetch ads for ad set ${adSet.name}: ${adError instanceof Error ? adError.message : 'Unknown error'}`);
                        }
                      }
                    }
                  } catch (adSetError) {
                    syncResults.errors.push(`Failed to fetch ad sets for campaign ${campaign.name}: ${adSetError instanceof Error ? adSetError.message : 'Unknown error'}`);
                  }
                }

              } catch (campaignError) {
                syncResults.errors.push(`Failed to process campaign ${campaign.name}: ${campaignError instanceof Error ? campaignError.message : 'Unknown error'}`);
              }
            }
          } catch (campaignsError) {
            syncResults.errors.push(`Failed to fetch campaigns for account ${account.account_name}: ${campaignsError instanceof Error ? campaignsError.message : 'Unknown error'}`);
          }
        }

        // Update account last sync time
        await supabase
          .from('facebook_accounts')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', account.id);

      } catch (accountError) {
        syncResults.errors.push(`Failed to process account ${account.account_name}: ${accountError instanceof Error ? accountError.message : 'Unknown error'}`);
      }
    }

    // Log sync operation
    await supabase
      .from('sync_logs')
      .insert({
        user_id: user.id,
        facebook_account_id: facebookAccounts[0]?.id,
        sync_type: sync_type,
        status: syncResults.errors.length > 0 ? 'partial' : 'success',
        records_processed: syncResults.campaigns_synced + syncResults.ad_sets_synced + syncResults.ads_synced,
        records_updated: syncResults.campaigns_synced + syncResults.ad_sets_synced + syncResults.ads_synced,
        records_created: 0,
        error_message: syncResults.errors.length > 0 ? syncResults.errors.join('; ') : null,
        completed_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: `Sync completed for ${syncResults.accounts_processed} account(s)`,
      results: syncResults
    });

  } catch (error) {
    console.error('Error in sync API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 