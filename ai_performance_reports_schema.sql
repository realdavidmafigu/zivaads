-- AI Performance Reports Table
CREATE TABLE IF NOT EXISTS ai_performance_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('morning', 'afternoon', 'evening')),
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  recommendations TEXT[] NOT NULL,
  campaign_count INTEGER NOT NULL DEFAULT 0,
  total_spend DECIMAL(10,2) NOT NULL DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_performance_reports_user_id ON ai_performance_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_performance_reports_generated_at ON ai_performance_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_performance_reports_type ON ai_performance_reports(report_type);

-- Enable RLS
ALTER TABLE ai_performance_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI performance reports" ON ai_performance_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI performance reports" ON ai_performance_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to clean up old reports (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_ai_reports()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_performance_reports 
  WHERE generated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to clean up old reports (optional)
-- SELECT cron.schedule('cleanup-ai-reports', '0 2 * * *', 'SELECT cleanup_old_ai_reports();'); 