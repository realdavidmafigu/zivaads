import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavigationBar from '@/components/NavigationBar';
import MobileNav from '@/components/MobileNav';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/supabase';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if Supabase environment variables are configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    redirect('/');
  }

  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <NavigationBar user={user} />
      
      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
} 