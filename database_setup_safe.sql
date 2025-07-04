-- Safe Database Setup Script for ZivaAds
-- Run this in your Supabase SQL Editor
-- This script handles existing objects gracefully

-- 1. Create users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create facebook_accounts table
CREATE TABLE IF NOT EXISTS facebook_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facebook_account_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_status INTEGER,
  currency TEXT,
  timezone_name TEXT,
  business_name TEXT,
  permissions TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, facebook_account_id)
);

-- 3. Create indexes for better performance (ignore if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_facebook_accounts_user_id') THEN
    CREATE INDEX idx_facebook_accounts_user_id ON facebook_accounts(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_facebook_accounts_account_id') THEN
    CREATE INDEX idx_facebook_accounts_account_id ON facebook_accounts(facebook_account_id);
  END IF;
END $$;

-- 4. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_accounts ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for users table (ignore if exists)
DO $$ 
BEGIN
  -- Users can view own profile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
  END IF;
  
  -- Users can update own profile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
  END IF;
  
  -- Users can insert own profile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 6. Create RLS policies for facebook_accounts table (ignore if exists)
DO $$ 
BEGIN
  -- Users can view own facebook accounts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'facebook_accounts' AND policyname = 'Users can view own facebook accounts') THEN
    CREATE POLICY "Users can view own facebook accounts" ON facebook_accounts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  -- Users can insert own facebook accounts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'facebook_accounts' AND policyname = 'Users can insert own facebook accounts') THEN
    CREATE POLICY "Users can insert own facebook accounts" ON facebook_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Users can update own facebook accounts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'facebook_accounts' AND policyname = 'Users can update own facebook accounts') THEN
    CREATE POLICY "Users can update own facebook accounts" ON facebook_accounts FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  -- Users can delete own facebook accounts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'facebook_accounts' AND policyname = 'Users can delete own facebook accounts') THEN
    CREATE POLICY "Users can delete own facebook accounts" ON facebook_accounts FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7. Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to call the function on user signup (drop if exists first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for updated_at on facebook_accounts (drop if exists first)
DROP TRIGGER IF EXISTS update_facebook_accounts_updated_at ON facebook_accounts;
CREATE TRIGGER update_facebook_accounts_updated_at
  BEFORE UPDATE ON facebook_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert existing auth users into users table (if any exist)
INSERT INTO users (id, email, full_name, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;

-- 12. Show summary of what was created
SELECT 'Database setup completed successfully!' as status; 