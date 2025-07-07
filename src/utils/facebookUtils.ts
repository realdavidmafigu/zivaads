import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase';

// Browser client for client-side operations
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user has connected Facebook accounts
export async function hasFacebookConnection(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('facebook_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('Error checking Facebook connection:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error in hasFacebookConnection:', error);
    return false;
  }
}

// Get user's Facebook accounts
export async function getUserFacebookAccounts(userId: string) {
  try {
    const { data, error } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Facebook accounts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserFacebookAccounts:', error);
    return [];
  }
}

// Check if Facebook access token is expired
export function isTokenExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return false;
  return new Date(tokenExpiresAt) < new Date();
}

// Format Facebook currency for display
export function formatFacebookCurrency(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
}

// Format Facebook metrics for display
export function formatFacebookMetric(value: number, metric: string): string {
  switch (metric) {
    case 'impressions':
    case 'clicks':
    case 'reach':
      return value.toLocaleString();
    case 'ctr':
      return `${(value * 100).toFixed(2)}%`;
    case 'cpc':
    case 'cpm':
    case 'spend':
      return formatFacebookCurrency(value);
    case 'frequency':
      return value.toFixed(2);
    default:
      return value.toString();
  }
}

// Get campaign status color
export function getCampaignStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'deleted':
      return 'bg-red-100 text-red-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Get campaign status emoji
export function getCampaignStatusEmoji(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return '🟢';
    case 'paused':
      return '🟡';
    case 'deleted':
      return '🔴';
    case 'archived':
      return '⚫';
    default:
      return '⚪';
  }
}

// Calculate campaign performance score
export function calculatePerformanceScore(ctr: number, cpc: number, spend: number): number {
  // Simple scoring algorithm - can be enhanced
  let score = 0;
  
  // CTR scoring (0-40 points)
  if (ctr >= 0.05) score += 40; // 5%+ CTR
  else if (ctr >= 0.03) score += 30; // 3-5% CTR
  else if (ctr >= 0.02) score += 20; // 2-3% CTR
  else if (ctr >= 0.01) score += 10; // 1-2% CTR
  
  // CPC scoring (0-30 points)
  if (cpc <= 1.0) score += 30; // $1 or less
  else if (cpc <= 2.0) score += 20; // $1-2
  else if (cpc <= 3.0) score += 10; // $2-3
  
  // Spend efficiency scoring (0-30 points)
  if (spend > 0) {
    const efficiency = (ctr * 100) / cpc; // CTR per dollar spent
    if (efficiency >= 5) score += 30;
    else if (efficiency >= 3) score += 20;
    else if (efficiency >= 1) score += 10;
  }
  
  return Math.min(score, 100);
}

// Get performance evaluation based on score
export function getPerformanceEvaluation(score: number): {
  emoji: string;
  status: 'excellent' | 'good' | 'average' | 'poor';
  message: string;
} {
  if (score >= 80) {
    return {
      emoji: '😄',
      status: 'excellent',
      message: 'Excellent performance! Your campaign is performing very well.'
    };
  } else if (score >= 60) {
    return {
      emoji: '🙂',
      status: 'good',
      message: 'Good performance! Your campaign is doing well with room for improvement.'
    };
  } else if (score >= 40) {
    return {
      emoji: '😐',
      status: 'average',
      message: 'Average performance. Consider optimizing your targeting or creative.'
    };
  } else {
    return {
      emoji: '😞',
      status: 'poor',
      message: 'Poor performance. Your campaign needs immediate attention and optimization.'
    };
  }
}

// Generate performance suggestions
export function generatePerformanceSuggestions(
  ctr: number,
  cpc: number,
  spend: number,
  status: string
): string[] {
  const suggestions: string[] = [];
  
  if (status.toLowerCase() === 'paused') {
    suggestions.push('Consider reactivating your campaign with optimized settings');
  }
  
  if (ctr < 0.02) {
    suggestions.push('Improve your ad creative to increase click-through rate');
    suggestions.push('Review your targeting to ensure you\'re reaching the right audience');
  }
  
  if (cpc > 3.0) {
    suggestions.push('Optimize your bidding strategy to reduce cost per click');
    suggestions.push('Consider using automatic bidding to let Facebook optimize for you');
  }
  
  if (spend > 0 && (ctr * 100) / cpc < 2) {
    suggestions.push('Focus on improving conversion rate to get better ROI');
    suggestions.push('Review your landing page to ensure it matches your ad messaging');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Your campaign is performing well! Keep monitoring for opportunities to scale.');
  }
  
  return suggestions;
} 