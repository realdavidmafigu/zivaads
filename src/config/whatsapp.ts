// WhatsApp Business API Configuration
export const WHATSAPP_CONFIG = {
  // API Configuration
  apiVersion: 'v19.0',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '713498348512377',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'EAFTe1yovOfsBOZBACZCr6Y9Dd59j6NGf6tLT9usO1Cn91OQ6mZAsyfzWuUcK8FLd6QDuZB39bwy4acbqaO2kkrm4tU45bkkBTMYPLx7ZACtNj6BTsL3X89O5KGj4Kgv6mvFzwHpM5lqeUVcZCCl2xHz2mA8uWkMXMHtQ8CxLexAGW0FX0ZCJtd6kvhpytkTZCmrywC3o2pxc8yNbUfhMMRaSkS3lMEjWxyqavy3BcoAL2XwZBniPK',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'test_verify_token',
  
  // Rate Limiting Configuration
  rateLimit: {
    maxMessagesPerMinute: 30,
    maxMessagesPerHour: 1000,
    cooldownPeriod: 60000, // 1 minute
  },
  
  // Default Settings
  defaultLanguage: 'en',
  defaultCountryCode: '27', // South Africa
  
  // Testing Configuration
  isTestMode: process.env.NODE_ENV === 'development',
  testPhoneNumber: process.env.TEST_WHATSAPP_NUMBER || '+27123456789',
};

// WhatsApp API endpoints
export const WHATSAPP_ENDPOINTS = {
  messages: `https://graph.facebook.com/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
  webhook: '/api/whatsapp/webhook',
};

// Message template names (must match templates in WhatsApp Business)
export const WHATSAPP_TEMPLATES = {
  budget_alert: 'budget_alert',
  ctr_alert: 'ctr_alert',
  cost_alert: 'cost_alert',
  status_alert: 'status_alert',
  test_alert: 'test_alert',
};

// Alert message templates
export const ALERT_MESSAGES = {
  budget_depleted: {
    header: '💰 Budget Alert',
    body: 'Your campaign "{{campaign_name}}" has depleted its budget. Current spend: ${{spend}}',
    button: 'View Campaign',
  },
  low_ctr: {
    header: '📉 CTR Alert',
    body: 'Low CTR detected for "{{campaign_name}}". Current CTR: {{ctr}}% (below {{threshold}}%)',
    button: 'Optimize Now',
  },
  high_costs: {
    header: '⚠️ Cost Alert',
    body: 'High costs detected for "{{campaign_name}}". CPC: ${{cpc}} (above ${{threshold}})',
    button: 'Review Costs',
  },
  campaign_paused: {
    header: '⏸️ Campaign Paused',
    body: 'Campaign "{{campaign_name}}" has been paused. Reason: {{reason}}',
    button: 'Reactivate',
  },
  test_message: {
    header: '🧪 Test Alert',
    body: 'This is a test alert from ZivaAds. Your WhatsApp integration is working correctly!',
    button: 'Got it!',
  },
};

// Default alert thresholds
export const DEFAULT_THRESHOLDS = {
  low_ctr: 1.0,        // 1% CTR threshold
  high_cpc: 5.0,       // $5 CPC threshold
  budget_usage: 90,    // 90% budget usage threshold
  spend_limit: 100,    // $100 daily spend limit
  frequency_cap: 3.0,  // 3.0 frequency threshold
};

// Quiet hours default settings
export const DEFAULT_QUIET_HOURS = {
  enabled: false,
  start: 22,  // 10:00 PM
  end: 8,     // 8:00 AM
};

// Alert frequency options
export const ALERT_FREQUENCIES = {
  immediate: 'immediate',
  hourly: 'hourly',
  daily: 'daily',
} as const;

export type AlertFrequency = typeof ALERT_FREQUENCIES[keyof typeof ALERT_FREQUENCIES]; 