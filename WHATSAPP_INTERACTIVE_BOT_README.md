# ZivaAds Interactive WhatsApp Bot System

## 🎯 Overview

This system transforms ZivaAds from a passive alert system to an interactive WhatsApp bot that provides AI-powered campaign insights on demand. Users can now request specific campaign analysis, spend summaries, and performance health scores through natural language commands.

## 🚀 Key Features

### Interactive Bot Commands
- **📊 INSIGHTS** - Get AI analysis for any campaign
- **💰 SPEND** - View total spend across all campaigns  
- **📈 PERFORMANCE** - Get overall performance health score
- **❓ HELP** - Show available commands
- **🛑 STOP** - Unsubscribe from messages

### Campaign Dashboard Integration
- **WhatsApp Buttons** on each campaign card
- **One-click access** to campaign insights via WhatsApp
- **Pre-filled messages** for easy interaction

### AI-Powered Responses
- **Real-time campaign analysis** using existing AI insights system
- **Performance metrics** with actionable recommendations
- **Spend tracking** and budget monitoring
- **Health scoring** for overall campaign performance

## 🔄 How It Works

### 1. User Interaction Flow
```
User clicks "📲 Get Insights" on campaign card
↓
Opens WhatsApp with pre-filled message: "Send me insights for Campaign: [CAMPAIGN_NAME]"
↓
User sends message to +263 77 155 5468
↓
Bot processes message and responds with AI insights
↓
24-hour session window opens for further interactions
```

### 2. Message Processing
```
Incoming WhatsApp message
↓
Webhook handler processes message
↓
Stores user interaction for 24-hour session
↓
Parses command and fetches relevant data
↓
Generates AI-powered response
↓
Sends formatted response back to user
```

### 3. AI Integration
```
Campaign name mentioned in message
↓
Fetches campaign data from database
↓
Calls AI insights API for analysis
↓
Formats response with metrics and recommendations
↓
Sends comprehensive insights to user
```

## 📱 WhatsApp Bot Commands

### Campaign Insights
**Command:** `insights for [campaign name]`
**Example:** `insights for Glow Hair Promo`

**Response includes:**
- Campaign performance metrics (CTR, CPC, spend, clicks, impressions)
- AI-generated insights and recommendations
- Quick action suggestions
- Campaign status and health indicators

### Spend Summary
**Command:** `spend` or `cost`

**Response includes:**
- Total spend across all campaigns
- Active vs paused campaign counts
- Top spending campaigns
- Budget utilization overview

### Performance Health
**Command:** `performance` or `health`

**Response includes:**
- Overall health score (0-100)
- Average CTR and CPC metrics
- Performance recommendations
- Campaign optimization tips

### Help Menu
**Command:** `help` or `menu`

**Response includes:**
- List of all available commands
- Usage examples
- Support information

## 🛠️ Technical Implementation

### Webhook Handler (`/api/whatsapp/webhook`)
```typescript
// Processes incoming messages
async function handleIncomingMessage(message: any) {
  // Store user interaction for 24-hour session
  await storeUserInteraction(phoneNumber, messageText, timestamp);
  
  // Parse and respond to commands
  const response = await parseAndRespond(messageText, phoneNumber);
  
  // Send response back to user
  await sendWhatsAppMessage(response);
}
```

### Campaign Card Integration
```typescript
// WhatsApp button on campaign cards
<button 
  onClick={() => {
    const message = encodeURIComponent(`Send me insights for Campaign: ${campaign.name}`);
    const whatsappUrl = `https://wa.me/263771555468?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }}
  className="bg-green-500 text-white py-2 px-4 rounded-lg"
>
  📲 Get Insights
</button>
```

### AI Insights Integration
```typescript
// Generate AI insights for campaigns
async function generateCampaignInsights(campaign: any, metrics: any): Promise<string> {
  // Call existing AI insights API
  const response = await fetch('/api/ai-explain', {
    method: 'POST',
    body: JSON.stringify({ campaigns: [campaignData] })
  });
  
  return formatCampaignInsights(campaign, metrics, aiResponse);
}
```

## 🗄️ Database Schema

### WhatsApp Subscribers Table
```sql
CREATE TABLE whatsapp_subscribers (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  first_message TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- **24-hour session tracking** via `last_message_at`
- **Message count** for analytics
- **Active status** for unsubscribe functionality
- **User preferences** for future enhancements

## 🔧 Configuration

### WhatsApp Business API
```typescript
export const WHATSAPP_CONFIG = {
  phoneNumberId: '713498348512377',
  accessToken: 'your_access_token',
  verifyToken: 'test_verify_token',
  apiVersion: 'v19.0',
  defaultLanguage: 'en',
  defaultCountryCode: '263', // Zimbabwe
};
```

### Rate Limiting
```typescript
rateLimit: {
  maxMessagesPerMinute: 30,
  maxMessagesPerHour: 1000,
  cooldownPeriod: 60000, // 1 minute
}
```

## 📊 Response Formatting

### Campaign Insights Response
```
🎯 Campaign: Glow Hair Promo

📊 Performance Metrics:
• CTR: 2.15%
• CPC: $0.85
• Spend: $45.20
• Clicks: 53
• Impressions: 2,465

🤖 AI Insight:
Your campaign is performing well with a good click rate. 
Consider increasing your budget to reach more people.

💡 Quick Actions:
• Send "spend" for cost overview
• Send "performance" for health score
• Send "help" for more options

Status: ACTIVE 📈
```

### Spend Summary Response
```
💰 Spend Summary

📊 Total Spend: $234.50
📈 Active Campaigns: 3
⏸️ Paused Campaigns: 1
📋 Total Campaigns: 4

💡 Top Spenders:
• Glow Hair Promo: $45.20
• Summer Sale: $89.30
• Brand Awareness: $100.00

Send "insights for [campaign name]" for detailed analysis! 🎯
```

## 🚨 Important Notes

### WhatsApp Business API Limitations
- ✅ **24-hour messaging window** - Can send messages within 24h of user's last message
- ✅ **Opt-in required** - Users must message first (handled by webhook)
- ✅ **Template messages** - Can send outside 24h window (requires approval)

### Session Management
- **Automatic session renewal** when user sends any message
- **Session tracking** in `whatsapp_subscribers` table
- **Graceful handling** of expired sessions

### Error Handling
- **Comprehensive logging** for debugging
- **Fallback responses** when AI service is unavailable
- **Rate limiting** to prevent abuse
- **Phone number validation** and formatting

## 🧪 Testing

### Test Endpoints
```bash
# Test WhatsApp message sending
POST /api/test-whatsapp
{
  "phoneNumber": "+263718558160",
  "messageType": "welcome"
}

# Test webhook processing
POST /api/whatsapp/webhook
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "263718558160",
          "text": { "body": "insights for Glow Hair Promo" }
        }]
      }
    }]
  }]
}
```

### Manual Testing
1. **Click "📲 Get Insights"** on any campaign card
2. **Send the pre-filled message** to +263 77 155 5468
3. **Wait for AI-powered response** with campaign insights
4. **Try other commands** like "spend" or "performance"

## 🔄 Migration from Old System

### Removed Components
- ❌ **Subscription-based alerts** - No longer sends automated alerts
- ❌ **Template message system** - Replaced with dynamic text responses
- ❌ **User preference checks** - Simplified to session-based interaction
- ❌ **Quiet hours logic** - Not needed for interactive system

### Preserved Components
- ✅ **WhatsApp Business API integration** - Core messaging functionality
- ✅ **Rate limiting** - Protection against abuse
- ✅ **Database schema** - Subscribers table still used for sessions
- ✅ **AI insights system** - Enhanced for interactive responses

## 📈 Future Enhancements

### Planned Features
- **Multi-language support** for different regions
- **Advanced analytics** with historical data
- **Custom alerts** based on user preferences
- **Team collaboration** with multiple users
- **Integration APIs** for third-party tools

### Potential Commands
- **`compare [campaign1] vs [campaign2]`** - Compare two campaigns
- **`trends [campaign]`** - Show performance trends over time
- **`optimize [campaign]`** - Get specific optimization suggestions
- **`budget [amount]`** - Set or check budget limits

## 🔒 Security & Compliance

### WhatsApp Business Policy
- ✅ **Opt-in compliance** - Users must message first
- ✅ **24-hour window** - Respects messaging limitations
- ✅ **Content guidelines** - All messages follow WhatsApp policies
- ✅ **Rate limiting** - Prevents spam and abuse

### Data Protection
- **Phone number encryption** in database
- **Session data retention** policies
- **User consent** for message processing
- **GDPR compliance** for European users

## 📞 Support

### Troubleshooting
1. **Check webhook logs** for incoming message processing
2. **Verify WhatsApp Business API** configuration
3. **Test with `/api/test-whatsapp`** endpoint
4. **Review database** for user session data

### Common Issues
- **"Campaign not found"** - Check campaign name spelling
- **"No response"** - Verify webhook is properly configured
- **"Rate limit exceeded"** - Wait before sending more messages
- **"Session expired"** - User needs to send a new message

---

**WhatsApp Business Number**: +263 77 155 5468  
**Phone Number ID**: 713498348512377  
**Status**: ✅ Interactive Bot Active  
**Session Management**: ✅ 24-hour window tracking  
**AI Integration**: ✅ Real-time insights generation 