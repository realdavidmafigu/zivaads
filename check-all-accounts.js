const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yhcmazbibgwmvazuxgcl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzUwMjEsImV4cCI6MjA2Njk1MTAyMX0.mp7OU9BwFA6ww2loJqkmgBMIioQD_K6t54y2diBV380'
);

async function checkAllAccounts() {
  console.log('Checking all Facebook accounts in database...\n');

  // Get ALL accounts (not just active ones)
  const { data: allAccounts, error } = await supabase
    .from('facebook_accounts')
    .select('*');

  if (error) {
    console.error('Error fetching accounts:', error.message);
    return;
  }

  console.log(`Total accounts in database: ${allAccounts?.length || 0}\n`);

  if (!allAccounts || allAccounts.length === 0) {
    console.log('❌ No Facebook accounts found in database');
    console.log('\nTo fix this:');
    console.log('1. Connect Facebook accounts through your app');
    console.log('2. Or manually insert test accounts in the database');
    return;
  }

  // Group by status
  const activeAccounts = allAccounts.filter(acc => acc.is_active === true);
  const inactiveAccounts = allAccounts.filter(acc => acc.is_active === false || acc.is_active === null);

  console.log(`Active accounts: ${activeAccounts.length}`);
  console.log(`Inactive accounts: ${inactiveAccounts.length}\n`);

  // Show all accounts
  allAccounts.forEach((account, index) => {
    console.log(`${index + 1}. Account: ${account.facebook_account_id}`);
    console.log(`   Name: ${account.account_name || 'N/A'}`);
    console.log(`   User ID: ${account.user_id}`);
    console.log(`   Active: ${account.is_active ? '✅ Yes' : '❌ No'}`);
    console.log(`   Has Token: ${account.access_token ? '✅ Yes' : '❌ No'}`);
    console.log(`   Last Sync: ${account.last_sync_at || 'Never'}`);
    console.log('');
  });

  if (inactiveAccounts.length > 0) {
    console.log('\n🔧 To activate accounts, run this SQL in Supabase:');
    console.log('UPDATE facebook_accounts SET is_active = true WHERE is_active = false;');
  }
}

checkAllAccounts().catch(console.error); 