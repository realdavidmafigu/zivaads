-- AI Daily Alerts Schema
-- This schema supports AI-powered daily alerts that send brief, jargon-free notifications

-- Table for storing AI daily alerts
CREATE TABLE IF NOT EXISTS ai_daily_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('morning', 'afternoon', 'evening')),
    content TEXT NOT NULL,
    summary TEXT NOT NULL,
    campaign_count INTEGER DEFAULT 0,
    total_spend DECIMAL(10,2) DEFAULT 0,
    should_send_alert BOOLEAN DEFAULT false,
    sent_via_whatsapp BOOLEAN DEFAULT false,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for user alert preferences
CREATE TABLE IF NOT EXISTS user_alert_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    ai_alerts_enabled BOOLEAN DEFAULT true,
    morning_alerts BOOLEAN DEFAULT true,
    afternoon_alerts BOOLEAN DEFAULT true,
    evening_alerts BOOLEAN DEFAULT true,
    alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('daily', 'weekly', 'custom')),
    custom_times TEXT[],
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_daily_alerts_user_id ON ai_daily_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_daily_alerts_generated_at ON ai_daily_alerts(generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_daily_alerts_alert_type ON ai_daily_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_user_alert_preferences_user_id ON user_alert_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alert_preferences_phone ON user_alert_preferences(phone_number);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_alert_preferences_updated_at ON user_alert_preferences;
CREATE TRIGGER update_user_alert_preferences_updated_at 
    BEFORE UPDATE ON user_alert_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE ai_daily_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alert_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for ai_daily_alerts
CREATE POLICY "Users can view their own AI daily alerts" ON ai_daily_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI daily alerts" ON ai_daily_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI daily alerts" ON ai_daily_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for user_alert_preferences
CREATE POLICY "Users can view their own alert preferences" ON user_alert_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert preferences" ON user_alert_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert preferences" ON user_alert_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to get AI alert statistics
CREATE OR REPLACE FUNCTION get_ai_alert_stats(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_alerts BIGINT,
    morning_alerts BIGINT,
    afternoon_alerts BIGINT,
    evening_alerts BIGINT,
    alerts_sent BIGINT,
    avg_campaign_count NUMERIC,
    total_spend NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_alerts,
        COUNT(*) FILTER (WHERE alert_type = 'morning') as morning_alerts,
        COUNT(*) FILTER (WHERE alert_type = 'afternoon') as afternoon_alerts,
        COUNT(*) FILTER (WHERE alert_type = 'evening') as evening_alerts,
        COUNT(*) FILTER (WHERE sent_via_whatsapp = true) as alerts_sent,
        AVG(campaign_count) as avg_campaign_count,
        SUM(total_spend) as total_spend
    FROM ai_daily_alerts
    WHERE user_id = user_uuid 
    AND generated_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

-- Insert default preferences for new users
CREATE OR REPLACE FUNCTION insert_default_alert_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_alert_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences for new users
DROP TRIGGER IF EXISTS create_default_alert_preferences ON auth.users;
CREATE TRIGGER create_default_alert_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION insert_default_alert_preferences();

-- Comments for documentation
COMMENT ON TABLE ai_daily_alerts IS 'Stores AI-generated daily alerts for users';
COMMENT ON TABLE user_alert_preferences IS 'Stores user preferences for AI alert notifications';
COMMENT ON FUNCTION get_ai_alert_stats IS 'Returns statistics about AI alerts for a user over a specified time period'; 