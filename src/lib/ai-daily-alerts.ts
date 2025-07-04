import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

export async function getRecentAIDailyAlerts(userId: string, limit: number = 10) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase
      .from('ai_daily_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('Error fetching AI daily alerts:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching AI daily alerts:', error);
    return [];
  }
} 