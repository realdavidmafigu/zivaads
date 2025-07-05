import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '@/config/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual Facebook campaigns sync triggered');
    
    // Get the user from the session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Call the Supabase Edge Function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/sync-facebook-campaigns`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          manual_sync: true
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge function call failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Sync failed: ${response.status} ${errorText}` },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('✅ Manual sync completed successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Facebook campaigns sync completed successfully',
      result: result
    });

  } catch (error) {
    console.error('❌ Manual sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error during sync' },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggering
export async function GET(request: NextRequest) {
  return POST(request);
} 