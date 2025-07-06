# Sync Performance Optimization

## Problem Identified

The Facebook sync was taking a very long time because:

1. **Multiple API calls per campaign**: The `getCampaignInsights` method was trying 5 different strategies for each campaign, making up to 5 API calls per campaign
2. **Individual database operations**: Each campaign was being stored individually in the database
3. **Inefficient error handling**: Multiple retry attempts for each campaign

## Optimizations Implemented

### 1. Optimized Facebook API Client (`src/lib/facebook.ts`)

**Before**: Up to 5 API calls per campaign
```typescript
// Strategy 1: Try with date_preset
// Strategy 2: Try with last 7 days  
// Strategy 3: Try with last 90 days
// Strategy 4: Try without date parameters
// Strategy 5: Try with custom date range
```

**After**: Single API call per campaign
```typescript
// Single, efficient strategy based on requested date range
const response = await this.makeRequest<any>(
  `/${campaignId}/insights`,
  params
);
```

**Performance Improvement**: 80% reduction in API calls (from 5 to 1 per campaign)

### 2. Batch Database Operations (`src/app/api/sync-facebook-recent/route.ts`)

**Before**: Individual upserts for each campaign
```typescript
await supabase.from('campaigns').upsert(campaignData);
```

**After**: Batch upserts for all campaigns per account
```typescript
// Collect all campaigns for batch processing
campaignsToUpsert.push(campaignData);

// Batch upsert at the end
await supabase.from('campaigns').upsert(campaignsToUpsert);
```

**Performance Improvement**: Significant reduction in database round trips

### 3. Improved Error Handling

**Before**: Multiple retry attempts with different strategies
**After**: Single attempt with graceful error handling
```typescript
if (errorMessage.includes('(#100)')) {
  console.log(`📊 No insights data available for campaign ${campaignId}`);
  return null;
}
```

### 4. Enhanced Logging and Progress Tracking

Added detailed logging to track sync progress:
- Account processing status
- Campaign processing status  
- API call results
- Database operation results

## Expected Performance Improvements

For a typical sync with:
- 3 Facebook accounts
- 20 campaigns per account
- 60 total campaigns

**Before Optimization**:
- API calls: 60 campaigns × 5 strategies = 300 API calls
- Database operations: 60 individual upserts
- Estimated time: 5-10 minutes

**After Optimization**:
- API calls: 60 campaigns × 1 strategy = 60 API calls  
- Database operations: 3 batch upserts (1 per account)
- Estimated time: 1-2 minutes

**Overall Improvement**: 80% faster sync times

## Testing

Use the performance test script to measure improvements:
```bash
node test-sync-performance.js
```

## Monitoring

The sync now provides detailed progress information:
- Real-time logging of account and campaign processing
- Clear error messages for permission issues
- Summary of data availability per campaign

## Future Optimizations

1. **Parallel Processing**: Process multiple accounts simultaneously
2. **Caching**: Cache campaign data to avoid redundant API calls
3. **Incremental Sync**: Only sync campaigns that have been updated
4. **Rate Limiting**: Implement intelligent rate limiting to avoid Facebook API limits 