# WhatsApp Alerts System for ZivaAds

This document explains the complete WhatsApp Business API integration for sending automated alerts to users when campaign issues are detected.

## 🚀 Features

- **Real-time Campaign Monitoring**: Automatically detects campaign issues every 30 minutes
- **WhatsApp Business API Integration**: Sends formatted alerts via WhatsApp
- **Customizable Alert Types**: Budget depletion, low CTR, high costs, campaign pauses, high frequency
- **User Preferences**: Configurable alert types, quiet hours, and frequency settings
- **Rate Limiting**: Built-in protection against spam and API limits
- **Alert Management**: View, resolve, and ignore alerts through the dashboard
- **Test Alerts**: Send test messages to verify WhatsApp integration

## 📋 Prerequisites

### 1. WhatsApp Business API Setup

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add the **WhatsApp Business API** product to your app
4. Configure WhatsApp Business API settings:
   - Set up a phone number
   - Create message templates
   - Configure webhooks (optional)

### 2. Required Environment Variables

Add these to your environment configuration:

```env
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

# Optional: Cron job security
CRON_SECRET=your_cron_secret_key

# Existing Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the WhatsApp alerts schema to create necessary tables:

```sql
-- Execute the whatsapp_alerts_schema.sql file
psql -d your_database -f whatsapp_alerts_schema.sql
```

## 🗄️ Database Schema

The system uses the following tables:

### `user_whatsapp_preferences`
Stores user WhatsApp settings:
- `user_id` - Reference to ZivaAds user
- `is_enabled` - Whether WhatsApp alerts are enabled
- `phone_number` - User's WhatsApp number
- `is_verified` - Whether phone number is verified
- Alert type preferences (budget_depleted, low_ctr, etc.)
- Quiet hours settings
- Alert frequency settings

### `user_alert_thresholds`
Stores customizable alert thresholds:
- `low_ctr` - CTR threshold for low performance alerts
- `high_cpc` - CPC threshold for high cost alerts
- `budget_usage` - Budget usage percentage threshold
- `spend_limit` - Daily spend limit threshold
- `frequency_cap` - Frequency threshold for over-exposure alerts

### `whatsapp_message_logs`
Tracks all WhatsApp messages sent:
- Message content and type
- Delivery status
- Error messages
- Timestamps

### `cron_logs`
Tracks automated campaign checks:
- Job execution status
- Number of alerts generated
- WhatsApp messages sent
- Error logs

## 🔧 API Endpoints

### 1. Fetch Alerts
```
GET /api/alerts?days=30
```
Retrieves user's alerts with statistics.

### 2. Resolve Alert
```
POST /api/alerts/{id}/resolve
```
Marks an alert as resolved.

### 3. Send Test Alert
```
POST /api/alerts/test
```
Sends a test WhatsApp message to verify integration.

### 4. Campaign Check Cron Job
```
POST /api/cron/check-campaigns
```
Automated endpoint that runs every 30 minutes to check campaigns and send alerts.

## 🛠️ Implementation Details

### WhatsApp Client (`src/lib/whatsapp.ts`)

The `WhatsAppClient` class provides:
- **Rate limiting**: Automatic protection against API limits
- **Template messages**: Pre-formatted alert templates
- **Phone number formatting**: Automatic country code handling
- **User preferences**: Respects user settings and quiet hours
- **Error handling**: Comprehensive error logging and recovery

```typescript
// Example usage
import { whatsappClient, sendWhatsAppAlert } from '@/lib/whatsapp';

// Send a budget alert
await sendWhatsAppAlert(userId, 'budget_depleted', {
  campaign_name: 'Summer Sale',
  spend: 150.00
});
```

### Alert Detection (`src/lib/alerts.ts`)

The `AlertDetector` class provides:
- **Campaign monitoring**: Checks all active campaigns for issues
- **Threshold management**: Customizable alert triggers
- **Alert generation**: Creates and stores alerts in database
- **WhatsApp integration**: Automatically sends alerts via WhatsApp

```typescript
// Example usage
import { alertDetector, detectCampaignIssues } from '@/lib/alerts';

// Detect issues for a user
const alerts = await detectCampaignIssues(userId);
```

### Alert Card Component (`src/components/AlertCard.tsx`)

A reusable component for displaying alerts with:
- **Severity indicators**: Color-coded alert levels
- **Action buttons**: Resolve, ignore, view campaign
- **Metric display**: Shows relevant performance data
- **Timestamp**: Human-readable time ago format

## 📱 Alert Types

### 1. Budget Depleted
- **Trigger**: Campaign uses ≥90% of daily budget
- **Template**: Shows current spend and budget usage
- **Action**: "View Campaign" button

### 2. Low CTR
- **Trigger**: CTR falls below user-defined threshold (default 1%)
- **Template**: Shows current CTR vs threshold
- **Action**: "Optimize Now" button

### 3. High Costs
- **Trigger**: CPC exceeds user-defined threshold (default $5)
- **Template**: Shows current CPC vs threshold
- **Action**: "Review Costs" button

### 4. Campaign Paused
- **Trigger**: Campaign status changes to PAUSED
- **Template**: Shows pause reason
- **Action**: "Reactivate" button

### 5. High Frequency
- **Trigger**: Frequency exceeds user-defined threshold (default 3.0)
- **Template**: Shows current frequency vs threshold
- **Action**: "Adjust Targeting" button

## ⚙️ Configuration

### Alert Thresholds

Users can customize alert thresholds in the settings:

```typescript
const thresholds = {
  low_ctr: 1.0,        // 1% CTR threshold
  high_cpc: 5.0,       // $5 CPC threshold
  budget_usage: 90,    // 90% budget usage threshold
  spend_limit: 100,    // $100 daily spend limit
  frequency_cap: 3.0   // 3.0 frequency threshold
};
```

### Quiet Hours

Users can set quiet hours to avoid notifications:

```typescript
const quietHours = {
  enabled: true,
  start: 22,  // 10:00 PM
  end: 8      // 8:00 AM
};
```

### Alert Frequency

Users can choose alert frequency:
- **Immediate**: Send alerts as soon as issues are detected
- **Hourly**: Send digest of all alerts every hour
- **Daily**: Send digest of all alerts once per day

## 🔄 Automated Monitoring

### Cron Job Setup

The system includes an automated cron job that runs every 30 minutes:

```bash
# Add to your crontab
*/30 * * * * curl -X POST https://your-domain.com/api/cron/check-campaigns \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Manual Trigger

You can also trigger campaign checks manually:

```bash
curl -X POST https://your-domain.com/api/cron/check-campaigns
```

## 📊 Dashboard Integration

### Alerts Page (`/dashboard/alerts`)

Features:
- **Recent alerts list**: Last 30 days of alerts
- **Filtering**: By status, severity, and alert type
- **Search**: Find alerts by campaign name or message
- **Statistics**: Alert counts by severity
- **Test button**: Send test WhatsApp alert
- **Settings link**: Quick access to alert preferences

### Alert Settings Page (`/dashboard/settings/alerts`)

Features:
- **WhatsApp configuration**: Phone number and verification
- **Alert preferences**: Enable/disable specific alert types
- **Quiet hours**: Set notification-free periods
- **Alert frequency**: Choose immediate, hourly, or daily
- **Threshold settings**: Customize alert triggers
- **Test alerts**: Verify WhatsApp integration

## 🐛 Troubleshooting

### Common Issues

1. **"WhatsApp API Error"**
   - Check `WHATSAPP_ACCESS_TOKEN` is valid
   - Verify `WHATSAPP_PHONE_NUMBER_ID` is correct
   - Ensure phone number is approved in WhatsApp Business

2. **"No alerts being sent"**
   - Check user has enabled WhatsApp alerts
   - Verify phone number is verified
   - Check quiet hours settings
   - Ensure alert type is enabled in preferences

3. **"Rate limit exceeded"**
   - System automatically handles rate limiting
   - Check WhatsApp Business API limits
   - Review message templates are approved

4. **"Cron job not running"**
   - Verify cron job is properly scheduled
   - Check `CRON_SECRET` environment variable
   - Review server logs for errors

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📈 Future Enhancements

### Planned Features
- **Webhook support**: Real-time alert delivery
- **Message templates**: More customizable templates
- **Alert scheduling**: Custom alert schedules
- **Team notifications**: Multiple recipients per alert
- **Alert analytics**: Track alert effectiveness
- **Integration APIs**: Connect with other notification services

## 🔒 Security Considerations

- **Rate limiting**: Built-in protection against spam
- **User verification**: Phone number verification required
- **RLS policies**: Database-level security
- **Cron authentication**: Secret-based cron job protection
- **Error logging**: Comprehensive audit trail

## 📞 Support

For issues with the WhatsApp alerts system:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Verify WhatsApp Business API configuration
4. Test with the "Send Test Alert" feature

---

**Note**: This system requires a valid WhatsApp Business API account and approved message templates. Ensure compliance with WhatsApp's messaging policies and rate limits. 