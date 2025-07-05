import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
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
  id?: string;
  campaign_id: string;
  campaign_name: string;
  alert_type: 'budget_depleted' | 'low_ctr' | 'high_costs' | 'campaign_paused' | 'high_frequency';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metadata: {
    current_spend?: number;
    current_ctr?: number;
    current_cpc?: number;
    threshold?: number;
    reason?: string;
    [key: string]: any;
  };
  created_at?: string;
  resolved_at?: string;
  is_resolved?: boolean;
}

export class AlertDetector {
  private supabase: any;
  private thresholds: AlertThresholds;

  constructor(thresholds?: Partial<AlertThresholds>) {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Get user-specific alert thresholds
   */
  async getUserThresholds(userId: string): Promise<AlertThresholds> {
    try {
      const { data, error } = await this.supabase
        .from('user_alert_thresholds')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return this.thresholds;
      }

      return {
        low_ctr: data.low_ctr || this.thresholds.low_ctr,
        high_cpc: data.high_cpc || this.thresholds.high_cpc,
        budget_usage: data.budget_usage || this.thresholds.budget_usage,
        spend_limit: data.spend_limit || this.thresholds.spend_limit,
        frequency_cap: data.frequency_cap || this.thresholds.frequency_cap,
      };
    } catch (error) {
      console.error('Error fetching user thresholds:', error);
      return this.thresholds;
    }
  }

  /**
   * Detect issues in a single campaign
   */
  async checkCampaignIssues(campaign: FacebookCampaign, thresholds?: AlertThresholds): Promise<CampaignAlert[]> {
    const alerts: CampaignAlert[] = [];
    const userThresholds = thresholds || this.thresholds;

    // Check budget depletion
    if (campaign.status === 'ACTIVE' && campaign.daily_budget && campaign.spend) {
      const budgetUsage = (campaign.spend / campaign.daily_budget) * 100;
      if (budgetUsage >= userThresholds.budget_usage) {
        alerts.push({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          alert_type: 'budget_depleted',
          severity: 'high',
          message: `Campaign "${campaign.name}" has used ${budgetUsage.toFixed(1)}% of its daily budget`,
          metadata: {
            current_spend: campaign.spend,
            budget_usage: budgetUsage,
          },
        });
      }
    }

    // Check low CTR
    if (campaign.ctr && campaign.ctr < userThresholds.low_ctr) {
      alerts.push({
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        alert_type: 'low_ctr',
        severity: 'medium',
        message: `Campaign "${campaign.name}" has low CTR: ${campaign.ctr.toFixed(2)}%`,
        metadata: {
          current_ctr: campaign.ctr,
          threshold: userThresholds.low_ctr,
        },
      });
    }

    // Check high CPC
    if (campaign.cpc && campaign.cpc > userThresholds.high_cpc) {
      alerts.push({
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        alert_type: 'high_costs',
        severity: 'medium',
        message: `Campaign "${campaign.name}" has high CPC: $${campaign.cpc.toFixed(2)}`,
        metadata: {
          current_cpc: campaign.cpc,
          threshold: userThresholds.high_cpc,
        },
      });
    }

    // Check campaign pause
    if (campaign.status === 'PAUSED') {
      alerts.push({
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        alert_type: 'campaign_paused',
        severity: 'low',
        message: `Campaign "${campaign.name}" is paused`,
        metadata: {
          reason: 'Campaign manually paused',
        },
      });
    }

    // Check high frequency
    if (campaign.frequency && campaign.frequency > userThresholds.frequency_cap) {
      alerts.push({
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        alert_type: 'high_frequency',
        severity: 'medium',
        message: `Campaign "${campaign.name}" has high frequency: ${campaign.frequency.toFixed(1)}`,
        metadata: {
          current_frequency: campaign.frequency,
          threshold: userThresholds.frequency_cap,
        },
      });
    }

    return alerts;
  }

  /**
   * Detect issues across all user campaigns
   */
  async detectCampaignIssues(userId: string): Promise<CampaignAlert[]> {
    try {
      // Get user's campaigns with latest metrics
      const { data: campaigns, error } = await this.supabase
        .from('campaigns')
        .select(`
          *,
          campaign_metrics!inner(
            impressions,
            clicks,
            ctr,
            cpc,
            cpm,
            spend,
            reach,
            frequency,
            conversions,
            is_latest
          )
        `)
        .eq('user_id', userId)
        .eq('campaign_metrics.is_latest', true);

      if (error) {
        console.error('Error fetching campaigns:', error);
        return [];
      }

      // Get user thresholds
      const thresholds = await this.getUserThresholds(userId);

      // Check each campaign for issues
      const allAlerts: CampaignAlert[] = [];
      for (const campaign of campaigns) {
        const campaignAlerts = await this.checkCampaignIssues(campaign, thresholds);
        allAlerts.push(...campaignAlerts);
      }

      // Store alerts in database
      if (allAlerts.length > 0) {
        await this.storeAlerts(allAlerts, userId);
      }

      return allAlerts;
    } catch (error) {
      console.error('Error detecting campaign issues:', error);
      return [];
    }
  }

  /**
   * Store alerts in the database
   */
  async storeAlerts(alerts: CampaignAlert[], userId: string): Promise<void> {
    try {
      const alertRecords = alerts.map(alert => ({
        user_id: userId,
        campaign_id: alert.campaign_id,
        campaign_name: alert.campaign_name,
        alert_type: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        metadata: alert.metadata,
        created_at: new Date().toISOString(),
      }));

      const { error } = await this.supabase
        .from('alerts')
        .insert(alertRecords);

      if (error) {
        console.error('Error storing alerts:', error);
      }
    } catch (error) {
      console.error('Error storing alerts:', error);
    }
  }

  /**
   * Get recent alerts for a user
   */
  async getRecentAlerts(userId: string, days: number = 30): Promise<CampaignAlert[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
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
}

// Create singleton instance
const alertDetector = new AlertDetector();

// Export convenience functions
export const detectCampaignIssues = (userId: string) => 
  alertDetector.detectCampaignIssues(userId);

export const getRecentAlerts = (userId: string, days?: number) => 
  alertDetector.getRecentAlerts(userId, days);

export const resolveAlert = (alertId: string, userId: string) => 
  alertDetector.resolveAlert(alertId, userId); 