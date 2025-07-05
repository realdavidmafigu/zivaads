const https = require('https');

// Configuration
const SUPABASE_URL = 'https://yhcmazbibgwmvazuxgcl.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzAsImV4cCI6MjA1MDU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

// Function to make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test manual sync
async function testManualSync() {
  console.log('🔄 Testing manual Facebook campaigns sync...');
  
  try {
    const response = await makeRequest(`${SUPABASE_URL}/functions/v1/sync-facebook-campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        manual_sync: true
      })
    });
    
    console.log(`✅ Manual sync test completed with status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Manual sync test failed:', error.message);
  }
}

// Test the API endpoint
async function testAPIEndpoint() {
  console.log('🔄 Testing API endpoint...');
  
  try {
    const response = await makeRequest('http://localhost:3000/api/cron/sync-facebook-campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ API endpoint test completed with status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ API endpoint test failed:', error.message);
  }
}

// Main function
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'edge':
      await testManualSync();
      break;
    case 'api':
      await testAPIEndpoint();
      break;
    case 'both':
      console.log('Testing Edge Function...');
      await testManualSync();
      console.log('\n---\n');
      console.log('Testing API Endpoint...');
      await testAPIEndpoint();
      break;
    default:
      console.log('Usage: node test-manual-sync.js [edge|api|both]');
      console.log('  edge - Test the Supabase Edge Function directly');
      console.log('  api  - Test the Next.js API endpoint');
      console.log('  both - Test both');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testManualSync, testAPIEndpoint }; 