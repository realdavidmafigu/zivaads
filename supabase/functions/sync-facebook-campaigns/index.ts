import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to add delay between requests
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Facebook accounts (only active ones)
    const { data: accounts, error: accountsError } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('is_active', true)

    if (accountsError) {
      throw new Error(`Failed to fetch Facebook accounts: ${accountsError.message}`)
    }

    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({
        message: 'No active Facebook accounts found'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    let totalCampaigns = 0
    let updatedCampaigns = 0
    let failedAccounts = 0
    let tokenErrors = 0
    let permissionErrors = 0
    let rateLimitErrors = 0

    for (const account of accounts) {
      // Validate account data
      if (!account.facebook_account_id || !account.access_token) {
        console.error(`Invalid account data for account ID: ${account.id}`)
        failedAccounts++
        continue
      }

      try {
        // Add delay between requests to avoid rate limiting (200ms between each account)
        await delay(200)

        // Fetch campaigns from Facebook API
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${account.facebook_account_id}/campaigns?access_token=${account.access_token}&fields=id,name,status,objective,created_time,updated_time`
        )
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Failed to fetch campaigns for account ${account.facebook_account_id}: ${response.status} ${response.statusText} - ${errorText}`)
          
          // Check for specific error types
          if (response.status === 403) {
            rateLimitErrors++
            console.error(`Rate limit reached for account ${account.facebook_account_id}. Consider reducing sync frequency.`)
            // Skip this account for now, don't count as failed
            continue
          } else if (response.status === 400) {
            tokenErrors++
            console.error(`Token/permission issue for account ${account.facebook_account_id}. Consider refreshing the access token.`)
          }
          
          failedAccounts++
          continue
        }

        const data = await response.json()
        
        if (data.error) {
          console.error(`Facebook API error for account ${account.facebook_account_id}:`, data.error)
          
          // Check for specific error types
          if (data.error.code === 190 || data.error.error_subcode === 463) {
            tokenErrors++
            console.error(`Token expired for account ${account.facebook_account_id}. Please refresh the access token.`)
          } else if (data.error.code === 100 && data.error.error_subcode === 33) {
            permissionErrors++
            console.error(`Permission issue for account ${account.facebook_account_id}. Missing ads_read permission or not an ad account.`)
          } else if (data.error.code === 4) {
            rateLimitErrors++
            console.error(`Rate limit reached for account ${account.facebook_account_id}. Consider reducing sync frequency.`)
            // Skip this account for now, don't count as failed
            continue
          }
          
          failedAccounts++
          continue
        }

        const campaigns = data.data || []
        totalCampaigns += campaigns.length

        for (const campaign of campaigns) {
          try {
            // First check if campaign already exists
            const { data: existingCampaign } = await supabase
              .from('campaigns')
              .select('id')
              .eq('facebook_account_id', account.id)
              .eq('facebook_campaign_id', campaign.id)
              .single()

            if (existingCampaign) {
              // Update existing campaign
              const { error: updateError } = await supabase
                .from('campaigns')
                .update({
                  name: campaign.name,
                  status: campaign.status,
                  objective: campaign.objective,
                  created_time: campaign.created_time,
                  last_sync_at: new Date().toISOString()
                })
                .eq('id', existingCampaign.id)

              if (updateError) {
                console.error(`Failed to update campaign ${campaign.id}:`, updateError)
              } else {
                updatedCampaigns++
              }
            } else {
              // Insert new campaign
              const { error: insertError } = await supabase
                .from('campaigns')
                .insert({
                  user_id: account.user_id,
                  facebook_account_id: account.id,
                  facebook_campaign_id: campaign.id,
                  name: campaign.name,
                  status: campaign.status,
                  objective: campaign.objective,
                  created_time: campaign.created_time,
                  last_sync_at: new Date().toISOString()
                })

              if (insertError) {
                console.error(`Failed to insert campaign ${campaign.id}:`, insertError)
              } else {
                updatedCampaigns++
              }
            }
          } catch (campaignError) {
            console.error(`Error processing campaign ${campaign.id}:`, campaignError)
          }
        }

        // Update last_sync_at for the account
        await supabase
          .from('facebook_accounts')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', account.id)

      } catch (error) {
        console.error(`Error syncing campaigns for account ${account.facebook_account_id}:`, error)
        failedAccounts++
      }
    }

    return new Response(JSON.stringify({
      message: 'Facebook campaigns sync completed',
      totalAccounts: accounts.length,
      successfulAccounts: accounts.length - failedAccounts,
      failedAccounts,
      tokenErrors,
      permissionErrors,
      rateLimitErrors,
      totalCampaigns,
      updatedCampaigns,
      recommendations: rateLimitErrors > 0 ? 'Consider reducing sync frequency or implementing exponential backoff' : undefined
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error in sync-facebook-campaigns:', error)
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}) 