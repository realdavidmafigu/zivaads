const { createClient } = require('@supabase/supabase-js');

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseStructure() {
  console.log('🔍 Testing Database Structure...\n');
  
  try {
    // Test 1: Check if campaign_metrics table exists
    const { data: metricsTable, error: metricsError } = await supabase
      .from('campaign_metrics')
      .select('count')
      .limit(1);
    
    if (metricsError) {
      console.log('❌ campaign_metrics table not accessible:', metricsError.message);
    } else {
      console.log('✅ campaign_metrics table exists and is accessible');
    }

    // Test 2: Check if alerts table exists
    const { data: alertsTable, error: alertsError } = await supabase
      .from('alerts')
      .select('count')
      .limit(1);
    
    if (alertsError) {
      console.log('❌ alerts table not accessible:', alertsError.message);
    } else {
      console.log('✅ alerts table exists and is accessible');
    }

    // Test 3: Check campaigns with metrics
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_metrics(
          impressions,
          clicks,
          ctr,
          cpc,
          cpm,
          spend,
          reach,
          frequency,
          conversions,
          is_latest
        )
      `)
      .limit(3);

    if (campaignsError) {
      console.log('❌ Error fetching campaigns with metrics:', campaignsError.message);
    } else {
      console.log(`✅ Successfully fetched ${campaigns?.length || 0} campaigns with metrics`);
      if (campaigns && campaigns.length > 0) {
        const campaign = campaigns[0];
        console.log(`   Sample campaign: ${campaign.name}`);
        console.log(`   Has metrics: ${campaign.campaign_metrics?.length > 0 ? 'Yes' : 'No'}`);
        if (campaign.campaign_metrics?.length > 0) {
          const metrics = campaign.campaign_metrics[0];
          console.log(`   Latest metrics: CTR=${metrics.ctr}%, CPC=$${metrics.cpc}, Spend=$${metrics.spend}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

async function testAIInsightsAPI() {
  console.log('\n🤖 Testing AI Insights API...\n');
  
  try {
    const testMetrics = {
      total_spend: 150.50,
      total_impressions: 5000,
      total_clicks: 75,
      average_ctr: 1.5,
      average_cpc: 2.0,
      total_campaigns: 3,
      active_campaigns: 2
    };

    const testCampaigns = [
      {
        name: 'Test Campaign 1',
        status: 'ACTIVE',
        objective: 'CONVERSIONS',
        impressions: 2000,
        clicks: 30,
        ctr: 1.5,
        cpc: 2.0,
        spend: 60.0
      }
    ];

    const response = await fetch('http://localhost:3000/api/ai-explain-fixed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: testMetrics,
        campaigns: testCampaigns
      })
    });

    if (!response.ok) {
      console.log(`❌ AI Insights API failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Error details: ${errorText}`);
    } else {
      const data = await response.json();
      console.log('✅ AI Insights API working');
      console.log(`   Response length: ${data.insight?.length || 0} characters`);
      console.log(`   Sample response: ${data.insight?.substring(0, 100)}...`);
    }

  } catch (error) {
    console.log('❌ AI Insights API test failed:', error.message);
  }
}

async function testAlertsAPI() {
  console.log('\n🚨 Testing Alerts API...\n');
  
  try {
    // First, get a user ID (you'll need to replace this with a real user ID)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.log('❌ No users found for testing alerts');
      return;
    }

    const userId = users[0].id;
    console.log(`Testing alerts for user: ${userId}`);

    const response = await fetch('http://localhost:3000/api/alerts/generate-fixed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forceGenerate: true
      })
    });

    if (!response.ok) {
      console.log(`❌ Alerts API failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Error details: ${errorText}`);
    } else {
      const data = await response.json();
      console.log('✅ Alerts API working');
      console.log(`   Generated ${data.alerts?.length || 0} alerts`);
      if (data.alerts && data.alerts.length > 0) {
        console.log(`   Sample alert: ${data.alerts[0].message}`);
      }
    }

  } catch (error) {
    console.log('❌ Alerts API test failed:', error.message);
  }
}

async function testEnvironmentVariables() {
  console.log('\n🔧 Testing Environment Variables...\n');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'OPENAI_API_KEY',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_ACCESS_TOKEN'
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
    }
  }
}

async function runAllTests() {
  console.log('🧪 Running AI Insights and Alerts Tests\n');
  console.log('=' .repeat(50));
  
  await testEnvironmentVariables();
  await testDatabaseStructure();
  await testAIInsightsAPI();
  await testAlertsAPI();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testDatabaseStructure,
  testAIInsightsAPI,
  testAlertsAPI,
  testEnvironmentVariables,
  runAllTests
}; 