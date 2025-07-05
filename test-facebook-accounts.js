const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yhcmazbibgwmvazuxgcl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzUwMjEsImV4cCI6MjA2Njk1MTAyMX0.mp7OU9BwFA6ww2loJqkmgBMIioQD_K6t54y2diBV380'
);

async function testFacebookAccounts() {
  console.log('Testing Facebook accounts data...\n');

  // Get all accounts
  const { data: allAccounts, error: allError } = await supabase
    .from('facebook_accounts')
    .select('*');

  if (allError) {
    console.error('Error fetching all accounts:', allError.message);
    return;
  }

  console.log(`Total accounts: ${allAccounts?.length || 0}`);

  // Get active accounts
  const { data: activeAccounts, error: activeError } = await supabase
    .from('facebook_accounts')
    .select('*')
    .eq('is_active', true);

  if (activeError) {
    console.error('Error fetching active accounts:', activeError.message);
    return;
  }

  console.log(`Active accounts: ${activeAccounts?.length || 0}`);

  // Check for accounts with missing data
  const invalidAccounts = allAccounts?.filter(account => 
    !account.facebook_account_id || 
    !account.access_token || 
    !account.user_id
  ) || [];

  console.log(`Invalid accounts (missing required fields): ${invalidAccounts.length}`);

  if (invalidAccounts.length > 0) {
    console.log('\nInvalid accounts:');
    invalidAccounts.forEach(account => {
      console.log(`- ID: ${account.id}`);
      console.log(`  facebook_account_id: ${account.facebook_account_id || 'MISSING'}`);
      console.log(`  access_token: ${account.access_token ? 'PRESENT' : 'MISSING'}`);
      console.log(`  user_id: ${account.user_id || 'MISSING'}`);
      console.log(`  is_active: ${account.is_active}`);
      console.log('');
    });
  }

  // Check for accounts with null/undefined facebook_account_id
  const nullAccountIds = allAccounts?.filter(account => 
    account.facebook_account_id === null || 
    account.facebook_account_id === undefined
  ) || [];

  console.log(`Accounts with null/undefined facebook_account_id: ${nullAccountIds.length}`);

  if (nullAccountIds.length > 0) {
    console.log('\nAccounts with null facebook_account_id:');
    nullAccountIds.forEach(account => {
      console.log(`- ID: ${account.id}, user_id: ${account.user_id}, is_active: ${account.is_active}`);
    });
  }

  // Show sample of valid accounts
  const validAccounts = activeAccounts?.filter(account => 
    account.facebook_account_id && 
    account.access_token && 
    account.user_id
  ) || [];

  console.log(`\nValid active accounts: ${validAccounts.length}`);

  if (validAccounts.length > 0) {
    console.log('\nSample valid accounts:');
    validAccounts.slice(0, 3).forEach(account => {
      console.log(`- ID: ${account.id}`);
      console.log(`  facebook_account_id: ${account.facebook_account_id}`);
      console.log(`  user_id: ${account.user_id}`);
      console.log(`  account_name: ${account.account_name}`);
      console.log(`  is_active: ${account.is_active}`);
      console.log('');
    });
  }
}

testFacebookAccounts().catch(console.error); 