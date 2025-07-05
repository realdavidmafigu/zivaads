import { FacebookAccount, FacebookCampaign, FacebookAdSet, FacebookAd } from '@/types';
import { FACEBOOK_OAUTH_CONFIG, FACEBOOK_LOGIN_CONFIG } from '@/config/facebook';

// Facebook Graph API base URL
const FACEBOOK_API_BASE = 'https://graph.facebook.com/v19.0';

// Facebook API error types
export interface FacebookApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

// Facebook API response types
export interface FacebookApiResponse<T> {
  data: T[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}

// Facebook API client class
export class FacebookApiClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // Generic API request method with error handling
  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${FACEBOOK_API_BASE}${endpoint}`);
    
    // Add access token to all requests
    url.searchParams.append('access_token', this.accessToken);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    try {
      console.log(`🔍 Making Facebook API request to: ${endpoint}`);
      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        const error = data as FacebookApiError;
        const errorMessage = `Facebook API Error: ${error.error.message} (Code: ${error.error.code})`;
        console.error(`❌ API Error for ${endpoint}:`, errorMessage);
        
        // Log additional error details for debugging
        if (error.error.error_subcode) {
          console.error(`   Subcode: ${error.error.error_subcode}`);
        }
        if (error.error.fbtrace_id) {
          console.error(`   FBTrace ID: ${error.error.fbtrace_id}`);
        }
        
        throw new Error(errorMessage);
      }

      // Log successful responses for insights endpoints
      if (endpoint.includes('/insights')) {
        console.log(`✅ API Success for ${endpoint}:`, {
          hasData: !!data.data,
          dataLength: data.data?.length || 0,
          firstRecord: data.data?.[0] ? {
            impressions: data.data[0].impressions,
            clicks: data.data[0].clicks,
            spend: data.data[0].spend
          } : null
        });
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        // Handle rate limiting
        if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          console.error(`⏰ Rate limit hit for ${endpoint}`);
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        // Handle permission errors
        if (error.message.includes('permission') || error.message.includes('access')) {
          console.error(`🚫 Permission error for ${endpoint}`);
          throw new Error('Insufficient permissions. Please check your Facebook app permissions.');
        }
        
        // Handle specific Facebook API errors
        if (error.message.includes('(#100)')) {
          console.error(`📊 No data available for ${endpoint} - campaign may have no activity`);
          throw new Error('No insights data available for this campaign');
        }
        
        if (error.message.includes('(#190)')) {
          console.error(`🔑 Invalid access token for ${endpoint}`);
          throw new Error('Invalid access token. Please reconnect your Facebook account.');
        }
        
        throw error;
      }
      throw new Error('An unexpected error occurred while communicating with Facebook API');
    }
  }

  // Get user's ad accounts
  async getAdAccounts(): Promise<FacebookAccount[]> {
    try {
      const response = await this.makeRequest<FacebookApiResponse<FacebookAccount>>('/me/adaccounts', {
        fields: 'id,account_name,name,account_status,currency,timezone_name,business_name,account_id,disable_reason,amount_spent,balance',
        limit: 100
      });

      // Process accounts and add payment status information
      const accounts = response.data.map(account => {
        const isDisabled = account.account_status !== 1;
        const hasPaymentIssue = this.detectPaymentIssue(account);
        
        return {
          ...account,
          is_active: account.account_status === 1,
          payment_status: hasPaymentIssue ? 'unsettled' as const : 'active' as const,
          disable_reason: account.disable_reason || null,
          amount_spent: account.amount_spent || 0,
          balance: account.balance || 0
        };
      });

      return accounts;
    } catch (error) {
      console.error('Error fetching ad accounts:', error);
      throw error;
    }
  }

  // Detect payment issues based on account status and disable reason
  private detectPaymentIssue(account: any): boolean {
    // Account status 2 = disabled, 3 = pending_risk_review, 7 = pending_settlement, 8 = disabled
    const disabledStatuses = [2, 3, 7, 8];
    
    if (disabledStatuses.includes(account.account_status)) {
      // Check if disable reason indicates payment issues
      const paymentRelatedReasons = [
        'UNSETTLED_PAYMENT',
        'PAYMENT_FAILED',
        'PAYMENT_METHOD_INVALID',
        'BALANCE_TOO_LOW',
        'PAYMENT_DECLINED',
        'BILLING_ISSUE'
      ];
      
      if (account.disable_reason && paymentRelatedReasons.some(reason => 
        account.disable_reason.toUpperCase().includes(reason)
      )) {
        return true;
      }
      
      // If account is disabled and has spent money, likely payment issue
      if (account.amount_spent > 0 && account.balance <= 0) {
        return true;
      }
    }
    
    return false;
  }

  // Get campaigns for a specific ad account
  async getCampaigns(adAccountId: string): Promise<FacebookCampaign[]> {
    try {
      const response = await this.makeRequest<FacebookApiResponse<FacebookCampaign>>(
        `/${adAccountId}/campaigns`,
        {
          fields: 'id,name,status,objective,created_time,start_time,stop_time,daily_budget,lifetime_budget,spend_cap,special_ad_categories',
          limit: 100
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  // Get ad sets for a specific campaign
  async getAdSets(campaignId: string): Promise<FacebookAdSet[]> {
    try {
      const response = await this.makeRequest<FacebookApiResponse<FacebookAdSet>>(
        `/${campaignId}/adsets`,
        {
          fields: 'id,name,status,created_time,start_time,end_time,daily_budget,lifetime_budget,targeting,optimization_goal,bid_amount',
          limit: 100
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching ad sets:', error);
      throw error;
    }
  }

  // Get ads for a specific ad set
  async getAds(adSetId: string): Promise<FacebookAd[]> {
    try {
      const response = await this.makeRequest<FacebookApiResponse<FacebookAd>>(
        `/${adSetId}/ads`,
        {
          fields: 'id,name,status,created_time,creative,adset_id,campaign_id',
          limit: 100
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching ads:', error);
      throw error;
    }
  }

  // Get campaign insights (performance metrics)
  async getCampaignInsights(campaignId: string, dateRange: string = 'last_30d'): Promise<any> {
    try {
      const fields = 'impressions,clicks,ctr,cpc,cpm,spend,reach,frequency,actions,action_values';
      
      // Strategy 1: Try with date_preset (most reliable for recent data)
      try {
        const response = await this.makeRequest<any>(
          `/${campaignId}/insights`,
          {
            fields,
            date_preset: 'last_30d',
            limit: 1
          }
        );
        
        if (response.data && response.data.length > 0 && this.hasValidInsightsData(response.data[0])) {
          console.log(`✅ Insights loaded for campaign ${campaignId} using date_preset`);
          return response.data[0];
        } else {
          console.log(`⚠️ Date preset returned empty data for campaign ${campaignId}`);
        }
      } catch (error) {
        console.log(`❌ Date preset approach failed for campaign ${campaignId}:`, error instanceof Error ? error.message : 'Unknown error');
      }

      // Strategy 2: Try with last 7 days (shorter period, more likely to have data)
      try {
        const response = await this.makeRequest<any>(
          `/${campaignId}/insights`,
          {
            fields,
            date_preset: 'last_7d',
            limit: 1
          }
        );
        
        if (response.data && response.data.length > 0 && this.hasValidInsightsData(response.data[0])) {
          console.log(`✅ Insights loaded for campaign ${campaignId} using last 7 days`);
          return response.data[0];
        } else {
          console.log(`⚠️ Last 7 days returned empty data for campaign ${campaignId}`);
        }
      } catch (error) {
        console.log(`❌ Last 7 days approach failed for campaign ${campaignId}:`, error instanceof Error ? error.message : 'Unknown error');
      }

      // Strategy 3: Try with last 90 days (longer period for older campaigns)
      try {
        const response = await this.makeRequest<any>(
          `/${campaignId}/insights`,
          {
            fields,
            date_preset: 'last_90d',
            limit: 1
          }
        );
        
        if (response.data && response.data.length > 0 && this.hasValidInsightsData(response.data[0])) {
          console.log(`✅ Insights loaded for campaign ${campaignId} using last 90 days`);
          return response.data[0];
        } else {
          console.log(`⚠️ Last 90 days returned empty data for campaign ${campaignId}`);
        }
      } catch (error) {
        console.log(`❌ Last 90 days approach failed for campaign ${campaignId}:`, error instanceof Error ? error.message : 'Unknown error');
      }

      // Strategy 4: Try without any date parameters (lifetime data)
      try {
        const response = await this.makeRequest<any>(
          `/${campaignId}/insights`,
          {
            fields,
            limit: 1
          }
        );
        
        if (response.data && response.data.length > 0 && this.hasValidInsightsData(response.data[0])) {
          console.log(`✅ Insights loaded for campaign ${campaignId} using lifetime data`);
          return response.data[0];
        } else {
          console.log(`⚠️ Lifetime data returned empty data for campaign ${campaignId}`);
        }
      } catch (error) {
        console.log(`❌ Lifetime data approach failed for campaign ${campaignId}:`, error instanceof Error ? error.message : 'Unknown error');
      }

      // Strategy 5: Try with custom date range (last 30 days)
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const response = await this.makeRequest<any>(
          `/${campaignId}/insights`,
          {
            fields,
            time_range: JSON.stringify({
              since: thirtyDaysAgo.toISOString().split('T')[0],
              until: 'today'
            }),
            limit: 1
          }
        );
        
        if (response.data && response.data.length > 0 && this.hasValidInsightsData(response.data[0])) {
          console.log(`✅ Insights loaded for campaign ${campaignId} using custom date range`);
          return response.data[0];
        } else {
          console.log(`⚠️ Custom date range returned empty data for campaign ${campaignId}`);
        }
      } catch (error) {
        console.log(`❌ Custom date range approach failed for campaign ${campaignId}:`, error instanceof Error ? error.message : 'Unknown error');
      }

      console.log(`All insights approaches failed for campaign ${campaignId}`);
      return null;
    } catch (error) {
      console.error('Error fetching campaign insights:', error);
      return null;
    }
  }

  // Helper method to check if insights data is valid
  private hasValidInsightsData(insights: any): boolean {
    if (!insights) return false;
    
    // Check if we have at least some basic metrics
    const hasImpressions = insights.impressions && Number(insights.impressions) > 0;
    const hasClicks = insights.clicks && Number(insights.clicks) > 0;
    const hasSpend = insights.spend && Number(insights.spend) > 0;
    
    // Return true if we have at least 2 out of 3 key metrics
    const validMetrics = [hasImpressions, hasClicks, hasSpend].filter(Boolean).length;
    return validMetrics >= 2;
  }

  // Get ad account insights
  async getAdAccountInsights(adAccountId: string, dateRange: string = 'last_30d'): Promise<any> {
    try {
      const response = await this.makeRequest<any>(
        `/${adAccountId}/insights`,
        {
          fields: 'impressions,clicks,ctr,cpc,cpm,spend,reach,frequency,actions,action_values',
          time_range: JSON.stringify({ since: dateRange, until: 'today' }),
          limit: 100
        }
      );

      return response.data?.[0] || null;
    } catch (error) {
      console.error('Error fetching ad account insights:', error);
      throw error;
    }
  }

  // Validate access token
  async validateToken(): Promise<boolean> {
    try {
      await this.makeRequest('/me');
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  // Get user profile information
  async getUserProfile(): Promise<{ id: string; name: string; email?: string }> {
    try {
      const response = await this.makeRequest<{ id: string; name: string; email?: string }>('/me', {
        fields: 'id,name,email'
      });

      return response;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
}

// Utility function to create Facebook API client
export function createFacebookClient(accessToken: string): FacebookApiClient {
  return new FacebookApiClient(accessToken);
}

// Generate Facebook OAuth URL for connection (with ad permissions)
export function generateFacebookOAuthUrl(): string {
  console.log('Generating OAuth URL with app ID:', FACEBOOK_OAUTH_CONFIG.appId);
  
  const params = new URLSearchParams({
    client_id: FACEBOOK_OAUTH_CONFIG.appId,
    redirect_uri: FACEBOOK_OAUTH_CONFIG.redirectUri,
    scope: FACEBOOK_OAUTH_CONFIG.scope,
    state: FACEBOOK_OAUTH_CONFIG.state,
    response_type: 'code'
  });

  const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  console.log('Generated OAuth URL:', oauthUrl);
  
  return oauthUrl;
}

// Generate Facebook OAuth URL for login (basic profile access only)
export function generateFacebookLoginUrl(): string {
  console.log('Generating Facebook Login OAuth URL with app ID:', FACEBOOK_LOGIN_CONFIG.appId);
  
  const params = new URLSearchParams({
    client_id: FACEBOOK_LOGIN_CONFIG.appId,
    redirect_uri: FACEBOOK_LOGIN_CONFIG.redirectUri,
    scope: FACEBOOK_LOGIN_CONFIG.scope,
    state: FACEBOOK_LOGIN_CONFIG.state,
    response_type: 'code'
  });

  const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  console.log('Generated Facebook Login OAuth URL:', oauthUrl);
  
  return oauthUrl;
}

// Exchange authorization code for access token (for connection)
export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const params = new URLSearchParams({
    client_id: FACEBOOK_OAUTH_CONFIG.appId,
    client_secret: FACEBOOK_OAUTH_CONFIG.appSecret,
    redirect_uri: FACEBOOK_OAUTH_CONFIG.redirectUri,
    code: code
  });

  const response = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to exchange code for access token');
  }

  return response.json();
}

// Exchange authorization code for access token (for login)
export async function exchangeLoginCodeForToken(code: string): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const params = new URLSearchParams({
    client_id: FACEBOOK_LOGIN_CONFIG.appId,
    client_secret: FACEBOOK_LOGIN_CONFIG.appSecret,
    redirect_uri: FACEBOOK_LOGIN_CONFIG.redirectUri,
    code: code
  });

  const response = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to exchange login code for access token');
  }

  return response.json();
} 