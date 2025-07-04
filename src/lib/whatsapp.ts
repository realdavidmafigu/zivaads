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
        console.warn(`Rate limit exceeded for ${phoneNumber}`);
        return false;
      }

      // Format phone number (remove + and add country code if needed)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const response = await fetch(
        `https://graph.facebook.com/${WHATSAPP_CONFIG.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...message,
            to: formattedNumber,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('WhatsApp API Error:', error);
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
   * Send an alert message using templates
   */
  async sendAlert(
    phoneNumber: string,
    alertType: keyof typeof ALERT_TEMPLATES,
    alertData: AlertData
  ): Promise<boolean> {
    try {
      const template = ALERT_TEMPLATES[alertType];
      if (!template) {
        console.error(`Template not found for alert type: ${alertType}`);
        return false;
      }

      // Replace placeholders in template components
      const components = template.components?.map(component => {
        if (component.type === 'body' && component.text) {
          let text = component.text;
          Object.entries(alertData).forEach(([key, value]) => {
            text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
          });
          return { ...component, text };
        }
        return component;
      });

      return this.sendTemplateMessage(phoneNumber, template.name, template.language, components);
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
    
    // If it starts with 0, replace with country code
    if (cleaned.startsWith('0')) {
      cleaned = WHATSAPP_CONFIG.defaultCountryCode + cleaned.substring(1);
    }
    
    // If it doesn't start with country code, add default country code
    if (!cleaned.startsWith(WHATSAPP_CONFIG.defaultCountryCode)) {
      cleaned = WHATSAPP_CONFIG.defaultCountryCode + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    // Implement webhook signature verification if needed
    // For now, return true (you should implement proper verification)
    return true;
  }

  /**
   * Get user's WhatsApp preferences
   */
  async getUserPreferences(userId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_whatsapp_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching WhatsApp preferences:', error);
      return null;
    }

    return data;
  }

  /**
   * Check if user has enabled WhatsApp alerts
   */
  async isWhatsAppEnabled(userId: string): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    return preferences?.is_enabled && preferences?.phone_number;
  }

  /**
   * Check quiet hours
   */
  async isInQuietHours(userId: string): Promise<boolean> {
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
      // Handles overnight quiet hours (e.g., 22:00 - 08:00)
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  /**
   * Send alert with user preferences check
   */
  async sendAlertWithPreferences(
    userId: string,
    alertType: keyof typeof ALERT_TEMPLATES,
    alertData: AlertData
  ): Promise<boolean> {
    try {
      // Check if WhatsApp is enabled
      if (!(await this.isWhatsAppEnabled(userId))) {
        console.log(`WhatsApp alerts disabled for user ${userId}`);
        return false;
      }

      // Check quiet hours
      if (await this.isInQuietHours(userId)) {
        console.log(`In quiet hours for user ${userId}`);
        return false;
      }

      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      if (!preferences?.phone_number) {
        console.error(`No phone number found for user ${userId}`);
        return false;
      }

      // Check alert type preferences
      const alertTypeKey = `alert_${alertType}`;
      if (preferences[alertTypeKey] === false) {
        console.log(`Alert type ${alertType} disabled for user ${userId}`);
        return false;
      }

      // Send the alert
      return this.sendAlert(preferences.phone_number, alertType, alertData);
    } catch (error) {
      console.error('Error sending alert with preferences:', error);
      return false;
    }
  }
}

// Export singleton instance
export const whatsappClient = new WhatsAppClient();

// Export helper functions
export const sendWhatsAppAlert = (
  userId: string,
  alertType: keyof typeof ALERT_TEMPLATES,
  alertData: AlertData
) => whatsappClient.sendAlertWithPreferences(userId, alertType, alertData);

export const sendTestWhatsAppMessage = (userId: string) => 
  whatsappClient.sendAlertWithPreferences(userId, 'test_message', { campaign_name: 'Test Campaign' }); 