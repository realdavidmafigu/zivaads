import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { OPENAI_API_KEY } from '@/config/openai';
import OpenAI from 'openai';

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
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
      .limit(10);

    // Get current date and time for context
    const now = new Date();

    // Generate AI-powered local insights only
    const insights = await generateLocalInsights(now, campaigns || []);

    return NextResponse.json({
      success: true,
      insights,
      generatedAt: now.toISOString(),
      aiPowered: true
    });

  } catch (error) {
    console.error('Error generating AI local insights:', error);
    
    // Return specific error for AI failures
    if (error instanceof Error && error.message.includes('Failed to generate AI insights')) {
      return NextResponse.json(
        { 
          error: 'AI insights generation failed. Please check your OpenAI API configuration.',
          details: error.message
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateLocalInsights(currentDate: Date, campaigns: any[]): Promise<LocalInsight[]> {
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

  // Check if OpenAI API key is configured
  if (!OPENAI_API_KEY) {
    console.log('⚠️ OpenAI API key not configured, showing setup message');
    return [{
      id: 'ai-not-configured',
      type: 'market',
      title: '🤖 AI Insights Not Configured',
      description: 'OpenAI API key is not set. Please configure it to get AI-powered insights.',
      impact: 'You\'re missing personalized campaign analysis based on Zimbabwean context.',
      recommendation: 'Add your OpenAI API key to .env.local file to enable AI insights.',
      priority: 'high',
      icon: '🤖',
      color: 'red'
    }];
  }

  // Generate AI-powered insights only
  console.log('🤖 Generating AI-powered local insights...');
  const aiInsights = await generateAILocalInsights(context, campaigns);
  
  if (aiInsights && aiInsights.length > 0) {
    console.log('✅ Generated AI-powered local insights');
    return aiInsights.slice(0, 3); // Return max 3 insights
  } else {
    console.log('❌ No AI insights generated');
    throw new Error('Failed to generate AI insights');
  }
}

async function generateAILocalInsights(context: any, campaigns: any[]): Promise<LocalInsight[]> {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // Prepare campaign performance data
    const campaignData = campaigns.map(campaign => ({
      name: campaign.name,
      status: campaign.status,
      spend: Number(campaign.spend) || 0,
      clicks: Number(campaign.clicks) || 0,
      impressions: Number(campaign.impressions) || 0,
      ctr: Number(campaign.ctr) || 0,
      cpc: Number(campaign.cpc) || 0,
    }));

    // Calculate aggregate metrics
    const totalSpend = campaignData.reduce((sum, c) => sum + c.spend, 0);
    const totalClicks = campaignData.reduce((sum, c) => sum + c.clicks, 0);
    const totalImpressions = campaignData.reduce((sum, c) => sum + c.impressions, 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

    // Create AI prompt for Zimbabwean context
    const prompt = `You are an expert marketing analyst specializing in Zimbabwean digital advertising. Analyze the following campaign data and local context to provide actionable insights.

**Current Local Context:**
- Time: ${context.currentTime} (Zimbabwe time)
- Hour: ${context.hour}:00
- Day of week: ${getDayName(context.dayOfWeek)}
- Month-end period: ${context.isMonthEnd ? 'Yes' : 'No'}
- Month-start period: ${context.isMonthStart ? 'Yes' : 'No'}

**Campaign Performance:**
- Total campaigns: ${context.campaignCount}
- Active campaigns: ${context.activeCampaigns}
- Total spend: $${totalSpend.toFixed(2)}
- Total clicks: ${totalClicks}
- Total impressions: ${totalImpressions}
- Average CTR: ${avgCTR.toFixed(2)}%
- Average CPC: $${avgCPC.toFixed(2)}

**Individual Campaigns:**
${campaignData.map(c => `- ${c.name}: $${c.spend} spend, ${c.clicks} clicks, ${c.ctr.toFixed(2)}% CTR, $${c.cpc.toFixed(2)} CPC`).join('\n')}

**Zimbabwean Factors to Consider:**
1. **Power Outages (ZESA Load Shedding)**: Common during 6-10 AM and 6-10 PM on weekdays
2. **Economic Cycles**: Month-end (25th-31st) sees increased spending, month-start (1st-5th) sees budget recovery
3. **Social Behavior**: Peak social media usage 6-10 PM, weekend shopping patterns
4. **Mobile-First**: 95% of users access via mobile devices
5. **Local Preferences**: Zimbabweans value authenticity, local language, and cultural relevance

**Task:** Generate 3 specific, actionable insights that combine campaign performance data with Zimbabwean local context. Each insight should include:
- A clear title with an emoji
- Description of the situation
- Impact on ad performance
- Specific recommendation for action
- Priority level (high/medium/low)
- Type (power/economic/social/market)

Format your response as a JSON array with this structure:
[
  {
    "id": "unique-id",
    "type": "economic|social|power|market",
    "title": "Title with emoji",
    "description": "Description of the situation",
    "impact": "How this affects ad performance",
    "recommendation": "Specific action to take",
    "priority": "high|medium|low",
    "icon": "relevant emoji",
    "color": "red|green|yellow|blue|purple"
  }
]

Focus on insights that are specific to Zimbabwean context and actionable for the business owner.`;

    console.log('🤖 Generating AI-powered local insights...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing analyst specializing in Zimbabwean digital advertising. Provide specific, actionable insights that combine campaign data with local context.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response
    try {
      const aiInsights = JSON.parse(response);
      console.log('✅ Successfully parsed AI insights:', aiInsights);
      return aiInsights;
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.log('Raw AI response:', response);
      
      // Try to extract insights from text response
      return extractInsightsFromText(response, context);
    }

  } catch (error) {
    console.error('❌ Error generating AI insights:', error);
    throw error;
  }
}

function extractInsightsFromText(text: string, context: any): LocalInsight[] {
  // Fallback parsing for when AI doesn't return proper JSON
  const insights: LocalInsight[] = [];
  
  // Simple pattern matching to extract insights
  const lines = text.split('\n');
  let currentInsight: any = {};
  
  for (const line of lines) {
    if (line.includes('"title"') || line.includes('Title:')) {
      if (currentInsight.title) {
        insights.push(currentInsight);
      }
      currentInsight = {
        id: `ai-insight-${insights.length + 1}`,
        type: 'market',
        priority: 'medium',
        icon: '🧠',
        color: 'blue'
      };
    }
    
    if (line.includes('"title"') || line.includes('Title:')) {
      currentInsight.title = line.split(':')[1]?.trim().replace(/"/g, '') || 'AI Insight';
    } else if (line.includes('"description"') || line.includes('Description:')) {
      currentInsight.description = line.split(':')[1]?.trim().replace(/"/g, '') || '';
    } else if (line.includes('"impact"') || line.includes('Impact:')) {
      currentInsight.impact = line.split(':')[1]?.trim().replace(/"/g, '') || '';
    } else if (line.includes('"recommendation"') || line.includes('Recommendation:')) {
      currentInsight.recommendation = line.split(':')[1]?.trim().replace(/"/g, '') || '';
    }
  }
  
  if (currentInsight.title) {
    insights.push(currentInsight);
  }
  
  return insights;
}

function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
} 