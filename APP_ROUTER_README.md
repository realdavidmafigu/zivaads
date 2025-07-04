# ZivaAds App Router Structure

This document describes the new App Router structure for ZivaAds, which provides better performance, improved SEO, and enhanced user experience.

## 🏗️ Architecture Overview

The application now uses Next.js 14 App Router with the following structure:

```
src/
├── app/                    # App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (redirects to dashboard/login)
│   ├── globals.css        # Global styles
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── layout.tsx     # Dashboard layout with navigation
│   │   └── page.tsx       # Main dashboard page
│   ├── campaigns/         # Campaigns management
│   │   └── page.tsx       # Campaigns page
│   ├── alerts/            # Alerts management
│   │   └── page.tsx       # Alerts page
│   ├── settings/          # User settings
│   │   └── page.tsx       # Settings page
│   ├── login/             # Authentication
│   │   └── page.tsx       # Login page
│   └── auth/              # Auth callbacks
│       └── callback/      # OAuth callback handling
│           └── route.ts   # Auth callback route
├── components/            # Reusable components
│   ├── NavigationBar.tsx  # Top navigation
│   ├── MobileNav.tsx      # Mobile bottom navigation
│   ├── StatsCard.tsx      # Stats display component
│   └── AlertsList.tsx     # Alerts display component
├── types/                 # TypeScript type definitions
│   └── index.ts           # Application types
├── utils/                 # Utility functions
│   └── performanceEvaluator.ts  # Performance analysis
└── config/                # Configuration files
    └── supabase.ts        # Supabase configuration
```

## 🔐 Authentication & Middleware

### Middleware Protection
- `middleware.ts` protects all dashboard routes
- Automatic session refresh and validation
- Redirects unauthenticated users to login
- Redirects authenticated users away from auth pages

### Authentication Flow
1. User visits protected route
2. Middleware checks session
3. If no session → redirect to `/login`
4. After login → redirect to original destination
5. OAuth callbacks handled in `/auth/callback`

## 🎨 Components

### NavigationBar
- Top navigation with ZivaAds logo
- User avatar and email display
- Logout functionality
- Mobile hamburger menu
- Desktop navigation links

### MobileNav
- Bottom mobile navigation
- Dashboard, Campaigns, Alerts, Settings
- Active state indicators
- Responsive design

### StatsCard
- Reusable stats display component
- Supports icons, colors, and change indicators
- Loading states and formatting
- Zimbabwean business context (USD currency)

### AlertsList
- Displays recent alerts
- Different alert types (warning, error, success, info)
- Time formatting and severity indicators
- Empty states and loading states

## 📊 Dashboard Features

### Main Dashboard (`/dashboard`)
- Welcome message with user's name
- Quick stats cards (Total Spend, Active Campaigns, Alerts Today, Total Revenue)
- Recent alerts list
- Facebook connection CTA
- Quick actions panel
- Local insights for Zimbabwean market

### Campaigns Page (`/campaigns`)
- Campaign cards with performance metrics
- Emoji-based performance indicators
- Budget progress bars
- Campaign status management
- Empty state for new users

### Alerts Page (`/alerts`)
- Comprehensive alerts management
- Alert statistics overview
- Severity-based filtering
- Resolved vs active alerts
- Action buttons for each alert

### Settings Page (`/settings`)
- Profile information management
- Notification preferences
- Connected accounts (Facebook, Google Analytics)
- Security settings
- Two-factor authentication

## 🌍 Zimbabwean Business Context

The application is specifically designed for the Zimbabwean market:

- **Currency**: USD (stable for ad spend)
- **Local Examples**: Harare, Bulawayo market insights
- **Business Context**: Local business promotion examples
- **Market Opportunities**: Zimbabwean market growth indicators

## 🚀 Performance Features

### Server-Side Rendering
- All pages use Server Components by default
- Improved SEO and initial page load
- Better caching and performance

### Client-Side Interactivity
- Interactive components marked with `'use client'`
- Smooth navigation and state management
- Real-time updates where needed

### Loading States
- Skeleton loading for all components
- Progressive enhancement
- Graceful degradation

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Integration
- Uses latest `@supabase/ssr` package
- Server and client-side authentication
- Automatic session management
- OAuth provider support

## 📱 Responsive Design

- Mobile-first approach
- Bottom navigation for mobile
- Desktop navigation for larger screens
- Responsive grid layouts
- Touch-friendly interactions

## 🎯 Key Benefits

1. **Better Performance**: Server Components reduce client-side JavaScript
2. **Improved SEO**: Server-side rendering for better search engine visibility
3. **Enhanced UX**: Faster page loads and smoother navigation
4. **Better Security**: Middleware-based route protection
5. **Scalability**: App Router architecture for better code organization
6. **Type Safety**: Comprehensive TypeScript types
7. **Local Focus**: Zimbabwean business context and examples

## 🚀 Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables
3. Run development server: `npm run dev`
4. Access the application at `http://localhost:3000`

## 📝 Migration Notes

- Old Pages Router files are preserved in `/src/pages/`
- New App Router structure is in `/src/app/`
- Middleware automatically handles route protection
- All components are now TypeScript-based
- Improved error handling and loading states

## 🔮 Future Enhancements

- Real-time campaign monitoring
- Advanced analytics dashboard
- Multi-language support (English/Shona)
- Mobile app development
- Advanced Facebook API integration
- Automated campaign optimization 