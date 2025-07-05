import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { alertDetector } from '@/lib/alerts';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

        // Get all users with active campaigns
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('id', 
        (await supabase
          .from('campaigns')
          .select('user_id')
          .in('status', ['ACTIVE', 'LEARNING'])).data?.map(c => c.user_id) || []
      );

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    const results = {
      users_processed: 0,
      alerts_generated: 0,
      whatsapp_sent: 0,
      errors: [] as string[],
    };

    // Process each user
    for (const user of users || []) {
      try {
        results.users_processed++;

        // Detect campaign issues for this user
        const alerts = await alertDetector.detectCampaignIssues(user.id);
        
        if (alerts.length > 0) {
          results.alerts_generated += alerts.length;
          // WhatsApp alert sending removed in new system
          // If you want to notify users, use whatsappClient.sendTextMessage here
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`User ${user.id}: ${errorMessage}`);
        console.error(`Error processing user ${user.id}:`, error);
      }
    }

    // Log the cron job execution
    await supabase
      .from('cron_logs')
      .insert({
        job_name: 'check_campaigns',
        status: results.errors.length > 0 ? 'partial' : 'success',
        users_processed: results.users_processed,
        alerts_generated: results.alerts_generated,
        whatsapp_sent: results.whatsapp_sent,
        error_message: results.errors.length > 0 ? results.errors.join('; ') : null,
        completed_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: 'Campaign check completed',
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in campaign check cron job:', error);
    
    // Log the error
    try {
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

      await supabase
        .from('cron_logs')
        .insert({
          job_name: 'check_campaigns',
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        });
    } catch (logError) {
      console.error('Error logging cron failure:', logError);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggering
export async function GET(request: NextRequest) {
  return POST(request);
} 