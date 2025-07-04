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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaign_id parameter is required' },
        { status: 400 }
      );
    }

    // Test different insights approaches
    const results = {
      campaignId,
      accountName: account.account_name,
      tests: [] as any[]
    };

    // Test 1: Basic insights without time range
    try {
      const response = await facebookClient['makeRequest'](campaignId + '/insights', {
        fields: 'impressions,clicks,ctr,cpc,cpm,spend,reach,frequency',
        limit: 1
      }) as any;
      results.tests.push({
        name: 'Basic insights without time range',
        success: true,
        data: response.data?.[0] || null
      });
    } catch (error) {
      results.tests.push({
        name: 'Basic insights without time range',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Insights with time range
    try {
      const response = await facebookClient['makeRequest'](campaignId + '/insights', {
        fields: 'impressions,clicks,ctr,cpc,cpm,spend,reach,frequency',
        time_range: JSON.stringify({ since: '2024-01-01', until: 'today' }),
        limit: 1
      }) as any;
      results.tests.push({
        name: 'Insights with time range',
        success: true,
        data: response.data?.[0] || null
      });
    } catch (error) {
      results.tests.push({
        name: 'Insights with time range',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Campaign details to verify access
    try {
      const response = await facebookClient['makeRequest'](campaignId, {
        fields: 'id,name,status,objective,created_time,daily_budget'
      }) as any;
      results.tests.push({
        name: 'Campaign details',
        success: true,
        data: response
      });
    } catch (error) {
      results.tests.push({
        name: 'Campaign details',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in test insights API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 