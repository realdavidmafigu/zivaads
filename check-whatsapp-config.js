// WhatsApp Configuration Checker
// Run this script to verify your WhatsApp Business API setup

const WHATSAPP_CONFIG = {
  apiVersion: 'v19.0',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '1388277549127767',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'EAFTe1yovOfsBPOKZCxS00BptvFZCCdZBDBi2zQnIBYuTrZCbsJckj1JLmyyZBZAScW6MxVuEqrMlMjcjBBm4Th8Eg9s99ZAACtCIftFeeH9urR6qm7Q2w7vgIkF26dsmliDbKZCGbJZCMZCIZCCf4WU6fEJyQIad9GUcKZARMu9DaOeZCezBYiFz17ypYXPfThehD69Es6m1GxynUGQR2mP9LZByzu575EqJ1aqVZAZBB0OM8cNBWZBLrdSPc',
};

console.log('🔍 WhatsApp Configuration Check');
console.log('================================');

console.log('📱 Phone Number ID:', WHATSAPP_CONFIG.phoneNumberId);
console.log('🔑 Access Token Length:', WHATSAPP_CONFIG.accessToken.length);
console.log('🔑 Access Token (first 20 chars):', WHATSAPP_CONFIG.accessToken.substring(0, 20) + '...');

// Check if access token looks valid
const isValidToken = WHATSAPP_CONFIG.accessToken.length > 100 && 
                    WHATSAPP_CONFIG.accessToken.includes('EAA') &&
                    !WHATSAPP_CONFIG.accessToken.includes('your_');

console.log('✅ Token Format Valid:', isValidToken ? 'Yes' : 'No');

if (!isValidToken) {
  console.log('\n❌ ISSUE DETECTED:');
  console.log('Your WhatsApp access token appears to be invalid or placeholder.');
  console.log('\n🔧 TO FIX THIS:');
  console.log('1. Go to Meta Developer Console: https://developers.facebook.com/');
  console.log('2. Navigate to your WhatsApp Business App');
  console.log('3. Go to System Users or Access Tokens');
  console.log('4. Generate a new access token with WhatsApp permissions');
  console.log('5. Update your .env file with:');
  console.log('   WHATSAPP_ACCESS_TOKEN=your_new_token_here');
  console.log('6. Restart your development server');
}

// Test the API endpoint
async function testWhatsAppAPI() {
  console.log('\n🧪 Testing WhatsApp API...');
  
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_CONFIG.phoneNumberId}?access_token=${WHATSAPP_CONFIG.accessToken}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Test Successful');
      console.log('📱 Phone Number Info:', data);
    } else {
      console.log('❌ API Test Failed');
      console.log('Error:', data.error);
      
      if (data.error?.code === 190) {
        console.log('\n🔧 SOLUTION:');
        console.log('Your access token is invalid. Please generate a new one from Meta Developer Console.');
      }
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Run the test
testWhatsAppAPI(); 