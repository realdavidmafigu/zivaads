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

    // Get all Facebook accounts for the user (including inactive ones)
    const { data: allAccounts, error: allAccountsError } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (allAccountsError) {
      return NextResponse.json(
        { error: 'Failed to fetch Facebook accounts' },
        { status: 500 }
      );
    }

    // Get only active accounts
    const { data: activeAccounts, error: activeAccountsError } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (activeAccountsError) {
      return NextResponse.json(
        { error: 'Failed to fetch active Facebook accounts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      allAccounts: allAccounts || [],
      activeAccounts: activeAccounts || [],
      summary: {
        totalAccounts: allAccounts?.length || 0,
        activeAccounts: activeAccounts?.length || 0,
        inactiveAccounts: (allAccounts?.length || 0) - (activeAccounts?.length || 0)
      }
    });

  } catch (error) {
    console.error('Error in debug Facebook accounts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 