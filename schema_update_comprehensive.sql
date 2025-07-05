-- Comprehensive Schema Update Script for ZivaAds
-- This script safely updates the existing schema to the new structure
-- without assuming any existing tables or columns

-- Step 1: Check and create all required base tables
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    -- Check if users table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating users table...';
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255),
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'users table created successfully';
    ELSE
        RAISE NOTICE 'users table already exists';
    END IF;
    
    -- Check if facebook_accounts table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'facebook_accounts'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating facebook_accounts table...';
        CREATE TABLE facebook_accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            facebook_account_id VARCHAR(255) NOT NULL,
            account_name VARCHAR(255) NOT NULL,
            access_token TEXT NOT NULL,
            token_expires_at TIMESTAMP WITH TIME ZONE,
            account_status INTEGER DEFAULT 1,
            currency VARCHAR(10) DEFAULT 'USD',
            timezone_name VARCHAR(100),
            business_name VARCHAR(255),
            permissions TEXT[],
            is_active BOOLEAN DEFAULT true,
            last_sync_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, facebook_account_id)
        );
        RAISE NOTICE 'facebook_accounts table created successfully';
    ELSE
        RAISE NOTICE 'facebook_accounts table already exists';
    END IF;
    
    -- Check if campaigns table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'campaigns'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating campaigns table...';
        CREATE TABLE campaigns (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            facebook_account_id UUID NOT NULL REFERENCES facebook_accounts(id) ON DELETE CASCADE,
            facebook_campaign_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL,
            objective VARCHAR(100),
            daily_budget DECIMAL(10,2),
            lifetime_budget DECIMAL(10,2),
            spend_cap DECIMAL(10,2),
            created_time TIMESTAMP WITH TIME ZONE,
            start_time TIMESTAMP WITH TIME ZONE,
            stop_time TIMESTAMP WITH TIME ZONE,
            special_ad_categories TEXT[],
            last_sync_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(facebook_account_id, facebook_campaign_id)
        );
        RAISE NOTICE 'campaigns table created successfully';
    ELSE
        RAISE NOTICE 'campaigns table already exists';
    END IF;
    
    -- Check if ad_sets table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ad_sets'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating ad_sets table...';
        CREATE TABLE ad_sets (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
            facebook_ad_set_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL,
            daily_budget DECIMAL(10,2),
            lifetime_budget DECIMAL(10,2),
            optimization_goal VARCHAR(100),
            bid_amount DECIMAL(10,2),
            targeting JSONB,
            created_time TIMESTAMP WITH TIME ZONE,
            start_time TIMESTAMP WITH TIME ZONE,
            end_time TIMESTAMP WITH TIME ZONE,
            last_sync_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(campaign_id, facebook_ad_set_id)
        );
        RAISE NOTICE 'ad_sets table created successfully';
    ELSE
        RAISE NOTICE 'ad_sets table already exists';
    END IF;
    
    -- Check if ads table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ads'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating ads table...';
        CREATE TABLE ads (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            ad_set_id UUID NOT NULL REFERENCES ad_sets(id) ON DELETE CASCADE,
            facebook_ad_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL,
            creative JSONB,
            created_time TIMESTAMP WITH TIME ZONE,
            last_sync_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(ad_set_id, facebook_ad_id)
        );
        RAISE NOTICE 'ads table created successfully';
    ELSE
        RAISE NOTICE 'ads table already exists';
    END IF;
    
    -- Check if alerts table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'alerts'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating alerts table...';
        CREATE TABLE alerts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
            ad_set_id UUID REFERENCES ad_sets(id) ON DELETE CASCADE,
            ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
            alert_type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) NOT NULL DEFAULT 'medium',
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            metadata JSONB,
            is_resolved BOOLEAN DEFAULT false,
            resolved_at TIMESTAMP WITH TIME ZONE,
            resolved_by UUID REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'alerts table created successfully';
    ELSE
        RAISE NOTICE 'alerts table already exists';
    END IF;
    
    -- Check if performance_snapshots table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'performance_snapshots'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating performance_snapshots table...';
        CREATE TABLE performance_snapshots (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
            ad_set_id UUID REFERENCES ad_sets(id) ON DELETE CASCADE,
            ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
            snapshot_date DATE NOT NULL,
            impressions BIGINT DEFAULT 0,
            clicks BIGINT DEFAULT 0,
            ctr DECIMAL(5,4) DEFAULT 0,
            cpc DECIMAL(10,2) DEFAULT 0,
            cpm DECIMAL(10,2) DEFAULT 0,
            spend DECIMAL(10,2) DEFAULT 0,
            reach BIGINT DEFAULT 0,
            frequency DECIMAL(5,2) DEFAULT 0,
            conversions BIGINT DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(campaign_id, snapshot_date),
            UNIQUE(ad_set_id, snapshot_date),
            UNIQUE(ad_id, snapshot_date)
        );
        RAISE NOTICE 'performance_snapshots table created successfully';
    ELSE
        RAISE NOTICE 'performance_snapshots table already exists';
    END IF;
    
    -- Check if sync_logs table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sync_logs'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating sync_logs table...';
        CREATE TABLE sync_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            facebook_account_id UUID REFERENCES facebook_accounts(id) ON DELETE CASCADE,
            sync_type VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL,
            records_processed INTEGER DEFAULT 0,
            records_updated INTEGER DEFAULT 0,
            records_created INTEGER DEFAULT 0,
            error_message TEXT,
            started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            duration_ms INTEGER
        );
        RAISE NOTICE 'sync_logs table created successfully';
    ELSE
        RAISE NOTICE 'sync_logs table already exists';
    END IF;
    
    -- Check if recommendations table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recommendations'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating recommendations table...';
        CREATE TABLE recommendations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
            campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            recommendation_type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            priority VARCHAR(20) DEFAULT 'medium',
            estimated_impact VARCHAR(100),
            action_items JSONB,
            is_implemented BOOLEAN DEFAULT false,
            implemented_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'recommendations table created successfully';
    ELSE
        RAISE NOTICE 'recommendations table already exists';
    END IF;
END $$;

-- Step 2: Create new metrics tables
DO $$
DECLARE
    table_exists BOOLEAN;
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

-- Step 3: Add missing columns to existing tables
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
    
    -- Add missing columns to recommendations table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recommendations' AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE recommendations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to recommendations table';
    END IF;
END $$;

-- Step 4: Create indexes safely
CREATE INDEX IF NOT EXISTS idx_facebook_accounts_user_id ON facebook_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_accounts_account_id ON facebook_accounts(facebook_account_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_facebook_account_id ON campaigns(facebook_account_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_facebook_campaign_id ON campaigns(facebook_campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_objective ON campaigns(objective);

CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_timestamp ON campaign_metrics(metric_timestamp);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_latest ON campaign_metrics(campaign_id, is_latest) WHERE is_latest = true;

CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign_id ON ad_sets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_set_metrics_ad_set_id ON ad_set_metrics(ad_set_id);
CREATE INDEX IF NOT EXISTS idx_ad_set_metrics_timestamp ON ad_set_metrics(metric_timestamp);

CREATE INDEX IF NOT EXISTS idx_ads_ad_set_id ON ads(ad_set_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_ad_id ON ad_metrics(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_timestamp ON ad_metrics(metric_timestamp);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_campaign_id ON alerts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_is_resolved ON alerts(is_resolved);

CREATE INDEX IF NOT EXISTS idx_performance_snapshots_campaign_id ON performance_snapshots(campaign_id);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_date ON performance_snapshots(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at);

CREATE INDEX IF NOT EXISTS idx_recommendations_campaign_id ON recommendations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_alert_id ON recommendations(alert_id);

-- Step 5: Migrate existing performance data (if old columns exist)
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

-- Step 6: Create or update functions and triggers
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

-- Step 7: Create triggers safely
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_facebook_accounts_updated_at ON facebook_accounts;
CREATE TRIGGER update_facebook_accounts_updated_at BEFORE UPDATE ON facebook_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ad_sets_updated_at ON ad_sets;
CREATE TRIGGER update_ad_sets_updated_at BEFORE UPDATE ON ad_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recommendations_updated_at ON recommendations;
CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS mark_latest_campaign_metrics_trigger ON campaign_metrics;
CREATE TRIGGER mark_latest_campaign_metrics_trigger 
    BEFORE INSERT ON campaign_metrics 
    FOR EACH ROW 
    EXECUTE FUNCTION mark_latest_campaign_metrics();

-- Step 8: Enable RLS and create policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_set_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Facebook accounts policies
DROP POLICY IF EXISTS "Users can view own Facebook accounts" ON facebook_accounts;
CREATE POLICY "Users can view own Facebook accounts" ON facebook_accounts FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own Facebook accounts" ON facebook_accounts;
CREATE POLICY "Users can insert own Facebook accounts" ON facebook_accounts FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own Facebook accounts" ON facebook_accounts;
CREATE POLICY "Users can update own Facebook accounts" ON facebook_accounts FOR UPDATE USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own Facebook accounts" ON facebook_accounts;
CREATE POLICY "Users can delete own Facebook accounts" ON facebook_accounts FOR DELETE USING (user_id::text = auth.uid()::text);

-- Campaigns policies
DROP POLICY IF EXISTS "Users can view own campaigns" ON campaigns;
CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own campaigns" ON campaigns;
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own campaigns" ON campaigns;
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own campaigns" ON campaigns;
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (user_id::text = auth.uid()::text);

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

-- Ad sets policies
DROP POLICY IF EXISTS "Users can view own ad sets" ON ad_sets;
CREATE POLICY "Users can view own ad sets" ON ad_sets FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = ad_sets.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can insert own ad sets" ON ad_sets;
CREATE POLICY "Users can insert own ad sets" ON ad_sets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = ad_sets.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);

-- Ad set metrics policies
DROP POLICY IF EXISTS "Users can view own ad set metrics" ON ad_set_metrics;
CREATE POLICY "Users can view own ad set metrics" ON ad_set_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM ad_sets JOIN campaigns ON campaigns.id = ad_sets.campaign_id WHERE ad_sets.id = ad_set_metrics.ad_set_id AND campaigns.user_id::text = auth.uid()::text)
);

-- Ads policies
DROP POLICY IF EXISTS "Users can view own ads" ON ads;
CREATE POLICY "Users can view own ads" ON ads FOR SELECT USING (
  EXISTS (SELECT 1 FROM ad_sets JOIN campaigns ON campaigns.id = ad_sets.campaign_id WHERE ad_sets.id = ads.ad_set_id AND campaigns.user_id::text = auth.uid()::text)
);

-- Ad metrics policies
DROP POLICY IF EXISTS "Users can view own ad metrics" ON ad_metrics;
CREATE POLICY "Users can view own ad metrics" ON ad_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM ads JOIN ad_sets ON ad_sets.id = ads.ad_set_id JOIN campaigns ON campaigns.id = ad_sets.campaign_id WHERE ads.id = ad_metrics.ad_id AND campaigns.user_id::text = auth.uid()::text)
);

-- Alerts policies
DROP POLICY IF EXISTS "Users can view own alerts" ON alerts;
CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own alerts" ON alerts;
CREATE POLICY "Users can insert own alerts" ON alerts FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own alerts" ON alerts;
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Performance snapshots policies
DROP POLICY IF EXISTS "Users can view own performance snapshots" ON performance_snapshots;
CREATE POLICY "Users can view own performance snapshots" ON performance_snapshots FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = performance_snapshots.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can insert own performance snapshots" ON performance_snapshots;
CREATE POLICY "Users can insert own performance snapshots" ON performance_snapshots FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = performance_snapshots.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);

-- Sync logs policies
DROP POLICY IF EXISTS "Users can view own sync logs" ON sync_logs;
CREATE POLICY "Users can view own sync logs" ON sync_logs FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own sync logs" ON sync_logs;
CREATE POLICY "Users can insert own sync logs" ON sync_logs FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Recommendations policies
DROP POLICY IF EXISTS "Users can view own recommendations" ON recommendations;
CREATE POLICY "Users can view own recommendations" ON recommendations FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own recommendations" ON recommendations;
CREATE POLICY "Users can insert own recommendations" ON recommendations FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own recommendations" ON recommendations;
CREATE POLICY "Users can update own recommendations" ON recommendations FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Step 9: Create backward compatibility view
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

-- Step 10: Add comments
COMMENT ON TABLE campaigns IS 'Campaign metadata only - performance metrics stored in campaign_metrics table';
COMMENT ON TABLE campaign_metrics IS 'Hourly performance metrics for campaigns with timestamps for trend analysis';
COMMENT ON COLUMN campaign_metrics.is_latest IS 'Marks the most recent metric snapshot for this campaign';
COMMENT ON COLUMN campaign_metrics.data_source IS 'Source of the metric data: facebook_api, manual, estimated, migration';

-- Step 11: Verification queries
SELECT 
    'Comprehensive Schema Update Summary' as info,
    COUNT(*) as total_campaigns,
    COUNT(CASE WHEN impressions > 0 OR clicks > 0 OR spend > 0 THEN 1 END) as campaigns_with_old_data,
    (SELECT COUNT(*) FROM campaign_metrics WHERE data_source = 'migration') as migrated_campaigns,
    (SELECT COUNT(*) FROM campaign_metrics) as total_metrics
FROM campaigns; 