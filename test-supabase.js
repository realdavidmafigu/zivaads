const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yhcmazbibgwmvazuxgcl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzUwMjEsImV4cCI6MjA2Njk1MTAyMX0.mp7OU9BwFA6ww2loJqkmgBMIioQD_K6t54y2diBV380'
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