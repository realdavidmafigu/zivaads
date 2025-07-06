const https = require('https');

// Test sync performance
async function testSyncPerformance() {
  console.log('🔄 Testing optimized sync performance...');
  
  const startTime = Date.now();
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/sync-facebook-recent',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        try {
          const jsonData = JSON.parse(data);
          console.log(`⏱️ Sync completed in ${duration.toFixed(2)} seconds`);
          console.log('✅ Response:', JSON.stringify(jsonData, null, 2));
          resolve({ status: res.statusCode, data: jsonData, duration });
        } catch (e) {
          console.log('📄 Raw response:', data);
          resolve({ status: res.statusCode, data: data, duration });
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
testSyncPerformance()
  .then(result => {
    console.log(`\n📊 Performance Summary:`);
    console.log(`- Duration: ${result.duration.toFixed(2)} seconds`);
    console.log(`- Status: ${result.status}`);
    if (result.data.results) {
      console.log(`- Accounts processed: ${result.data.results.totalAccounts}`);
      console.log(`- Campaigns processed: ${result.data.results.totalCampaigns}`);
      console.log(`- Campaigns with data: ${result.data.results.campaignsWithData}`);
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  }); 