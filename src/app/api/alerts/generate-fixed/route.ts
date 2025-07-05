import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { alertDetector } from '@/lib/alerts-fixed';

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

    // Get request body for custom parameters
    const body = await request.json();
    const { forceGenerate = false, campaignId } = body;

    let alerts = [];

    if (campaignId) {
      // Generate alerts for specific campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_metrics!inner(
            impressions,
            clicks,
            ctr,
            cpc,
            cpm,
            spend,
            reach,
            frequency,
            conversions,
            is_latest
          )
        `)
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .eq('campaign_metrics.is_latest', true)
        .single();

      if (campaignError || !campaign) {
        return NextResponse.json(
          { error: 'Campaign not found or no metrics available' },
          { status: 404 }
        );
      }

      const thresholds = await alertDetector.getUserThresholds(user.id);
      alerts = await alertDetector['checkCampaignIssues'](campaign, thresholds);
      
      if (alerts.length > 0) {
        await alertDetector['storeAlerts'](alerts, user.id);
      }
    } else {
      // Generate alerts for all user campaigns
      alerts = await alertDetector.detectCampaignIssues(user.id);
    }

    // Send WhatsApp alerts if any were generated
    if (alerts.length > 0) {
      try {
        await alertDetector.sendWhatsAppAlerts(user.id, alerts);
      } catch (whatsappError) {
        console.error('WhatsApp alert sending failed:', whatsappError);
        // Continue even if WhatsApp fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${alerts.length} alerts`,
      alerts: alerts.map(alert => ({
        id: alert.id,
        campaign_name: alert.campaign_name,
        alert_type: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 