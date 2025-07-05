// Setup WhatsApp Subscribers Table
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yhcmazbibgwmvazuxgcl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM3NTAyMSwiZXhwIjoyMDY2OTUxMDIxfQ.YTeTK-Xs2_h6e2fQzmlWXjxCJf4fLYXNzThMXYiA1CI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupWhatsAppSubscribers() {
  console.log('🔧 Setting up WhatsApp subscribers table...');

  try {
    // Create the table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_subscribers (
          id SERIAL PRIMARY KEY,
          phone_number VARCHAR(20) UNIQUE NOT NULL,
          first_message TEXT,
          subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          message_count INTEGER DEFAULT 0,
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.log('⚠️ Table might already exist, trying alternative approach...');
      
      // Try to insert a test record to see if table exists
      const { error: insertError } = await supabase
        .from('whatsapp_subscribers')
        .insert({
          phone_number: '+263718558160',
          first_message: 'Test subscription',
          is_active: true
        });

      if (insertError && insertError.code === '42P01') {
        console.log('❌ Table does not exist. Please create it manually in Supabase dashboard.');
        console.log('SQL to run:');
        console.log(`
          CREATE TABLE whatsapp_subscribers (
            id SERIAL PRIMARY KEY,
            phone_number VARCHAR(20) UNIQUE NOT NULL,
            first_message TEXT,
            subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_active BOOLEAN DEFAULT true,
            message_count INTEGER DEFAULT 0,
            preferences JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
        return;
      } else if (insertError) {
        console.log('⚠️ Test insert failed:', insertError.message);
      } else {
        console.log('✅ Table exists and is working!');
        
        // Clean up test record
        await supabase
          .from('whatsapp_subscribers')
          .delete()
          .eq('phone_number', '+263718558160');
      }
    } else {
      console.log('✅ Table created successfully!');
    }

    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('whatsapp_subscribers')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Error testing table:', testError);
    } else {
      console.log('✅ Table is working correctly!');
      console.log('📊 Current subscribers:', testData?.length || 0);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupWhatsAppSubscribers(); 