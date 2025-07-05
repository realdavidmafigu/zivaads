-- Fix for "column ad_id does not exist" error
-- This script safely adds the missing ad_id column to the alerts table

-- Step 1: Check if alerts table exists and what columns it has
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    -- Check if alerts table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'alerts'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Alerts table exists, checking for ad_id column...';
        
        -- Check if ad_id column exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'alerts' AND column_name = 'ad_id'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            RAISE NOTICE 'Adding ad_id column to alerts table...';
            ALTER TABLE alerts ADD COLUMN ad_id UUID REFERENCES ads(id) ON DELETE CASCADE;
            RAISE NOTICE 'Successfully added ad_id column to alerts table';
        ELSE
            RAISE NOTICE 'ad_id column already exists in alerts table';
        END IF;
        
        -- Check for other missing columns
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'alerts' AND column_name = 'ad_set_id'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            RAISE NOTICE 'Adding ad_set_id column to alerts table...';
            ALTER TABLE alerts ADD COLUMN ad_set_id UUID REFERENCES ad_sets(id) ON DELETE CASCADE;
            RAISE NOTICE 'Successfully added ad_set_id column to alerts table';
        END IF;
        
        -- Check for updated_at column
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'alerts' AND column_name = 'updated_at'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            RAISE NOTICE 'Adding updated_at column to alerts table...';
            ALTER TABLE alerts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Successfully added updated_at column to alerts table';
        END IF;
        
    ELSE
        RAISE NOTICE 'Alerts table does not exist, creating it...';
        
        -- Create alerts table with all required columns
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
        
        RAISE NOTICE 'Successfully created alerts table with all required columns';
    END IF;
END $$;

-- Step 2: Create indexes for alerts table
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_campaign_id ON alerts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_alerts_ad_set_id ON alerts(ad_set_id);
CREATE INDEX IF NOT EXISTS idx_alerts_ad_id ON alerts(ad_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_is_resolved ON alerts(is_resolved);

-- Step 3: Enable RLS and create policies for alerts table
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON alerts;

-- Create new policies
CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can insert own alerts" ON alerts FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Step 4: Create trigger for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Verify the fix
SELECT 
    'Alerts table structure verification' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'alerts' 
ORDER BY ordinal_position;

-- Step 6: Show current alerts table count
SELECT 
    'Alerts table status' as info,
    COUNT(*) as total_alerts,
    COUNT(CASE WHEN is_resolved = true THEN 1 END) as resolved_alerts,
    COUNT(CASE WHEN is_resolved = false THEN 1 END) as active_alerts
FROM alerts; 