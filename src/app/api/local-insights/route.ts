import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

interface LocalInsight {
  id: string;
  type: 'power' | 'economic' | 'weather' | 'holiday' | 'social' | 'market';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
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

    // Get user's campaign data for context
    const { data: campaigns } = await supabase
      .from('facebook_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .limit(5);

    // Get current date and time for context
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isMonthEnd = now.getDate() >= 25;
    const isMonthStart = now.getDate() <= 5;

    // Generate AI-powered local insights
    const insights = await generateLocalInsights(now, campaigns || []);

    return NextResponse.json({
      success: true,
      insights,
      generatedAt: now.toISOString(),
    });

  } catch (error) {
    console.error('Error generating local insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateLocalInsights(currentDate: Date, campaigns: any[]): Promise<LocalInsight[]> {
  const insights: LocalInsight[] = [];
  
  // Prepare context for insights
  const context = {
    currentTime: currentDate.toLocaleString('en-ZW', { timeZone: 'Africa/Harare' }),
    hour: currentDate.getHours(),
    dayOfWeek: currentDate.getDay(),
    isMonthEnd: currentDate.getDate() >= 25,
    isMonthStart: currentDate.getDate() <= 5,
    campaignCount: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
    totalSpend: campaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0),
  };

  // For now, use fallback insights to ensure the feature works
  // TODO: Enable AI insights once OpenAI is properly configured
  insights.push(...generateFallbackInsights(context));

  return insights.slice(0, 3); // Return max 3 insights
}



function generateFallbackInsights(context: any): LocalInsight[] {
  const insights: LocalInsight[] = [];
  
  // Power outage insights (common in Zimbabwe)
  const currentHour = context.hour;
  if (currentHour >= 6 && currentHour <= 22) {
    insights.push({
      id: 'power-outage',
      type: 'power',
      title: 'ZESA Load Shedding Alert',
      description: 'Power outages may be affecting internet connectivity in your target areas.',
      impact: 'Fewer people online means reduced ad reach and engagement during load shedding hours.',
      recommendation: 'Consider pausing ads during peak load shedding times (usually 6-10 AM and 6-10 PM).',
      priority: 'high',
      icon: '⚡',
      color: 'red'
    });
  }
  
  // Month-end insights (very important in Zimbabwe)
  if (context.isMonthEnd) {
    insights.push({
      id: 'month-end-spending',
      type: 'economic',
      title: 'Month-End Spending Spree',
      description: 'People have just received their salaries and are more likely to make purchases.',
      impact: 'Higher conversion rates for retail and service businesses during this period.',
      recommendation: 'Boost your retail campaigns and offer special month-end deals and payment plans.',
      priority: 'high',
      icon: '💰',
      color: 'green'
    });
  } else if (context.isMonthStart) {
    insights.push({
      id: 'month-start-recovery',
      type: 'economic',
      title: 'Month-Start Recovery',
      description: 'People are recovering from month-end spending and may be more budget-conscious.',
      impact: 'Lower spending power - focus on value propositions and budget-friendly options.',
      recommendation: 'Emphasize value, discounts, and payment plans in your ad messaging.',
      priority: 'medium',
      icon: '💳',
      color: 'yellow'
    });
  }
  
  // Time-based insights
  if (currentHour >= 18 || currentHour <= 8) {
    insights.push({
      id: 'evening-hours',
      type: 'social',
      title: 'Evening Peak Hours',
      description: 'People are home and more likely to be on social media during evening hours.',
      impact: 'Higher engagement rates during 6-10 PM when people are relaxing at home.',
      recommendation: 'Consider boosting ads during evening hours for better reach and engagement.',
      priority: 'medium',
      icon: '🌙',
      color: 'blue'
    });
  }
  
  // Weekend insights
  if (context.dayOfWeek === 5 || context.dayOfWeek === 6) {
    insights.push({
      id: 'weekend-engagement',
      type: 'social',
      title: 'Weekend Social Time',
      description: 'Weekend users have more free time to browse social media and engage with content.',
      impact: 'Higher engagement but potentially lower purchase intent on weekends.',
      recommendation: 'Use more engaging, entertaining content on weekends. Focus on brand awareness.',
      priority: 'medium',
      icon: '🎉',
      color: 'blue'
    });
  }
  
  // Mobile-first insight (important for Zimbabwe)
  if (insights.length < 3) {
    insights.push({
      id: 'mobile-first',
      type: 'market',
      title: 'Mobile-First Market',
      description: 'Most Zimbabwean users access Facebook via mobile devices.',
      impact: 'Mobile-optimized ads perform significantly better than desktop-focused content.',
      recommendation: 'Ensure your ads are mobile-friendly with clear, readable text and fast-loading images.',
      priority: 'medium',
      icon: '📱',
      color: 'purple'
    });
  }
  
  // Default insight if still need more
  if (insights.length < 2) {
    insights.push({
      id: 'local-context',
      type: 'market',
      title: 'Local Market Context',
      description: 'Zimbabwean users are very selective about clicking ads - quality over quantity matters.',
      impact: 'Lower click-through rates but higher quality leads when you do get clicks.',
      recommendation: 'Focus on creating highly relevant, culturally appropriate, and engaging ad content.',
      priority: 'medium',
      icon: '🎯',
      color: 'purple'
    });
  }
  
  return insights;
} 