// WhatsApp Business API Configuration
export const WHATSAPP_CONFIG = {
  // API Configuration - Using test credentials for development
  apiVersion: 'v19.0',
  // TODO: Replace with the correct Phone Number ID from Meta Developer Console
  // Go to: Meta for Developers > Your App > WhatsApp > Getting Started
  // Find your phone number +263 77 155 5468 and copy its Phone Number ID
  phoneNumberId: '713498348512377', // <-- Correct Phone Number ID for +263 77 155 5468
  accessToken: 'EAFTe1yovOfsBPOKZCxS00BptvFZCCdZBDBi2zQnIBYuTrZCbsJckj1JLmyyZBZAScW6MxVuEqrMlMjcjBBm4Th8Eg9s99ZAACtCIftFeeH9urR6qm7Q2w7vgIkF26dsmliDbKZCGbJZCMZCIZCCf4WU6fEJyQIad9GUcKZARMu9DaOeZCezBYiFz17ypYXPfThehD69Es6m1GxynUGQR2mP9LZByzu575EqJ1aqVZAZBB0OM8cNBWZBLrdSPc',
  verifyToken: 'test_verify_token',
  
  // Rate Limiting Configuration
  rateLimit: {
    maxMessagesPerMinute: 30,
    maxMessagesPerHour: 1000,
    cooldownPeriod: 60000, // 1 minute
  },
  
  // Default Settings
  defaultLanguage: 'en',
  defaultCountryCode: '263', // Zimbabwe
  
  // Testing Configuration
  isTestMode: false, // Disabled test mode - now sending real messages
  testPhoneNumber: '+263718558160', // Updated to your number
};

// WhatsApp API endpoints
export const WHATSAPP_ENDPOINTS = {
  messages: () => `https://graph.facebook.com/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
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