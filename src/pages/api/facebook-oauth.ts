import type { NextApiRequest, NextApiResponse } from 'next';

const FB_APP_ID = '23888913750768123';
const FB_APP_SECRET = 'a06d215cccb10c17608a2c4abe96b191';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { code, redirect_uri } = req.body;
  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing code or redirect_uri' });
  }
  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${FB_APP_SECRET}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error.message });
    }
    return res.status(200).json({ access_token: tokenData.access_token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
} 