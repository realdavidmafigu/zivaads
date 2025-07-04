import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { generateAIPerformanceReport } from '@/lib/ai-alerts';

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
    const { reportType = 'auto' } = body;

    // Determine report type based on time of day if auto
    let finalReportType: 'morning' | 'afternoon' | 'evening';
    if (reportType === 'auto') {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) {
        finalReportType = 'morning';
      } else if (hour >= 12 && hour < 18) {
        finalReportType = 'afternoon';
      } else {
        finalReportType = 'evening';
      }
    } else {
      finalReportType = reportType as 'morning' | 'afternoon' | 'evening';
    }

    // Generate AI performance report
    const report = await generateAIPerformanceReport(user.id, finalReportType);

    if (!report) {
      return NextResponse.json(
        { error: 'No campaign data available for analysis' },
        { status: 404 }
      );
    }

    // Store the report in database
    const { error: insertError } = await supabase
      .from('ai_performance_reports')
      .insert({
        user_id: user.id,
        report_type: finalReportType,
        content: report.content,
        summary: report.summary,
        recommendations: report.recommendations,
        campaign_count: report.campaignCount,
        total_spend: report.totalSpend,
        generated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing report:', insertError);
    }

    // Send WhatsApp notification if report indicates it should
    if (report.shouldSendAlert) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/alerts/test`, {
          method: 'POST',
        });
        console.log('WhatsApp notification sent:', response.ok);
      } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
      }
    }

    return NextResponse.json({
      success: true,
      report: {
        type: finalReportType,
        content: report.content,
        summary: report.summary,
        recommendations: report.recommendations,
        campaignCount: report.campaignCount,
        totalSpend: report.totalSpend,
        shouldSendAlert: report.shouldSendAlert,
        generatedAt: new Date().toISOString(),
      },
      message: `${finalReportType.charAt(0).toUpperCase() + finalReportType.slice(1)} performance report generated successfully`,
    });

  } catch (error) {
    console.error('Error generating enhanced AI report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    const reportType = searchParams.get('type');

    // Build query
    let query = supabase
      .from('ai_performance_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reports: reports || [],
      count: reports?.length || 0,
    });

  } catch (error) {
    console.error('Error fetching enhanced AI reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 