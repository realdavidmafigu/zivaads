# Facebook Ads API Integration for ZivaAds

This document explains the complete Facebook Ads API integration implemented in ZivaAds, including setup instructions, API endpoints, and usage examples.

## 🚀 Features

- **OAuth Authentication**: Secure Facebook Business account connection
- **Real-time Data Sync**: Automatic synchronization of campaigns, ad sets, and ads
- **Performance Monitoring**: Track CTR, CPC, spend, and other key metrics
- **Smart Alerts**: AI-powered performance insights and recommendations
- **Multi-Account Support**: Connect multiple Facebook Business accounts
- **Rate Limit Handling**: Built-in protection against API rate limits
- **Error Recovery**: Robust error handling and retry mechanisms

## 📋 Prerequisites

### 1. Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add the following products to your app:
   - **Facebook Login**
   - **Marketing API**
4. Configure app settings:
   - Set App Domains
   - Add OAuth redirect URIs
   - Configure privacy policy URL

### 2. Required Permissions

Your Facebook app needs the following permissions:
- `ads_management` - Manage ad campaigns
- `ads_read` - Read ad performance data
- `business_management` - Access business accounts

### 3. Environment Variables

Add these to your environment configuration:

```env
# Facebook App Configuration
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🗄️ Database Schema

The integration uses the following Supabase tables:

### `facebook_accounts`
Stores connected Facebook Business accounts:
- `user_id` - Reference to ZivaAds user
- `facebook_account_id` - Facebook's account ID
- `access_token` - Encrypted access token
- `account_status` - Account status (1=active, 2=disabled)
- `permissions` - Array of granted permissions

### `campaigns`
Stores Facebook ad campaigns:
- `facebook_campaign_id` - Facebook's campaign ID
- `name`, `status`, `objective` - Campaign details
- `daily_budget`, `lifetime_budget` - Budget information
- Performance metrics (impressions, clicks, CTR, CPC, etc.)

### `ad_sets` and `ads`
Store ad sets and individual ads with their configurations and performance data.

### `alerts`
Stores performance alerts and recommendations.

### `performance_snapshots`
Historical performance data for trend analysis.

### `sync_logs`
Tracks API sync operations and errors.

## 🔧 API Endpoints

### 1. Facebook OAuth Callback
```
GET /api/facebook/connect
```
Handles the OAuth callback from Facebook, exchanges authorization code for access token, and stores account information.

### 2. Fetch Campaigns
```
GET /api/facebook/campaigns?account_id={id}&limit={limit}&offset={offset}
```
Retrieves user's Facebook campaigns with performance metrics.

### 3. Sync Data
```
POST /api/facebook/sync
Body: { account_id?: string, sync_type?: 'all' | 'campaigns' | 'ad_sets' | 'ads' }
```
Triggers a full data synchronization for the specified account.

## 🛠️ Implementation Details

### Facebook API Client (`src/lib/facebook.ts`)

The `FacebookApiClient` class provides:
- **Rate limit handling**: Automatic retry with exponential backoff
- **Error handling**: Comprehensive error categorization and messaging
- **Token validation**: Automatic token validation and refresh
- **Batch operations**: Efficient data fetching with pagination

```typescript
// Example usage
const facebookClient = createFacebookClient(accessToken);
const campaigns = await facebookClient.getCampaigns(accountId);
const insights = await facebookClient.getCampaignInsights(campaignId);
```

### Utility Functions (`src/utils/facebookUtils.ts`)

Provides helper functions for:
- Connection status checking
- Performance scoring and evaluation
- Data formatting and display
- Status indicators and emojis

```typescript
// Check if user has Facebook connected
const hasFacebook = await hasFacebookConnection(userId);

// Calculate performance score
const score = calculatePerformanceScore(ctr, cpc, spend);
const evaluation = getPerformanceEvaluation(score);
```

## 🔐 Security Considerations

### 1. Access Token Storage
- Tokens are encrypted before storage
- Automatic token expiration checking
- Secure token refresh mechanism

### 2. Row Level Security (RLS)
- All database tables have RLS enabled
- Users can only access their own data
- Proper permission checks on all operations

### 3. OAuth Security
- State parameter validation
- CSRF protection
- Secure redirect URI validation

## 📊 Performance Monitoring

### Key Metrics Tracked
- **CTR (Click-Through Rate)**: Click performance
- **CPC (Cost Per Click)**: Cost efficiency
- **CPM (Cost Per Mille)**: Impression cost
- **Spend**: Total campaign expenditure
- **Reach**: Unique audience reached
- **Frequency**: Average impressions per user

### Performance Scoring
The system calculates a performance score (0-100) based on:
- CTR performance (40 points)
- CPC efficiency (30 points)
- Spend efficiency (30 points)

### Smart Alerts
Automatic alerts are generated for:
- High CPC campaigns
- Low CTR performance
- Budget threshold warnings
- Account status changes

## 🚀 Usage Examples

### 1. Connect Facebook Account

```typescript
// Navigate to connection page
window.location.href = '/dashboard/connect-facebook';

// Or programmatically
const oauthUrl = generateFacebookOAuthUrl();
window.location.href = oauthUrl;
```

### 2. Fetch Campaign Data

```typescript
// Using the API endpoint
const response = await fetch('/api/facebook/campaigns');
const { data: campaigns } = await response.json();

// Using the client directly
const facebookClient = createFacebookClient(accessToken);
const campaigns = await facebookClient.getCampaigns(accountId);
```

### 3. Sync Data

```typescript
// Trigger full sync
const response = await fetch('/api/facebook/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sync_type: 'all' })
});
```

## 🔄 Data Synchronization

### Automatic Sync
- Campaigns are synced when connecting accounts
- Performance data is updated with each API call
- Historical snapshots are created daily

### Manual Sync
- Users can trigger manual sync via API
- Sync logs track all operations
- Error handling with retry mechanisms

### Sync Types
- `campaigns`: Sync campaign data and insights
- `ad_sets`: Sync ad set configurations
- `ads`: Sync individual ad data
- `all`: Complete data synchronization

## 🐛 Troubleshooting

### Common Issues

1. **"No ad accounts found"**
   - Ensure user has admin access to Facebook Business account
   - Check account status in Facebook Business Manager
   - Verify app permissions are granted

2. **"Access token expired"**
   - Tokens automatically refresh on next API call
   - If persistent, user may need to reconnect account

3. **"Rate limit exceeded"**
   - System automatically retries with backoff
   - Check sync logs for detailed error information

4. **"Insufficient permissions"**
   - Verify app has required permissions
   - Check user's role in Facebook Business account

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📈 Future Enhancements

### Planned Features
- **Real-time webhooks**: Instant data updates
- **Advanced analytics**: Custom reporting and insights
- **Automated optimization**: AI-powered campaign suggestions
- **Multi-platform support**: Google Ads, TikTok Ads integration
- **Advanced targeting**: Audience insights and recommendations

### Performance Improvements
- **Caching layer**: Redis for frequently accessed data
- **Background jobs**: Queue-based sync operations
- **Data compression**: Optimized storage and transfer
- **CDN integration**: Faster static asset delivery

## 🤝 Contributing

When contributing to the Facebook integration:

1. Follow the existing code structure
2. Add proper error handling
3. Include TypeScript types
4. Write tests for new functionality
5. Update documentation
6. Follow security best practices

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review sync logs in the database
3. Check Facebook API documentation
4. Contact the development team

---

**Note**: This integration requires a Facebook Business account with active ad campaigns. Personal Facebook accounts are not supported. 