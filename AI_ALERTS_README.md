# AI Performance Alerts System

## Overview

The AI Performance Alerts System provides intelligent, periodic reports about your Facebook ad campaign performance. It uses AI to analyze your campaign data and generate clear, actionable insights without technical jargon.

## Features

### 🕐 **Periodic Reports**
- **Morning Reports** (8 AM): Start your day with insights about overnight performance
- **Afternoon Reports** (2 PM): Check performance during peak hours
- **Evening Reports** (8 PM): Review daily performance and plan for tomorrow

### 🤖 **AI-Powered Analysis**
- Analyzes campaign performance data
- Identifies trends and patterns
- Provides actionable recommendations
- Uses simple, clear language (no technical jargon)

### 📱 **WhatsApp Integration**
- Automatic alerts sent to WhatsApp
- Respects quiet hours preferences
- Includes summary and key recommendations
- Only sends when there are important insights

## Setup Instructions

### 1. Database Setup

Run the SQL schema to create the required tables:

```sql
-- Run this in your Supabase SQL editor
\i ai_performance_reports_schema.sql
```

### 2. Environment Variables

Ensure these environment variables are set:

```env
# OpenAI API Key for AI analysis
OPENAI_API_KEY=your_openai_api_key

# Cron job secret (optional but recommended)
CRON_SECRET=your_cron_secret_key

# WhatsApp configuration (if using WhatsApp alerts)
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
```

### 3. Cron Job Setup

Set up automatic cron jobs to generate reports at scheduled times:

#### Option A: Using a Cron Service (Recommended)

Use a service like [Cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

**Morning Reports (8 AM):**
```
URL: https://your-domain.com/api/cron/ai-performance-reports?type=morning
Method: POST
Headers: Authorization: Bearer your_cron_secret
Schedule: 0 8 * * *
```

**Afternoon Reports (2 PM):**
```
URL: https://your-domain.com/api/cron/ai-performance-reports?type=afternoon
Method: POST
Headers: Authorization: Bearer your_cron_secret
Schedule: 0 14 * * *
```

**Evening Reports (8 PM):**
```
URL: https://your-domain.com/api/cron/ai-performance-reports?type=evening
Method: POST
Headers: Authorization: Bearer your_cron_secret
Schedule: 0 20 * * *
```

#### Option B: Server Cron (Linux/Unix)

Add to your server's crontab:

```bash
# Edit crontab
crontab -e

# Add these lines
0 8 * * * curl -X POST -H "Authorization: Bearer your_cron_secret" https://your-domain.com/api/cron/ai-performance-reports?type=morning
0 14 * * * curl -X POST -H "Authorization: Bearer your_cron_secret" https://your-domain.com/api/cron/ai-performance-reports?type=afternoon
0 20 * * * curl -X POST -H "Authorization: Bearer your_cron_secret" https://your-domain.com/api/cron/ai-performance-reports?type=evening
```

### 4. Testing

#### Manual Testing

1. **Test the API directly:**
   ```bash
   curl -X POST https://your-domain.com/api/cron/ai-performance-reports?type=morning
   ```

2. **Use the test page:**
   Visit `https://your-domain.com/test-ai-alerts` to test all features

3. **Generate reports manually:**
   ```bash
   curl -X POST https://your-domain.com/api/ai-reports \
     -H "Content-Type: application/json" \
     -d '{"type": "morning"}'
   ```

#### Dashboard Integration

Add the AI Performance Reports component to your dashboard:

```tsx
import AIPerformanceReports from '@/components/AIPerformanceReports';

// In your dashboard page
<AIPerformanceReports />
```

## API Endpoints

### Generate AI Report
```http
POST /api/ai-reports
Content-Type: application/json

{
  "type": "morning" | "afternoon" | "evening"
}
```

### Get AI Reports
```http
GET /api/ai-reports?limit=10&type=morning
```

### Cron Job Endpoint
```http
POST /api/cron/ai-performance-reports?type=morning
Authorization: Bearer your_cron_secret
```

## How It Works

### 1. **Data Collection**
- Fetches recent campaign data from your Facebook ads
- Filters to only campaigns with meaningful activity
- Calculates performance metrics

### 2. **AI Analysis**
- Uses OpenAI GPT-4 to analyze campaign performance
- Generates insights based on time of day context
- Provides actionable recommendations
- Uses simple, non-technical language

### 3. **Report Generation**
- Creates structured reports with summary, content, and recommendations
- Stores reports in database for historical tracking
- Determines if WhatsApp alert should be sent

### 4. **Alert Delivery**
- Sends WhatsApp alerts only when there are important insights
- Respects user preferences and quiet hours
- Includes key information and recommendations

## Report Types

### Morning Reports
- **Focus:** Overnight performance and daily planning
- **Content:** Yesterday's performance summary, today's recommendations
- **Tone:** Motivational and planning-oriented

### Afternoon Reports
- **Focus:** Mid-day performance check
- **Content:** Current performance status, optimization opportunities
- **Tone:** Analytical and action-oriented

### Evening Reports
- **Focus:** Daily summary and tomorrow's preparation
- **Content:** Today's performance review, tomorrow's strategy
- **Tone:** Reflective and strategic

## Customization

### Modify AI Prompts
Edit the prompts in `src/lib/ai-alerts.ts` to customize:
- Analysis focus
- Language style
- Recommendation types
- Alert triggers

### Adjust Report Frequency
Modify the cron schedules to change when reports are generated:
- More frequent reports (hourly, every 6 hours)
- Less frequent reports (daily, weekly)
- Custom times based on your business hours

### Customize WhatsApp Templates
Create custom WhatsApp message templates in `src/config/whatsapp.ts` for:
- Different report types
- Various alert priorities
- Brand-specific messaging

## Troubleshooting

### Common Issues

1. **No reports generated:**
   - Check if campaigns have recent data
   - Verify OpenAI API key is valid
   - Check server logs for errors

2. **WhatsApp alerts not sending:**
   - Verify WhatsApp configuration
   - Check user's quiet hours settings
   - Ensure user has WhatsApp enabled

3. **Cron jobs not running:**
   - Verify cron service is working
   - Check authorization headers
   - Review server logs

### Debug Tools

1. **Test Page:** `https://your-domain.com/test-ai-alerts`
2. **Manual API Testing:** Use the endpoints above
3. **Logs:** Check server logs for detailed error messages

## Monitoring

### Key Metrics to Track
- Report generation success rate
- WhatsApp delivery success rate
- User engagement with reports
- AI analysis quality feedback

### Logs
The system logs all activities to the `cron_logs` table:
- Job execution status
- Number of users processed
- Reports generated
- Errors encountered

## Security

### Authentication
- All endpoints require user authentication
- Cron jobs use secret-based authorization
- Database has Row Level Security (RLS)

### Data Privacy
- Reports are user-specific
- No cross-user data sharing
- Automatic cleanup of old reports (30 days)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Test individual components using the test page
4. Verify all environment variables are set correctly 