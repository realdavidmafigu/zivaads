# OpenAI API Setup Guide

## Issue
The Local Insights feature is showing "Internal server error" because the `OPENAI_API_KEY` environment variable is not set.

## Solution

### Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (it starts with `sk-`)

### Step 2: Add to Environment File

Create or edit your `.env.local` file in the root directory of your project:

```bash
# Create the file if it doesn't exist
touch .env.local
```

Add this line to your `.env.local` file:

```env
OPENAI_API_KEY=sk-your_actual_api_key_here
```

**Important**: Replace `sk-your_actual_api_key_here` with your actual OpenAI API key.

### Step 3: Restart Your Development Server

After adding the API key, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 4: Test the Feature

1. Go to your dashboard
2. Look for the "🧠 Local Insights" section
3. It should now show AI-powered insights instead of an error

## Alternative: Quick Fix

If you want to temporarily disable AI and use a simple fallback, you can modify the Local Insights to show a basic message:

```typescript
// In src/app/api/local-insights/route.ts
// Replace the generateLocalInsights function with:

async function generateLocalInsights(currentDate: Date, campaigns: any[]): Promise<LocalInsight[]> {
  // Simple fallback when AI is not configured
  return [{
    id: 'ai-not-configured',
    type: 'market',
    title: '🤖 AI Insights Not Configured',
    description: 'OpenAI API key is not set. Please configure it to get AI-powered insights.',
    impact: 'You\'re missing personalized campaign analysis based on Zimbabwean context.',
    recommendation: 'Add your OpenAI API key to .env.local file to enable AI insights.',
    priority: 'high',
    icon: '🤖',
    color: 'red'
  }];
}
```

## Troubleshooting

### Common Issues

1. **"OPENAI_API_KEY environment variable is not set"**
   - Make sure you added the key to `.env.local` (not `.env`)
   - Restart your development server after adding the key

2. **"Invalid API key"**
   - Check that your API key is correct
   - Make sure you have credits in your OpenAI account

3. **"Rate limit exceeded"**
   - You've hit your OpenAI usage limits
   - Check your OpenAI account billing

### Check Your Current Environment

You can verify your environment variables are loaded by adding this to your API route temporarily:

```typescript
console.log('Environment check:', {
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...'
});
```

## Cost Considerations

- OpenAI API calls cost money (typically $0.01-0.10 per request)
- Local Insights makes 1 API call per refresh
- Consider setting up usage limits in your OpenAI account

## Next Steps

Once you have the API key configured:
1. Test the Local Insights feature
2. Check that AI-powered insights are working
3. Monitor your OpenAI usage and costs 