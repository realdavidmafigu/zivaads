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
      .eq('is_active', true)
      .limit(1);

    if (accountsError || !facebookAccounts || facebookAccounts.length === 0) {
      return NextResponse.json(
        { error: 'No Facebook accounts found' },
        { status: 404 }
      );
    }

    const account = facebookAccounts[0];
    const facebookClient = createFacebookClient(account.access_token);

    // Test different API endpoints
    const results: any = {
      account: {
        id: account.facebook_account_id,
        name: account.account_name,
        status: account.account_status
      },
      tests: {}
    };

    // Test 1: Get user profile
    try {
      const profile = await facebookClient.getUserProfile();
      results.tests.userProfile = { success: true, data: profile };
    } catch (error) {
      results.tests.userProfile = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    // Test 2: Get ad accounts
    try {
      const adAccounts = await facebookClient.getAdAccounts();
      results.tests.adAccounts = { 
        success: true, 
        count: adAccounts.length,
        accounts: adAccounts.map(acc => ({ id: acc.facebook_account_id, name: acc.account_name, status: acc.account_status }))
      };
    } catch (error) {
      results.tests.adAccounts = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    // Test 3: Get campaigns
    try {
      const campaigns = await facebookClient.getCampaigns(account.facebook_account_id);
      results.tests.campaigns = { 
        success: true, 
        count: campaigns.length,
        campaigns: campaigns.slice(0, 3).map(camp => ({ id: camp.id, name: camp.name, status: camp.status }))
      };
    } catch (error) {
      results.tests.campaigns = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    // Test 4: Get insights for first campaign (if available)
    try {
      const campaigns = await facebookClient.getCampaigns(account.facebook_account_id);
      if (campaigns.length > 0) {
        const firstCampaign = campaigns[0];
        const insights = await facebookClient.getCampaignInsights(firstCampaign.id);
        results.tests.insights = { 
          success: !!insights, 
          campaignId: firstCampaign.id,
          campaignName: firstCampaign.name,
          data: insights ? {
            impressions: insights.impressions,
            clicks: insights.clicks,
            spend: insights.spend,
            ctr: insights.ctr
          } : null
        };
      } else {
        results.tests.insights = { success: false, error: 'No campaigns available' };
      }
    } catch (error) {
      results.tests.insights = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in Facebook test API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 