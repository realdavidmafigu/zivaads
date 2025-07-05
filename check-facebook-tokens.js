const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yhcmazbibgwmvazuxgcl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzUwMjEsImV4cCI6MjA2Njk1MTAyMX0.mp7OU9BwFA6ww2loJqkmgBMIioQD_K6t54y2diBV380'
);

async function checkFacebookTokens() {
  console.log('Checking Facebook account tokens...\n');

  // Get all active accounts
  const { data: accounts, error } = await supabase
    .from('facebook_accounts')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching accounts:', error.message);
    return;
  }

  console.log(`Found ${accounts?.length || 0} active accounts\n`);

  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

  for (const account of accounts || []) {
    console.log(`Testing account: ${account.facebook_account_id} (${account.account_name})`);
    
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${account.facebook_account_id}/campaigns?access_token=${account.access_token}&fields=id&limit=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          console.log(`❌ Token error: ${data.error.message} (Code: ${data.error.code})`);
          
          if (data.error.code === 190) {
            console.log(`   🔄 This account needs token refresh`);
          }
        } else {
          console.log(`✅ Token working - Found ${data.data?.length || 0} campaigns`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ HTTP ${response.status}: ${errorText}`);
        
        if (response.status === 400) {
          console.log(`   🔄 Likely token/permission issue`);
        }
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('\nSummary:');
  console.log('- ✅ Working tokens: Check the output above');
  console.log('- ❌ Failed tokens: Need to be refreshed');
  console.log('- 🔄 Accounts with 400 errors or code 190 need token refresh');
}

checkFacebookTokens().catch(console.error); 