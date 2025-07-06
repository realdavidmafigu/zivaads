const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSyncFunction() {
  console.log('Testing sync-facebook-campaigns function...\n');

  try {
    const response = await fetch(
      'https://yhcmazbibgwmvazuxgcl.supabase.co/functions/v1/sync-facebook-campaigns',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'}`,
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