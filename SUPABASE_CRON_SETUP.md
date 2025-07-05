# Supabase Cron Jobs Setup Guide

This guide explains how to set up cron jobs in Supabase to replace the Vercel cron jobs that require a paid plan.

## Overview

We've created two Supabase Edge Functions that can be triggered by cron jobs:
1. `sync-facebook-campaigns` - Syncs Facebook campaign data every 30 minutes
2. `generate-ai-alerts` - Generates AI alerts three times daily

## Prerequisites

1. **Supabase Project**: You need a Supabase project with the following extensions enabled:
   - `pg_cron` (for scheduling)
   - `http` (for making HTTP requests)

2. **Environment Variables**: Set these in your Supabase project settings:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `WHATSAPP_TOKEN` - Your WhatsApp Business API token (optional)
   - `WHATSAPP_PHONE_ID` - Your WhatsApp phone number ID (optional)
   - `WHATSAPP_PHONE` - The phone number to send alerts to (optional)

## Setup Steps

### 1. Deploy Edge Functions

First, deploy the Edge Functions to your Supabase project:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the functions
supabase functions deploy sync-facebook-campaigns
supabase functions deploy generate-ai-alerts
```

### 2. Set Environment Variables

In your Supabase dashboard:
1. Go to Settings → Edge Functions
2. Add the following environment variables:
   - `OPENAI_API_KEY`
   - `WHATSAPP_TOKEN` (optional)
   - `WHATSAPP_PHONE_ID` (optional)
   - `WHATSAPP_PHONE` (optional)

### 3. Enable Extensions

Run this SQL in your Supabase SQL editor:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;
```

### 4. Set Up Cron Jobs

Update the `supabase/cron_jobs.sql` file with your actual project details:

1. Replace `your-project-ref` with your actual Supabase project reference
2. Replace `your-anon-key` with your actual anon/public key

Then run the SQL in your Supabase SQL editor.

## Cron Schedule

- **Facebook Campaign Sync**: Every 30 minutes (`*/30 * * * *`)
- **AI Alerts**: Three times daily
  - Morning: 8:00 AM (`0 8 * * *`)
  - Afternoon: 2:00 PM (`0 14 * * *`)
  - Evening: 8:00 PM (`0 20 * * *`)

## Monitoring

You can monitor your cron jobs in the Supabase dashboard:

1. Go to Database → Logs
2. Filter by "cron" to see cron job executions
3. Check Edge Function logs for any errors

## Troubleshooting

### Common Issues

1. **Function not found**: Make sure you've deployed the Edge Functions
2. **Authentication errors**: Verify your anon key is correct
3. **Environment variables missing**: Check that all required env vars are set
4. **Extensions not enabled**: Run the extension creation SQL

### Testing Functions

You can test the functions manually:

```bash
# Test sync function
curl -X POST https://your-project-ref.supabase.co/functions/v1/sync-facebook-campaigns \
  -H "Authorization: Bearer your-anon-key"

# Test AI alerts function
curl -X POST https://your-project-ref.supabase.co/functions/v1/generate-ai-alerts \
  -H "Authorization: Bearer your-anon-key"
```

## Cost Considerations

- **Supabase Free Tier**: Includes 500,000 Edge Function invocations per month
- **Cron Jobs**: Free with pg_cron extension
- **HTTP Requests**: Minimal cost for external API calls

## Migration from Vercel

Since we removed `vercel.json`, your Vercel deployment should now work without the cron job errors. The cron functionality is now handled entirely by Supabase.

## Security Notes

- The Edge Functions use the service role key for database access
- Environment variables are encrypted in Supabase
- Functions include CORS headers for web access
- All external API calls are properly authenticated 