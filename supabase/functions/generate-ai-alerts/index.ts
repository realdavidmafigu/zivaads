import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables')
    }

    // Get Facebook accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('facebook_accounts')
      .select('*')

    if (accountsError) {
      throw new Error(`Failed to fetch Facebook accounts: ${accountsError.message}`)
    }

    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No Facebook accounts found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get campaigns with performance data
    const { data: campaigns, error: campaignsError } = await supabase
      .from('facebook_campaigns')
      .select(`
        *,
        facebook_accounts!inner(*)
      `)
      .eq('status', 'ACTIVE')

    if (campaignsError) {
      throw new Error(`Failed to fetch campaigns: ${campaignsError.message}`)
    }

    if (!campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active campaigns found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate AI alert
    const campaignData = campaigns.map(campaign => ({
      name: campaign.name,
      status: campaign.status,
      spend: campaign.spend || 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0
    }))

    const prompt = `Analyze these Facebook ad campaigns and provide a brief, actionable insight:

Campaigns:
${campaignData.map(c => `- ${c.name}: $${c.spend} spent, ${c.impressions} impressions, ${c.clicks} clicks, ${c.status}`).join('\n')}

Provide a helpful, encouraging message about their ad performance in 1-2 sentences. Focus on what's working well and suggest one improvement.`

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error('Failed to generate AI alert')
    }

    const openaiData = await openaiResponse.json()
    const alertMessage = openaiData.choices[0].message.content

    // Create alert in database
    const { error: alertError } = await supabase
      .from('ai_alerts')
      .insert({
        message: alertMessage,
        type: 'daily',
        created_at: new Date().toISOString()
      })

    if (alertError) {
      throw new Error(`Failed to save alert: ${alertError.message}`)
    }

    // Send WhatsApp notification if configured
    const whatsappPhone = Deno.env.get('WHATSAPP_PHONE')
    if (whatsappPhone) {
      try {
        const whatsappToken = Deno.env.get('WHATSAPP_TOKEN')
        const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_ID')
        
        if (whatsappToken && whatsappPhoneId) {
          await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: whatsappPhone,
              type: 'text',
              text: { body: alertMessage }
            }),
          })
        }
      } catch (error) {
        console.error('Failed to send WhatsApp notification:', error)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'AI alert generated and sent successfully',
        alert: alertMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-ai-alerts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 