// User types
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
}

// Campaign types
export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'ended' | 'draft';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  startDate: string;
  endDate: string;
  facebookCampaignId?: string;
  targeting?: {
    locations?: string[];
    ageRange?: [number, number];
    interests?: string[];
  };
}

// Alert types
export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  campaignName?: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  userId: string;
}

// Performance evaluation types
export interface PerformanceMetrics {
  ctr: number;
  cpc: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface PerformanceEvaluation {
  emoji: string;
  message: string;
  status: 'excellent' | 'good' | 'average' | 'poor';
  suggestions: string[];
}

// Stats types
export interface DashboardStats {
  totalSpend: number;
  activeCampaigns: number;
  alertsToday: number;
  totalRevenue: number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
}

// Facebook integration types
export interface FacebookAccount {
  id: string;
  facebook_account_id: string;
  account_name: string;
  name?: string; // Facebook API might return 'name' instead of 'account_name'
  account_status: number;
  currency: string;
  timezone_name: string;
  business_name?: string;
  access_token?: string;
  permissions?: string[];
  is_active?: boolean;
  last_sync_at?: string;
  created_at?: string;
  updated_at?: string;
  // Payment and status fields
  disable_reason?: string | null;
  amount_spent?: number;
  balance?: number;
  payment_status?: 'active' | 'unsettled' | 'pending';
}

export interface FacebookCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  start_time?: string;
  stop_time?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  spend_cap?: number;
  special_ad_categories?: string[];
  // Performance metrics from insights (added by API)
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  spend?: number;
  reach?: number;
  frequency?: number;
  conversions?: number;
  // New fields for custom CPCs and click counts
  cpc_link?: number;
  cpc_whatsapp?: number;
  link_clicks?: number;
  whatsapp_clicks?: number;
  // Additional fields from API
  facebook_account_id?: string;
  account_name?: string;
  insights_loaded?: boolean;
  // Payment status (inherited from account)
  payment_status?: 'active' | 'unsettled' | 'pending';
}

export interface FacebookAdSet {
  id: string;
  name: string;
  status: string;
  created_time: string;
  start_time?: string;
  end_time?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  targeting?: any;
  optimization_goal?: string;
  bid_amount?: number;
}

export interface FacebookAd {
  id: string;
  name: string;
  status: string;
  created_time: string;
  creative?: any;
  adset_id: string;
  campaign_id: string;
}

export interface FacebookInsights {
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  reach: number;
  frequency: number;
  actions?: any[];
  action_values?: any[];
}

// Settings types
export interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    performanceAlerts: boolean;
  };
  currency: 'USD';
  timezone: string;
  language: 'en' | 'sn';
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current?: boolean;
} 