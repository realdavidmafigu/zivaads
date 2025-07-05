// Alternative method to find WhatsApp Phone Number ID
const WHATSAPP_CONFIG = {
  apiVersion: 'v19.0',
  accessToken: 'EAFTe1yovOfsBPOKZCxS00BptvFZCCdZBDBi2zQnIBYuTrZCbsJckj1JLmyyZBZAScW6MxVuEqrMlMjcjBBm4Th8Eg9s99ZAACtCIftFeeH9urR6qm7Q2w7vgIkF26dsmliDbKZCGbJZCMZCIZCCf4WU6fEJyQIad9GUcKZARMu9DaOeZCezBYiFz17ypYXPfThehD69Es6m1GxynUGQR2mP9LZByzu575EqJ1aqVZAZBB0OM8cNBWZBLrdSPc',
};

async function findPhoneIDAlternative() {
  console.log('🔍 Alternative method to find WhatsApp Phone Number ID...');
  
  try {
    // Method 1: Try to get business accounts
    console.log('\n📞 Method 1: Getting business accounts...');
    const response1 = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${WHATSAPP_CONFIG.accessToken}`
    );
    
    const data1 = await response1.json();
    
    if (response1.ok && data1.data && data1.data.length > 0) {
      console.log('✅ Found business accounts:');
      data1.data.forEach(account => {
        console.log(`   ID: ${account.id}`);
        console.log(`   Name: ${account.name}`);
        console.log(`   Category: ${account.category || 'Not set'}`);
        console.log('   ---');
      });
      
      // Check each business account for WhatsApp
      for (const account of data1.data) {
        console.log(`\n🔍 Checking business account: ${account.name} (${account.id})`);
        
        const response2 = await fetch(
          `https://graph.facebook.com/v19.0/${account.id}?fields=whatsapp_business_account&access_token=${WHATSAPP_CONFIG.accessToken}`
        );
        
        const data2 = await response2.json();
        
        if (response2.ok && data2.whatsapp_business_account) {
          console.log('✅ Found WhatsApp Business Account!');
          console.log('WhatsApp Business Account ID:', data2.whatsapp_business_account.id);
          
          // Get phone numbers from this WhatsApp Business Account
          const response3 = await fetch(
            `https://graph.facebook.com/v19.0/${data2.whatsapp_business_account.id}/phone_numbers?access_token=${WHATSAPP_CONFIG.accessToken}`
          );
          
          const data3 = await response3.json();
          
          if (response3.ok && data3.data && data3.data.length > 0) {
            console.log('✅ Found phone numbers:');
            data3.data.forEach(phone => {
              console.log(`   ID: ${phone.id}`);
              console.log(`   Display Name: ${phone.display_name || 'Not set'}`);
              console.log(`   Phone Number: ${phone.display_phone_number || 'Not set'}`);
              console.log(`   Verified Name: ${phone.verified_name || 'Not verified'}`);
              console.log(`   Quality Rating: ${phone.quality_rating || 'Unknown'}`);
              console.log('   ---');
              
              // Check if this is the target phone number
              if (phone.display_phone_number === '+263 77 155 5468' || 
                  phone.display_phone_number === '263771555468') {
                console.log('\n🎯 FOUND YOUR PHONE NUMBER!');
                console.log(`   Correct Phone Number ID: ${phone.id}`);
                console.log(`   Display Name: ${phone.display_name}`);
                console.log(`   Phone Number: ${phone.display_phone_number}`);
                
                // Test messaging
                console.log('\n🧪 Testing messaging...');
                const testResponse = await fetch(
                  `https://graph.facebook.com/v19.0/${phone.id}/messages?access_token=${WHATSAPP_CONFIG.accessToken}`,
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
              }
            });
          } else {
            console.log('❌ No phone numbers found in this WhatsApp Business Account');
          }
        } else {
          console.log('❌ No WhatsApp Business Account found in this business account');
        }
      }
    } else {
      console.log('❌ No business accounts found');
      console.log('Response:', data1);
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

findPhoneIDAlternative(); 