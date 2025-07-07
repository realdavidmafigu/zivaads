import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for Facebook accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('facebook_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    if (accountsError) {
      console.error('Error checking Facebook connection:', accountsError);
      return NextResponse.json(
        { error: 'Failed to check Facebook connection' },
        { status: 500 }
      );
    }

    const hasConnection = accounts && accounts.length > 0;

    return NextResponse.json({
      hasConnection,
      accountCount: accounts?.length || 0,
      userId: user.id
    });

  } catch (error) {
    console.error('Error in Facebook connection status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 