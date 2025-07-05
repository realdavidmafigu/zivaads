import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { generateAIPerformanceReport } from '@/lib/ai-alerts';
import { whatsappClient } from '@/lib/whatsapp';

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

    // Get query parameters for manual testing
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || getCurrentReportType();
    const userId = searchParams.get('user_id'); // For testing specific user

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
    const { data: activeUserIds, error: userIdsError } = await supabase
      .from('campaigns')
      .select('user_id')
      .in('status', ['ACTIVE', 'LEARNING']);

    if (userIdsError) {
      console.error('Error fetching active user IDs:', userIdsError);
      return NextResponse.json(
        { error: 'Failed to fetch active users' },
        { status: 500 }
      );
    }

    const uniqueUserIds = [...new Set(activeUserIds?.map(u => u.user_id) || [])];
    
    let usersQuery = supabase
      .from('users')
      .select('id, email')
      .in('id', uniqueUserIds);

    // If testing specific user, filter to that user only
    if (userId) {
      usersQuery = supabase
        .from('users')
        .select('id, email')
        .eq('id', userId);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    const results = {
      users_processed: 0,
      reports_generated: 0,
      whatsapp_sent: 0,
      errors: [] as string[],
      report_type: reportType,
    };

    // Process each user
    for (const user of users || []) {
      try {
        results.users_processed++;

        // Generate AI performance report for this user
        const report = await generateAIPerformanceReport(user.id, reportType as 'morning' | 'afternoon' | 'evening');
        
        if (report) {
          results.reports_generated++;
          
          // Store the report in database
          await supabase
            .from('ai_performance_reports')
            .insert({
              user_id: user.id,
              report_type: reportType,
              content: report.content,
              summary: report.summary,
              recommendations: report.recommendations,
              campaign_count: report.campaignCount,
              total_spend: report.totalSpend,
              generated_at: new Date().toISOString(),
            });

          // Send WhatsApp alert with the report
          if (report.shouldSendAlert) {
            await sendWhatsAppReport(user.id, report);
            results.whatsapp_sent++;
          }
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
        job_name: 'ai_performance_reports',
        status: results.errors.length > 0 ? 'partial' : 'success',
        users_processed: results.users_processed,
        reports_generated: results.reports_generated,
        whatsapp_sent: results.whatsapp_sent,
        error_message: results.errors.length > 0 ? results.errors.join('; ') : null,
        completed_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: 'AI Performance reports generated',
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in AI performance reports cron job:', error);
    
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
          job_name: 'ai_performance_reports',
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

// Helper function to determine current report type based on time
function getCurrentReportType(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 18) {
    return 'afternoon';
  } else {
    return 'evening';
  }
}

// Helper function to send WhatsApp report
async function sendWhatsAppReport(userId: string, report: any) {
  try {
    // Fetch user's WhatsApp phone number from preferences
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
    const { data: preferences } = await supabase
      .from('user_alert_preferences')
      .select('phone_number')
      .eq('user_id', userId)
      .single();

    if (!preferences?.phone_number) {
      console.log(`No WhatsApp phone number for user ${userId}, skipping WhatsApp report.`);
      return;
    }

    // Compose a simple summary message
    const message = `📊 ZivaAds Performance Report\n\nType: ${report.reportType}\nCampaigns: ${report.campaignCount}\nTotal Spend: $${report.totalSpend}\n\nSummary: ${report.summary}\n\nRecommendations: ${report.recommendations?.join(', ') || ''}`;

    await whatsappClient.sendTextMessage(preferences.phone_number, message);
  } catch (error) {
    console.error('Error sending WhatsApp report:', error);
  }
} 