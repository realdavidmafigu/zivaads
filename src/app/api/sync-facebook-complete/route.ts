import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { createFacebookClient } from '@/lib/facebook';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Complete Facebook sync triggered');
    
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
      return NextResponse.json(
        { error: 'No active Facebook accounts found' },
        { status: 404 }
      );
    }

    console.log(`📊 Found ${accounts.length} active Facebook accounts`);

    let totalCampaigns = 0;
    let updatedCampaigns = 0;
    let failedAccounts = 0;
    let errors: string[] = [];

    // Process each account
    for (const account of accounts) {
      try {
        console.log(`🔄 Processing account: ${account.account_name || account.facebook_account_id}`);
        
        const facebookClient = createFacebookClient(account.access_token);
        
        // Fetch campaigns with recent insights
        const campaigns = await facebookClient.getCampaigns(account.facebook_account_id);
        
        if (!campaigns || campaigns.length === 0) {
          console.log(`⚠️ No campaigns found for account ${account.account_name}`);
          continue;
        }

        console.log(`📊 Found ${campaigns.length} campaigns for ${account.account_name}`);

        // Process each campaign with recent insights
        for (const campaign of campaigns) {
          try {
            // Get recent insights (last 30 days by default)
            const insights = await facebookClient.getCampaignInsights(campaign.id, 'last_30d');
            
            if (insights) {
              console.log(`✅ Recent insights for ${campaign.name}:`, {
                impressions: insights.impressions,
                clicks: insights.clicks,
                spend: insights.spend,
                date_range: 'last_30d'
              });
            } else {
              console.log(`⚠️ No recent insights for ${campaign.name}, trying lifetime data`);
              // Try lifetime data if recent data is not available
              const lifetimeInsights = await facebookClient.getCampaignInsights(campaign.id, 'lifetime');
              if (lifetimeInsights) {
                console.log(`✅ Lifetime insights for ${campaign.name}:`, {
                  impressions: lifetimeInsights.impressions,
                  clicks: lifetimeInsights.clicks,
                  spend: lifetimeInsights.spend,
                  date_range: 'lifetime'
                });
              }
            }

            // Store campaign and metrics in database
            const { error: storeError } = await supabase
              .from('campaigns')
              .upsert({
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
              }, { onConflict: 'facebook_account_id,facebook_campaign_id' });

            if (storeError) {
              console.error(`❌ Error storing campaign ${campaign.name}:`, storeError);
            } else {
              updatedCampaigns++;
            }

            totalCampaigns++;

          } catch (campaignError) {
            console.error(`❌ Error processing campaign ${campaign.name}:`, campaignError);
            errors.push(`Campaign ${campaign.name}: ${campaignError instanceof Error ? campaignError.message : 'Unknown error'}`);
          }
        }

        // Update account last sync time
        await supabase
          .from('facebook_accounts')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', account.id);

      } catch (accountError) {
        console.error(`❌ Error processing account ${account.account_name}:`, accountError);
        failedAccounts++;
        errors.push(`Account ${account.account_name}: ${accountError instanceof Error ? accountError.message : 'Unknown error'}`);
      }
    }

    console.log('✅ Complete sync finished');

    return NextResponse.json({
      success: true,
      message: 'Complete Facebook sync completed successfully',
      results: {
        totalAccounts: accounts.length,
        successfulAccounts: accounts.length - failedAccounts,
        failedAccounts,
        totalCampaigns,
        updatedCampaigns,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('❌ Complete sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error during complete sync' },
      { status: 500 }
    );
  }
} 