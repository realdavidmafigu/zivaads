import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { generateAIPerformanceReport } from '@/lib/ai-alerts';

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
    const reportType = searchParams.get('type') || 'morning';

    // Test AI report generation
    console.log('🧪 Testing AI report generation...');
    const report = await generateAIPerformanceReport(user.id, reportType as 'morning' | 'afternoon' | 'evening');

    if (!report) {
      return NextResponse.json({
        success: false,
        message: 'No campaign data available for AI analysis',
        config: {
          openai_configured: true,
          user_has_campaigns: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'AI report generated successfully',
      report: {
        type: report.reportType,
        summary: report.summary,
        recommendations: report.recommendations,
        campaignCount: report.campaignCount,
        totalSpend: report.totalSpend,
        shouldSendAlert: report.shouldSendAlert
      },
      config: {
        openai_configured: true,
        user_has_campaigns: true
      }
    });

  } catch (error) {
    console.error('Error in AI test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        openai_configured: true,
        error_details: error instanceof Error ? error.stack : 'No stack trace'
      }
    }, { status: 500 });
  }
} 