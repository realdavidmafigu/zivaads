const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yhcmazbibgwmvazuxgcl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzUwMjEsImV4cCI6MjA2Njk1MTAyMX0.mp7OU9BwFA6ww2loJqkmgBMIioQD_K6t54y2diBV380'
);

async function debugDatabase() {
  console.log('🔍 Debugging database state...\n');

  // Check if the table exists and has any data
  const { data: allAccounts, error: allError } = await supabase
    .from('facebook_accounts')
    .select('*');

  if (allError) {
    console.error('❌ Error accessing facebook_accounts table:', allError.message);
    return;
  }

  console.log(`📊 Total accounts in facebook_accounts table: ${allAccounts?.length || 0}`);

  if (allAccounts && allAccounts.length > 0) {
    console.log('\n📋 All accounts:');
    allAccounts.forEach((acc, index) => {
      console.log(`${index + 1}. ID: ${acc.id}`);
      console.log(`   Facebook Account ID: ${acc.facebook_account_id}`);
      console.log(`   Name: ${acc.account_name || 'N/A'}`);
      console.log(`   User ID: ${acc.user_id}`);
      console.log(`   Active: ${acc.is_active}`);
      console.log(`   Created: ${acc.created_at}`);
      console.log(`   Last Sync: ${acc.last_sync_at || 'Never'}`);
      console.log('');
    });
  } else {
    console.log('\n❌ No accounts found in database');
  }

  // Check users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');

  if (usersError) {
    console.error('❌ Error accessing users table:', usersError.message);
  } else {
    console.log(`👥 Total users in users table: ${users?.length || 0}`);
    if (users && users.length > 0) {
      console.log('Recent users:');
      users.slice(0, 3).forEach(user => {
        console.log(`  - ${user.id} (${user.email}) - Created: ${user.created_at}`);
      });
    }
  }

  // Check campaigns table
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('*');

  if (campaignsError) {
    console.error('❌ Error accessing campaigns table:', campaignsError.message);
  } else {
    console.log(`📈 Total campaigns in campaigns table: ${campaigns?.length || 0}`);
  }

  console.log('\n🔧 Possible issues:');
  console.log('1. Accounts were inserted but then deleted by a cleanup process');
  console.log('2. Database transaction rollback occurred');
  console.log('3. RLS (Row Level Security) is blocking access');
  console.log('4. The accounts were inserted with a different user_id');
  console.log('5. The table was truncated or reset');

  console.log('\n💡 Next steps:');
  console.log('1. Check if you can see the accounts in Supabase dashboard');
  console.log('2. Try connecting Facebook accounts again');
  console.log('3. Check if there are any database triggers or cleanup jobs');
}

debugDatabase().catch(console.error); 