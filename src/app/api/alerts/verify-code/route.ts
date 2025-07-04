import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone_number, code } = await request.json();

    if (!phone_number || !code) {
      return NextResponse.json({ error: 'Phone number and code are required' }, { status: 400 });
    }

    // Check if the verification code exists and is valid
    const { data: verificationData, error: verificationError } = await supabase
      .from('whatsapp_verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('phone_number', phone_number)
      .eq('code', code)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (verificationError || !verificationData) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // Mark the phone number as verified in user preferences
    const { error: updateError } = await supabase
      .from('user_whatsapp_preferences')
      .upsert({
        user_id: user.id,
        phone_number,
        is_verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Error updating user preferences:', updateError);
      return NextResponse.json({ error: 'Failed to verify phone number' }, { status: 500 });
    }

    // Delete the used verification code
    await supabase
      .from('whatsapp_verification_codes')
      .delete()
      .eq('id', verificationData.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Phone number verified successfully' 
    });

  } catch (error) {
    console.error('Error in verify-code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 