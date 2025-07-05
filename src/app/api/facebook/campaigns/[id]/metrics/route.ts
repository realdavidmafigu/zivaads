import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const campaignId = params.id;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const timeRange = searchParams.get('time_range') || 'last_7d'; // last_24h, last_7d, last_30d, custom
    const granularity = searchParams.get('granularity') || 'hourly'; // hourly, daily, weekly
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Validate campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name, facebook_campaign_id')
      .eq('facebook_campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' },
        { status: 404 }
      );
    }

    // Build query for campaign metrics
    let query = supabase
      .from('campaign_metrics')
      .select(`
        id,
        metric_timestamp,
        metric_date,
        metric_hour,
        impressions,
        clicks,
        ctr,
        cpc,
        cpm,
        spend,
        reach,
        frequency,
        conversions,
        link_clicks,
        whatsapp_clicks,
        cpc_link,
        cpc_whatsapp,
        data_source,
        is_latest,
        created_at
      `)
      .eq('campaign_id', campaign.id)
      .order('metric_timestamp', { ascending: false })
      .limit(limit);

    // Apply time range filters
    if (timeRange === 'custom' && startDate && endDate) {
      query = query
        .gte('metric_date', startDate)
        .lte('metric_date', endDate);
    } else if (timeRange === 'last_24h') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      query = query.gte('metric_timestamp', yesterday.toISOString());
    } else if (timeRange === 'last_7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte('metric_timestamp', sevenDaysAgo.toISOString());
    } else if (timeRange === 'last_30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('metric_timestamp', thirtyDaysAgo.toISOString());
    }

    // Apply granularity filter
    if (granularity === 'daily') {
      query = query.eq('metric_hour', null);
    } else if (granularity === 'hourly') {
      query = query.not('metric_hour', 'is', null);
    }

    const { data: metrics, error: metricsError } = await query;

    if (metricsError) {
      console.error('Error fetching campaign metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch campaign metrics' },
        { status: 500 }
      );
    }

    // Get latest metrics for comparison
    const { data: latestMetrics } = await supabase
      .from('campaign_metrics')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('is_latest', true)
      .single();

    // Calculate trends and aggregations
    const aggregatedData = calculateAggregations(metrics || [], granularity);
    const trends = calculateTrends(metrics || []);

    return NextResponse.json({
      campaign: {
        id: campaign.facebook_campaign_id,
        name: campaign.name,
        latest_metrics: latestMetrics
      },
      metrics: metrics || [],
      aggregated_data: aggregatedData,
      trends,
      time_range: timeRange,
      granularity,
      total_records: metrics?.length || 0
    });

  } catch (error) {
    console.error('Error in campaign metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate aggregations based on granularity
function calculateAggregations(metrics: any[], granularity: string) {
  if (!metrics || metrics.length === 0) return {};

  const aggregations: any = {
    total_impressions: 0,
    total_clicks: 0,
    total_spend: 0,
    total_reach: 0,
    total_conversions: 0,
    total_link_clicks: 0,
    total_whatsapp_clicks: 0,
    avg_ctr: 0,
    avg_cpc: 0,
    avg_cpm: 0,
    avg_frequency: 0
  };

  let totalCtr = 0;
  let totalCpc = 0;
  let totalCpm = 0;
  let totalFrequency = 0;
  let validMetrics = 0;

  metrics.forEach(metric => {
    aggregations.total_impressions += Number(metric.impressions) || 0;
    aggregations.total_clicks += Number(metric.clicks) || 0;
    aggregations.total_spend += Number(metric.spend) || 0;
    aggregations.total_reach += Number(metric.reach) || 0;
    aggregations.total_conversions += Number(metric.conversions) || 0;
    aggregations.total_link_clicks += Number(metric.link_clicks) || 0;
    aggregations.total_whatsapp_clicks += Number(metric.whatsapp_clicks) || 0;

    if (Number(metric.ctr) > 0) {
      totalCtr += Number(metric.ctr);
      validMetrics++;
    }
    if (Number(metric.cpc) > 0) totalCpc += Number(metric.cpc);
    if (Number(metric.cpm) > 0) totalCpm += Number(metric.cpm);
    if (Number(metric.frequency) > 0) totalFrequency += Number(metric.frequency);
  });

  if (validMetrics > 0) {
    aggregations.avg_ctr = totalCtr / validMetrics;
    aggregations.avg_cpc = totalCpc / validMetrics;
    aggregations.avg_cpm = totalCpm / validMetrics;
    aggregations.avg_frequency = totalFrequency / validMetrics;
  }

  // Calculate overall CTR and CPC
  if (aggregations.total_impressions > 0) {
    aggregations.overall_ctr = (aggregations.total_clicks / aggregations.total_impressions) * 100;
  }
  if (aggregations.total_clicks > 0) {
    aggregations.overall_cpc = aggregations.total_spend / aggregations.total_clicks;
  }

  return aggregations;
}

// Helper function to calculate trends
function calculateTrends(metrics: any[]) {
  if (!metrics || metrics.length < 2) return {};

  // Sort by timestamp ascending
  const sortedMetrics = [...metrics].sort((a, b) => 
    new Date(a.metric_timestamp).getTime() - new Date(b.metric_timestamp).getTime()
  );

  const firstHalf = sortedMetrics.slice(0, Math.floor(sortedMetrics.length / 2));
  const secondHalf = sortedMetrics.slice(Math.floor(sortedMetrics.length / 2));

  const firstHalfAvg = calculateAverageMetrics(firstHalf);
  const secondHalfAvg = calculateAverageMetrics(secondHalf);

  const trends: any = {};
  
  // Calculate percentage changes
  Object.keys(firstHalfAvg).forEach(key => {
    if (firstHalfAvg[key] > 0) {
      const change = ((secondHalfAvg[key] - firstHalfAvg[key]) / firstHalfAvg[key]) * 100;
      trends[`${key}_trend`] = {
        change_percentage: change,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        first_half_avg: firstHalfAvg[key],
        second_half_avg: secondHalfAvg[key]
      };
    }
  });

  return trends;
}

// Helper function to calculate average metrics
function calculateAverageMetrics(metrics: any[]) {
  if (!metrics || metrics.length === 0) return {};

  const totals: any = {};
  let count = 0;

  metrics.forEach(metric => {
    count++;
    Object.keys(metric).forEach(key => {
      if (typeof metric[key] === 'number' && !isNaN(metric[key])) {
        totals[key] = (totals[key] || 0) + metric[key];
      }
    });
  });

  const averages: any = {};
  Object.keys(totals).forEach(key => {
    averages[key] = totals[key] / count;
  });

  return averages;
} 