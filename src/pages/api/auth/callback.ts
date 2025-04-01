import { NextApiRequest, NextApiResponse } from 'next';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { Session } from '@shopify/shopify-api';

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_APP_SCOPES?.split(',') || [],
  hostName: process.env.HOST!,
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  hostScheme: 'https',
  isPrivateApp: false,
  userAgentPrefix: 'BundlrPro',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { shop, code, state, host } = req.query;

    if (!shop || Array.isArray(shop)) {
      return res.status(400).json({ error: 'Invalid shop parameter' });
    }

    const codeParam = Array.isArray(code) ? code[0] : code || '';
    const stateParam = Array.isArray(state) ? state[0] : state || '';
    const hostParam = Array.isArray(host) ? host[0] : host || '';

    // Verify state parameter
    const storedState = req.cookies.shopify_oauth_state;
    if (!storedState || storedState !== stateParam) {
      console.error('State parameter mismatch:', { 
        storedState, 
        stateParam,
        cookies: req.cookies 
      });
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    // Exchange the code for an access token
    const accessTokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code: codeParam,
      }),
    });

    if (!accessTokenResponse.ok) {
      const errorText = await accessTokenResponse.text();
      console.error('Access token error:', errorText);
      return res.status(500).json({ error: 'Failed to get access token' });
    }

    const { access_token } = await accessTokenResponse.json();

    // Create a session
    const session = new Session({
      id: `${shop}_${Date.now()}`,
      shop,
      state: stateParam,
      isOnline: true,
      accessToken: access_token,
      scope: process.env.SHOPIFY_APP_SCOPES || '',
    });

    // Cookie options for cross-site context
    const cookieOptions = {
      secure: true,
      sameSite: 'none' as const,
      path: '/',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };

    // Set cookies with proper attributes
    res.setHeader('Set-Cookie', [
      `shopify_session=${session.id}; ${Object.entries(cookieOptions)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')}`,
      `shop=${shop}; ${Object.entries(cookieOptions)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')}`,
      `shopify_oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT` // Clear state cookie
    ]);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://*.myshopify.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Redirect back to app with host parameter
    const redirectUrl = `/?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(hostParam)}`;
    console.log('Redirecting to:', redirectUrl);
    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
} 