// Get Correct WhatsApp Phone Number ID
const WHATSAPP_CONFIG = {
  apiVersion: 'v19.0',
  accessToken: 'EAFTe1yovOfsBPOKZCxS00BptvFZCCdZBDBi2zQnIBYuTrZCbsJckj1JLmyyZBZAScW6MxVuEqrMlMjcjBBm4Th8Eg9s99ZAACtCIftFeeH9urR6qm7Q2w7vgIkF26dsmliDbKZCGbJZCMZCIZCCf4WU6fEJyQIad9GUcKZARMu9DaOeZCezBYiFz17ypYXPfThehD69Es6m1GxynUGQR2mP9LZByzu575EqJ1aqVZAZBB0OM8cNBWZBLrdSPc',
};

async function getCorrectPhoneNumberID() {
  console.log('🔍 Finding correct WhatsApp Phone Number ID...');
  console.log('📱 Looking for phone number: +263 77 155 5468');
  
  try {
    // Method 1: Get all phone numbers for the app
    console.log('\n📞 Method 1: Getting all phone numbers...');
    const response1 = await fetch(
      `https://graph.facebook.com/v19.0/me/phone_numbers?access_token=${WHATSAPP_CONFIG.accessToken}`
    );
    
    const data1 = await response1.json();
    
    if (response1.ok && data1.data && data1.data.length > 0) {
      console.log('✅ Found phone numbers:');
      data1.data.forEach(phone => {
        console.log(`   ID: ${phone.id}`);
        console.log(`   Display Name: ${phone.display_name || 'Not set'}`);
        console.log(`   Phone Number: ${phone.display_phone_number || 'Not set'}`);
        console.log(`   Verified Name: ${phone.verified_name || 'Not verified'}`);
        console.log(`   Quality Rating: ${phone.quality_rating || 'Unknown'}`);
        console.log('   ---');
      });
      
      // Look for the specific phone number
      const targetPhone = data1.data.find(phone => 
        phone.display_phone_number === '+263 77 155 5468' ||
        phone.display_phone_number === '263771555468'
      );
      
      if (targetPhone) {
        console.log('\n🎯 FOUND YOUR PHONE NUMBER!');
        console.log(`   Correct Phone Number ID: ${targetPhone.id}`);
        console.log(`   Display Name: ${targetPhone.display_name}`);
        console.log(`   Phone Number: ${targetPhone.display_phone_number}`);
        
        // Test messaging with the correct ID
        console.log('\n🧪 Testing messaging with correct ID...');
        const testResponse = await fetch(
          `https://graph.facebook.com/v19.0/${targetPhone.id}/messages?access_token=${WHATSAPP_CONFIG.accessToken}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: '263718558160',
              type: 'text',
              text: { body: 'Test message from correct phone number ID' }
            })
          }
        );
        
        const testData = await testResponse.json();
        
        if (testResponse.ok) {
          console.log('✅ Messaging test successful!');
          console.log('Response:', testData);
        } else {
          console.log('❌ Messaging test failed');
          console.log('Error:', testData.error);
        }
        
      } else {
        console.log('\n⚠️ Phone number +263 77 155 5468 not found in the list');
        console.log('Available phone numbers:');
        data1.data.forEach(phone => {
          console.log(`   - ${phone.display_phone_number || 'Unknown'} (ID: ${phone.id})`);
        });
      }
      
    } else {
      console.log('❌ No phone numbers found or error occurred');
      console.log('Response:', data1);
    }
    
    // Method 2: Try to get phone numbers from WhatsApp Business Account
    console.log('\n📞 Method 2: Getting WhatsApp Business Account phone numbers...');
    const response2 = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=whatsapp_business_account&access_token=${WHATSAPP_CONFIG.accessToken}`
    );
    
    const data2 = await response2.json();
    
    if (response2.ok && data2.whatsapp_business_account) {
      console.log('✅ Found WhatsApp Business Account');
      console.log('Account ID:', data2.whatsapp_business_account.id);
      
      // Get phone numbers from the business account
      const response3 = await fetch(
        `https://graph.facebook.com/v19.0/${data2.whatsapp_business_account.id}/phone_numbers?access_token=${WHATSAPP_CONFIG.accessToken}`
      );
      
      const data3 = await response3.json();
      
      if (response3.ok && data3.data && data3.data.length > 0) {
        console.log('✅ Found phone numbers in WhatsApp Business Account:');
        data3.data.forEach(phone => {
          console.log(`   ID: ${phone.id}`);
          console.log(`   Display Name: ${phone.display_name || 'Not set'}`);
          console.log(`   Phone Number: ${phone.display_phone_number || 'Not set'}`);
          console.log(`   Verified Name: ${phone.verified_name || 'Not verified'}`);
          console.log(`   Quality Rating: ${phone.quality_rating || 'Unknown'}`);
          console.log('   ---');
        });
      } else {
        console.log('❌ No phone numbers found in WhatsApp Business Account');
      }
    } else {
      console.log('❌ No WhatsApp Business Account found');
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

getCorrectPhoneNumberID(); 