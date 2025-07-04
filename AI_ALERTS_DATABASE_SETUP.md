# AI Alerts Database Setup

This guide will help you set up the database for the AI-powered daily alerts system.

## Quick Setup

### Option 1: Run the Simple Script (Recommended)

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `add_phone_number_column.sql`
3. Run the script

This script will:
- Add the `phone_number` column to your existing `user_alert_preferences` table
- Create necessary indexes
- Update RLS policies
- Verify the changes

### Option 2: Run the Full Schema (If Tables Don't Exist)

If the `user_alert_preferences` and `ai_daily_alerts` tables don't exist yet:

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `ai_daily_alerts_schema.sql`
3. Run the script

## What Gets Created

### Tables
- `ai_daily_alerts` - Stores AI-generated alerts
- `user_alert_preferences` - Stores user preferences (phone number, alert times, etc.)

### Indexes
- Performance indexes for faster queries
- Phone number index for WhatsApp lookups

### Functions
- `update_updated_at_column()` - Automatically updates timestamps
- `get_ai_alert_stats()` - Gets alert statistics
- `insert_default_alert_preferences()` - Creates default preferences for new users

### Triggers
- Automatically updates `updated_at` timestamp
- Creates default preferences for new users

### RLS Policies
- Secure access to user data
- Users can only see their own alerts and preferences

## Verification

After running the script, you should see:

1. **Tables exist**: Check in Supabase Dashboard → Table Editor
2. **Phone number column**: Should be visible in `user_alert_preferences` table
3. **No errors**: The script should complete without errors

## Testing

1. Go to `/dashboard/ai-alerts` in your app
2. Add your phone number in the preferences
3. Test an alert using the test buttons
4. Check that the alert is generated and stored in the database

## Troubleshooting

### "Trigger already exists" Error
- This is normal if you've run the script before
- The updated script now handles this with `DROP TRIGGER IF EXISTS`

### "Column already exists" Error
- The simple script checks if the column exists before adding it
- Safe to run multiple times

### RLS Policy Errors
- The script drops and recreates policies
- This ensures they're up to date

## Next Steps

After the database is set up:

1. **Configure WhatsApp**: Make sure your WhatsApp Business API is configured
2. **Test Alerts**: Use the test page to verify everything works
3. **Set Up Cron Jobs**: Configure automatic alerts (optional)
4. **Monitor**: Check the logs for any issues

## Support

If you encounter any issues:

1. Check the Supabase logs for detailed error messages
2. Verify your database permissions
3. Make sure all required environment variables are set
4. Test with the simple script first before running the full schema 