const https = require('https');

// Test the complete sync endpoint
async function testCompleteSync() {
  console.log('🔄 Testing complete Facebook sync...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/sync-facebook-complete',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

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
    
    req.end();
  });
}

// Run the test
testCompleteSync()
  .then(result => {
    console.log('✅ Complete sync test completed');
  })
  .catch(error => {
    console.error('❌ Complete sync test failed:', error);
  }); 