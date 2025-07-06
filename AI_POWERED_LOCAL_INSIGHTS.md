# AI-Only Local Insights

## Overview

The Local Insights feature now uses **AI-only analysis** that combines your campaign performance data with Zimbabwean local context to provide intelligent, actionable insights. **No fallback to rule-based insights** - the system is designed to provide the highest quality, most personalized insights possible.

## How It Works

### AI Analysis Process

The system:

1. **Collects Campaign Data**: Fetches your current campaign performance metrics
2. **Analyzes Local Context**: Considers Zimbabwean factors like:
   - Power outages (ZESA load shedding schedules)
   - Economic cycles (month-end spending, month-start recovery)
   - Social behavior patterns (evening peak usage, weekend shopping)
   - Mobile-first usage patterns
   - Local cultural preferences

3. **AI-Powered Analysis**: Uses OpenAI's GPT-4o to:
   - Analyze your specific campaign performance
   - Combine it with local Zimbabwean context
   - Generate personalized, actionable insights

4. **Error Handling**: If AI is unavailable, returns a clear error message instead of fallback insights

## Features

### Smart Context Awareness

The AI analyzes your campaigns in the context of:

- **Time-based factors**: Current hour, day of week, month-end/start
- **Power infrastructure**: ZESA load shedding impact on internet usage
- **Economic patterns**: Salary cycles and spending behavior
- **Social behavior**: Peak usage times and cultural patterns
- **Mobile usage**: Zimbabwe's mobile-first internet access

### Personalized Recommendations

Instead of generic advice, you get insights like:

- "Your campaign CTR is 2.1% during evening peak hours (6-10 PM), which is good for Zimbabwean standards. Consider increasing budget during these hours."
- "Month-end spending is active, but your CPC has increased 15%. This suggests higher competition - consider adjusting your bidding strategy."
- "Power outages during 6-10 AM are affecting your morning campaign performance. Consider pausing ads during these hours."

### Intelligent Priority System

Insights are automatically prioritized based on:
- **High Priority**: Critical issues requiring immediate action
- **Medium Priority**: Optimization opportunities
- **Low Priority**: General best practices and observations

## Technical Implementation

### API Endpoint

```
GET /api/local-insights
```

### Response Format

```json
{
  "success": true,
  "insights": [
    {
      "id": "ai-campaign-optimization-1",
      "type": "economic",
      "title": "💰 Month-End Opportunity",
      "description": "Your campaign is performing well during month-end spending period...",
      "impact": "Higher conversion rates expected due to increased disposable income...",
      "recommendation": "Increase budget by 20% during 25th-31st of month...",
      "priority": "high",
      "icon": "💰",
      "color": "green"
    }
  ],
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "aiPowered": true
}
```

### Error Response (AI Unavailable)

```json
{
  "error": "AI insights generation failed. Please check your OpenAI API configuration.",
  "details": "Failed to generate AI insights"
}
```

### AI Prompt Structure

The AI receives a comprehensive prompt including:
- Current campaign performance metrics
- Local Zimbabwean context
- Historical patterns and cultural factors
- Specific formatting requirements for actionable insights

## Usage

### In the Dashboard

1. Navigate to your dashboard
2. Look for the "🧠 Local Insights" section
3. The component will always show:
   - **AI Powered** indicator (green chip icon)
4. Click "Refresh" to get updated insights

### Testing

Use the test script to verify AI functionality:

```bash
node test-local-insights-ai.js
```

## Configuration

### Environment Variables

Ensure your `.env.local` file has:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Error Handling

If OpenAI API is unavailable, the system will:
1. Return a 503 status code
2. Provide a clear error message
3. Guide you to check your OpenAI configuration
4. **No fallback insights** - ensuring you always get the highest quality analysis

## Benefits

### For Business Owners

1. **Contextual Understanding**: Understand why campaigns perform differently at different times
2. **Actionable Advice**: Get specific recommendations based on your data
3. **Local Relevance**: Insights tailored to Zimbabwean market conditions
4. **Performance Optimization**: Identify opportunities to improve campaign performance
5. **Consistent Quality**: Always AI-powered insights, no mixed quality

### For Campaign Management

1. **Timing Optimization**: Know when to boost or pause campaigns
2. **Budget Allocation**: Understand when to increase/decrease spending
3. **Audience Behavior**: Learn about local user patterns
4. **Competitive Intelligence**: Understand market dynamics

## Troubleshooting

### AI Not Working

If you see error messages:

1. **Check OpenAI API Key**: Ensure it's correctly set in `.env.local`
2. **Verify OpenAI Credits**: Make sure your OpenAI account has available credits
3. **Check Network**: Ensure your server can reach OpenAI's API
4. **Review Logs**: Check server logs for specific error details

### Common Error Messages

- **"AI service temporarily unavailable"**: Check OpenAI API configuration
- **"Failed to generate AI insights"**: OpenAI API call failed
- **"Internal server error"**: General server issue

### Performance

- AI insights typically take 2-5 seconds to generate
- No fallback means faster error detection
- Higher quality insights justify the wait time

## Support

The Local Insights feature is designed to provide the highest quality insights possible. If AI is unavailable, the system will clearly indicate the issue so you can resolve it quickly. This ensures you always get personalized, intelligent analysis when the feature is working. 