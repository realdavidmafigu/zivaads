// Test script for WhatsApp configuration
// Run with: node test-whatsapp.js

console.log('🧪 WhatsApp Configuration Test');
console.log('==============================\n');

// Test environment variables
const envVars = {
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '123456789012345',
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || 'test_access_token_for_development',
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'test_verify_token',
  TEST_WHATSAPP_NUMBER: process.env.TEST_WHATSAPP_NUMBER || '+27123456789',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

console.log('📱 Environment Variables:');
Object.entries(envVars).forEach(([key, value]) => {
  const isSet = value && value !== 'undefined' && !value.includes('test_');
  console.log(`- ${key}: ${isSet ? '✅ Set' : '❌ Using default/test value'} (${value})`);
});
console.log('');

console.log('⚙️ Configuration Values:');
console.log('- API Version: v19.0');
console.log('- Default Language: en');
console.log('- Default Country Code: 27 (South Africa)');
console.log('- Test Mode:', envVars.NODE_ENV === 'development' ? '✅ Enabled' : '❌ Disabled');
console.log('');

console.log('📋 Rate Limiting:');
console.log('- Max Messages/Minute: 30');
console.log('- Max Messages/Hour: 1000');
console.log('- Cooldown Period: 60000ms');
console.log('');

console.log('📝 Message Templates:');
const templates = {
  budget_alert: 'budget_alert',
  ctr_alert: 'ctr_alert',
  cost_alert: 'cost_alert',
  status_alert: 'status_alert',
  test_alert: 'test_alert'
};

Object.entries(templates).forEach(([key, value]) => {
  console.log(`- ${key}: ${value}`);
});
console.log('');

console.log('🚨 Alert Types:');
const alertTypes = [
  'budget_depleted',
  'low_ctr', 
  'high_costs',
  'campaign_paused',
  'test_message'
];

alertTypes.forEach(type => {
  console.log(`- ${type}`);
});
console.log('');

console.log('⚙️ Default Thresholds:');
const thresholds = {
  low_ctr: '1.0%',
  high_cpc: '$5.0',
  budget_usage: '90%',
  spend_limit: '$100',
  frequency_cap: '3.0'
};

Object.entries(thresholds).forEach(([key, value]) => {
  console.log(`- ${key}: ${value}`);
});
console.log('');

console.log('✅ Configuration test completed!');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Set up your WhatsApp Business API credentials');
console.log('2. Add these environment variables to your .env file:');
console.log('   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id');
console.log('   WHATSAPP_ACCESS_TOKEN=your_access_token');
console.log('   WHATSAPP_VERIFY_TOKEN=your_verify_token');
console.log('   TEST_WHATSAPP_NUMBER=your_test_phone_number');
console.log('3. Run the database schema: whatsapp_alerts_schema.sql');
console.log('4. Use the "Test Alert" button in the dashboard');
console.log('5. Check the WhatsApp message logs in the database');
console.log('');
console.log('🔗 Useful Links:');
console.log('- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp');
console.log('- Meta for Developers: https://developers.facebook.com/');
console.log('- ZivaAds Documentation: Check the WHATSAPP_ALERTS_README.md file'); 