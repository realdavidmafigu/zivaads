-- ZivaAds Supabase Database Schema (So Far)

-- 1. users
-- Extends Supabase Auth users
create table if not exists users (
  id uuid primary key references auth.users(id),
  full_name text,
  email text,
  created_at timestamp with time zone default now()
);

-- 2. ad_accounts
-- Stores Facebook ad account info after OAuth connection
create table if not exists ad_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  fb_account_id text not null,
  account_name text,
  account_status text,
  access_token text, -- encrypt this if needed
  connected_at timestamp with time zone default now()
);

-- 3. Optional: tokens
-- If you want to separately manage/refresh user-wide tokens (not per ad account)
create table if not exists tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  fb_user_id text,
  access_token text,
  refresh_token text,
  expires_at timestamp,
  created_at timestamp with time zone default now()
); 