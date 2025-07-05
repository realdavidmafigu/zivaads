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

    let totalCampaigns = 0
    let updatedCampaigns = 0

    for (const account of accounts) {
      try {
        // Fetch campaigns from Facebook API
        const response = await fetch(`https://graph.facebook.com/v18.0/${account.ad_account_id}/campaigns?access_token=${account.access_token}&fields=id,name,status,objective,created_time,updated_time`)
        
        if (!response.ok) {
          console.error(`Failed to fetch campaigns for account ${account.ad_account_id}`)
          continue
        }

        const data = await response.json()
        const campaigns = data.data || []

        totalCampaigns += campaigns.length

        for (const campaign of campaigns) {
          // Upsert campaign data
          const { error: upsertError } = await supabase
            .from('facebook_campaigns')
            .upsert({
              campaign_id: campaign.id,
              account_id: account.id,
              name: campaign.name,
              status: campaign.status,
              objective: campaign.objective,
              created_time: campaign.created_time,
              updated_time: campaign.updated_time,
              last_synced: new Date().toISOString()
            })

          if (!upsertError) {
            updatedCampaigns++
          }
        }
      } catch (error) {
        console.error(`Error syncing campaigns for account ${account.ad_account_id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Facebook campaigns synced successfully',
        totalCampaigns,
        updatedCampaigns
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in sync-facebook-campaigns:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 