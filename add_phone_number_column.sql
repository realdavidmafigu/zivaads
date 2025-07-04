-- Add phone_number column to existing user_alert_preferences table
-- This script is safe to run multiple times

-- Add phone_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_alert_preferences' 
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE user_alert_preferences ADD COLUMN phone_number TEXT;
        RAISE NOTICE 'Added phone_number column to user_alert_preferences table';
    ELSE
        RAISE NOTICE 'phone_number column already exists in user_alert_preferences table';
    END IF;
END $$;

-- Add index for phone_number if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_alert_preferences_phone ON user_alert_preferences(phone_number);

-- Update RLS policies to include phone_number
DROP POLICY IF EXISTS "Users can view their own alert preferences" ON user_alert_preferences;
CREATE POLICY "Users can view their own alert preferences" ON user_alert_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own alert preferences" ON user_alert_preferences;
CREATE POLICY "Users can insert their own alert preferences" ON user_alert_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own alert preferences" ON user_alert_preferences;
CREATE POLICY "Users can update their own alert preferences" ON user_alert_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_alert_preferences' 
AND column_name = 'phone_number'; 