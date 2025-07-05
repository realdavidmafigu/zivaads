import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { generateAIDailyAlert } from '@/lib/server/ai-daily-alerts';

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
    const { alertType = 'auto', forceSend = false, accountId } = body;

    // Determine alert type based on time of day if auto
    let finalAlertType: 'morning' | 'afternoon' | 'evening';
    if (alertType === 'auto') {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) {
        finalAlertType = 'morning';
      } else if (hour >= 12 && hour < 18) {
        finalAlertType = 'afternoon';
      } else {
        finalAlertType = 'evening';
      }
    } else {
      finalAlertType = alertType as 'morning' | 'afternoon' | 'evening';
    }

    // Generate AI daily alert
    const alert = await generateAIDailyAlert(user.id, finalAlertType, accountId, supabase);

    // If no alert generated, create a fallback alert
    if (!alert) {
      const fallbackAlert = {
        content: `Good ${finalAlertType === 'morning' ? 'morning' : finalAlertType === 'afternoon' ? 'afternoon' : 'evening'}! No campaign data available at the moment. Connect your Facebook account to start receiving AI-powered insights about your ad performance.`,
        summary: `${finalAlertType.charAt(0).toUpperCase() + finalAlertType.slice(1)} update - No campaigns`,
        campaignCount: 0,
        totalSpend: 0,
        shouldSendAlert: true,
        alertType: finalAlertType,
        accountId: accountId || null,
      };

      // Store the fallback alert in database
      const { error: insertError } = await supabase
        .from('ai_daily_alerts')
        .insert({
          user_id: user.id,
          alert_type: finalAlertType,
          content: fallbackAlert.content,
          summary: fallbackAlert.summary,
          campaign_count: fallbackAlert.campaignCount,
          total_spend: fallbackAlert.totalSpend,
          facebook_account_id: accountId || null,
          generated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error storing fallback AI alert:', insertError);
      }

      // Create dashboard alert notification
      await createDashboardAlert(supabase, user.id, fallbackAlert);

      return NextResponse.json({
        success: true,
        alert: {
          type: finalAlertType,
          content: fallbackAlert.content,
          summary: fallbackAlert.summary,
          campaignCount: fallbackAlert.campaignCount,
          totalSpend: fallbackAlert.totalSpend,
          shouldSendAlert: fallbackAlert.shouldSendAlert,
          generatedAt: new Date().toISOString(),
        },
        message: `${finalAlertType.charAt(0).toUpperCase() + finalAlertType.slice(1)} AI alert generated successfully (fallback)`,
      });
    }

    // Store the alert in database
    const { error: insertError } = await supabase
      .from('ai_daily_alerts')
      .insert({
        user_id: user.id,
        alert_type: finalAlertType,
        content: alert.content,
        summary: alert.summary,
        campaign_count: alert.campaignCount,
        total_spend: alert.totalSpend,
        facebook_account_id: accountId || null,
        generated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing AI alert:', insertError);
    }

    // Create dashboard alert notification
    await createDashboardAlert(supabase, user.id, alert);

    // Send WhatsApp notification (but don't fail if it doesn't work)
    let whatsappSuccess = false;
    if (alert.shouldSendAlert || forceSend) {
      try {
        // Import the WhatsApp client
        const { whatsappClient } = await import('@/lib/whatsapp');
        
        // Get user's phone number from preferences
        const { data: preferences } = await supabase
          .from('user_alert_preferences')
          .select('phone_number')
          .eq('user_id', user.id)
          .single();

        if (preferences?.phone_number) {
          whatsappSuccess = await whatsappClient.sendTextMessage(preferences.phone_number, alert.content);
          console.log('WhatsApp AI alert sent:', whatsappSuccess);
          
          // Update the alert record to mark as sent
          if (whatsappSuccess) {
            await supabase
              .from('ai_daily_alerts')
              .update({ sent_via_whatsapp: true })
              .eq('user_id', user.id)
              .eq('generated_at', new Date().toISOString());
          }
        } else {
          console.log('No phone number found for user, skipping WhatsApp notification');
        }
      } catch (error) {
        console.error('Error sending WhatsApp AI alert:', error);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      alert: {
        type: finalAlertType,
        content: alert.content,
        summary: alert.summary,
        campaignCount: alert.campaignCount,
        totalSpend: alert.totalSpend,
        shouldSendAlert: alert.shouldSendAlert,
        generatedAt: new Date().toISOString(),
      },
      whatsappSent: whatsappSuccess,
      message: `${finalAlertType.charAt(0).toUpperCase() + finalAlertType.slice(1)} AI alert generated successfully`,
    });

  } catch (error) {
    console.error('Error generating AI daily alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to create dashboard alert notification
async function createDashboardAlert(supabase: any, userId: string, alert: any) {
  try {
    const alertId = `ai_alert_${Date.now()}`;
    const now = new Date().toISOString();
    
    // Create a dashboard alert notification
    await supabase
      .from('alerts')
      .insert({
        id: alertId,
        user_id: userId,
        campaign_id: null, // AI alerts don't belong to specific campaigns
        alert_type: 'ai_daily_alert',
        severity: 'medium',
        title: 'AI Performance Alert',
        message: alert.content,
        metadata: {
          alert_type: alert.alertType,
          summary: alert.summary,
          campaign_count: alert.campaignCount,
          total_spend: alert.totalSpend,
          source: 'ai_daily_alerts',
        },
        created_at: now,
        is_resolved: false,
      });

    console.log('Dashboard alert notification created for AI alert');
  } catch (error) {
    console.error('Error creating dashboard alert notification:', error);
    // Don't fail the main request if this fails
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '10');
    const alertType = searchParams.get('type');

    // Build query
    let query = supabase
      .from('ai_daily_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (alertType) {
      query = query.eq('alert_type', alertType);
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error('Error fetching AI alerts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alerts: alerts || [],
      count: alerts?.length || 0,
    });

  } catch (error) {
    console.error('Error fetching AI daily alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 