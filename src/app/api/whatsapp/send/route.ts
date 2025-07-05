import { NextRequest, NextResponse } from 'next/server';
import { WHATSAPP_CONFIG } from '@/config/whatsapp';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/config/supabase';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message, messageType = 'text' } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const apiPhone = formattedPhone.replace('+', '');

    // Check if user is subscribed
    const { data: subscriber, error: subscriberError } = await supabase
      .from('whatsapp_subscribers')
      .select('*')
      .eq('phone_number', formattedPhone)
      .eq('is_active', true)
      .single();

    if (subscriberError || !subscriber) {
      return NextResponse.json(
        { 
          error: 'User not subscribed',
          message: 'This phone number has not opted in to receive messages. Users must message your WhatsApp number first to subscribe.'
        },
        { status: 403 }
      );
    }

    // Check if within 24-hour window (update last_message_at)
    const lastMessageTime = new Date(subscriber.last_message_at);
    const now = new Date();
    const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastMessage > 24) {
      return NextResponse.json(
        { 
          error: '24-hour window expired',
          message: 'The 24-hour messaging window has expired. The user needs to send a new message to your WhatsApp number to re-subscribe.'
        },
        { status: 403 }
      );
    }

    // Prepare message payload
    let messagePayload: any = {
      messaging_product: 'whatsapp',
      to: apiPhone,
      type: messageType
    };

    if (messageType === 'text') {
      messagePayload.text = { body: message };
    } else if (messageType === 'template') {
      messagePayload.template = message;
    }

    // Send message
    const response = await fetch(
      `https://graph.facebook.com/v${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const result = await response.json();

    if (result.error) {
      console.error('❌ WhatsApp API Error:', result.error);
      return NextResponse.json(
        { error: 'WhatsApp API error', details: result.error },
        { status: 500 }
      );
    }

    // Update subscriber's last message time and message count
    await supabase
      .from('whatsapp_subscribers')
      .update({
        last_message_at: now.toISOString(),
        message_count: subscriber.message_count + 1
      })
      .eq('phone_number', formattedPhone);

    console.log(`✅ WhatsApp message sent to ${formattedPhone}:`, result);

    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
      subscriber: {
        phoneNumber: formattedPhone,
        messageCount: subscriber.message_count + 1,
        subscribedAt: subscriber.subscribed_at
      }
    });

  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 