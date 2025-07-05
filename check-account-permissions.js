const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yhcmazbibgwmvazuxgcl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzUwMjEsImV4cCI6MjA2Njk1MTAyMX0.mp7OU9BwFA6ww2loJqkmgBMIioQD_K6t54y2diBV380'
);

async function checkAccountPermissions() {
  console.log('Checking Facebook account permissions...\n');

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

  const workingAccounts = [];
  const permissionIssues = [];
  const tokenIssues = [];
  const otherIssues = [];

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
          
          if (data.error.code === 190) {
            tokenIssues.push(account);
            console.log(`   🔄 Token expired - needs refresh`);
          } else if (data.error.code === 100 && data.error.error_subcode === 33) {
            permissionIssues.push(account);
            console.log(`   🔒 Permission issue - missing ads_read or not an ad account`);
          } else {
            otherIssues.push(account);
            console.log(`   ❓ Other issue`);
          }
        } else {
          workingAccounts.push(account);
          console.log(`✅ Working - Found ${data.data?.length || 0} campaigns`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ HTTP ${response.status}: ${errorText}`);
        otherIssues.push(account);
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
      otherIssues.push(account);
    }
    
    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('📊 SUMMARY:');
  console.log(`✅ Working accounts: ${workingAccounts.length}`);
  console.log(`🔒 Permission issues: ${permissionIssues.length}`);
  console.log(`🔄 Token issues: ${tokenIssues.length}`);
  console.log(`❓ Other issues: ${otherIssues.length}\n`);

  if (workingAccounts.length > 0) {
    console.log('✅ WORKING ACCOUNTS:');
    workingAccounts.forEach(acc => {
      console.log(`  - ${acc.facebook_account_id} (${acc.account_name})`);
    });
    console.log('');
  }

  if (permissionIssues.length > 0) {
    console.log('🔒 ACCOUNTS WITH PERMISSION ISSUES:');
    permissionIssues.forEach(acc => {
      console.log(`  - ${acc.facebook_account_id} (${acc.account_name})`);
    });
    console.log('\nTo fix permission issues:');
    console.log('1. These might be personal accounts, not ad accounts');
    console.log('2. Or they need the "ads_read" permission');
    console.log('3. Consider deactivating these accounts in your database');
    console.log('');
  }

  if (tokenIssues.length > 0) {
    console.log('🔄 ACCOUNTS WITH TOKEN ISSUES:');
    tokenIssues.forEach(acc => {
      console.log(`  - ${acc.facebook_account_id} (${acc.account_name})`);
    });
    console.log('\nTo fix token issues:');
    console.log('1. Reconnect these accounts through your app');
    console.log('2. Or refresh the access tokens manually');
    console.log('');
  }

  // SQL to deactivate problematic accounts
  if (permissionIssues.length > 0 || tokenIssues.length > 0) {
    console.log('🔧 SQL to deactivate problematic accounts:');
    const problematicIds = [...permissionIssues, ...tokenIssues].map(acc => acc.id);
    console.log(`UPDATE facebook_accounts SET is_active = false WHERE id IN ('${problematicIds.join("','")}');`);
  }
}

checkAccountPermissions().catch(console.error); 