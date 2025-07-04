import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { WhatsAppClient } from '@/lib/whatsapp';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone_number } = await request.json();

    if (!phone_number) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the verification code in the database
    const { error: storeError } = await supabase
      .from('whatsapp_verification_codes')
      .upsert({
        user_id: user.id,
        phone_number,
        code: verificationCode,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        created_at: new Date().toISOString(),
      });

    if (storeError) {
      console.error('Error storing verification code:', storeError);
      return NextResponse.json({ error: 'Failed to store verification code' }, { status: 500 });
    }

    // Send WhatsApp message with verification code
    const message = `Your ZivaAds verification code is: ${verificationCode}\n\nThis code will expire in 10 minutes.`;
    
    const whatsappClient = new WhatsAppClient();
    const sendResult = await whatsappClient.sendTextMessage(phone_number, message);

    if (!sendResult) {
      console.error('Error sending WhatsApp message');
      return NextResponse.json({ 
        error: 'Failed to send verification code. Please check your phone number.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent successfully' 
    });

  } catch (error) {
    console.error('Error in verify-phone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 