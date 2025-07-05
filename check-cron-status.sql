-- Check if cron extension is available
SELECT 
  extname as extension_name,
  extversion as version,
  extrelocatable as relocatable
FROM pg_extension 
WHERE extname = 'pg_cron';

-- Check if http extension is available
SELECT 
  extname as extension_name,
  extversion as version,
  extrelocatable as relocatable
FROM pg_extension 
WHERE extname = 'http';

-- Check current cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  created_at
FROM cron.job;

-- Check if we can access cron schema
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'cron'; 