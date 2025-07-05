import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { WHATSAPP_CONFIG, WHATSAPP_ENDPOINTS, WHATSAPP_TEMPLATES, ALERT_MESSAGES } from '@/config/whatsapp';

// Message templates for different alert types
const ALERT_TEMPLATES = {
  budget_depleted: {
    name: WHATSAPP_TEMPLATES.budget_alert,
    language: WHATSAPP_CONFIG.defaultLanguage,
    components: [
      {
        type: 'header',
        text: ALERT_MESSAGES.budget_depleted.header
      },
      {
        type: 'body',
        text: ALERT_MESSAGES.budget_depleted.body
      },
      {
        type: 'button',
        sub_type: 'quick_reply',
        index: 0,
        parameters: [
          {
            type: 'text',
            text: ALERT_MESSAGES.budget_depleted.button
          }
        ]
      }
    ]
  },
  low_ctr: {
    name: WHATSAPP_TEMPLATES.ctr_alert,
    language: WHATSAPP_CONFIG.defaultLanguage,
    components: [
      {
        type: 'header',
        text: ALERT_MESSAGES.low_ctr.header
      },
      {
        type: 'body',
        text: ALERT_MESSAGES.low_ctr.body
      },
      {
        type: 'button',
        sub_type: 'quick_reply',
        index: 0,
        parameters: [
          {
            type: 'text',
            text: ALERT_MESSAGES.low_ctr.button
          }
        ]
      }
    ]
  },
  high_costs: {
    name: WHATSAPP_TEMPLATES.cost_alert,
    language: WHATSAPP_CONFIG.defaultLanguage,
    components: [
      {
        type: 'header',
        text: ALERT_MESSAGES.high_costs.header
      },
      {
        type: 'body',
        text: ALERT_MESSAGES.high_costs.body
      },
      {
        type: 'button',
        sub_type: 'quick_reply',
        index: 0,
        parameters: [
          {
            type: 'text',
            text: ALERT_MESSAGES.high_costs.button
          }
        ]
      }
    ]
  },
  campaign_paused: {
    name: WHATSAPP_TEMPLATES.status_alert,
    language: WHATSAPP_CONFIG.defaultLanguage,
    components: [
      {
        type: 'header',
        text: ALERT_MESSAGES.campaign_paused.header
      },
      {
        type: 'body',
        text: ALERT_MESSAGES.campaign_paused.body
      },
      {
        type: 'button',
        sub_type: 'quick_reply',
        index: 0,
        parameters: [
          {
            type: 'text',
            text: ALERT_MESSAGES.campaign_paused.button
          }
        ]
      }
    ]
  },
  test_message: {
    name: WHATSAPP_TEMPLATES.test_alert,
    language: WHATSAPP_CONFIG.defaultLanguage,
    components: [
      {
        type: 'header',
        text: ALERT_MESSAGES.test_message.header
      },
      {
        type: 'body',
        text: ALERT_MESSAGES.test_message.body
      },
      {
        type: 'button',
        sub_type: 'quick_reply',
        index: 0,
        parameters: [
          {
            type: 'text',
            text: ALERT_MESSAGES.test_message.button
          }
        ]
      }
    ]
  }
};

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
   * Check rate limits for a phone number
   */
  private checkRateLimit(phoneNumber: string): boolean {
    const now = Date.now();
    const key = `whatsapp_${phoneNumber}`;
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
      // Check rate limits
      if (!this.checkRateLimit(phoneNumber)) {
        console.log('Rate limit exceeded for phone number:', phoneNumber);
        return false;
      }

      // In test mode, just log the message
      if (WHATSAPP_CONFIG.isTestMode || this.accessToken === 'test_access_token_for_development') {
        console.log('📱 WhatsApp Test Mode - Message would be sent to:', phoneNumber);
        console.log('📱 Message content:', JSON.stringify(message, null, 2));
        return true;
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await fetch(WHATSAPP_ENDPOINTS.messages, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          ...message,
          to: formattedPhone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp API Error:', errorData);
        return false;
      }

      const result = await response.json();
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
        components,
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
   * Send an alert using the appropriate template
   */
  async sendAlert(
    phoneNumber: string,
    alertType: keyof typeof ALERT_TEMPLATES,
    alertData: AlertData
  ): Promise<boolean> {
    try {
      const template = ALERT_TEMPLATES[alertType];
      if (!template) {
        console.error('Unknown alert type:', alertType);
        return false;
      }

      // Replace placeholders in the template
      const processedComponents = template.components?.map(component => {
        if (component.type === 'body' && component.text) {
          let processedText = component.text;
          Object.entries(alertData).forEach(([key, value]) => {
            processedText = processedText.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
          });
          return { ...component, text: processedText };
        }
        return component;
      });

      return this.sendTemplateMessage(
        phoneNumber,
        template.name,
        template.language,
        processedComponents
      );
    } catch (error) {
      console.error('Error sending alert:', error);
      return false;
    }
  }

  /**
   * Send a test message
   */
  async sendTestMessage(phoneNumber: string): Promise<boolean> {
    return this.sendAlert(phoneNumber, 'test_message', { campaign_name: 'Test Campaign' });
  }

  /**
   * Format phone number for WhatsApp API
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (!cleaned.startsWith('27')) {
      cleaned = '27' + cleaned;
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
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('user_alert_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  /**
   * Check if user has enabled WhatsApp alerts
   */
  async isWhatsAppEnabled(userId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return preferences?.whatsapp_enabled === true;
    } catch (error) {
      console.error('Error checking WhatsApp enabled status:', error);
      return false;
    }
  }

  /**
   * Check if current time is in quiet hours
   */
  async isInQuietHours(userId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences?.quiet_hours_enabled) {
        return false;
      }

      const now = new Date();
      const currentHour = now.getHours();
      const startHour = preferences.quiet_hours_start || 22;
      const endHour = preferences.quiet_hours_end || 8;

      if (startHour <= endHour) {
        return currentHour >= startHour && currentHour < endHour;
      } else {
        // Quiet hours span midnight
        return currentHour >= startHour || currentHour < endHour;
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  }

  /**
   * Send alert with user preferences
   */
  async sendAlertWithPreferences(
    userId: string,
    alertType: keyof typeof ALERT_TEMPLATES,
    alertData: AlertData
  ): Promise<boolean> {
    try {
      // Check if WhatsApp is enabled
      const isEnabled = await this.isWhatsAppEnabled(userId);
      if (!isEnabled) {
        console.log(`WhatsApp alerts disabled for user ${userId}`);
        return false;
      }

      // Check quiet hours
      const inQuietHours = await this.isInQuietHours(userId);
      if (inQuietHours) {
        console.log(`User ${userId} is in quiet hours, skipping WhatsApp alert`);
        return false;
      }

      // Get user's phone number
      const preferences = await this.getUserPreferences(userId);
      if (!preferences?.phone_number) {
        console.log(`No phone number found for user ${userId}`);
        return false;
      }

      // Send the alert
      return await this.sendAlert(preferences.phone_number, alertType, alertData);
    } catch (error) {
      console.error('Error sending alert with preferences:', error);
      return false;
    }
  }
}

// Create singleton instance
export const whatsappClient = new WhatsAppClient();

// Export convenience functions
export const sendWhatsAppAlert = (
  userId: string,
  alertType: keyof typeof ALERT_TEMPLATES,
  alertData: AlertData
) => whatsappClient.sendAlertWithPreferences(userId, alertType, alertData);

export const sendTestWhatsAppMessage = (userId: string) => 
  whatsappClient.sendAlertWithPreferences(userId, 'test_message', { campaign_name: 'Test Campaign' }); 