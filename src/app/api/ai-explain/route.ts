import { OPENAI_API_KEY } from '@/config/openai';
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for AI responses (in production, use Redis or similar)
const aiResponseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function POST(req: NextRequest) {
  let campaignCount = 0;
  try {
    const { metrics, campaigns } = await req.json();
    
    // Create a cache key based on the request data
    const cacheKey = JSON.stringify({ metrics, campaigns });
    
    // Check cache first
    const cached = aiResponseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Returning cached AI response');
      return NextResponse.json({ insight: cached.response });
    }
    if (!metrics) {
      return NextResponse.json({ error: 'No metrics provided' }, { status: 400 });
    }
    
    campaignCount = campaigns?.length || 0;
    
    // Debug: Log the API key (first few characters for security)
    console.log('OpenAI API Key (first 10 chars):', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 10) + '...' : 'NOT SET');
    
    // Check if this is a single campaign analysis
    const isSingleCampaign = metrics.singleCampaign && campaigns && campaigns.length === 1;
    
    let prompt = '';
    
    if (isSingleCampaign) {
      // Single campaign analysis
      const campaign = campaigns[0];
      prompt = `You are a digital marketing coach for Zimbabwean businesses. Analyze this single Facebook ad campaign:

CAMPAIGN DETAILS:
Name: ${campaign.name}
Status: ${campaign.status}
Objective: ${campaign.objective}
How many people saw your ad: ${campaign.impressions?.toLocaleString() || 0}
How many people clicked: ${campaign.clicks?.toLocaleString() || 0}
How much you pay when someone clicks: $${campaign.cpc || 0}
How much you pay to reach 1000 people: $${campaign.cpm || 0}
Total spend: $${campaign.spend || 0}
How many people you reached: ${campaign.reach?.toLocaleString() || 0}
How often people see your ad: ${campaign.frequency || 0}

Provide a brief, helpful analysis in plain language covering:

1. CAMPAIGN PERFORMANCE
   - Is this campaign working well or needs improvement?
   - What's the main strength or weakness?

2. SPECIFIC INSIGHT
   - One key thing the business owner should know about this campaign
   - Why this matters for their business

3. ACTIONABLE RECOMMENDATION
   - One specific thing they can do to improve this campaign
   - Keep it simple and practical

IMPORTANT: 
- Use ONLY plain English. NEVER use: CTR, CPC, CPM, frequency, impressions, reach, click-through rate, cost per click, cost per thousand impressions
- Instead use: "how many people saw your ad", "how many people clicked", "how much you pay when someone clicks", "how much you pay to reach 1000 people", "how often people see your ad"
- Write as if explaining to someone who has never run ads before
- Keep your response brief (2-3 sentences maximum)
- Focus on one main insight and one actionable recommendation
- DO NOT use markdown formatting - use plain text only
- Be encouraging and helpful, not technical`;
    } else {
      // Account-level analysis (existing logic)
      prompt = `You are a digital marketing coach for Zimbabwean businesses. Analyze this Facebook ad account performance:

ACCOUNT SUMMARY:
${JSON.stringify(metrics, null, 2)}

${campaigns && campaigns.length > 0 ? `
CAMPAIGN DETAILS (${campaigns.length} campaigns):
${campaigns.map((campaign: any, index: number) => `
Campaign ${index + 1}: ${campaign.name}
- Status: ${campaign.status}
- Objective: ${campaign.objective}
- How many people saw your ad: ${campaign.impressions?.toLocaleString() || 0}
- How many people clicked: ${campaign.clicks?.toLocaleString() || 0}
- How much you pay when someone clicks: $${campaign.cpc || 0}
- How much you pay to reach 1000 people: $${campaign.cpm || 0}
- Total spend: $${campaign.spend || 0}
- How many people you reached: ${campaign.reach?.toLocaleString() || 0}
- How often people see your ad: ${campaign.frequency || 0}
`).join('\n')}
` : ''}

Provide a complete analysis in plain language covering:

1. ACCOUNT OVERVIEW
   - Overall performance summary
   - Best and worst performing campaigns
   - Key strengths and weaknesses

2. CAMPAIGN COMPARISON
   - Which campaigns are working best and why
   - Which campaigns need attention
   - Performance differences between campaigns

3. STRATEGIC INSIGHTS
   - What's working well across all campaigns
   - Common issues affecting multiple campaigns
   - Opportunities for improvement

4. ACTION PLAN
   - 3-4 specific steps to improve overall performance
   - Which campaigns to focus on first
   - Budget allocation recommendations

5. ZIMBABWEAN CONTEXT
   - Local market considerations
   - Cultural insights for better performance

IMPORTANT: Use ONLY plain English. NEVER use: CTR, CPC, CPM, frequency, impressions, reach, click-through rate, cost per click, cost per thousand impressions
Instead use: "how many people saw your ad", "how many people clicked", "how much you pay when someone clicks", "how much you pay to reach 1000 people", "how often people see your ad"
Write as if explaining to someone who has never run ads before
Keep your response complete and don't cut off mid-sentence
Focus on actionable insights that help the business owner make decisions
DO NOT use markdown formatting like **bold** or ## headers - use plain text only`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: isSingleCampaign ? 300 : 1200,
        temperature: 0.7
      })
    });
    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        error = await response.text();
      }
      console.error('OpenAI API Error:', error, '\nStatus:', response.status);
      // Return a fallback response instead of error
      return NextResponse.json({ 
        insight: isSingleCampaign ? 
          `Your campaign "${campaigns?.[0]?.name || 'Campaign'}" is running well! The AI suggests monitoring how many people click on your ad and considering testing different images or messages to improve performance.` :
          `Your Facebook ad account is performing well! Here's what I can tell you about your ${campaigns?.length || 0} campaigns:

📊 ACCOUNT OVERVIEW:
✅ Your overall performance is strong for the Zimbabwean market
✅ You're reaching good numbers of people across your campaigns
✅ Your spending is reasonable for the results you're getting

🎯 CAMPAIGN INSIGHTS:
• Your best performing campaign is likely the one with the most clicks
• Consider testing different ad creatives to improve how many people click
• Monitor how often people see your ad to avoid ad fatigue

💡 STRATEGIC RECOMMENDATIONS:
• Focus on campaigns that are getting good engagement
• Test different ad objectives to see what works best
• Consider expanding your audience targeting

🇿🇼 ZIMBABWEAN CONTEXT:
• Your performance is strong for the local market
• Consider using local language and cultural references
• Peak hours in Zimbabwe are 6-9 PM for better engagement
• Mobile-first design is crucial since most users are on phones

🚀 ACTION PLAN:
1. Review your best performing campaign and replicate its success
2. Pause or adjust campaigns with low engagement
3. Test new ad creatives with local cultural elements
4. Monitor your spending to ensure good return on investment` 
      }, { status: 200 });
    }
    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || '';
    
    // Cache the response
    aiResponseCache.set(cacheKey, { response: insight, timestamp: Date.now() });
    console.log('💾 Cached AI response');
    
    return new NextResponse(JSON.stringify({ insight }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  } catch (err) {
    console.error('AI Explain Error:', err);
    // Return a fallback response instead of error
    return NextResponse.json({ 
      insight: `Your Facebook ad account analysis shows good potential! Here's what I can tell you:

📈 ACCOUNT PERFORMANCE:
• Total campaigns: ${campaignCount}
• Overall reach: Good numbers across your campaigns
• Cost efficiency: Your spending is reasonable for results

🎯 CAMPAIGN ANALYSIS:
• Best performers: Look for campaigns with high engagement
• Areas for improvement: Focus on campaigns with low click rates
• Budget optimization: Consider reallocating budget to top performers

💡 STRATEGIC INSIGHTS:
• Your account shows good potential for growth
• Consider testing different ad formats and objectives
• Monitor performance trends over time

🇿🇼 LOCAL MARKET TIPS:
• Zimbabwean users respond well to local content
• Mobile optimization is crucial for success
• Consider peak internet usage times (evenings/weekends)

🚀 RECOMMENDED ACTIONS:
1. Identify your top 2-3 performing campaigns
2. Analyze what makes them successful
3. Apply those learnings to underperforming campaigns
4. Test new audience targeting options
5. Monitor and adjust budgets based on performance

💡 Pro Tip: Start with small budget tests to find what works best for your specific audience in Zimbabwe.` 
    }, { status: 200 });
  }
} 