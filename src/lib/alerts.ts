import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { sendWhatsAppAlert, AlertData } from './whatsapp';
import { FacebookCampaign } from '@/types';
import { DEFAULT_THRESHOLDS } from '@/config/whatsapp';

export interface AlertThresholds {
  low_ctr: number;
  high_cpc: number;
  budget_usage: number;
  spend_limit: number;
  frequency_cap: number;
}

export interface CampaignAlert {
  id: string;
  campaign_id: string;
  campaign_name: string;
  alert_type: 'budget_depleted' | 'low_ctr' | 'high_costs' | 'campaign_paused' | 'high_frequency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: Record<string, any>;
  created_at: string;
  is_resolved: boolean;
}

export class AlertDetector {
  private supabase: any;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /**
   * Get user's alert thresholds
   */
  async getUserThresholds(userId: string): Promise<AlertThresholds> {
    try {
      const { data, error } = await this.supabase
        .from('user_alert_thresholds')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Return default thresholds if none set
        return DEFAULT_THRESHOLDS;
      }

      return {
        low_ctr: data.low_ctr || DEFAULT_THRESHOLDS.low_ctr,
        high_cpc: data.high_cpc || DEFAULT_THRESHOLDS.high_cpc,
        budget_usage: data.budget_usage || DEFAULT_THRESHOLDS.budget_usage,
        spend_limit: data.spend_limit || DEFAULT_THRESHOLDS.spend_limit,
        frequency_cap: data.frequency_cap || DEFAULT_THRESHOLDS.frequency_cap,
      };
    } catch (error) {
      console.error('Error fetching user thresholds:', error);
      return DEFAULT_THRESHOLDS;
    }
  }

  /**
   * Detect campaign issues and generate alerts
   */
  async detectCampaignIssues(userId: string): Promise<CampaignAlert[]> {
    try {
      const thresholds = await this.getUserThresholds(userId);
      const alerts: CampaignAlert[] = [];

      // Get user's active campaigns
      const { data: campaigns, error } = await this.supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['ACTIVE', 'LEARNING']);

      if (error) {
        console.error('Error fetching campaigns:', error);
        return [];
      }

      if (!campaigns || campaigns.length === 0) {
        return [];
      }

      // Check each campaign for issues
      for (const campaign of campaigns) {
        const campaignAlerts = await this.checkCampaignIssues(campaign, thresholds);
        alerts.push(...campaignAlerts);
      }

      // Store alerts in database
      if (alerts.length > 0) {
        await this.storeAlerts(alerts, userId);
      }

      return alerts;
    } catch (error) {
      console.error('Error detecting campaign issues:', error);
      return [];
    }
  }

  /**
   * Check individual campaign for issues
   */
  private async checkCampaignIssues(
    campaign: any,
    thresholds: AlertThresholds
  ): Promise<CampaignAlert[]> {
    const alerts: CampaignAlert[] = [];
    const now = new Date().toISOString();

    // Check if campaign is paused
    if (campaign.status === 'PAUSED') {
      alerts.push({
        id: `paused_${campaign.id}`,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        alert_type: 'campaign_paused',
        severity: 'medium',
        message: `Campaign "${campaign.name}" has been paused`,
        metadata: {
          reason: 'Campaign status changed to PAUSED',
          previous_status: campaign.status,
        },
        created_at: now,
        is_resolved: false,
      });
    }

    // Check budget depletion
    if (campaign.daily_budget && campaign.spend) {
      const budgetUsage = (campaign.spend / campaign.daily_budget) * 100;
      if (budgetUsage >= thresholds.budget_usage) {
        alerts.push({
          id: `budget_${campaign.id}`,
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          alert_type: 'budget_depleted',
          severity: budgetUsage >= 100 ? 'high' : 'medium',
          message: `Campaign "${campaign.name}" has used ${budgetUsage.toFixed(1)}% of daily budget`,
          metadata: {
            budget_usage: budgetUsage,
            daily_budget: campaign.daily_budget,
            current_spend: campaign.spend,
            threshold: thresholds.budget_usage,
          },
          created_at: now,
          is_resolved: false,
        });
      }
    }

    // Check low CTR
    if (campaign.ctr && campaign.ctr < thresholds.low_ctr) {
      alerts.push({
        id: `ctr_${campaign.id}`,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        alert_type: 'low_ctr',
        severity: campaign.ctr < thresholds.low_ctr * 0.5 ? 'high' : 'medium',
        message: `Low CTR detected for "${campaign.name}": ${campaign.ctr.toFixed(2)}%`,
        metadata: {
          current_ctr: campaign.ctr,
          threshold: thresholds.low_ctr,
          impressions: campaign.impressions,
          clicks: campaign.clicks,
        },
        created_at: now,
        is_resolved: false,
      });
    }

    // Check high CPC
    if (campaign.cpc && campaign.cpc > thresholds.high_cpc) {
      alerts.push({
        id: `cpc_${campaign.id}`,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        alert_type: 'high_costs',
        severity: campaign.cpc > thresholds.high_cpc * 2 ? 'high' : 'medium',
        message: `High CPC detected for "${campaign.name}": $${campaign.cpc.toFixed(2)}`,
        metadata: {
          current_cpc: campaign.cpc,
          threshold: thresholds.high_cpc,
          spend: campaign.spend,
          clicks: campaign.clicks,
        },
        created_at: now,
        is_resolved: false,
      });
    }

    // Check high frequency
    if (campaign.frequency && campaign.frequency > thresholds.frequency_cap) {
      alerts.push({
        id: `freq_${campaign.id}`,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        alert_type: 'high_frequency',
        severity: campaign.frequency > thresholds.frequency_cap * 1.5 ? 'high' : 'medium',
        message: `High frequency detected for "${campaign.name}": ${campaign.frequency.toFixed(2)}`,
        metadata: {
          current_frequency: campaign.frequency,
          threshold: thresholds.frequency_cap,
          reach: campaign.reach,
          impressions: campaign.impressions,
        },
        created_at: now,
        is_resolved: false,
      });
    }

    return alerts;
  }

  /**
   * Store alerts in database
   */
  private async storeAlerts(alerts: CampaignAlert[], userId: string): Promise<void> {
    try {
      const alertRecords = alerts.map(alert => ({
        user_id: userId, // Use the actual user_id passed to the function
        campaign_id: alert.campaign_id,
        alert_type: alert.alert_type,
        severity: alert.severity,
        title: alert.message,
        message: alert.message,
        metadata: alert.metadata,
        is_resolved: alert.is_resolved,
        created_at: alert.created_at,
      }));

      const { error } = await this.supabase
        .from('alerts')
        .insert(alertRecords);

      if (error) {
        console.error('Error storing alerts:', error);
      } else {
        console.log(`Successfully stored ${alerts.length} alerts for user ${userId}`);
      }
    } catch (error) {
      console.error('Error storing alerts:', error);
    }
  }

  /**
   * Send WhatsApp alerts for detected issues
   */
  async sendWhatsAppAlerts(userId: string, alerts: CampaignAlert[]): Promise<void> {
    try {
      for (const alert of alerts) {
        const alertData: AlertData = {
          campaign_name: alert.campaign_name,
          campaign_id: alert.campaign_id,
          ...alert.metadata,
        };

        // Map alert types to WhatsApp alert types
        let whatsappAlertType: 'budget_depleted' | 'low_ctr' | 'high_costs' | 'campaign_paused' | 'test_message';
        
        switch (alert.alert_type) {
          case 'budget_depleted':
            whatsappAlertType = 'budget_depleted';
            alertData.spend = alert.metadata.current_spend;
            break;
          case 'low_ctr':
            whatsappAlertType = 'low_ctr';
            alertData.ctr = alert.metadata.current_ctr;
            alertData.threshold = alert.metadata.threshold;
            break;
          case 'high_costs':
            whatsappAlertType = 'high_costs';
            alertData.cpc = alert.metadata.current_cpc;
            alertData.threshold = alert.metadata.threshold;
            break;
          case 'campaign_paused':
            whatsappAlertType = 'campaign_paused';
            alertData.reason = alert.metadata.reason;
            break;
          default:
            continue; // Skip unsupported alert types
        }

        // Send WhatsApp alert
        await sendWhatsAppAlert(userId, whatsappAlertType, alertData);
      }
    } catch (error) {
      console.error('Error sending WhatsApp alerts:', error);
    }
  }

  /**
   * Get recent alerts for a user
   */
  async getRecentAlerts(userId: string, days: number = 30): Promise<any[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('alerts')
        .select(`
          *,
          campaigns(name, facebook_campaign_id)
        `)
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recent alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      return [];
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
        })
        .eq('id', alertId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error resolving alert:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }

  /**
   * Update user alert thresholds
   */
  async updateThresholds(userId: string, thresholds: Partial<AlertThresholds>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_alert_thresholds')
        .upsert({
          user_id: userId,
          ...thresholds,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating thresholds:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating thresholds:', error);
      return false;
    }
  }

  /**
   * Get alert statistics for dashboard
   */
  async getAlertStats(userId: string): Promise<{
    total: number;
    resolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('alerts')
        .select('severity, is_resolved')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching alert stats:', error);
        return {
          total: 0,
          resolved: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        };
      }

      const stats = {
        total: data.length,
        resolved: data.filter((a: any) => a.is_resolved).length,
        critical: data.filter((a: any) => a.severity === 'critical').length,
        high: data.filter((a: any) => a.severity === 'high').length,
        medium: data.filter((a: any) => a.severity === 'medium').length,
        low: data.filter((a: any) => a.severity === 'low').length,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching alert stats:', error);
      return {
        total: 0,
        resolved: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
    }
  }
}

// Export singleton instance
export const alertDetector = new AlertDetector();

// Export helper functions
export const detectCampaignIssues = (userId: string) => 
  alertDetector.detectCampaignIssues(userId);

export const getRecentAlerts = (userId: string, days?: number) => 
  alertDetector.getRecentAlerts(userId, days);

export const resolveAlert = (alertId: string, userId: string) => 
  alertDetector.resolveAlert(alertId, userId);

export const updateAlertThresholds = (userId: string, thresholds: Partial<AlertThresholds>) => 
  alertDetector.updateThresholds(userId, thresholds);

export const getAlertStats = (userId: string) => 
  alertDetector.getAlertStats(userId); 