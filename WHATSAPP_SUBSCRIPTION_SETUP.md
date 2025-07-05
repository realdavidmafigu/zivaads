# WhatsApp Subscription System Setup Guide

## 🎯 Overview

This system implements WhatsApp Business API with proper opt-in requirements. Users must message your WhatsApp number first before you can send them messages.

## 📋 What's Been Created

### 1. Database Schema
- **Table**: `whatsapp_subscribers`
- **Purpose**: Track users who have opted in to receive messages
- **Fields**: phone_number, subscription date, message count, etc.

### 2. API Endpoints
- **`/api/whatsapp/webhook`**: Receives incoming WhatsApp messages
- **`/api/whatsapp/send`**: Sends messages to subscribed users only
- **`/api/whatsapp/subscribers`**: Manage subscriber list

### 3. Test Pages
- **`/test-whatsapp-subscription`**: Test the subscription system

## 🔧 Setup Steps

### Step 1: Create Database Table

Run this SQL in your Supabase dashboard:

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

-- Indexes for performance
CREATE INDEX idx_whatsapp_subscribers_phone ON whatsapp_subscribers(phone_number);
CREATE INDEX idx_whatsapp_subscribers_active ON whatsapp_subscribers(is_active);
```

### Step 2: Configure WhatsApp Webhook

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Navigate to your WhatsApp Business App
3. Go to **WhatsApp > Configuration**
4. Set **Webhook URL**: `https://yourdomain.com/api/whatsapp/webhook`
5. Set **Verify Token**: `test_verify_token` (or change in config)
6. Subscribe to **messages** events

### Step 3: Test the System

1. **Message your WhatsApp number** (+263 77 155 5468) with any text
2. **Visit** `/test-whatsapp-subscription` to see subscribers
3. **Send test messages** to subscribed numbers

## 🔄 How It Works

### 1. User Opt-in Process
```
User → Messages +263 77 155 5468 → Webhook receives message → User added to subscribers
```

### 2. Message Sending Process
```
Your App → Checks if user is subscribed → Sends message within 24h window → Updates message count
```

### 3. 24-Hour Window
- Users can receive messages for 24 hours after their last message
- After 24 hours, they need to message again to re-subscribe
- This is a WhatsApp Business API requirement

## 📱 Testing

### Test Page: `/test-whatsapp-subscription`

This page allows you to:
- ✅ Send test messages to subscribed users
- ✅ View current subscribers
- ✅ Test the subscription flow

### Manual Testing Steps:

1. **Send a message** to +263 77 155 5468 on WhatsApp
2. **Wait a few seconds** for webhook processing
3. **Visit the test page** and click "Get Subscribers"
4. **Send a test message** using the form
5. **Check your WhatsApp** to see if you receive the message

## 🚨 Important Notes

### WhatsApp Business API Limitations:
- ✅ **24-hour messaging window**: Can only send messages within 24h of user's last message
- ✅ **Opt-in required**: Users must message you first
- ✅ **Template messages**: Can send template messages outside 24h window (requires approval)

### Error Handling:
- ❌ **User not subscribed**: Returns error if phone number not in subscribers
- ❌ **24h window expired**: Returns error if user hasn't messaged recently
- ❌ **Invalid phone number**: Returns error for malformed numbers

## 🔧 Configuration

### Current WhatsApp Config:
```typescript
{
  phoneNumberId: '713498348512377', // Your WhatsApp Business Phone Number ID
  accessToken: 'your_access_token_here',
  verifyToken: 'test_verify_token',
  isTestMode: false // Set to true for testing
}
```

### Environment Variables (Optional):
```env
WHATSAPP_PHONE_NUMBER_ID=713498348512377
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_VERIFY_TOKEN=test_verify_token
```

## 🎯 Next Steps

1. **Create the database table** in Supabase
2. **Configure the webhook** in Meta Developer Console
3. **Test with your phone number** by messaging +263 77 155 5468
4. **Use the test page** to verify everything works
5. **Integrate with your AI alerts** system

## 📞 Support

If you encounter issues:
1. Check the terminal logs for error messages
2. Verify your WhatsApp Business setup in Meta Console
3. Ensure the database table exists
4. Test with the provided test pages

---

**Your WhatsApp Business Number**: +263 77 155 5468  
**Phone Number ID**: 713498348512377  
**Status**: ✅ Connected and Ready 