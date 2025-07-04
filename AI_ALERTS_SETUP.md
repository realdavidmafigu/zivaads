# AI-Powered Daily Alerts Setup Guide

This guide explains how to set up and use the AI-powered daily alerts system that sends brief, jargon-free notifications about campaign performance.

## Overview

The AI Daily Alerts system provides:
- **Brief, jargon-free notifications** about campaign performance
- **Scheduled alerts** at morning, afternoon, and evening times
- **WhatsApp delivery** for instant notifications
- **User-configurable preferences** for alert frequency and timing
- **AI-powered insights** that focus on business impact

## Database Setup

1. Run the SQL schema to create the required tables:

```sql
-- Execute the ai_daily_alerts_schema.sql file in your Supabase database
```

This creates:
- `ai_daily_alerts` table for storing generated alerts
- `user_alert_preferences` table for user settings
- RLS policies for security
- Helper functions for statistics

## API Endpoints

### 1. Generate AI Daily Alert
```
POST /api/alerts/ai-daily
```

**Request Body:**
```json
{
  "alertType": "morning|afternoon|evening",
  "forceSend": true
}
```

**Response:**
```json
{
  "success": true,
  "alert": {
    "type": "morning",
    "content": "Good morning! Your ads are performing well today...",
    "summary": "Morning performance update",
    "campaignCount": 5,
    "totalSpend": 150.50,
    "shouldSendAlert": true
  }
}
```

### 2. Get Recent AI Alerts
```
GET /api/alerts/ai-daily?limit=10&type=morning
```

### 3. Cron Job for Scheduled Alerts
```
POST /api/cron/ai-daily-alerts
```

**Request Body:**
```json
{
  "alertType": "morning"
}
```

## How to Use

### 1. Test the System

Visit `/dashboard/ai-alerts` to:
- Configure your alert preferences
- Test morning, afternoon, and evening alerts
- View recent AI-generated alerts

### 2. Configure Preferences

Users can set:
- **Enable/disable AI alerts**
- **Alert times**: Morning (6 AM - 12 PM), Afternoon (12 PM - 6 PM), Evening (6 PM - 12 AM)
- **Alert frequency**: Daily, weekly, or custom
- **Test alerts** to see how they work

### 3. Set Up Cron Jobs

To automatically send alerts, set up cron jobs:

```bash
# Morning alerts (6 AM)
0 6 * * * curl -X POST http://your-domain/api/cron/ai-daily-alerts -H "Content-Type: application/json" -d '{"alertType":"morning"}'

# Afternoon alerts (2 PM)
0 14 * * * curl -X POST http://your-domain/api/cron/ai-daily-alerts -H "Content-Type: application/json" -d '{"alertType":"afternoon"}'

# Evening alerts (8 PM)
0 20 * * * curl -X POST http://your-domain/api/cron/ai-daily-alerts -H "Content-Type: application/json" -d '{"alertType":"evening"}'
```

## AI Alert Examples

### Morning Alert
```
Good morning! Your ads are running smoothly with 5 active campaigns. 
You've spent $45.20 so far today and are getting good engagement. 
Keep an eye on your "Smart Auto Spares" campaign as it's performing above average.
```

### Afternoon Alert
```
Afternoon check-in: Your ads are doing well during peak hours. 
Total spend is $78.50 across all campaigns with strong click-through rates. 
Consider increasing budget on your best-performing ads for better results.
```

### Evening Alert
```
Evening wrap-up: Great day for your ads! You spent $125.30 total 
and reached 2,450 people. Your "Harare Business" campaign had 
the best performance. Review tomorrow's budget allocation.
```

## Features

### 1. Jargon-Free Language
- No technical terms like "CTR", "CPC", "impressions"
- Uses plain English: "click-through rates", "cost per click", "views"
- Focuses on business impact, not metrics

### 2. Smart Timing
- **Morning**: Start-of-day insights and motivation
- **Afternoon**: Midday performance check and optimization tips
- **Evening**: End-of-day summary and next-day planning

### 3. WhatsApp Integration
- Sends alerts directly to user's WhatsApp
- Uses existing WhatsApp alert infrastructure
- Includes campaign-specific insights

### 4. User Control
- Enable/disable alerts completely
- Choose which times to receive alerts
- Set custom frequencies
- Test alerts before committing

## Technical Implementation

### AI Alert Generation
The system uses OpenAI GPT-4 to:
1. Analyze campaign data
2. Generate contextual insights
3. Create friendly, actionable messages
4. Determine if an alert should be sent

### Data Sources
- Campaign performance metrics
- Historical data for context
- User preferences and settings
- Time of day for appropriate messaging

### Error Handling
- Fallback messages if AI fails
- Graceful degradation
- Logging for debugging
- User-friendly error messages

## Customization

### Alert Content
Modify the AI prompt in `src/lib/ai-daily-alerts.ts` to:
- Change tone and style
- Add specific business context
- Include different metrics
- Customize for different industries

### Timing
Adjust alert times by modifying:
- Cron job schedules
- Time zone handling
- User preference options

### Delivery
Extend beyond WhatsApp to:
- Email notifications
- SMS messages
- In-app notifications
- Slack/Discord integration

## Monitoring

### Alert Statistics
Use the database function to get insights:
```sql
SELECT * FROM get_ai_alert_stats('user-uuid', 30);
```

### Logs
Monitor:
- Alert generation success/failure
- WhatsApp delivery status
- User engagement with alerts
- AI response quality

## Best Practices

1. **Start Small**: Begin with one alert type and expand
2. **Test Thoroughly**: Use test alerts before going live
3. **Monitor Feedback**: Track user satisfaction and engagement
4. **Iterate**: Refine AI prompts based on user feedback
5. **Respect Preferences**: Always honor user alert settings

## Troubleshooting

### Common Issues

1. **Alerts not generating**
   - Check OpenAI API key
   - Verify campaign data exists
   - Review error logs

2. **WhatsApp not sending**
   - Verify WhatsApp integration
   - Check phone number format
   - Review API response

3. **Poor AI quality**
   - Refine prompts
   - Add more context
   - Adjust temperature settings

### Debug Commands

```bash
# Test alert generation
curl -X POST http://localhost:3000/api/alerts/ai-daily \
  -H "Content-Type: application/json" \
  -d '{"alertType":"morning","forceSend":true}'

# Check recent alerts
curl http://localhost:3000/api/alerts/ai-daily?limit=5

# Test cron endpoint
curl -X POST http://localhost:3000/api/cron/ai-daily-alerts \
  -H "Content-Type: application/json" \
  -d '{"alertType":"morning"}'
```

## Support

For issues or questions:
1. Check the logs in your application
2. Review the database for alert records
3. Test individual components
4. Verify all dependencies are configured

The AI Daily Alerts system is designed to be simple, reliable, and user-friendly while providing valuable insights about campaign performance. 