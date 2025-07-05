// Test WhatsApp Phone Number ID
const WHATSAPP_CONFIG = {
  apiVersion: 'v19.0',
  phoneNumberId: '1388277549127767', // Current ID from config
  accessToken: 'EAFTe1yovOfsBPOKZCxS00BptvFZCCdZBDBi2zQnIBYuTrZCbsJckj1JLmyyZBZAScW6MxVuEqrMlMjcjBBm4Th8Eg9s99ZAACtCIftFeeH9urR6qm7Q2w7vgIkF26dsmliDbKZCGbJZCMZCIZCCf4WU6fEJyQIad9GUcKZARMu9DaOeZCezBYiFz17ypYXPfThehD69Es6m1GxynUGQR2mP9LZByzu575EqJ1aqVZAZBB0OM8cNBWZBLrdSPc',
};

async function testPhoneNumberID() {
  console.log('🔍 Testing WhatsApp Phone Number ID...');
  console.log('📱 Phone Number ID:', WHATSAPP_CONFIG.phoneNumberId);
  console.log('🔑 Access Token Length:', WHATSAPP_CONFIG.accessToken.length);
  
  try {
    // Test 1: Get phone number info
    console.log('\n📞 Test 1: Getting phone number info...');
    const response1 = await fetch(
      `https://graph.facebook.com/v19.0/${WHATSAPP_CONFIG.phoneNumberId}?access_token=${WHATSAPP_CONFIG.accessToken}`
    );
    
    const data1 = await response1.json();
    
    if (response1.ok) {
      console.log('✅ Phone Number ID is valid!');
      console.log('📱 Phone Number Info:', data1);
    } else {
      console.log('❌ Phone Number ID is invalid or inaccessible');
      console.log('Error:', data1.error);
      
      if (data1.error?.code === 100) {
        console.log('\n🔧 SOLUTION:');
        console.log('This phone number ID does not exist or you do not have permission to access it.');
        console.log('Please check your Meta Developer Console for the correct phone number ID.');
      }
    }
    
    // Test 2: Check if we can send messages
    console.log('\n📤 Test 2: Testing message sending capability...');
    const response2 = await fetch(
      `https://graph.facebook.com/v19.0/${WHATSAPP_CONFIG.phoneNumberId}/messages?access_token=${WHATSAPP_CONFIG.accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: '263718558160',
          type: 'text',
          text: { body: 'Test message' }
        })
      }
    );
    
    const data2 = await response2.json();
    
    if (response2.ok) {
      console.log('✅ Message sending is working!');
      console.log('Response:', data2);
    } else {
      console.log('❌ Message sending failed');
      console.log('Error:', data2.error);
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

testPhoneNumberID(); 