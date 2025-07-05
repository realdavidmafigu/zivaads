import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { getRecentAlerts } from '@/lib/alerts';

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
    const days = parseInt(searchParams.get('days') || '30');

    // Fetch alerts
    const alerts = await getRecentAlerts(user.id, days);

    // Calculate basic stats from alerts
    const stats = {
      total: alerts.length,
      resolved: alerts.filter(alert => alert.is_resolved).length,
      high: alerts.filter(alert => alert.severity === 'high').length,
      medium: alerts.filter(alert => alert.severity === 'medium').length,
      low: alerts.filter(alert => alert.severity === 'low').length,
    };

    return NextResponse.json({
      data: alerts,
      stats,
      pagination: {
        total: alerts.length,
        days
      }
    });

  } catch (error) {
    console.error('Error in alerts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 