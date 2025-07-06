const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yhcmazbibgwmvazuxgcl.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'
);

async function testSupabase() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('Supabase error:', error.message);
  } else {
    console.log('Supabase data:', data);
  }
}

testSupabase(); 