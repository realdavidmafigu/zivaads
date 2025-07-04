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
      .select('user_id, access_token, facebook_account_id')
      .eq('is_active', true);

    if (fbAccountsError) {
      console.error('Error fetching Facebook accounts:', fbAccountsError);
      return NextResponse.json({ error: 'Failed to fetch Facebook accounts' }, { status: 500 });
    }

    let totalCampaigns = 0;
    let totalErrors = 0;
    let errors: string[] = [];

    // For each Facebook account, fetch campaigns and upsert
    for (const account of fbAccounts || []) {
      try {
        const facebookClient = createFacebookClient(account.access_token);
        const campaigns = await facebookClient.getCampaigns(account.facebook_account_id);

        // Upsert campaigns into Supabase
        if (campaigns && campaigns.length > 0) {
          const upsertData = campaigns.map((c: any) => ({
            id: c.id,
            user_id: account.user_id,
            facebook_account_id: account.facebook_account_id,
            name: c.name,
            status: c.status,
            objective: c.objective,
            created_time: c.created_time,
            start_time: c.start_time,
            stop_time: c.stop_time,
            daily_budget: c.daily_budget,
            lifetime_budget: c.lifetime_budget,
            spend_cap: c.spend_cap,
            special_ad_categories: c.special_ad_categories,
            last_sync_at: new Date().toISOString(),
          }));

          const { error: upsertError } = await supabase
            .from('campaigns')
            .upsert(upsertData, { onConflict: 'id' });

          if (upsertError) {
            totalErrors++;
            errors.push(`Upsert error for user ${account.user_id}: ${upsertError.message}`);
            console.error('Upsert error:', upsertError);
          } else {
            totalCampaigns += campaigns.length;
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