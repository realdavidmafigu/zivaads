-- Safe Schema Update Script for ZivaAds
-- This script safely updates the existing schema to the new structure
-- without causing column conflicts

-- Step 1: Check current database state and create new tables safely
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    -- Check if campaign_metrics table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'campaign_metrics'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating campaign_metrics table...';
        
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
        RAISE NOTICE 'campaign_metrics table already exists';
    END IF;
    
    -- Check if ad_set_metrics table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ad_set_metrics'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating ad_set_metrics table...';
        
        CREATE TABLE ad_set_metrics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            ad_set_id UUID NOT NULL REFERENCES ad_sets(id) ON DELETE CASCADE,
            
            metric_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            metric_date DATE NOT NULL,
            metric_hour INTEGER,
            
            impressions BIGINT DEFAULT 0,
            clicks BIGINT DEFAULT 0,
            ctr DECIMAL(5,4) DEFAULT 0,
            cpc DECIMAL(10,2) DEFAULT 0,
            spend DECIMAL(10,2) DEFAULT 0,
            
            data_source VARCHAR(50) DEFAULT 'facebook_api',
            is_latest BOOLEAN DEFAULT false,
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            UNIQUE(ad_set_id, metric_timestamp),
            UNIQUE(ad_set_id, metric_date, metric_hour)
        );
        
        RAISE NOTICE 'ad_set_metrics table created successfully';
    ELSE
        RAISE NOTICE 'ad_set_metrics table already exists';
    END IF;
    
    -- Check if ad_metrics table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ad_metrics'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating ad_metrics table...';
        
        CREATE TABLE ad_metrics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
            
            metric_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            metric_date DATE NOT NULL,
            metric_hour INTEGER,
            
            impressions BIGINT DEFAULT 0,
            clicks BIGINT DEFAULT 0,
            ctr DECIMAL(5,4) DEFAULT 0,
            cpc DECIMAL(10,2) DEFAULT 0,
            spend DECIMAL(10,2) DEFAULT 0,
            
            data_source VARCHAR(50) DEFAULT 'facebook_api',
            is_latest BOOLEAN DEFAULT false,
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            UNIQUE(ad_id, metric_timestamp),
            UNIQUE(ad_id, metric_date, metric_hour)
        );
        
        RAISE NOTICE 'ad_metrics table created successfully';
    ELSE
        RAISE NOTICE 'ad_metrics table already exists';
    END IF;
END $$;

-- Step 2: Add missing columns to existing tables (if they don't exist)
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Add missing columns to campaigns table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE campaigns ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to campaigns table';
    END IF;
    
    -- Add missing columns to ad_sets table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ad_sets' AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE ad_sets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to ad_sets table';
    END IF;
    
    -- Add missing columns to ads table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE ads ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to ads table';
    END IF;
    
    -- Add missing columns to alerts table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'alerts' AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE alerts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to alerts table';
    END IF;
END $$;

-- Step 3: Create indexes safely
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_timestamp ON campaign_metrics(metric_timestamp);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_latest ON campaign_metrics(campaign_id, is_latest) WHERE is_latest = true;

CREATE INDEX IF NOT EXISTS idx_ad_set_metrics_ad_set_id ON ad_set_metrics(ad_set_id);
CREATE INDEX IF NOT EXISTS idx_ad_set_metrics_timestamp ON ad_set_metrics(metric_timestamp);

CREATE INDEX IF NOT EXISTS idx_ad_metrics_ad_id ON ad_metrics(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_timestamp ON ad_metrics(metric_timestamp);

-- Add new indexes to existing tables
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_objective ON campaigns(objective);

-- Step 4: Migrate existing performance data (if old columns exist)
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

-- Step 5: Create or update functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Step 6: Create triggers safely
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ad_sets_updated_at ON ad_sets;
CREATE TRIGGER update_ad_sets_updated_at BEFORE UPDATE ON ad_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS mark_latest_campaign_metrics_trigger ON campaign_metrics;
CREATE TRIGGER mark_latest_campaign_metrics_trigger 
    BEFORE INSERT ON campaign_metrics 
    FOR EACH ROW 
    EXECUTE FUNCTION mark_latest_campaign_metrics();

-- Step 7: Enable RLS and create policies
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_set_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;

-- Campaign metrics policies
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

-- Ad set metrics policies
DROP POLICY IF EXISTS "Users can view own ad set metrics" ON ad_set_metrics;
CREATE POLICY "Users can view own ad set metrics" ON ad_set_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM ad_sets JOIN campaigns ON campaigns.id = ad_sets.campaign_id WHERE ad_sets.id = ad_set_metrics.ad_set_id AND campaigns.user_id::text = auth.uid()::text)
);

-- Ad metrics policies
DROP POLICY IF EXISTS "Users can view own ad metrics" ON ad_metrics;
CREATE POLICY "Users can view own ad metrics" ON ad_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM ads JOIN ad_sets ON ad_sets.id = ads.ad_set_id JOIN campaigns ON campaigns.id = ad_sets.campaign_id WHERE ads.id = ad_metrics.ad_id AND campaigns.user_id::text = auth.uid()::text)
);

-- Step 8: Create backward compatibility view
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

-- Step 9: Add comments
COMMENT ON TABLE campaigns IS 'Campaign metadata only - performance metrics stored in campaign_metrics table';
COMMENT ON TABLE campaign_metrics IS 'Hourly performance metrics for campaigns with timestamps for trend analysis';
COMMENT ON COLUMN campaign_metrics.is_latest IS 'Marks the most recent metric snapshot for this campaign';
COMMENT ON COLUMN campaign_metrics.data_source IS 'Source of the metric data: facebook_api, manual, estimated, migration';

-- Step 10: Verification queries
SELECT 
    'Schema Update Summary' as info,
    COUNT(*) as total_campaigns,
    COUNT(CASE WHEN impressions > 0 OR clicks > 0 OR spend > 0 THEN 1 END) as campaigns_with_old_data,
    (SELECT COUNT(*) FROM campaign_metrics WHERE data_source = 'migration') as migrated_campaigns,
    (SELECT COUNT(*) FROM campaign_metrics) as total_metrics
FROM campaigns; 