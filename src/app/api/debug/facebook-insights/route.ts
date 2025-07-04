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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');
    const accountId = searchParams.get('account_id');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaign_id parameter is required' },
        { status: 400 }
      );
    }

    // Get Facebook account
    const { data: facebookAccounts, error: accountsError } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (accountsError || !facebookAccounts || facebookAccounts.length === 0) {
      return NextResponse.json(
        { error: 'No active Facebook accounts found' },
        { status: 404 }
      );
    }

    // Filter by account_id if provided
    const targetAccount = accountId 
      ? facebookAccounts.find(acc => acc.facebook_account_id === accountId)
      : facebookAccounts[0];

    if (!targetAccount) {
      return NextResponse.json(
        { error: 'Facebook account not found' },
        { status: 404 }
      );
    }

    // Create Facebook client
    const facebookClient = createFacebookClient(targetAccount.access_token);

    // Test different insights fetching strategies
    const debugResults: {
      campaignId: string;
      accountId: any;
      accountName: any;
      strategies: any[];
      finalResult: any;
      summary?: any;
    } = {
      campaignId,
      accountId: targetAccount.facebook_account_id,
      accountName: targetAccount.account_name,
      strategies: [],
      finalResult: null
    };

    // Strategy 1: date_preset last_30d
    try {
      console.log(`🔍 Testing strategy 1: date_preset last_30d for campaign ${campaignId}`);
      const result = await facebookClient.getCampaignInsights(campaignId, 'last_30d');
      debugResults.strategies.push({
        name: 'date_preset last_30d',
        success: !!result,
        data: result,
        error: null
      });
      if (result) debugResults.finalResult = result;
    } catch (error) {
      debugResults.strategies.push({
        name: 'date_preset last_30d',
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Strategy 2: date_preset last_7d
    if (!debugResults.finalResult) {
      try {
        console.log(`🔍 Testing strategy 2: date_preset last_7d for campaign ${campaignId}`);
        const result = await facebookClient.getCampaignInsights(campaignId, 'last_7d');
        debugResults.strategies.push({
          name: 'date_preset last_7d',
          success: !!result,
          data: result,
          error: null
        });
        if (result) debugResults.finalResult = result;
      } catch (error) {
        debugResults.strategies.push({
          name: 'date_preset last_7d',
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Strategy 3: date_preset last_90d
    if (!debugResults.finalResult) {
      try {
        console.log(`🔍 Testing strategy 3: date_preset last_90d for campaign ${campaignId}`);
        const result = await facebookClient.getCampaignInsights(campaignId, 'last_90d');
        debugResults.strategies.push({
          name: 'date_preset last_90d',
          success: !!result,
          data: result,
          error: null
        });
        if (result) debugResults.finalResult = result;
      } catch (error) {
        debugResults.strategies.push({
          name: 'date_preset last_90d',
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Strategy 4: lifetime data (no date parameters)
    if (!debugResults.finalResult) {
      try {
        console.log(`🔍 Testing strategy 4: lifetime data for campaign ${campaignId}`);
        const result = await facebookClient.getCampaignInsights(campaignId, 'lifetime');
        debugResults.strategies.push({
          name: 'lifetime data',
          success: !!result,
          data: result,
          error: null
        });
        if (result) debugResults.finalResult = result;
      } catch (error) {
        debugResults.strategies.push({
          name: 'lifetime data',
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Strategy 5: custom date range
    if (!debugResults.finalResult) {
      try {
        console.log(`🔍 Testing strategy 5: custom date range for campaign ${campaignId}`);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const response = await (facebookClient as any).makeRequest(
          `/${campaignId}/insights`,
          {
            fields: 'impressions,clicks,ctr,cpc,cpm,spend,reach,frequency,actions,action_values',
            time_range: JSON.stringify({
              since: thirtyDaysAgo.toISOString().split('T')[0],
              until: 'today'
            }),
            limit: 1
          }
        );
        
        const result = (response as any).data?.[0] || null;
        debugResults.strategies.push({
          name: 'custom date range',
          success: !!result,
          data: result,
          error: null
        });
        if (result) debugResults.finalResult = result;
      } catch (error) {
        debugResults.strategies.push({
          name: 'custom date range',
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Summary
    debugResults.summary = {
      totalStrategies: debugResults.strategies.length,
      successfulStrategies: debugResults.strategies.filter(s => s.success).length,
      hasFinalResult: !!debugResults.finalResult,
      bestStrategy: debugResults.strategies.find(s => s.success)?.name || 'None'
    };

    return NextResponse.json(debugResults);

  } catch (error) {
    console.error('Error in debug Facebook insights API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 