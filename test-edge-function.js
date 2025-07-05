const https = require('https');

// Test the Edge Function directly
async function testEdgeFunction() {
  console.log('🔄 Testing Edge Function directly...');
  
  const options = {
    hostname: 'yhcmazbibgwmvazuxgcl.supabase.co',
    port: 443,
    path: '/functions/v1/sync-facebook-campaigns',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM3NTAyMSwiZXhwIjoyMDY2OTUxMDIxfQ.YTeTK-Xs2_h6e2fQzmlWXjxCJf4fLYXNzThMXYiA1CI',
      'Content-Type': 'application/json',
    }
  };

  const postData = JSON.stringify({
    manual_sync: true
  });

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      console.log(`📡 Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ Response:', JSON.stringify(jsonData, null, 2));
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          console.log('📄 Raw response:', data);
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run the test
testEdgeFunction()
  .then(result => {
    console.log('✅ Test completed successfully');
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  }); 