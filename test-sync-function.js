const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSyncFunction() {
  console.log('Testing sync-facebook-campaigns function...\n');

  try {
    const response = await fetch(
      'https://yhcmazbibgwmvazuxgcl.supabase.co/functions/v1/sync-facebook-campaigns',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzUwMjEsImV4cCI6MjA2Njk1MTAyMX0.mp7OU9BwFA6ww2loJqkmgBMIioQD_K6t54y2diBV380',
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response body:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error testing sync function:', error.message);
  }
}

testSyncFunction(); 