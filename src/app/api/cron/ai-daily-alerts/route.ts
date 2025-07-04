import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { generateAIDailyAlert } from '@/lib/server/ai-daily-alerts';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    // Get request body
    const body = await request.json();
    const { alertType, userId } = body;

    // Validate alert type
    if (!['morning', 'afternoon', 'evening'].includes(alertType)) {
      return NextResponse.json(
        { error: 'Invalid alert type' },
        { status: 400 }
      );
    }

    // If userId is provided, send alert to specific user
    if (userId) {
      const alert = await generateAIDailyAlert(userId, alertType);
      
      if (alert && alert.shouldSendAlert) {
        // Send WhatsApp notification
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/alerts/test`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: alert.content,
              alertType: alertType,
              userId: userId,
            }),
          });
          console.log(`AI daily alert sent to user ${userId}:`, response.ok);
        } catch (error) {
          console.error('Error sending WhatsApp AI alert:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: `AI daily alert processed for user ${userId}`,
        alert: alert,
      });
    }

    // Get all users with AI alerts enabled
    const { data: users, error: usersError } = await supabase
      .from('user_alert_preferences')
      .select('user_id, ai_alerts_enabled, morning_alerts, afternoon_alerts, evening_alerts')
      .eq('ai_alerts_enabled', true);

    if (usersError) {
      console.error('Error fetching users with AI alerts enabled:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with AI alerts enabled',
        processedCount: 0,
      });
    }

    // Filter users based on alert type preference
    const eligibleUsers = users.filter(user => {
      switch (alertType) {
        case 'morning':
          return user.morning_alerts;
        case 'afternoon':
          return user.afternoon_alerts;
        case 'evening':
          return user.evening_alerts;
        default:
          return false;
      }
    });

    console.log(`Processing ${alertType} alerts for ${eligibleUsers.length} users`);

    let processedCount = 0;
    let successCount = 0;

    // Process alerts for each eligible user
    for (const user of eligibleUsers) {
      try {
        const alert = await generateAIDailyAlert(user.user_id, alertType);
        
        if (alert && alert.shouldSendAlert) {
                  // Send WhatsApp notification
        try {
          // Import the WhatsApp client
          const { whatsappClient } = await import('@/lib/whatsapp');
          
          // Get user's phone number
          const { data: userPrefs } = await supabase
            .from('user_alert_preferences')
            .select('phone_number')
            .eq('user_id', user.user_id)
            .single();

          if (userPrefs?.phone_number) {
            const success = await whatsappClient.sendTextMessage(userPrefs.phone_number, alert.content);
            
            if (success) {
              successCount++;
              console.log(`AI daily alert sent to user ${user.user_id}`);
              
              // Update the alert record to mark as sent
              await supabase
                .from('ai_daily_alerts')
                .update({ sent_via_whatsapp: true })
                .eq('user_id', user.user_id)
                .eq('generated_at', new Date().toISOString());
            } else {
              console.error(`Failed to send AI daily alert to user ${user.user_id}`);
            }
          } else {
            console.log(`No phone number found for user ${user.user_id}, skipping WhatsApp notification`);
          }
        } catch (error) {
          console.error(`Error sending WhatsApp AI alert to user ${user.user_id}:`, error);
        }
        }
        
        processedCount++;
        
        // Add small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing AI daily alert for user ${user.user_id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${alertType} AI daily alerts processed`,
      processedCount,
      successCount,
      eligibleUsers: eligibleUsers.length,
    });

  } catch (error) {
    console.error('Error processing AI daily alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Get user's alert preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_alert_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (preferencesError) {
      console.error('Error fetching user alert preferences:', preferencesError);
      return NextResponse.json(
        { error: 'Failed to fetch user preferences' },
        { status: 500 }
      );
    }

    // Get recent AI alerts for the user
    const { data: recentAlerts, error: alertsError } = await supabase
      .from('ai_daily_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(5);

    if (alertsError) {
      console.error('Error fetching recent AI alerts:', alertsError);
    }

    return NextResponse.json({
      success: true,
      preferences: preferences || {},
      recentAlerts: recentAlerts || [],
    });

  } catch (error) {
    console.error('Error fetching AI daily alert info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 