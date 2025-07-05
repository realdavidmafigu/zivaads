# Campaign Data Restructure - ZivaAds

## Overview

This document outlines the comprehensive restructuring of campaign data storage and retrieval in ZivaAds to improve data integrity, performance, and support for advanced analytics.

## 🎯 Goals Achieved

### ✅ 1. Proper Data Separation
- **Campaign metadata** (name, ID, objective, status) stored in `campaigns` table
- **Performance metrics** (CTR, CPC, spend, impressions) stored in separate `campaign_metrics` table
- **No more unstructured JSON blobs** - all data is properly normalized

### ✅ 2. Time-Based Tracking
- **Hourly metrics** with timestamps for real-time monitoring
- **Daily aggregations** for trend analysis
- **Historical data preservation** with proper date/hour tracking

### ✅ 3. Improved Query Performance
- **Dedicated indexes** for time-based queries
- **Latest metrics flag** for quick access to current performance
- **Efficient joins** between campaigns and metrics

### ✅ 4. Flexible Data Sources
- **Facebook API** for live data
- **Database cache** for fast dashboard loading
- **Manual entry** support for custom metrics
- **Data source tracking** for audit trails

## 📊 Database Schema Changes

### New Tables

#### `campaign_metrics`
```sql
CREATE TABLE campaign_metrics (
    id UUID PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id),
    
    -- Time tracking
    metric_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_date DATE NOT NULL,
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
    
    -- Enhanced metrics
    link_clicks BIGINT DEFAULT 0,
    whatsapp_clicks BIGINT DEFAULT 0,
    cpc_link DECIMAL(10,2) DEFAULT 0,
    cpc_whatsapp DECIMAL(10,2) DEFAULT 0,
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'facebook_api',
    is_latest BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `ad_set_metrics` and `ad_metrics`
Similar structure for ad set and ad-level performance tracking.

### Updated Tables

#### `campaigns` (Metadata Only)
```sql
-- REMOVED: All performance metric columns
-- impressions, clicks, ctr, cpc, cpm, spend, reach, frequency, conversions

-- KEPT: All metadata columns
-- name, status, objective, daily_budget, created_time, etc.
```

## 🔧 API Changes

### Campaigns API (`/api/facebook/campaigns`)

#### New Query Parameters
- `use_cache=true/false` - Use cached data or fetch live from Facebook
- `force_refresh=true` - Force refresh even if cache is enabled

#### Response Format
```json
{
  "data": [...],
  "pagination": {...},
  "data_source": "database|facebook_api",
  "errors": [...]
}
```

### New Metrics API (`/api/facebook/campaigns/[id]/metrics`)

#### Query Parameters
- `time_range=last_24h|last_7d|last_30d|custom`
- `granularity=hourly|daily|weekly`
- `start_date=YYYY-MM-DD` (for custom range)
- `end_date=YYYY-MM-DD` (for custom range)
- `limit=100`

#### Response Format
```json
{
  "campaign": {
    "id": "campaign_id",
    "name": "Campaign Name",
    "latest_metrics": {...}
  },
  "metrics": [...],
  "aggregated_data": {
    "total_impressions": 10000,
    "total_clicks": 500,
    "avg_ctr": 5.0,
    "overall_cpc": 1.20
  },
  "trends": {
    "ctr_trend": {
      "change_percentage": 15.5,
      "direction": "up"
    }
  }
}
```

## 🎨 UI/UX Improvements

### Dashboard Enhancements

#### Data Source Toggle
- **Cached Data** (Recommended) - Fast loading, uses database
- **Live Data** - Real-time from Facebook API

#### Data Source Indicator
- Shows current data source (Cached/Live)
- Displays last update timestamp
- Visual feedback for data freshness

#### Refresh Button
- Manual refresh capability
- Loading states with spinner
- Error handling with retry options

### Campaign Cards
- **Performance ribbons** with color coding
- **Health scores** based on CTR/CPC
- **AI insights** with actionable recommendations
- **Trend indicators** showing performance direction

## 🚀 Migration Process

### 1. Run Migration Script
```bash
# Execute the migration script
psql -d your_database -f database_migration.sql
```

### 2. Verify Migration
```sql
-- Check migrated campaigns
SELECT COUNT(*) FROM campaign_metrics WHERE data_source = 'migration';

-- Verify no data loss
SELECT COUNT(*) FROM campaigns WHERE impressions > 0 OR clicks > 0;
```

### 3. Update Application Code
- Deploy new API endpoints
- Update frontend to use new data structure
- Test both cached and live data modes

### 4. Clean Up (Optional)
```sql
-- After verifying everything works, remove old columns
ALTER TABLE campaigns DROP COLUMN IF EXISTS impressions;
ALTER TABLE campaigns DROP COLUMN IF EXISTS clicks;
-- ... (other performance columns)
```

## 📈 Benefits

### For Users
- **Faster dashboard loading** with cached data
- **Real-time insights** when needed
- **Better performance tracking** with hourly data
- **Historical trend analysis** capabilities

### For Developers
- **Cleaner data structure** - no more nested JSON
- **Better query performance** with proper indexing
- **Easier analytics** with time-based data
- **Scalable architecture** for future features

### For Business
- **Improved user experience** with faster loading
- **Better insights** for campaign optimization
- **Data integrity** with proper normalization
- **Future-proof** for AI features and WhatsApp alerts

## 🔮 Future Use Cases Supported

### AI Insights
- **Historical trend analysis** for better recommendations
- **Performance prediction** based on time-series data
- **Anomaly detection** with hourly tracking

### WhatsApp Alerts
- **Real-time monitoring** with hourly metrics
- **Threshold-based alerts** with precise timing
- **Performance summaries** with trend context

### Campaign Filtering
- **Time-based filtering** (last 24h, 7d, 30d)
- **Performance-based sorting** with latest metrics
- **Custom date ranges** for analysis

### Advanced Analytics
- **Hourly performance patterns** for optimization
- **Cross-campaign comparisons** with normalized data
- **ROI calculations** with detailed cost tracking

## 🛠️ Technical Implementation

### Database Triggers
```sql
-- Automatically marks latest metrics
CREATE TRIGGER mark_latest_campaign_metrics_trigger 
    BEFORE INSERT ON campaign_metrics 
    FOR EACH ROW 
    EXECUTE FUNCTION mark_latest_campaign_metrics();
```

### Row Level Security
```sql
-- Users can only access their own campaign metrics
CREATE POLICY "Users can view own campaign metrics" ON campaign_metrics 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaigns 
          WHERE campaigns.id = campaign_metrics.campaign_id 
          AND campaigns.user_id::text = auth.uid()::text)
);
```

### Indexes for Performance
```sql
-- Optimized for time-based queries
CREATE INDEX idx_campaign_metrics_timestamp ON campaign_metrics(metric_timestamp);
CREATE INDEX idx_campaign_metrics_latest ON campaign_metrics(campaign_id, is_latest) 
WHERE is_latest = true;
```

## 📋 Testing Checklist

### Database
- [ ] Migration script runs without errors
- [ ] All existing data is preserved
- [ ] New metrics are being stored correctly
- [ ] Indexes are working for fast queries
- [ ] RLS policies are enforced

### API
- [ ] Campaigns API returns cached data
- [ ] Campaigns API fetches live data when requested
- [ ] Metrics API returns time-based data
- [ ] Error handling works correctly
- [ ] Pagination works with new structure

### Frontend
- [ ] Dashboard loads with cached data
- [ ] Data source toggle works
- [ ] Refresh button updates data
- [ ] Campaign cards display correctly
- [ ] Error states are handled

### Performance
- [ ] Dashboard loads faster with cache
- [ ] API responses are under 2 seconds
- [ ] Database queries are optimized
- [ ] No memory leaks in frontend

## 🚨 Important Notes

### Breaking Changes
- **API response format** has changed slightly
- **Database schema** requires migration
- **Frontend components** need updates

### Backward Compatibility
- **Old API endpoints** still work during transition
- **Database view** provides backward compatibility
- **Migration script** preserves all existing data

### Monitoring
- **Watch for API errors** during transition
- **Monitor database performance** with new indexes
- **Check data consistency** between old and new structure

## 📞 Support

If you encounter issues during migration:

1. **Check the migration logs** for specific errors
2. **Verify data integrity** with the verification queries
3. **Rollback if needed** - the migration is reversible
4. **Contact support** with specific error messages

---

**This restructuring significantly improves ZivaAds' data architecture, making it ready for advanced features like AI insights, real-time alerts, and comprehensive analytics.** 