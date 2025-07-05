import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { WHATSAPP_CONFIG, WHATSAPP_ENDPOINTS } from '@/config/whatsapp';

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template' | 'text';
  template?: {
    name: string;
    language: string;
    components?: any[];
  };
  text?: {
    body: string;
  };
}

export interface AlertData {
  campaign_name: string;
  campaign_id?: string;
  spend?: number;
  ctr?: number;
  cpc?: number;
  threshold?: number;
  reason?: string;
  [key: string]: any;
}

export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;
  private supabase: any;

  constructor() {
    this.phoneNumberId = WHATSAPP_CONFIG.phoneNumberId;
    this.accessToken = WHATSAPP_CONFIG.accessToken;
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /**
   * Check rate limiting for a phone number
   */
  private checkRateLimit(phoneNumber: string): boolean {
    const now = Date.now();
    const key = phoneNumber;
    const limit = rateLimitStore.get(key);

    if (!limit || now > limit.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + WHATSAPP_CONFIG.rateLimit.cooldownPeriod });
      return true;
    }

    if (limit.count >= WHATSAPP_CONFIG.rateLimit.maxMessagesPerMinute) {
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Send a WhatsApp message
   */
  async sendMessage(phoneNumber: string, message: WhatsAppMessage): Promise<boolean> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(phoneNumber)) {
        console.error('Rate limit exceeded for phone number:', phoneNumber);
        return false;
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await fetch(WHATSAPP_ENDPOINTS.messages(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...message,
          to: formattedPhone,
        }),
      });

      const result = await response.json();

      if (result.error) {
        console.error('WhatsApp API Error:', result.error);
        return false;
      }

      console.log('WhatsApp message sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    language: string = 'en',
    components?: any[]
  ): Promise<boolean> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language,
        ...(components && { components }),
      },
    };

    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Send a text message
   */
  async sendTextMessage(phoneNumber: string, text: string): Promise<boolean> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: text,
      },
    };

    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Send a test message
   */
  async sendTestMessage(phoneNumber: string): Promise<boolean> {
    return this.sendTextMessage(phoneNumber, '🧪 Test message from ZivaAds! Your WhatsApp integration is working correctly.');
  }

  /**
   * Format phone number for WhatsApp API
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    // Check for Zimbabwe numbers (263) first, then South Africa (27)
    if (!cleaned.startsWith('263') && !cleaned.startsWith('27')) {
      // If it's a 9-digit number starting with 7, it's likely Zimbabwe
      if (cleaned.length === 9 && cleaned.startsWith('7')) {
        cleaned = '263' + cleaned;
      } else {
        // Default to South Africa
        cleaned = '27' + cleaned;
      }
    }
    
    return cleaned;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    // Implement signature verification if needed
    return true;
  }

  /**
   * Store user interaction for 24-hour session
   */
  async storeUserInteraction(phoneNumber: string, messageText: string): Promise<void> {
    try {
      // Check if user exists in subscribers table
      const { data: existingUser } = await this.supabase
        .from('whatsapp_subscribers')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (existingUser) {
        // Update existing user's last message time
        await this.supabase
          .from('whatsapp_subscribers')
          .update({
            last_message_at: new Date().toISOString(),
            message_count: existingUser.message_count + 1
          })
          .eq('phone_number', phoneNumber);
      } else {
        // Add new user
        await this.supabase
          .from('whatsapp_subscribers')
          .insert({
            phone_number: phoneNumber,
            first_message: messageText,
            subscribed_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
            is_active: true,
            message_count: 1
          });
      }
    } catch (error) {
      console.error('Error storing user interaction:', error);
    }
  }

  /**
   * Check if user is within 24-hour session window
   */
  async isWithinSessionWindow(phoneNumber: string): Promise<boolean> {
    try {
      const { data: user } = await this.supabase
        .from('whatsapp_subscribers')
        .select('last_message_at')
        .eq('phone_number', phoneNumber)
        .single();

      if (!user) {
        return false;
      }

      const lastMessage = new Date(user.last_message_at);
      const now = new Date();
      const hoursSinceLastMessage = (now.getTime() - lastMessage.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastMessage <= 24;
    } catch (error) {
      console.error('Error checking session window:', error);
      return false;
    }
  }
}

// Create singleton instance
export const whatsappClient = new WhatsAppClient();

// Export convenience functions
export const sendWhatsAppMessage = (phoneNumber: string, text: string) => 
  whatsappClient.sendTextMessage(phoneNumber, text);

export const sendTestWhatsAppMessage = (phoneNumber: string) => 
  whatsappClient.sendTestMessage(phoneNumber); 