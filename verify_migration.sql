-- Migration Verification Script
-- Run these queries manually to verify your migration worked correctly

-- 1. Check if all required tables exist
SELECT 
    'Table Existence Check' as check_type,
    table_name,
    CASE 
        WHEN table_name IN ('users', 'facebook_accounts', 'campaigns', 'campaign_metrics', 'ad_sets', 'ad_set_metrics', 'ads', 'ad_metrics', 'alerts', 'performance_snapshots', 'sync_logs', 'recommendations') 
        THEN '✅ Required'
        ELSE '⚠️ Optional'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'facebook_accounts', 'campaigns', 'campaign_metrics', 'ad_sets', 'ad_set_metrics', 'ads', 'ad_metrics', 'alerts', 'performance_snapshots', 'sync_logs', 'recommendations')
ORDER BY table_name;

-- 2. Check alerts table structure (the one that was causing the error)
SELECT 
    'Alerts Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'ad_id' THEN '✅ This was the missing column!'
        WHEN column_name IN ('id', 'user_id', 'campaign_id', 'ad_set_id', 'ad_id') THEN '✅ Foreign key column'
        ELSE '✅ Standard column'
    END as notes
FROM information_schema.columns 
WHERE table_name = 'alerts' 
ORDER BY ordinal_position;

-- 3. Check if campaign_metrics table has the right structure
SELECT 
    'Campaign Metrics Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('metric_timestamp', 'metric_date', 'metric_hour') THEN '✅ Time tracking columns'
        WHEN column_name IN ('impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'spend') THEN '✅ Performance metrics'
        WHEN column_name = 'is_latest' THEN '✅ Latest flag for queries'
        WHEN column_name = 'data_source' THEN '✅ Source tracking'
        ELSE '✅ Standard column'
    END as notes
FROM information_schema.columns 
WHERE table_name = 'campaign_metrics' 
ORDER BY ordinal_position;

-- 4. Check data counts
SELECT 
    'Data Counts' as check_type,
    'campaigns' as table_name,
    COUNT(*) as record_count
FROM campaigns
UNION ALL
SELECT 
    'Data Counts' as check_type,
    'campaign_metrics' as table_name,
    COUNT(*) as record_count
FROM campaign_metrics
UNION ALL
SELECT 
    'Data Counts' as check_type,
    'alerts' as table_name,
    COUNT(*) as record_count
FROM alerts
UNION ALL
SELECT 
    'Data Counts' as check_type,
    'facebook_accounts' as table_name,
    COUNT(*) as record_count
FROM facebook_accounts;

-- 5. Check if old performance columns still exist in campaigns table (they shouldn't)
SELECT 
    'Old Schema Check' as check_type,
    column_name,
    CASE 
        WHEN column_name IN ('impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'spend', 'reach', 'frequency', 'conversions') 
        THEN '⚠️ Should be removed (performance data moved to campaign_metrics)'
        ELSE '✅ Metadata column (keep)'
    END as status
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND column_name IN ('impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'spend', 'reach', 'frequency', 'conversions');

-- 6. Check if indexes were created
SELECT 
    'Index Check' as check_type,
    indexname,
    tablename,
    CASE 
        WHEN indexname LIKE 'idx_%' THEN '✅ Custom index'
        ELSE '✅ System index'
    END as index_type
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('campaigns', 'campaign_metrics', 'alerts', 'facebook_accounts')
ORDER BY tablename, indexname;

-- 7. Check RLS policies
SELECT 
    'RLS Policy Check' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('campaigns', 'campaign_metrics', 'alerts', 'facebook_accounts')
ORDER BY tablename, policyname;

-- 8. Test the backward compatibility view
SELECT 
    'Backward Compatibility Test' as check_type,
    COUNT(*) as campaigns_with_metrics,
    COUNT(CASE WHEN impressions > 0 OR clicks > 0 OR spend > 0 THEN 1 END) as campaigns_with_data
FROM campaigns_with_metrics;

-- 9. Check if triggers exist
SELECT 
    'Trigger Check' as check_type,
    trigger_name,
    event_object_table,
    action_statement,
    CASE 
        WHEN trigger_name LIKE '%updated_at%' THEN '✅ Auto-update trigger'
        WHEN trigger_name LIKE '%latest%' THEN '✅ Latest metrics trigger'
        ELSE '✅ Other trigger'
    END as trigger_type
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('campaigns', 'campaign_metrics', 'alerts')
ORDER BY event_object_table, trigger_name;

-- 10. Sample data verification
SELECT 
    'Sample Data Check' as check_type,
    'campaigns' as table_name,
    COUNT(*) as total_campaigns,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_campaigns,
    COUNT(CASE WHEN status = 'PAUSED' THEN 1 END) as paused_campaigns
FROM campaigns
UNION ALL
SELECT 
    'Sample Data Check' as check_type,
    'campaign_metrics' as table_name,
    COUNT(*) as total_metrics,
    COUNT(CASE WHEN is_latest = true THEN 1 END) as latest_metrics,
    COUNT(CASE WHEN data_source = 'migration' THEN 1 END) as migrated_metrics
FROM campaign_metrics;

-- 11. Test a simple query to make sure everything works
SELECT 
    'Functionality Test' as check_type,
    c.name as campaign_name,
    c.status,
    COALESCE(cm.impressions, 0) as impressions,
    COALESCE(cm.clicks, 0) as clicks,
    COALESCE(cm.ctr, 0) as ctr,
    COALESCE(cm.spend, 0) as spend,
    cm.data_source,
    cm.metric_timestamp
FROM campaigns c
LEFT JOIN campaign_metrics cm ON c.id = cm.campaign_id AND cm.is_latest = true
LIMIT 5; 