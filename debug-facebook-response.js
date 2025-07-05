const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugFacebookResponse() {
  console.log('🔍 Debugging Facebook API response...\n');

  // You'll need to get a fresh access token from your app
  // For now, let's create a test script that you can run with a real token
  
  console.log('To debug the Facebook API response:');
  console.log('1. Go to your app and connect Facebook');
  console.log('2. Copy the access token from the browser network tab');
  console.log('3. Run this script with the token');
  console.log('');
  
  console.log('Example usage:');
  console.log('node debug-facebook-response.js YOUR_ACCESS_TOKEN_HERE');
  console.log('');
  
  console.log('Or you can test the API directly:');
  console.log('curl "https://graph.facebook.com/v18.0/me/adaccounts?access_token=YOUR_TOKEN&fields=id,account_name,name,account_status,currency,timezone_name,business_name"');
}

// If a token is provided as command line argument
if (process.argv[2]) {
  const token = process.argv[2];
  
  async function testWithToken() {
    try {
      console.log('Testing with provided token...\n');
      
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${token}&fields=id,account_name,name,account_status,currency,timezone_name,business_name&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.data && data.data.length > 0) {
          console.log('\n📋 Account details:');
          data.data.forEach((account, index) => {
            console.log(`\nAccount ${index + 1}:`);
            console.log(`  ID: ${account.id}`);
            console.log(`  account_name: ${account.account_name || 'MISSING'}`);
            console.log(`  name: ${account.name || 'MISSING'}`);
            console.log(`  account_status: ${account.account_status}`);
            console.log(`  currency: ${account.currency}`);
            console.log(`  timezone_name: ${account.timezone_name}`);
            console.log(`  business_name: ${account.business_name || 'MISSING'}`);
          });
        }
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:');
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error.message);
    }
  }
  
  testWithToken();
} else {
  debugFacebookResponse();
} 