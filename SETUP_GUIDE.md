# ZivaAds Setup Guide

## 🚀 Quick Setup

Your ZivaAds dashboard is ready, but you need to configure Supabase to enable authentication and database functionality.

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Node.js**: Version 16 or higher
3. **Git**: For version control

## 🔧 Configuration Steps

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `zivaads` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to Zimbabwe (e.g., Europe West)
5. Click "Create new project"
6. Wait for project to be created (2-3 minutes)

### Step 2: Get API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

### Step 3: Configure Environment Variables

1. In your project root directory, create a file named `.env.local`
2. Add the following content (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.example
```

### Step 4: Restart Development Server

1. Stop the current server (Ctrl+C)
2. Run: `npm run dev`
3. Visit: `http://localhost:3000`

## 🎯 What You'll See

After configuration, you'll have access to:

- **Home Page** (`/`) - Redirects to dashboard or login
- **Login Page** (`/login`) - Authentication with Google OAuth
- **Dashboard** (`/dashboard`) - Main dashboard with stats
- **Campaigns** (`/campaigns`) - Campaign management
- **Alerts** (`/alerts`) - Alert management
- **Settings** (`/settings`) - User settings

## 🔐 Authentication Features

- **Email/Password**: Traditional login
- **Google OAuth**: One-click Google sign-in
- **Session Management**: Automatic session refresh
- **Protected Routes**: Middleware-based security

## 📊 Database Schema

The application will automatically create the following tables:

```sql
-- Users table (handled by Supabase Auth)
-- Campaigns table
-- Alerts table
-- User settings table
```

## 🚨 Troubleshooting

### "Configuration Required" Error
- Ensure `.env.local` file exists in project root
- Check that environment variables are correctly set
- Restart the development server

### "Supabase client error"
- Verify your Supabase project URL and key
- Check that your Supabase project is active
- Ensure you're using the correct API keys

### "404 Not Found"
- Make sure all environment variables are set
- Check that the development server is running
- Clear browser cache and try again

## 📱 Features Overview

### Dashboard
- Welcome message with user's name
- Quick stats (Total Spend, Active Campaigns, Alerts Today)
- Recent alerts list
- Facebook connection CTA
- Local Zimbabwean business insights

### Campaigns
- Campaign cards with performance metrics
- Emoji-based performance indicators
- Budget progress tracking
- Campaign status management

### Alerts
- Comprehensive alert management
- Different alert types (warning, error, success, info)
- Severity-based filtering
- Action buttons for each alert

### Settings
- Profile information management
- Notification preferences
- Connected accounts
- Security settings

## 🌍 Zimbabwean Business Context

The application is specifically designed for the Zimbabwean market:

- **Currency**: USD (stable for ad spend)
- **Local Examples**: Harare, Bulawayo market insights
- **Business Context**: Local business promotion examples
- **Market Opportunities**: Zimbabwean market growth indicators

## 🎉 Next Steps

1. **Test Authentication**: Try logging in with Google OAuth
2. **Explore Dashboard**: Navigate through all sections
3. **Connect Facebook**: Set up Facebook Business account integration
4. **Customize Settings**: Configure your preferences
5. **Add Campaigns**: Start managing your Facebook ads

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify your Supabase configuration
3. Ensure all environment variables are set correctly
4. Restart the development server

Your ZivaAds dashboard is now ready to help you manage Facebook advertising campaigns for the Zimbabwean market! 🚀 