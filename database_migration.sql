-- Database Migration Script for ZivaAds
-- This script migrates from the old schema to the new schema with separated campaign metadata and metrics

-- Step 1: Create the new campaign_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS campaign_metrics (
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

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_timestamp ON campaign_metrics(metric_timestamp);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_latest ON campaign_metrics(campaign_id, is_latest) WHERE is_latest = true;

-- Step 3: Migrate existing performance data from campaigns table to campaign_metrics table
-- This creates a historical snapshot of the current metrics
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

-- Step 4: Remove performance metrics columns from campaigns table
-- This step is commented out for safety - uncomment after verifying migration worked
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS impressions;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS clicks;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS ctr;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS cpc;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS cpm;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS spend;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS reach;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS frequency;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS conversions;

-- Step 5: Create the trigger function for marking latest metrics
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

-- Step 6: Create the trigger
DROP TRIGGER IF EXISTS mark_latest_campaign_metrics_trigger ON campaign_metrics;
CREATE TRIGGER mark_latest_campaign_metrics_trigger 
    BEFORE INSERT ON campaign_metrics 
    FOR EACH ROW 
    EXECUTE FUNCTION mark_latest_campaign_metrics();

-- Step 7: Enable RLS on campaign_metrics table
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for campaign_metrics
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

-- Step 9: Add comments to explain the new structure
COMMENT ON TABLE campaigns IS 'Campaign metadata only - performance metrics stored in campaign_metrics table';
COMMENT ON TABLE campaign_metrics IS 'Hourly performance metrics for campaigns with timestamps for trend analysis';
COMMENT ON COLUMN campaign_metrics.is_latest IS 'Marks the most recent metric snapshot for this campaign';
COMMENT ON COLUMN campaign_metrics.data_source IS 'Source of the metric data: facebook_api, manual, estimated, migration';

-- Step 10: Create a view for backward compatibility (optional)
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

-- Migration verification queries
-- Run these to verify the migration worked correctly:

-- Check how many campaigns were migrated
-- SELECT COUNT(*) as migrated_campaigns FROM campaign_metrics WHERE data_source = 'migration';

-- Check for campaigns that still have performance data in the old columns
-- SELECT COUNT(*) as campaigns_with_old_data FROM campaigns WHERE impressions > 0 OR clicks > 0 OR spend > 0;

-- Check the latest metrics for each campaign
-- SELECT 
--     c.name,
--     cm.impressions,
--     cm.clicks,
--     cm.spend,
--     cm.metric_timestamp
-- FROM campaigns c
-- LEFT JOIN campaign_metrics cm ON c.id = cm.campaign_id AND cm.is_latest = true
-- ORDER BY cm.metric_timestamp DESC;

-- IMPORTANT NOTES:
-- 1. This migration preserves all existing data
-- 2. The old performance columns are NOT dropped by default (commented out for safety)
-- 3. After verifying the migration worked, you can uncomment the DROP COLUMN statements
-- 4. The campaigns_with_metrics view provides backward compatibility
-- 5. All new data will be stored in the campaign_metrics table with proper timestamps 