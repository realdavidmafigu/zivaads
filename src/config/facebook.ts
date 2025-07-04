export const FACEBOOK_APP_ID = '23888913750768123';
export const FACEBOOK_APP_SECRET = 'a06d215cccb10c17608a2c4abe96b191';
export const FACEBOOK_APP_URL = 'http://localhost:3000';

export const FACEBOOK_OAUTH_CONFIG = {
  appId: FACEBOOK_APP_ID,
  appSecret: FACEBOOK_APP_SECRET,
  redirectUri: `${FACEBOOK_APP_URL}/api/facebook/connect`,
  scope: 'ads_management,ads_read,business_management,read_insights,pages_manage_ads,pages_read_engagement,whatsapp_business_manage_events',
  state: 'zivaads_facebook_connect',
};

// Facebook Login OAuth configuration (basic profile access only)
export const FACEBOOK_LOGIN_CONFIG = {
  appId: FACEBOOK_APP_ID,
  appSecret: FACEBOOK_APP_SECRET,
  redirectUri: `${FACEBOOK_APP_URL}/api/facebook/login`,
  scope: 'email,public_profile',
  state: 'zivaads_facebook_login',
}; 