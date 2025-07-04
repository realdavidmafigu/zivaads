# ZivaAds

ZivaAds is a Facebook ad campaign dashboard app designed for African business owners, marketers, and entrepreneurs. It simplifies technical ad metrics and provides AI-generated insights to help you understand and optimize your Facebook ad campaigns.

## Features
- Connect your Facebook Ad Account
- View and analyze campaign performance
- Receive AI-generated, plain-language insights
- Alerts for important campaign events
- Secure authentication and user management

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/realdavidmafigu/zivaads.git
cd zivaads
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Copy the example environment file and fill in your credentials:
```bash
cp env-template.txt .env.local
```
Edit `.env.local` and provide your OpenAI API key, Supabase keys, and Facebook credentials.

### 4. Run the development server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to use the app.

## Environment Variables
See `env-template.txt` for all required variables. Example:
```
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

## Deployment
You can deploy ZivaAds to Vercel, Netlify, or any platform that supports Next.js. Make sure to set all environment variables in your deployment settings.

## License
MIT

---

For questions or support, open an issue on the [GitHub repository](https://github.com/realdavidmafigu/zivaads).
