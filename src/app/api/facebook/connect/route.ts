import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { exchangeCodeForToken, createFacebookClient } from '@/lib/facebook';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { FACEBOOK_OAUTH_CONFIG } from '@/config/facebook';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const error_reason = searchParams.get('error_reason');

  // Handle OAuth errors
  if (error) {
    console.error('Facebook OAuth error:', error, error_reason);
    return NextResponse.redirect(
      `${FACEBOOK_OAUTH_CONFIG.redirectUri.replace('/api/facebook/connect', '/dashboard/connect-facebook')}?error=${encodeURIComponent(`Facebook authorization failed: ${error_reason || error}`)}`
    );
  }

  // Validate state parameter
  if (state !== FACEBOOK_OAUTH_CONFIG.state) {
    return NextResponse.redirect(
      `${FACEBOOK_OAUTH_CONFIG.redirectUri.replace('/api/facebook/connect', '/dashboard/connect-facebook')}?error=${encodeURIComponent('Invalid state parameter')}`
    );
  }

  // Check if authorization code is present
  if (!code) {
    return NextResponse.redirect(
      `${FACEBOOK_OAUTH_CONFIG.redirectUri.replace('/api/facebook/connect', '/dashboard/connect-facebook')}?error=${encodeURIComponent('No authorization code received')}`
    );
  }

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
      return NextResponse.redirect(
        `/login?redirectTo=/dashboard/connect-facebook`
      );
    }

    // Ensure user exists in the users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userCheckError || !existingUser) {
      // Create user record if it doesn't exist
      console.log('Creating user record for:', user.id);
      const { error: insertUserError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          created_at: user.created_at
        });

      if (insertUserError) {
        console.error('Error creating user record:', insertUserError);
        return NextResponse.redirect(
          `${FACEBOOK_OAUTH_CONFIG.redirectUri.replace('/api/facebook/connect', '/dashboard/connect-facebook')}?error=${encodeURIComponent('Failed to create user profile')}`
        );
      }
    }

    // Exchange authorization code for access token
    console.log('Exchanging code for token with app ID:', FACEBOOK_OAUTH_CONFIG.appId);
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, expires_in } = tokenData;

    // Create Facebook client to validate token and get user info
    const facebookClient = createFacebookClient(access_token);
    
    // Validate the access token
    const isValid = await facebookClient.validateToken();
    if (!isValid) {
      throw new Error('Invalid access token received from Facebook');
    }

    // Get user profile from Facebook
    const facebookUser = await facebookClient.getUserProfile();
    
    // Get user's ad accounts
    const adAccounts = await facebookClient.getAdAccounts();
    
    if (adAccounts.length === 0) {
      return NextResponse.redirect(
        `${FACEBOOK_OAUTH_CONFIG.redirectUri.replace('/api/facebook/connect', '/dashboard/connect-facebook')}?error=${encodeURIComponent('No ad accounts found. Please ensure you have admin access to a Facebook Business account with active ad campaigns.')}`
      );
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expires_in);

    // Store Facebook accounts in database
    const { error: insertError } = await supabase
      .from('facebook_accounts')
      .upsert(
        adAccounts.map(account => ({
          user_id: user.id,
          facebook_account_id: account.id,
          account_name: account.account_name || 'Unknown',
          access_token: access_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          account_status: account.account_status,
          currency: account.currency,
          timezone_name: account.timezone_name,
          business_name: account.business_name,
          permissions: ['ads_management', 'ads_read', 'business_management'],
          is_active: true,
          last_sync_at: new Date().toISOString()
        })),
        { onConflict: 'user_id,facebook_account_id' }
      );

    if (insertError) {
      console.error('Error storing Facebook accounts:', insertError);
      return NextResponse.redirect(
        `${FACEBOOK_OAUTH_CONFIG.redirectUri.replace('/api/facebook/connect', '/dashboard/connect-facebook')}?error=${encodeURIComponent('Failed to store Facebook account data')}`
      );
    }

    // Log successful connection
    console.log(`Facebook account connected for user ${user.id}:`, adAccounts.map(acc => acc.account_name));

    // Redirect to success page
    return NextResponse.redirect(
      `${FACEBOOK_OAUTH_CONFIG.redirectUri.replace('/api/facebook/connect', '/dashboard/connect-facebook')}?success=${encodeURIComponent(`Successfully connected ${adAccounts.length} Facebook account(s)`)}`
    );

  } catch (error) {
    console.error('Error in Facebook OAuth callback:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.redirect(
      `${FACEBOOK_OAUTH_CONFIG.redirectUri.replace('/api/facebook/connect', '/dashboard/connect-facebook')}?error=${encodeURIComponent(errorMessage)}`
    );
  }
} 