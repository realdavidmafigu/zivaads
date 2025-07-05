# AI Insights and Alerts Fixes for ZivaAds

## Issues Identified and Fixed

### 1. Database Structure Mismatch
**Problem**: The alerts system was trying to access performance data from old columns (`ctr`, `cpc`, `spend`, etc.) in the `campaigns` table that were removed during the recent migration.

**Solution**: Updated the alerts system to use the new `campaign_metrics` table structure with proper joins.

### 2. AI Insights API Issues
**Problem**: 
- OpenAI API key might not be configured
- Error handling was poor, causing the entire feature to fail
- No fallback responses when AI service is unavailable

**Solution**: 
- Added better error handling and fallback responses
- Improved API key validation
- Created a more robust AI insights system

### 3. WhatsApp Integration Issues
**Problem**: WhatsApp alerts might fail silently, breaking the entire alerts system.

**Solution**: Added proper error handling so alerts continue to work even if WhatsApp fails.

## Files Created/Fixed

### New Files Created:
1. `src/lib/alerts-fixed.ts` - Fixed alerts system using new database structure
2. `src/app/api/alerts/generate-fixed/route.ts` - Fixed alerts generation API
3. `src/app/api/ai-explain-fixed/route.ts` - Fixed AI insights API with better error handling
4. `src/components/AIInsights-fixed.tsx` - Fixed AI insights component
5. `test-ai-alerts-fix.js` - Test script to verify fixes

### Key Changes Made:

#### 1. Database Queries Fixed
```typescript
// OLD (broken):
const { data: campaigns } = await supabase
  .from('campaigns')
  .select('*')
  .eq('user_id', userId);

// NEW (fixed):
const { data: campaigns } = await supabase
  .from('campaigns')
  .select(`
    *,
    campaign_metrics!inner(
      impressions,
      clicks,
      ctr,
      cpc,
      cpm,
      spend,
      reach,
      frequency,
      conversions,
      is_latest
    )
  `)
  .eq('user_id', userId)
  .eq('campaign_metrics.is_latest', true);
```

#### 2. Better Error Handling
```typescript
// Added fallback responses when AI fails
if (!OPENAI_API_KEY) {
  return NextResponse.json({ 
    insight: generateFallbackResponse(campaigns, metrics)
  }, { status: 200 });
}
```

#### 3. WhatsApp Error Isolation
```typescript
// WhatsApp failures no longer break the entire alerts system
try {
  await alertDetector.sendWhatsAppAlerts(user.id, alerts);
} catch (whatsappError) {
  console.error('WhatsApp alert sending failed:', whatsappError);
  // Continue even if WhatsApp fails
}
```

## How to Apply the Fixes

### Step 1: Replace the Old Files
```bash
# Backup old files
cp src/lib/alerts.ts src/lib/alerts.ts.backup
cp src/app/api/alerts/generate/route.ts src/app/api/alerts/generate/route.ts.backup
cp src/app/api/ai-explain/route.ts src/app/api/ai-explain/route.ts.backup
cp src/components/AIInsights.tsx src/components/AIInsights.tsx.backup

# Replace with fixed versions
cp src/lib/alerts-fixed.ts src/lib/alerts.ts
cp src/app/api/alerts/generate-fixed/route.ts src/app/api/alerts/generate/route.ts
cp src/app/api/ai-explain-fixed/route.ts src/app/api/ai-explain/route.ts
cp src/components/AIInsights-fixed.tsx src/components/AIInsights.tsx
```

### Step 2: Update Environment Variables
Make sure these environment variables are set in your `.env.local`:

```bash
# Required for AI insights
OPENAI_API_KEY=your_openai_api_key_here

# Required for WhatsApp alerts
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token

# Already configured
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Test the Fixes
```bash
# Run the test script
node test-ai-alerts-fix.js
```

### Step 4: Update Dashboard Component
Update your dashboard to use the fixed AI insights component:

```typescript
// In your dashboard page
import AIInsights from '@/components/AIInsights'; // This now uses the fixed version
```

## Testing the Fixes

### 1. Test AI Insights
1. Go to your dashboard
2. Check if AI insights are loading properly
3. Look for the AI insights section with proper analysis
4. If OpenAI is not configured, you should see fallback insights

### 2. Test Alerts Generation
1. Go to `/api/alerts/generate` in your browser or use the test script
2. Check if alerts are being generated for campaigns with issues
3. Verify alerts are stored in the database

### 3. Test WhatsApp Integration
1. Check if WhatsApp alerts are being sent (if configured)
2. Verify that alerts still work even if WhatsApp fails

## Expected Behavior After Fixes

### AI Insights:
- ✅ Should load and display insights for campaigns
- ✅ Should show fallback insights if OpenAI is not configured
- ✅ Should handle errors gracefully without breaking the UI
- ✅ Should provide Zimbabwe-specific context and recommendations

### Alerts System:
- ✅ Should detect campaign issues using the new database structure
- ✅ Should generate alerts for low CTR, high CPC, budget issues, etc.
- ✅ Should store alerts in the database properly
- ✅ Should send WhatsApp alerts (if configured)
- ✅ Should continue working even if WhatsApp fails

### Database Queries:
- ✅ Should use the new `campaign_metrics` table for performance data
- ✅ Should join campaigns with their latest metrics
- ✅ Should not try to access removed columns from campaigns table

## Troubleshooting

### If AI Insights Still Don't Work:
1. Check if `OPENAI_API_KEY` is set in your environment
2. Check browser console for any errors
3. Verify the API endpoint `/api/ai-explain` is accessible
4. Check if the fallback insights are showing

### If Alerts Still Don't Work:
1. Check if campaigns have metrics in the `campaign_metrics` table
2. Verify the alerts table exists and has proper structure
3. Check if user alert thresholds are configured
4. Look for errors in the server logs

### If WhatsApp Alerts Don't Work:
1. Check if WhatsApp credentials are configured
2. Verify WhatsApp Business API is set up properly
3. Check if test messages can be sent
4. Look for WhatsApp-specific errors in logs

## Performance Improvements

The fixes also include several performance improvements:

1. **Better Caching**: AI responses are cached for 5 minutes to reduce API calls
2. **Efficient Queries**: Only fetch latest metrics using `is_latest` flag
3. **Error Isolation**: Individual failures don't break the entire system
4. **Fallback Responses**: System continues to work even when external services fail

## Future Enhancements

With these fixes in place, you can now:

1. **Add Real-time Alerts**: Set up webhooks for immediate alert notifications
2. **Enhanced AI Insights**: Add more sophisticated AI analysis using the new data structure
3. **Custom Alert Rules**: Allow users to create custom alert conditions
4. **Alert History**: Build comprehensive alert history and analytics
5. **Multi-channel Notifications**: Add email, SMS, or push notification support

## Support

If you encounter any issues after applying these fixes:

1. Check the test script output for specific error messages
2. Verify all environment variables are set correctly
3. Ensure the database migration was completed successfully
4. Check server logs for detailed error information

The fixes ensure that both AI insights and real-time alerts work reliably with the new database structure while providing graceful fallbacks when external services are unavailable. 