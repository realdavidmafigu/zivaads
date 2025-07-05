-- Fixed Database Migration Script for ZivaAds
-- This script safely migrates from the old schema to the new schema with separated campaign metadata and metrics

-- Step 1: Check if we're running this migration for the first time
DO $$
BEGIN
    -- Check if campaign_metrics table already exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaign_metrics') THEN
        RAISE NOTICE 'Creating new campaign_metrics table...';
        
        -- Create the new campaign_metrics table
        CREATE TABLE campaign_metrics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
            
            -- Timestamp for this metric snapshot
            metric_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            metric_date DATE NOT NULL, -- For daily aggregations
            metric_hour INTEGER, -- 0-23 for hourly tracking
            
            -- Performance metrics
            impressions BIGINT DEFAULT 0,
            clicks BIGINT DEFAULT 0,
            ctr DECIMAL(5,4) DEFAULT 0,
            cpc DECIMAL(10,2) DEFAULT 0,
            cpm DECIMAL(10,2) DEFAULT 0,
            spend DECIMAL(10,2) DEFAULT 0,
            reach BIGINT DEFAULT 0,
            frequency DECIMAL(5,2) DEFAULT 0,
            conversions BIGINT DEFAULT 0,
            
            -- Additional metrics for better insights
            link_clicks BIGINT DEFAULT 0,
            whatsapp_clicks BIGINT DEFAULT 0,
            cpc_link DECIMAL(10,2) DEFAULT 0,
            cpc_whatsapp DECIMAL(10,2) DEFAULT 0,
            
            -- Data source tracking
            data_source VARCHAR(50) DEFAULT 'facebook_api', -- 'facebook_api', 'manual', 'estimated'
            is_latest BOOLEAN DEFAULT false, -- Marks the most recent metric for this campaign
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Constraints and indexes
            UNIQUE(campaign_id, metric_timestamp),
            UNIQUE(campaign_id, metric_date, metric_hour) -- Prevent duplicate hourly entries
        );
        
        RAISE NOTICE 'campaign_metrics table created successfully';
    ELSE
        RAISE NOTICE 'campaign_metrics table already exists, skipping creation';
    END IF;
END $$;

-- Step 2: Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_timestamp ON campaign_metrics(metric_timestamp);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_latest ON campaign_metrics(campaign_id, is_latest) WHERE is_latest = true;

-- Step 3: Check if old performance columns exist in campaigns table and migrate data
DO $$
DECLARE
    column_exists BOOLEAN;
    migration_count INTEGER;
BEGIN
    -- Check if impressions column exists in campaigns table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'impressions'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'Found old performance columns in campaigns table, migrating data...';
        
        -- Migrate existing performance data from campaigns table to campaign_metrics table
        INSERT INTO campaign_metrics (
            campaign_id,
            metric_timestamp,
            metric_date,
            metric_hour,
            impressions,
            clicks,
            ctr,
            cpc,
            cpm,
            spend,
            reach,
            frequency,
            conversions,
            link_clicks,
            whatsapp_clicks,
            cpc_link,
            cpc_whatsapp,
            data_source,
            is_latest,
            created_at
        )
        SELECT 
            id as campaign_id,
            COALESCE(last_sync_at, created_at) as metric_timestamp,
            COALESCE(last_sync_at::date, created_at::date) as metric_date,
            EXTRACT(hour FROM COALESCE(last_sync_at, created_at)) as metric_hour,
            COALESCE(impressions, 0) as impressions,
            COALESCE(clicks, 0) as clicks,
            COALESCE(ctr, 0) as ctr,
            COALESCE(cpc, 0) as cpc,
            COALESCE(cpm, 0) as cpm,
            COALESCE(spend, 0) as spend,
            COALESCE(reach, 0) as reach,
            COALESCE(frequency, 0) as frequency,
            COALESCE(conversions, 0) as conversions,
            0 as link_clicks, -- These fields didn't exist in old schema
            0 as whatsapp_clicks,
            0 as cpc_link,
            0 as cpc_whatsapp,
            'migration' as data_source,
            true as is_latest,
            NOW() as created_at
        FROM campaigns 
        WHERE 
            -- Only migrate campaigns that have performance data
            (impressions > 0 OR clicks > 0 OR spend > 0 OR reach > 0)
            AND id NOT IN (
                -- Avoid duplicates
                SELECT DISTINCT campaign_id 
                FROM campaign_metrics 
                WHERE data_source = 'migration'
            );
        
        GET DIAGNOSTICS migration_count = ROW_COUNT;
        RAISE NOTICE 'Migrated % campaigns to campaign_metrics table', migration_count;
        
    ELSE
        RAISE NOTICE 'No old performance columns found in campaigns table, skipping migration';
    END IF;
END $$;

-- Step 4: Create the trigger function for marking latest metrics
CREATE OR REPLACE FUNCTION mark_latest_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Reset is_latest for all metrics for this campaign
    UPDATE campaign_metrics 
    SET is_latest = false 
    WHERE campaign_id = NEW.campaign_id;
    
    -- Set is_latest for the new metric
    NEW.is_latest = true;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Create the trigger
DROP TRIGGER IF EXISTS mark_latest_campaign_metrics_trigger ON campaign_metrics;
CREATE TRIGGER mark_latest_campaign_metrics_trigger 
    BEFORE INSERT ON campaign_metrics 
    FOR EACH ROW 
    EXECUTE FUNCTION mark_latest_campaign_metrics();

-- Step 6: Enable RLS on campaign_metrics table
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for campaign_metrics
DROP POLICY IF EXISTS "Users can view own campaign metrics" ON campaign_metrics;
CREATE POLICY "Users can view own campaign metrics" ON campaign_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_metrics.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can insert own campaign metrics" ON campaign_metrics;
CREATE POLICY "Users can insert own campaign metrics" ON campaign_metrics FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_metrics.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can update own campaign metrics" ON campaign_metrics;
CREATE POLICY "Users can update own campaign metrics" ON campaign_metrics FOR UPDATE USING (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_metrics.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);

-- Step 8: Add comments to explain the new structure
COMMENT ON TABLE campaigns IS 'Campaign metadata only - performance metrics stored in campaign_metrics table';
COMMENT ON TABLE campaign_metrics IS 'Hourly performance metrics for campaigns with timestamps for trend analysis';
COMMENT ON COLUMN campaign_metrics.is_latest IS 'Marks the most recent metric snapshot for this campaign';
COMMENT ON COLUMN campaign_metrics.data_source IS 'Source of the metric data: facebook_api, manual, estimated, migration';

-- Step 9: Create a view for backward compatibility (optional)
-- This view allows existing queries to continue working during transition
CREATE OR REPLACE VIEW campaigns_with_metrics AS
SELECT 
    c.*,
    cm.impressions,
    cm.clicks,
    cm.ctr,
    cm.cpc,
    cm.cpm,
    cm.spend,
    cm.reach,
    cm.frequency,
    cm.conversions,
    cm.link_clicks,
    cm.whatsapp_clicks,
    cm.cpc_link,
    cm.cpc_whatsapp,
    cm.metric_timestamp as last_updated,
    cm.data_source
FROM campaigns c
LEFT JOIN campaign_metrics cm ON c.id = cm.campaign_id AND cm.is_latest = true;

-- Step 10: Create verification queries
-- These will help you verify the migration worked correctly

-- Check migration status
SELECT 
    'Migration Summary' as info,
    COUNT(*) as total_campaigns,
    COUNT(CASE WHEN impressions > 0 OR clicks > 0 OR spend > 0 THEN 1 END) as campaigns_with_old_data,
    (SELECT COUNT(*) FROM campaign_metrics WHERE data_source = 'migration') as migrated_campaigns
FROM campaigns;

-- Check for any campaigns that still have old performance data
SELECT 
    'Campaigns with old data' as info,
    COUNT(*) as count
FROM campaigns 
WHERE impressions > 0 OR clicks > 0 OR spend > 0 OR reach > 0;

-- Check the latest metrics for each campaign
SELECT 
    'Latest metrics sample' as info,
    c.name,
    cm.impressions,
    cm.clicks,
    cm.spend,
    cm.metric_timestamp,
    cm.data_source
FROM campaigns c
LEFT JOIN campaign_metrics cm ON c.id = cm.campaign_id AND cm.is_latest = true
ORDER BY cm.metric_timestamp DESC
LIMIT 10;

-- IMPORTANT NOTES:
-- 1. This migration preserves all existing data
-- 2. The old performance columns are NOT dropped by default (for safety)
-- 3. After verifying the migration worked, you can manually remove old columns:
--    ALTER TABLE campaigns DROP COLUMN IF EXISTS impressions;
--    ALTER TABLE campaigns DROP COLUMN IF EXISTS clicks;
--    ALTER TABLE campaigns DROP COLUMN IF EXISTS ctr;
--    ALTER TABLE campaigns DROP COLUMN IF EXISTS cpc;
--    ALTER TABLE campaigns DROP COLUMN IF EXISTS cpm;
--    ALTER TABLE campaigns DROP COLUMN IF EXISTS spend;
--    ALTER TABLE campaigns DROP COLUMN IF EXISTS reach;
--    ALTER TABLE campaigns DROP COLUMN IF EXISTS frequency;
--    ALTER TABLE campaigns DROP COLUMN IF EXISTS conversions;
-- 4. The campaigns_with_metrics view provides backward compatibility
-- 5. All new data will be stored in the campaign_metrics table with proper timestamps 