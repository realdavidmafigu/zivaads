const https = require('https');

// Test AI-only Local Insights
async function testLocalInsightsAI() {
  console.log('🧠 Testing AI-only Local Insights...');
  
  const startTime = Date.now();
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/local-insights',
    method: 'GET',
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
          console.log(`⏱️ AI Local Insights generated in ${duration.toFixed(2)} seconds`);
          console.log('✅ Response:', JSON.stringify(jsonData, null, 2));
          
          // Check if AI insights were generated successfully
          const insights = jsonData.insights || [];
          const isAIPowered = jsonData.aiPowered === true;
          
          console.log(`\n📊 Analysis:`);
          console.log(`- Total insights: ${insights.length}`);
          console.log(`- AI Powered: ${isAIPowered ? 'Yes' : 'No'}`);
          console.log(`- Generated at: ${jsonData.generatedAt}`);
          
          if (insights.length > 0) {
            console.log(`\n🔍 Sample AI Insight:`);
            const sample = insights[0];
            console.log(`- Title: ${sample.title}`);
            console.log(`- Type: ${sample.type}`);
            console.log(`- Priority: ${sample.priority}`);
            console.log(`- Description: ${sample.description.substring(0, 100)}...`);
          }
          
          resolve({ status: res.statusCode, data: jsonData, duration, isAIPowered });
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
testLocalInsightsAI()
  .then(result => {
    console.log(`\n🎯 Test Summary:`);
    console.log(`- Duration: ${result.duration.toFixed(2)} seconds`);
    console.log(`- Status: ${result.status}`);
    console.log(`- AI Powered: ${result.isAIPowered ? '✅ Yes' : '❌ No'}`);
    
    if (result.isAIPowered && result.data.insights?.length > 0) {
      console.log(`\n🚀 Success! Local Insights are now AI-only and generating personalized insights.`);
    } else if (result.status === 503) {
      console.log(`\n⚠️ AI service unavailable. Check OpenAI API configuration.`);
    } else {
      console.log(`\n❌ AI insights failed. Check OpenAI API key and configuration.`);
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  }); 