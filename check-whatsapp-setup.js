// Comprehensive WhatsApp Business Setup Checker
const WHATSAPP_CONFIG = {
  apiVersion: 'v19.0',
  phoneNumberId: '1388277549127767',
  accessToken: 'EAFTe1yovOfsBPOKZCxS00BptvFZCCdZBDBi2zQnIBYuTrZCbsJckj1JLmyyZBZAScW6MxVuEqrMlMjcjBBm4Th8Eg9s99ZAACtCIftFeeH9urR6qm7Q2w7vgIkF26dsmliDbKZCGbJZCMZCIZCCf4WU6fEJyQIad9GUcKZARMu9DaOeZCezBYiFz17ypYXPfThehD69Es6m1GxynUGQR2mP9LZByzu575EqJ1aqVZAZBB0OM8cNBWZBLrdSPc',
};

async function checkWhatsAppSetup() {
  console.log('🔍 Comprehensive WhatsApp Business Setup Check');
  console.log('📱 Phone Number ID:', WHATSAPP_CONFIG.phoneNumberId);
  console.log('🔑 Access Token Length:', WHATSAPP_CONFIG.accessToken.length);
  
  try {
    // Test 1: Get phone number details
    console.log('\n📞 Test 1: Getting phone number details...');
    const response1 = await fetch(
      `https://graph.facebook.com/v19.0/${WHATSAPP_CONFIG.phoneNumberId}?fields=id,name,code_verification_status,quality_rating,verified_name,display_phone_number&access_token=${WHATSAPP_CONFIG.accessToken}`
    );
    
    const data1 = await response1.json();
    
    if (response1.ok) {
      console.log('✅ Phone Number Details Retrieved:');
      console.log('   ID:', data1.id);
      console.log('   Name:', data1.name || 'Not set');
      console.log('   Display Phone Number:', data1.display_phone_number || 'Not set');
      console.log('   Verification Status:', data1.code_verification_status || 'Unknown');
      console.log('   Quality Rating:', data1.quality_rating || 'Unknown');
      console.log('   Verified Name:', data1.verified_name || 'Not verified');
    } else {
      console.log('❌ Failed to get phone number details');
      console.log('Error:', data1.error);
    }
    
    // Test 2: Check if phone number supports messaging
    console.log('\n📤 Test 2: Checking messaging capability...');
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
      console.log('✅ Messaging is working!');
      console.log('Response:', data2);
    } else {
      console.log('❌ Messaging failed');
      console.log('Error:', data2.error);
      
      if (data2.error?.error_subcode === 33) {
        console.log('\n🔧 DIAGNOSIS: Phone number does not support messaging');
        console.log('This usually means:');
        console.log('1. The phone number is not enabled for WhatsApp Business');
        console.log('2. The phone number is in a different state (not active)');
        console.log('3. Missing messaging permissions');
      }
    }
    
    // Test 3: Check app permissions
    console.log('\n🔐 Test 3: Checking app permissions...');
    const response3 = await fetch(
      `https://graph.facebook.com/v19.0/me/permissions?access_token=${WHATSAPP_CONFIG.accessToken}`
    );
    
    const data3 = await response3.json();
    
    if (response3.ok) {
      console.log('✅ App Permissions:');
      data3.data.forEach(permission => {
        console.log(`   ${permission.permission}: ${permission.status}`);
      });
      
      const hasWhatsAppPermission = data3.data.some(p => 
        p.permission.includes('whatsapp') && p.status === 'granted'
      );
      
      if (!hasWhatsAppPermission) {
        console.log('\n⚠️ MISSING: WhatsApp permissions not granted');
        console.log('You need these permissions:');
        console.log('- whatsapp_business_messaging');
        console.log('- whatsapp_business_management');
      }
    } else {
      console.log('❌ Failed to get permissions');
      console.log('Error:', data3.error);
    }
    
    // Test 4: Check app info
    console.log('\n📱 Test 4: Checking app information...');
    const response4 = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${WHATSAPP_CONFIG.accessToken}`
    );
    
    const data4 = await response4.json();
    
    if (response4.ok) {
      console.log('✅ App Information:');
      console.log('   App ID:', data4.id);
      console.log('   App Name:', data4.name);
      console.log('   Email:', data4.email || 'Not set');
    } else {
      console.log('❌ Failed to get app info');
      console.log('Error:', data4.error);
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

checkWhatsAppSetup(); 