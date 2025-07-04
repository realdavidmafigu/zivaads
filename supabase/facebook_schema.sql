-- Facebook Integration Database Schema for ZivaAds
-- This schema extends the existing database with Facebook-specific tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facebook accounts table
CREATE TABLE IF NOT EXISTS facebook_accounts (
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
    permissions TEXT[], -- Array of granted permissions
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, facebook_account_id)
);

-- Campaigns table (Facebook campaigns)
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facebook_account_id UUID NOT NULL REFERENCES facebook_accounts(id) ON DELETE CASCADE,
    facebook_campaign_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- ACTIVE, PAUSED, DELETED, etc.
    objective VARCHAR(100),
    daily_budget DECIMAL(10,2),
    lifetime_budget DECIMAL(10,2),
    spend_cap DECIMAL(10,2),
    created_time TIMESTAMP WITH TIME ZONE,
    start_time TIMESTAMP WITH TIME ZONE,
    stop_time TIMESTAMP WITH TIME ZONE,
    special_ad_categories TEXT[],
    
    -- Performance metrics (cached from Facebook)
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    cpc DECIMAL(10,2) DEFAULT 0,
    cpm DECIMAL(10,2) DEFAULT 0,
    spend DECIMAL(10,2) DEFAULT 0,
    reach BIGINT DEFAULT 0,
    frequency DECIMAL(5,2) DEFAULT 0,
    conversions BIGINT DEFAULT 0,
    
    -- Metadata
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(facebook_account_id, facebook_campaign_id)
);

-- Ad Sets table
CREATE TABLE IF NOT EXISTS ad_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    facebook_ad_set_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    daily_budget DECIMAL(10,2),
    lifetime_budget DECIMAL(10,2),
    optimization_goal VARCHAR(100),
    bid_amount DECIMAL(10,2),
    targeting JSONB, -- Store targeting configuration
    created_time TIMESTAMP WITH TIME ZONE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    
    -- Performance metrics
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    cpc DECIMAL(10,2) DEFAULT 0,
    spend DECIMAL(10,2) DEFAULT 0,
    
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(campaign_id, facebook_ad_set_id)
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_set_id UUID NOT NULL REFERENCES ad_sets(id) ON DELETE CASCADE,
    facebook_ad_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    creative JSONB, -- Store creative configuration
    created_time TIMESTAMP WITH TIME ZONE,
    
    -- Performance metrics
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    cpc DECIMAL(10,2) DEFAULT 0,
    spend DECIMAL(10,2) DEFAULT 0,
    
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(ad_set_id, facebook_ad_id)
);

-- Alerts table (enhanced)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    ad_set_id UUID REFERENCES ad_sets(id) ON DELETE CASCADE,
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    
    alert_type VARCHAR(50) NOT NULL, -- 'performance', 'budget', 'status', 'error'
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB, -- Additional alert data
    
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance snapshots table (for historical data)
CREATE TABLE IF NOT EXISTS performance_snapshots (
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

-- Sync logs table (for tracking API calls)
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facebook_account_id UUID REFERENCES facebook_accounts(id) ON DELETE CASCADE,
    
    sync_type VARCHAR(50) NOT NULL, -- 'accounts', 'campaigns', 'adsets', 'ads', 'insights'
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    error_message TEXT,
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER
);

-- AI Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    ai_model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_accounts_user_id ON facebook_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_accounts_account_id ON facebook_accounts(facebook_account_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_facebook_account_id ON campaigns(facebook_account_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_facebook_campaign_id ON campaigns(facebook_campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign_id ON ad_sets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_ad_set_id ON ads(ad_set_id);
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

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (assuming auth.uid() is available from Supabase Auth)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own facebook accounts" ON facebook_accounts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own facebook accounts" ON facebook_accounts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own facebook accounts" ON facebook_accounts FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own facebook accounts" ON facebook_accounts FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own ad sets" ON ad_sets FOR SELECT USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = ad_sets.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can insert own ad sets" ON ad_sets FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = ad_sets.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can update own ad sets" ON ad_sets FOR UPDATE USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = ad_sets.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can delete own ad sets" ON ad_sets FOR DELETE USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = ad_sets.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);

CREATE POLICY "Users can view own ads" ON ads FOR SELECT USING (
    EXISTS (SELECT 1 FROM ad_sets 
            JOIN campaigns ON campaigns.id = ad_sets.campaign_id 
            WHERE ad_sets.id = ads.ad_set_id AND campaigns.user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can insert own ads" ON ads FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ad_sets 
            JOIN campaigns ON campaigns.id = ad_sets.campaign_id 
            WHERE ad_sets.id = ads.ad_set_id AND campaigns.user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can update own ads" ON ads FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ad_sets 
            JOIN campaigns ON campaigns.id = ad_sets.campaign_id 
            WHERE ad_sets.id = ads.ad_set_id AND campaigns.user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can delete own ads" ON ads FOR DELETE USING (
    EXISTS (SELECT 1 FROM ad_sets 
            JOIN campaigns ON campaigns.id = ad_sets.campaign_id 
            WHERE ad_sets.id = ads.ad_set_id AND campaigns.user_id::text = auth.uid()::text)
);

CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own alerts" ON alerts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own alerts" ON alerts FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own performance snapshots" ON performance_snapshots FOR SELECT USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = performance_snapshots.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can insert own performance snapshots" ON performance_snapshots FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = performance_snapshots.campaign_id AND campaigns.user_id::text = auth.uid()::text)
);

CREATE POLICY "Users can view own sync logs" ON sync_logs FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own sync logs" ON sync_logs FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facebook_accounts_updated_at BEFORE UPDATE ON facebook_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ad_sets_updated_at BEFORE UPDATE ON ad_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 