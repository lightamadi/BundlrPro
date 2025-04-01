import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { DeliveryMethod } from '@shopify/shopify-api';

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
  adminApiAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  billing: undefined,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/api/webhooks',
    },
  },
});

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();

    // Add CORS headers for Shopify
    response.headers.set('Access-Control-Allow-Origin', 'https://*.myshopify.com');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');

    // Comprehensive CSP for Shopify embedded app
    response.headers.set('Content-Security-Policy', `
      frame-ancestors https://*.myshopify.com https://admin.shopify.com https://accounts.shopify.com;
      default-src 'self' https://*.myshopify.com https://admin.shopify.com https://accounts.shopify.com https://cdn.shopify.com;
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.myshopify.com https://admin.shopify.com https://cdn.shopify.com;
      style-src 'self' 'unsafe-inline' https://*.myshopify.com https://admin.shopify.com https://cdn.shopify.com;
      img-src 'self' data: blob: https://*.myshopify.com https://admin.shopify.com https://cdn.shopify.com;
      connect-src 'self' https://*.myshopify.com https://admin.shopify.com https://accounts.shopify.com https://cdn.shopify.com wss://*.shopify.com;
      font-src 'self' https://*.myshopify.com https://admin.shopify.com https://cdn.shopify.com;
      media-src 'self' https://*.myshopify.com https://admin.shopify.com https://cdn.shopify.com;
      object-src 'none';
      frame-src https://*.myshopify.com https://admin.shopify.com https://accounts.shopify.com;
    `.replace(/\s+/g, ' ').trim());

    // Handle OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }

    // Skip auth for API routes and auth callback
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return response;
    }

    const shop = request.nextUrl.searchParams.get('shop');
    const host = request.nextUrl.searchParams.get('host');
    const shopifyCookie = request.cookies.get('shopify_session');

    // If we have a valid session cookie, allow the request
    if (shopifyCookie) {
      return response;
    }

    // If we're not in the Shopify admin context, redirect to Shopify admin
    if (!shop || !host) {
      return NextResponse.redirect(
        `https://admin.shopify.com/store/${process.env.SHOPIFY_HOST}/apps/bundlrpro-dev`
      );
    }

    // Generate state parameter
    const state = generateNonce();
    
    // Begin auth process
    const redirectUri = `https://${request.headers.get('host')}/api/auth/callback`;
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_APP_SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    const authResponse = NextResponse.redirect(authUrl);
    
    // Set state cookie with proper attributes
    authResponse.cookies.set('shopify_oauth_state', state, {
      secure: true,
      sameSite: 'none',
      path: '/',
      httpOnly: true,
      maxAge: 60 * 5 // 5 minutes
    });
    
    return authResponse;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// Generate a random nonce for OAuth state parameter
function generateNonce() {
  return Math.random().toString(36).substring(2, 15);
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)',
  ],
}; 