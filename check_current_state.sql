-- Check Current Database State
-- This script checks what actually exists without assuming anything

-- 1. Check what tables exist
SELECT 
    'Existing Tables' as check_type,
    table_name,
    '✅ Exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'facebook_accounts', 'campaigns', 'campaign_metrics', 'ad_sets', 'ad_set_metrics', 'ads', 'ad_metrics', 'alerts', 'performance_snapshots', 'sync_logs', 'recommendations')
ORDER BY table_name;

-- 2. Check what tables are missing
SELECT 
    'Missing Tables' as check_type,
    table_name,
    '❌ Missing' as status
FROM (
    VALUES 
        ('users'),
        ('facebook_accounts'),
        ('campaigns'),
        ('campaign_metrics'),
        ('ad_sets'),
        ('ad_set_metrics'),
        ('ads'),
        ('ad_metrics'),
        ('alerts'),
        ('performance_snapshots'),
        ('sync_logs'),
        ('recommendations')
) AS required_tables(table_name)
WHERE table_name NOT IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
);

-- 3. Check campaigns table structure (if it exists)
SELECT 
    'Campaigns Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
ORDER BY ordinal_position;

-- 4. Check alerts table structure (if it exists)
SELECT 
    'Alerts Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'alerts' 
ORDER BY ordinal_position;

-- 5. Check if we have any data in existing tables
SELECT 
    'Data Counts' as check_type,
    table_name,
    CASE 
        WHEN table_name = 'campaigns' THEN (SELECT COUNT(*)::text FROM campaigns)
        WHEN table_name = 'alerts' THEN (SELECT COUNT(*)::text FROM alerts)
        WHEN table_name = 'facebook_accounts' THEN (SELECT COUNT(*)::text FROM facebook_accounts)
        WHEN table_name = 'users' THEN (SELECT COUNT(*)::text FROM users)
        ELSE 'N/A'
    END as record_count
FROM (
    SELECT 'campaigns' as table_name
    UNION ALL SELECT 'alerts'
    UNION ALL SELECT 'facebook_accounts'
    UNION ALL SELECT 'users'
) AS tables_to_check
WHERE table_name IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
);

-- 6. Check if the ad_id column exists in alerts table
SELECT 
    'Alerts ad_id Column Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'alerts' AND column_name = 'ad_id'
        ) THEN '✅ ad_id column exists'
        ELSE '❌ ad_id column missing'
    END as status;

-- 7. Check if performance columns exist in campaigns table
SELECT 
    'Old Performance Columns Check' as check_type,
    column_name,
    CASE 
        WHEN column_name IN ('impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'spend', 'reach', 'frequency', 'conversions') 
        THEN '⚠️ Old performance column (should be moved to metrics table)'
        ELSE '✅ Metadata column'
    END as status
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND column_name IN ('impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'spend', 'reach', 'frequency', 'conversions');

-- 8. Check if any indexes exist
SELECT 
    'Index Check' as check_type,
    indexname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('campaigns', 'alerts', 'facebook_accounts')
ORDER BY tablename, indexname;

-- 9. Check if RLS is enabled on existing tables
SELECT 
    'RLS Check' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('campaigns', 'alerts', 'facebook_accounts');

-- 10. Summary of what needs to be done
SELECT 
    'Migration Status Summary' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_metrics') 
        THEN '✅ campaign_metrics table exists'
        ELSE '❌ Need to create campaign_metrics table'
    END as campaign_metrics_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'ad_id') 
        THEN '✅ ad_id column exists in alerts'
        ELSE '❌ Need to add ad_id column to alerts'
    END as ad_id_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name IN ('impressions', 'clicks', 'spend')) 
        THEN '⚠️ Old performance columns still exist (need migration)'
        ELSE '✅ No old performance columns (good)'
    END as old_schema_status; 