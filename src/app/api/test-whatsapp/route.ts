import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '@/config/supabase';
import { whatsappClient } from '@/lib/whatsapp';
import { WHATSAPP_CONFIG } from '@/config/whatsapp';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Parse request body
    const { phoneNumber, messageType = 'text' } = await request.json();

    // Validate phone number
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    let success = false;
    let targetPhoneNumber = phoneNumber;

    // Format phone number if needed
    if (!targetPhoneNumber.startsWith('+')) {
      targetPhoneNumber = '+263' + targetPhoneNumber.replace(/\D/g, '');
    }

    // Send different types of messages based on messageType
    switch (messageType) {
      case 'text':
        success = await whatsappClient.sendTextMessage(
          targetPhoneNumber, 
          '🧪 Test message from ZivaAds! Your WhatsApp integration is working correctly. This is a simple text message test.'
        );
        break;
      
      case 'welcome':
        success = await whatsappClient.sendTextMessage(
          targetPhoneNumber,
          `🎉 Welcome to ZivaAds WhatsApp Bot!

I'm your AI-powered Facebook Ads assistant. I can help you with:

📊 Campaign Insights - Get AI analysis for any campaign
💰 Spend Tracking - Monitor your advertising costs
📈 Performance Health - Overall campaign performance
🎯 Optimization Tips - AI-powered recommendations

*Try these commands:*
• "insights for [campaign name]"
• "spend summary"
• "performance health"
• "help" for full menu

Your 24-hour messaging session is now active! ⏰`
        );
        break;
      
      case 'help':
        success = await whatsappClient.sendTextMessage(
          targetPhoneNumber,
          `🎯 *ZivaAds WhatsApp Bot - Available Commands*

📊 *INSIGHTS* - Get AI insights for a specific campaign
💰 *SPEND* - View total spend across all campaigns  
📈 *PERFORMANCE* - Get overall performance health score
❓ *HELP* - Show this menu
🛑 *STOP* - Unsubscribe from messages

*Example:* Send "insights for Glow Hair Promo" to get AI analysis for that campaign.

Need help? Reply with any of these commands! 🌟`
        );
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid message type. Use: text, welcome, or help' },
          { status: 400 }
        );
    }

    // Log the result
    console.log(`📱 WhatsApp test message sent to ${targetPhoneNumber}:`, success);

    return NextResponse.json({
      success: true,
      message: 'WhatsApp test message sent successfully',
      phoneNumber: targetPhoneNumber,
      messageType,
      sent: success,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending WhatsApp test message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user preferences
    const { data: preferences } = await supabase
      .from('alert_preferences')
      .select('*')
      .single();

    // Get WhatsApp subscribers count
    const { data: subscribers, error: subscribersError } = await supabase
      .from('whatsapp_subscribers')
      .select('*')
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      preferences: {
        phoneNumber: preferences?.phone_number || null,
        aiAlertsEnabled: preferences?.ai_alerts_enabled || false,
        hasPhoneNumber: !!preferences?.phone_number
      },
      whatsappConfig: {
        isTestMode: WHATSAPP_CONFIG.isTestMode,
        phoneNumberId: WHATSAPP_CONFIG.phoneNumberId,
        hasAccessToken: !!WHATSAPP_CONFIG.accessToken,
        accessTokenLength: WHATSAPP_CONFIG.accessToken.length
      },
      subscribers: {
        count: subscribers?.length || 0,
        active: subscribers?.filter(s => s.is_active)?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching WhatsApp status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
} 