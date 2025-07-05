// Simple test script for AI alerts functionality
const { createClient } = require('@supabase/supabase-js');

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAIAlerts() {
  console.log('🧪 Testing AI Alerts Functionality\n');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Check if ai_daily_alerts table exists
    console.log('1. Checking ai_daily_alerts table...');
    const { data: alertsTable, error: alertsError } = await supabase
      .from('ai_daily_alerts')
      .select('count')
      .limit(1);
    
    if (alertsError) {
      console.log('❌ ai_daily_alerts table not accessible:', alertsError.message);
    } else {
      console.log('✅ ai_daily_alerts table exists and is accessible');
    }

    // Test 2: Check if alerts table exists
    console.log('\n2. Checking alerts table...');
    const { data: alertsTable2, error: alertsError2 } = await supabase
      .from('alerts')
      .select('count')
      .limit(1);
    
    if (alertsError2) {
      console.log('❌ alerts table not accessible:', alertsError2.message);
    } else {
      console.log('✅ alerts table exists and is accessible');
    }

    // Test 3: Check if user_alert_preferences table exists
    console.log('\n3. Checking user_alert_preferences table...');
    const { data: prefsTable, error: prefsError } = await supabase
      .from('user_alert_preferences')
      .select('count')
      .limit(1);
    
    if (prefsError) {
      console.log('❌ user_alert_preferences table not accessible:', prefsError.message);
    } else {
      console.log('✅ user_alert_preferences table exists and is accessible');
    }

    // Test 4: Check if there are any users
    console.log('\n4. Checking for users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else if (users && users.length > 0) {
      console.log(`✅ Found ${users.length} user(s)`);
      console.log(`   Sample user: ${users[0].email}`);
    } else {
      console.log('⚠️  No users found');
    }

    // Test 5: Check if there are any AI alerts
    console.log('\n5. Checking for existing AI alerts...');
    const { data: existingAlerts, error: existingAlertsError } = await supabase
      .from('ai_daily_alerts')
      .select('*')
      .limit(5);
    
    if (existingAlertsError) {
      console.log('❌ Error fetching AI alerts:', existingAlertsError.message);
    } else {
      console.log(`✅ Found ${existingAlerts?.length || 0} existing AI alerts`);
      if (existingAlerts && existingAlerts.length > 0) {
        const alert = existingAlerts[0];
        console.log(`   Sample alert: ${alert.alert_type} - ${alert.content.substring(0, 50)}...`);
      }
    }

    // Test 6: Check if there are any regular alerts
    console.log('\n6. Checking for existing alerts...');
    const { data: existingRegularAlerts, error: existingRegularAlertsError } = await supabase
      .from('alerts')
      .select('*')
      .limit(5);
    
    if (existingRegularAlertsError) {
      console.log('❌ Error fetching alerts:', existingRegularAlertsError.message);
    } else {
      console.log(`✅ Found ${existingRegularAlerts?.length || 0} existing alerts`);
      if (existingRegularAlerts && existingRegularAlerts.length > 0) {
        const alert = existingRegularAlerts[0];
        console.log(`   Sample alert: ${alert.alert_type} - ${alert.message.substring(0, 50)}...`);
      }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ Database structure test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Visit http://localhost:3000/dashboard/ai-alerts');
    console.log('3. Click "Test Morning" button to generate an alert');
    console.log('4. Check if the alert appears in the "Recent AI Alerts" section');
    console.log('5. Check the browser console for any errors');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAIAlerts().catch(console.error); 