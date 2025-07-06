import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Simple Facebook sync triggered');
    
    // Call the Supabase Edge Function directly
    const response = await fetch(
      'https://yhcmazbibgwmvazuxgcl.supabase.co/functions/v1/sync-facebook-campaigns',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manual_sync: true
        }),
      }
    );

    console.log('📡 Edge function response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge function call failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Sync failed: ${response.status} ${errorText}` },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('✅ Simple sync completed successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Facebook campaigns sync completed successfully',
      result: result
    });

  } catch (error) {
    console.error('❌ Simple sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error during sync' },
      { status: 500 }
    );
  }
} 