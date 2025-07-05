// Test the correct WhatsApp Phone Number ID
const WHATSAPP_CONFIG = {
  apiVersion: 'v19.0',
  phoneNumberId: '713498348512377', // Correct Phone Number ID
  accessToken: 'EAFTe1yovOfsBPOKZCxS00BptvFZCCdZBDBi2zQnIBYuTrZCbsJckj1JLmyyZBZAScW6MxVuEqrMlMjcjBBm4Th8Eg9s99ZAACtCIftFeeH9urR6qm7Q2w7vgIkF26dsmliDbKZCGbJZCMZCIZCCf4WU6fEJyQIad9GUcKZARMu9DaOeZCezBYiFz17ypYXPfThehD69Es6m1GxynUGQR2mP9LZByzu575EqJ1aqVZAZBB0OM8cNBWZBLrdSPc',
};

async function testCorrectPhoneID() {
  console.log('🧪 Testing correct WhatsApp Phone Number ID...');
  console.log('📱 Phone Number ID:', WHATSAPP_CONFIG.phoneNumberId);
  console.log('🔑 Access Token Length:', WHATSAPP_CONFIG.accessToken.length);
  
  try {
    // Test 1: Get phone number details
    console.log('\n📞 Test 1: Getting phone number details...');
    const response1 = await fetch(
      `https://graph.facebook.com/v19.0/${WHATSAPP_CONFIG.phoneNumberId}?access_token=${WHATSAPP_CONFIG.accessToken}`
    );
    
    const data1 = await response1.json();
    
    if (response1.ok) {
      console.log('✅ Phone Number Details Retrieved:');
      console.log('   ID:', data1.id);
      console.log('   Display Phone Number:', data1.display_phone_number || 'Not set');
      console.log('   Verified Name:', data1.verified_name || 'Not verified');
      console.log('   Quality Rating:', data1.quality_rating || 'Unknown');
    } else {
      console.log('❌ Failed to get phone number details');
      console.log('Error:', data1.error);
      return;
    }
    
    // Test 2: Send a test message
    console.log('\n📤 Test 2: Sending test message...');
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
          text: { 
            body: '🧪 Test message from ZivaAds! Your WhatsApp integration is now working correctly. This message was sent using the correct Phone Number ID.' 
          }
        })
      }
    );
    
    const data2 = await response2.json();
    
    if (response2.ok) {
      console.log('✅ MESSAGE SENT SUCCESSFULLY!');
      console.log('Response:', data2);
      console.log('\n🎉 Your WhatsApp integration is working!');
      console.log('📱 Check your phone (+263718558160) for the test message.');
    } else {
      console.log('❌ Failed to send message');
      console.log('Error:', data2.error);
      
      if (data2.error?.error_subcode === 33) {
        console.log('\n🔧 DIAGNOSIS: Phone number does not support messaging');
      } else if (data2.error?.code === 190) {
        console.log('\n🔧 DIAGNOSIS: Access token is invalid');
      }
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

testCorrectPhoneID(); 