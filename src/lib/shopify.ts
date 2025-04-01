import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

const isDev = process.env.NODE_ENV === 'development';

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_APP_SCOPES!.split(','),
  hostName: process.env.HOST!,
  hostScheme: 'https',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  isCustomStoreApp: false,
  logger: {
    log: isDev ? console.log : () => {},
    warn: console.warn,
    error: console.error,
    debug: isDev ? console.debug : () => {},
  },
});

export default shopify;

// Helper function to verify session token
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const session = await shopify.session.decodeSessionToken(token);
    return Boolean(session);
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

// Helper function to get offline session
export async function getOfflineSession(shop: string) {
  const sessionId = shopify.session.getOfflineId(shop);
  return await shopify.session.loadOffline(shop);
}

// Helper function to get online session
export async function getOnlineSession(shop: string, accessToken: string) {
  return new shopify.session.Session({
    id: '',
    shop,
    state: '',
    isOnline: true,
    accessToken,
  });
} 