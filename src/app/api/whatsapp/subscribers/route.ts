import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/config/supabase';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    let query = supabase
      .from('whatsapp_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: subscribers, error } = await query;

    if (error) {
      console.error('❌ Error fetching subscribers:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscribers: subscribers || [],
      count: subscribers?.length || 0
    });

  } catch (error) {
    console.error('❌ Error in subscribers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, firstMessage = '' } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Check if already exists
    const { data: existing } = await supabase
      .from('whatsapp_subscribers')
      .select('*')
      .eq('phone_number', formattedPhone)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Subscriber already exists' },
        { status: 409 }
      );
    }

    // Add new subscriber
    const { data: newSubscriber, error } = await supabase
      .from('whatsapp_subscribers')
      .insert({
        phone_number: formattedPhone,
        first_message: firstMessage,
        subscribed_at: new Date().toISOString(),
        is_active: true,
        message_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding subscriber:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriber: newSubscriber
    });

  } catch (error) {
    console.error('❌ Error in subscribers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { phoneNumber, isActive } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    const { data: updatedSubscriber, error } = await supabase
      .from('whatsapp_subscribers')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('phone_number', formattedPhone)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating subscriber:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriber: updatedSubscriber
    });

  } catch (error) {
    console.error('❌ Error in subscribers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 