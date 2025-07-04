import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { getRecentAIReports } from '@/lib/ai-alerts';

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
    const reportType = searchParams.get('type'); // morning, afternoon, evening, or null for all

    // Fetch AI performance reports
    const reports = await getRecentAIReports(user.id, limit);

    // Filter by report type if specified
    const filteredReports = reportType 
      ? reports.filter(report => report.report_type === reportType)
      : reports;

    // Get summary statistics
    const stats = {
      total_reports: filteredReports.length,
      morning_reports: filteredReports.filter(r => r.report_type === 'morning').length,
      afternoon_reports: filteredReports.filter(r => r.report_type === 'afternoon').length,
      evening_reports: filteredReports.filter(r => r.report_type === 'evening').length,
      total_spend_reported: filteredReports.reduce((sum, r) => sum + (r.total_spend || 0), 0),
      average_campaigns: filteredReports.length > 0 
        ? filteredReports.reduce((sum, r) => sum + (r.campaign_count || 0), 0) / filteredReports.length 
        : 0,
    };

    return NextResponse.json({
      data: filteredReports,
      stats,
      pagination: {
        total: filteredReports.length,
        limit,
        hasMore: filteredReports.length === limit
      }
    });

  } catch (error) {
    console.error('Error in AI reports API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Manual trigger for generating a report
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
    const reportType = body.type || 'morning'; // morning, afternoon, evening

    if (!['morning', 'afternoon', 'evening'].includes(reportType)) {
      return NextResponse.json(
        { error: 'Invalid report type. Must be morning, afternoon, or evening.' },
        { status: 400 }
      );
    }

    // Generate AI performance report
    const { generateAIPerformanceReport } = await import('@/lib/ai-alerts');
    const report = await generateAIPerformanceReport(user.id, reportType);

    if (!report) {
      return NextResponse.json(
        { error: 'No campaign data available to generate report' },
        { status: 404 }
      );
    }

    // Store the report in database
    const { data: storedReport, error: storeError } = await supabase
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
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing AI report:', storeError);
      return NextResponse.json(
        { error: 'Failed to store report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'AI performance report generated successfully',
      data: storedReport,
      shouldSendAlert: report.shouldSendAlert
    });

  } catch (error) {
    console.error('Error generating AI report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 