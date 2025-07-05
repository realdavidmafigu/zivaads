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

// Function to trigger Facebook campaigns sync
async function syncFacebookCampaigns() {
  console.log('🔄 Triggering Facebook campaigns sync...');
  
  try {
    const response = await makeRequest(`${SUPABASE_URL}/functions/v1/sync-facebook-campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Sync completed with status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

// Function to trigger AI alerts generation
async function generateAIAlerts() {
  console.log('🤖 Triggering AI alerts generation...');
  
  try {
    const response = await makeRequest(`${SUPABASE_URL}/functions/v1/generate-ai-alerts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ AI alerts generation completed with status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ AI alerts generation failed:', error.message);
  }
}

// Main function
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'sync':
      await syncFacebookCampaigns();
      break;
    case 'alerts':
      await generateAIAlerts();
      break;
    case 'both':
      await syncFacebookCampaigns();
      console.log('\n---\n');
      await generateAIAlerts();
      break;
    default:
      console.log('Usage: node external-cron.js [sync|alerts|both]');
      console.log('  sync   - Trigger Facebook campaigns sync');
      console.log('  alerts - Trigger AI alerts generation');
      console.log('  both   - Trigger both sync and alerts');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { syncFacebookCampaigns, generateAIAlerts }; 