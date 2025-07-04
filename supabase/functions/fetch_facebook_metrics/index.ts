// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as btoa } from "https://deno.land/std@0.177.0/encoding/base64.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const FB_API_VERSION = 'v19.0';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

async function fetchAndStoreMetrics() {
  // 1. Get all ad accounts and tokens
  const { data: adAccounts, error } = await supabase
    .from('ad_accounts')
    .select('user_id, fb_account_id, access_token');
  if (error) throw error;

  for (const acct of adAccounts) {
    // 2. Fetch campaigns for each account
    const now = new Date();
    const since = new Date(now.getTime() - 60 * 60 * 1000); // last hour
    const time_range = `since=${since.toISOString().slice(0, 19)}&until=${now.toISOString().slice(0, 19)}`;

    const campaignsRes = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/act_${acct.fb_account_id}/campaigns?fields=id,name,status&access_token=${acct.access_token}`
    );
    const campaigns = (await campaignsRes.json()).data || [];

    for (const campaign of campaigns) {
      // 3. Fetch campaign insights
      const insightsRes = await fetch(
        `https://graph.facebook.com/${FB_API_VERSION}/${campaign.id}/insights?fields=impressions,reach,clicks,ctr,cpc,cpm,frequency,spend,objective,actions,budget&${time_range}&access_token=${acct.access_token}`
      );
      const insights = (await insightsRes.json()).data?.[0];
      if (insights) {
        await supabase.from('ad_metrics').upsert({
          user_id: acct.user_id,
          fb_account_id: acct.fb_account_id,
          object_type: 'campaign',
          object_id: campaign.id,
          timestamp: now.toISOString(),
          impressions: parseInt(insights.impressions || '0'),
          reach: parseInt(insights.reach || '0'),
          clicks: parseInt(insights.clicks || '0'),
          ctr: parseFloat(insights.ctr || '0'),
          cpc: parseFloat(insights.cpc || '0'),
          cpm: parseFloat(insights.cpm || '0'),
          frequency: parseFloat(insights.frequency || '0'),
          spend: parseFloat(insights.spend || '0'),
          budget: parseFloat(insights.budget || '0'),
          conversions: Array.isArray(insights.actions) ? (insights.actions.find((a: any) => a.action_type === 'offsite_conversion')?.value || 0) : 0,
        });
        // Generate and store AI recommendation
        await generateAIRecommendation(insights, campaign, acct.user_id);
      }
    }
  }
}

async function generateAIRecommendation(metrics: any, campaign: any, user_id: string) {
  if (!OPENAI_API_KEY) return;
  const prompt = `You are a digital marketing coach. Given these Facebook ad campaign metrics: ${JSON.stringify(metrics)}, explain in plain language:\n- What's going well and what's not\n- Why these numbers matter\n- What the business owner should do next (step-by-step)\n- Use Zimbabwean context and avoid jargon`;
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
      max_tokens: 400,
      temperature: 0.7
    })
  });
  if (!response.ok) return;
  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content || '';
  if (summary) {
    await supabase.from('recommendations').insert({
      campaign_id: campaign.id,
      user_id,
      summary,
      suggestion: summary,
      ai_model: 'gpt-3.5-turbo'
    });
  }
}

serve(async (_req: Request) => {
  try {
    await fetchAndStoreMetrics();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}); 