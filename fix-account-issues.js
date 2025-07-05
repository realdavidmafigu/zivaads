const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yhcmazbibgwmvazuxgcl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzUwMjEsImV4cCI6MjA2Njk1MTAyMX0.mp7OU9BwFA6ww2loJqkmgBMIioQD_K6t54y2diBV380'
);

async function fixAccountIssues() {
  console.log('🔧 Fixing Facebook account issues...\n');

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

  const accountsToDeactivate = [];
  const workingAccounts = [];

  for (const account of accounts || []) {
    console.log(`Testing account: ${account.facebook_account_id} (${account.account_name})`);
    
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${account.facebook_account_id}/campaigns?access_token=${account.access_token}&fields=id&limit=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          console.log(`❌ Error: ${data.error.message} (Code: ${data.error.code}, Subcode: ${data.error.error_subcode})`);
          
          // Check if it's a permission issue (code 100, subcode 33)
          if (data.error.code === 100 && data.error.error_subcode === 33) {
            accountsToDeactivate.push(account);
            console.log(`   🔒 Will deactivate - permission issue`);
          } else if (data.error.code === 190) {
            accountsToDeactivate.push(account);
            console.log(`   🔄 Will deactivate - token expired`);
          } else if (data.error.code === 4) {
            console.log(`   ⏰ Rate limited - will retry later`);
          }
        } else {
          workingAccounts.push(account);
          console.log(`✅ Working - Found ${data.data?.length || 0} campaigns`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ HTTP ${response.status}: ${errorText}`);
        
        if (response.status === 400) {
          accountsToDeactivate.push(account);
          console.log(`   🔒 Will deactivate - permission issue`);
        }
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Working accounts: ${workingAccounts.length}`);
  console.log(`🔒 Accounts to deactivate: ${accountsToDeactivate.length}`);

  if (accountsToDeactivate.length > 0) {
    console.log('\n🔒 ACCOUNTS TO DEACTIVATE:');
    accountsToDeactivate.forEach(acc => {
      console.log(`  - ${acc.facebook_account_id} (${acc.account_name})`);
    });

    console.log('\n🔧 SQL to deactivate problematic accounts:');
    const problematicIds = accountsToDeactivate.map(acc => acc.id);
    console.log(`UPDATE facebook_accounts SET is_active = false WHERE id IN ('${problematicIds.join("','")}');`);

    console.log('\n💡 Recommendations:');
    console.log('1. Run the SQL above to deactivate problematic accounts');
    console.log('2. Reconnect only the working accounts');
    console.log('3. Consider reducing sync frequency to every 2-4 hours');
    console.log('4. Implement exponential backoff for rate limiting');
  }

  if (workingAccounts.length > 0) {
    console.log('\n✅ WORKING ACCOUNTS (keep these):');
    workingAccounts.forEach(acc => {
      console.log(`  - ${acc.facebook_account_id} (${acc.account_name})`);
    });
  }
}

fixAccountIssues().catch(console.error); 