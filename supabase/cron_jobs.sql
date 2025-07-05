-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cron job to sync Facebook campaigns every 2 hours (reduced frequency to avoid rate limiting)
SELECT cron.schedule(
  'sync-facebook-campaigns',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yhcmazbibgwmvazuxgcl.supabase.co/functions/v1/sync-facebook-campaigns',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzAsImV4cCI6MjA1MDU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- Cron job to generate AI alerts three times daily (8 AM, 2 PM, 8 PM)
SELECT cron.schedule(
  'generate-ai-alerts-morning',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yhcmazbibgwmvazuxgcl.supabase.co/functions/v1/generate-ai-alerts',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzAsImV4cCI6MjA1MDU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'generate-ai-alerts-afternoon',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yhcmazbibgwmvazuxgcl.supabase.co/functions/v1/generate-ai-alerts',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzAsImV4cCI6MjA1MDU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'generate-ai-alerts-evening',
  '0 20 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yhcmazbibgwmvazuxgcl.supabase.co/functions/v1/generate-ai-alerts',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzAsImV4cCI6MjA1MDU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- Enable the http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS http; 