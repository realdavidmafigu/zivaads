import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { exchangeLoginCodeForToken, createFacebookClient } from '@/lib/facebook';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { FACEBOOK_LOGIN_CONFIG } from '@/config/facebook';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const error_reason = searchParams.get('error_reason');

  // Handle OAuth errors
  if (error) {
    console.error('Facebook Login OAuth error:', error, error_reason);
    return NextResponse.redirect(
      `${FACEBOOK_LOGIN_CONFIG.redirectUri.replace('/api/facebook/login', '/login')}?error=${encodeURIComponent(`Facebook login failed: ${error_reason || error}`)}`
    );
  }

  // Validate state parameter
  if (state !== FACEBOOK_LOGIN_CONFIG.state) {
    return NextResponse.redirect(
      `${FACEBOOK_LOGIN_CONFIG.redirectUri.replace('/api/facebook/login', '/login')}?error=${encodeURIComponent('Invalid state parameter')}`
    );
  }

  // Check if authorization code is present
  if (!code) {
    return NextResponse.redirect(
      `${FACEBOOK_LOGIN_CONFIG.redirectUri.replace('/api/facebook/login', '/login')}?error=${encodeURIComponent('No authorization code received')}`
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
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // Exchange authorization code for access token
    console.log('Exchanging Facebook login code for access token...');
    const { access_token, expires_in } = await exchangeLoginCodeForToken(code);
    
    if (!access_token) {
      throw new Error('No access token received from Facebook');
    }

    // Create Facebook client and validate token
    const facebookClient = createFacebookClient(access_token);
    const isValid = await facebookClient.validateToken();
    
    if (!isValid) {
      throw new Error('Invalid access token received from Facebook');
    }

    // Get user profile from Facebook
    const facebookUser = await facebookClient.getUserProfile();
    console.log('Facebook user profile:', facebookUser);
    
    if (!facebookUser.email) {
      return NextResponse.redirect(
        `${FACEBOOK_LOGIN_CONFIG.redirectUri.replace('/api/facebook/login', '/login')}?error=${encodeURIComponent('Email is required for login. Please ensure your Facebook account has an email address.')}`
      );
    }

    // Check if user already exists in Supabase
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', facebookUser.email)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing user:', userError);
      throw new Error('Failed to check existing user');
    }

    let userId: string;

    if (existingUser) {
      // User exists, update their Facebook info
      console.log('Existing user found:', existingUser.email);
      userId = existingUser.id;
      
      // Update user's Facebook ID if not set
      if (!existingUser.facebook_id) {
        await supabase
          .from('users')
          .update({ 
            facebook_id: facebookUser.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);
      }
    } else {
      // Create new user
      console.log('Creating new user with Facebook account:', facebookUser.email);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: facebookUser.email,
          full_name: facebookUser.name,
          facebook_id: facebookUser.id,
          avatar_url: `https://graph.facebook.com/${facebookUser.id}/picture?type=large`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating new user:', createError);
        throw new Error('Failed to create user account');
      }

      userId = newUser.id;
      console.log('New user created:', newUser.email);
    }

    // For now, we'll redirect to login with a success message
    // The user will need to sign in with their email/password
    // In a production app, you'd implement proper OAuth session management
    console.log(`Facebook login successful for user ${userId}:`, facebookUser.email);

    // Redirect to login with success message
    return NextResponse.redirect(
      `${FACEBOOK_LOGIN_CONFIG.redirectUri.replace('/api/facebook/login', '/login')}?success=${encodeURIComponent('Facebook account connected! Please sign in with your email and password.')}`
    );

  } catch (error) {
    console.error('Error in Facebook login OAuth callback:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.redirect(
      `${FACEBOOK_LOGIN_CONFIG.redirectUri.replace('/api/facebook/login', '/login')}?error=${encodeURIComponent(errorMessage)}`
    );
  }
} 