// For local testing, use the fallback values directly
// In production, these will be overridden by Vercel environment variables
const url = 'https://yhcmazbibgwmvazuxgcl.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloY21hemJpYmd3bXZhenV4Z2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzUwMjEsImV4cCI6MjA2Njk1MTAyMX0.mp7OU9BwFA6ww2loJqkmgBMIioQD_K6t54y2diBV380';

console.log('[CONFIG] SUPABASE_URL:', url);
console.log('[CONFIG] SUPABASE_ANON_KEY:', key);

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = key;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'; 