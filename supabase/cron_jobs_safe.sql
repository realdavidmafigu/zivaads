-- Safe cron jobs setup with error handling
-- Run this in your Supabase SQL editor

-- First, check if we can create extensions
DO $$
BEGIN
  -- Enable the pg_cron extension
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  RAISE NOTICE 'pg_cron extension enabled successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to enable pg_cron extension: %', SQLERRM;
END $$;

-- Enable the http extension
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS http;
  RAISE NOTICE 'http extension enabled successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to enable http extension: %', SQLERRM;
END $$;

-- Remove existing cron jobs if they exist
SELECT cron.unschedule('sync-facebook-campaigns') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-facebook-campaigns'
);

SELECT cron.unschedule('generate-ai-alerts-morning') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-ai-alerts-morning'
);

SELECT cron.unschedule('generate-ai-alerts-afternoon') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-ai-alerts-afternoon'
);

SELECT cron.unschedule('generate-ai-alerts-evening') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-ai-alerts-evening'
);

-- Create cron job to sync Facebook campaigns every 2 hours
DO $$
BEGIN
  PERFORM cron.schedule(
    'sync-facebook-campaigns',
    '0 */2 * * *',
    $$
    SELECT net.http_post(
      url := 'https://yhcmazbibgwmvazuxgcl.supabase.co/functions/v1/sync-facebook-campaigns',
      headers := '{"Authorization": "Bearer YOUR_SUPABASE_ANON_KEY", "Content-Type": "application/json"}'::jsonb
    );
    $$
  );
  RAISE NOTICE 'Facebook campaigns sync job scheduled successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to schedule Facebook campaigns sync job: %', SQLERRM;
END $$;

-- Create cron job to generate AI alerts three times daily
DO $$
BEGIN
  -- Morning alert (8 AM)
  PERFORM cron.schedule(
    'generate-ai-alerts-morning',
    '0 8 * * *',
    $$
    SELECT net.http_post(
      url := 'https://yhcmazbibgwmvazuxgcl.supabase.co/functions/v1/generate-ai-alerts',
      headers := '{"Authorization": "Bearer YOUR_SUPABASE_ANON_KEY", "Content-Type": "application/json"}'::jsonb
    );
    $$
  );
  RAISE NOTICE 'Morning AI alerts job scheduled successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to schedule morning AI alerts job: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- Afternoon alert (2 PM)
  PERFORM cron.schedule(
    'generate-ai-alerts-afternoon',
    '0 14 * * *',
    $$
    SELECT net.http_post(
      url := 'https://yhcmazbibgwmvazuxgcl.supabase.co/functions/v1/generate-ai-alerts',
      headers := '{"Authorization": "Bearer YOUR_SUPABASE_ANON_KEY", "Content-Type": "application/json"}'::jsonb
    );
    $$
  );
  RAISE NOTICE 'Afternoon AI alerts job scheduled successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to schedule afternoon AI alerts job: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- Evening alert (8 PM)
  PERFORM cron.schedule(
    'generate-ai-alerts-evening',
    '0 20 * * *',
    $$
    SELECT net.http_post(
      url := 'https://yhcmazbibgwmvazuxgcl.supabase.co/functions/v1/generate-ai-alerts',
      headers := '{"Authorization": "Bearer YOUR_SUPABASE_ANON_KEY", "Content-Type": "application/json"}'::jsonb
    );
    $$
  );
  RAISE NOTICE 'Evening AI alerts job scheduled successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to schedule evening AI alerts job: %', SQLERRM;
END $$;

-- Show current cron jobs
SELECT jobname, schedule, active FROM cron.job; 