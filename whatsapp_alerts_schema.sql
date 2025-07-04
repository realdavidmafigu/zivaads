-- WhatsApp Alerts System Database Schema for ZivaAds
-- This schema extends the existing database with WhatsApp-specific tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- WhatsApp preferences table
CREATE TABLE IF NOT EXISTS user_whatsapp_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT false,
    phone_number VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(6),
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Alert type preferences
    alert_budget_depleted BOOLEAN DEFAULT true,
    alert_low_ctr BOOLEAN DEFAULT true,
    alert_high_costs BOOLEAN DEFAULT true,
    alert_campaign_paused BOOLEAN DEFAULT true,
    alert_high_frequency BOOLEAN DEFAULT true,
    
    -- Quiet hours settings
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start INTEGER DEFAULT 22, -- Hour in 24-hour format
    quiet_hours_end INTEGER DEFAULT 8,   -- Hour in 24-hour format
    
    -- Alert frequency
    alert_frequency VARCHAR(20) DEFAULT 'immediate', -- 'immediate', 'hourly', 'daily'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id)
);

-- WhatsApp verification codes table
CREATE TABLE IF NOT EXISTS whatsapp_verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, phone_number, code)
);

-- Alert thresholds table
CREATE TABLE IF NOT EXISTS user_alert_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Threshold values
    low_ctr DECIMAL(5,2) DEFAULT 1.0,        -- 1% CTR threshold
    high_cpc DECIMAL(10,2) DEFAULT 5.0,      -- $5 CPC threshold
    budget_usage DECIMAL(5,2) DEFAULT 90.0,  -- 90% budget usage threshold
    spend_limit DECIMAL(10,2) DEFAULT 100.0, -- $100 daily spend limit
    frequency_cap DECIMAL(5,2) DEFAULT 3.0,  -- 3.0 frequency threshold
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id)
);

-- WhatsApp message logs table
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    
    phone_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- 'template', 'text'
    template_name VARCHAR(100),
    message_content TEXT,
    alert_data JSONB,
    
    status VARCHAR(20) NOT NULL, -- 'sent', 'delivered', 'failed', 'pending'
    whatsapp_message_id VARCHAR(255),
    error_message TEXT,
    
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cron job logs table
CREATE TABLE IF NOT EXISTS cron_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'partial'
    
    users_processed INTEGER DEFAULT 0,
    alerts_generated INTEGER DEFAULT 0,
    whatsapp_sent INTEGER DEFAULT 0,
    
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER
);

-- Rate limiting table for WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    message_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    window_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 minute'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(phone_number, window_start)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_whatsapp_preferences_user_id ON user_whatsapp_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_whatsapp_preferences_phone_number ON user_whatsapp_preferences(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_verification_codes_user_id ON whatsapp_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_verification_codes_phone_number ON whatsapp_verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_verification_codes_expires_at ON whatsapp_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_alert_thresholds_user_id ON user_alert_thresholds(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_user_id ON whatsapp_message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_phone_number ON whatsapp_message_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_sent_at ON whatsapp_message_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_status ON whatsapp_message_logs(status);
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_started_at ON cron_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_cron_logs_status ON cron_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_rate_limits_phone_number ON whatsapp_rate_limits(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_rate_limits_window_end ON whatsapp_rate_limits(window_end);

-- Row Level Security (RLS) policies
ALTER TABLE user_whatsapp_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own whatsapp preferences" ON user_whatsapp_preferences FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own whatsapp preferences" ON user_whatsapp_preferences FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own whatsapp preferences" ON user_whatsapp_preferences FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own whatsapp preferences" ON user_whatsapp_preferences FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own verification codes" ON whatsapp_verification_codes FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own verification codes" ON whatsapp_verification_codes FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own verification codes" ON whatsapp_verification_codes FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own alert thresholds" ON user_alert_thresholds FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own alert thresholds" ON user_alert_thresholds FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own alert thresholds" ON user_alert_thresholds FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own alert thresholds" ON user_alert_thresholds FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own whatsapp message logs" ON whatsapp_message_logs FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own whatsapp message logs" ON whatsapp_message_logs FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Cron logs are read-only for users (admin only for full access)
CREATE POLICY "Users can view cron logs" ON cron_logs FOR SELECT USING (true);

-- Rate limits are system-managed
CREATE POLICY "System can manage rate limits" ON whatsapp_rate_limits FOR ALL USING (true);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_user_whatsapp_preferences_updated_at BEFORE UPDATE ON user_whatsapp_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_alert_thresholds_updated_at BEFORE UPDATE ON user_alert_thresholds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM whatsapp_rate_limits 
    WHERE window_end < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old cron logs
CREATE OR REPLACE FUNCTION cleanup_old_cron_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM cron_logs 
    WHERE started_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old whatsapp message logs
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM whatsapp_message_logs 
    WHERE sent_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Insert default data for existing users (optional)
-- This can be run after the schema is created to set up default preferences
-- INSERT INTO user_whatsapp_preferences (user_id, is_enabled)
-- SELECT id FROM auth.users 
-- WHERE id NOT IN (SELECT user_id FROM user_whatsapp_preferences);

-- Insert default thresholds for existing users (optional)
-- INSERT INTO user_alert_thresholds (user_id)
-- SELECT id FROM auth.users 
-- WHERE id NOT IN (SELECT user_id FROM user_alert_thresholds); 