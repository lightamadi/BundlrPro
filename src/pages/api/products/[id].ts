import { NextApiRequest, NextApiResponse } from 'next';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

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
    const { id } = req.query;
    const shop = req.query.shop || req.cookies['shop'];
    const session = req.cookies['shopify_session'];

    if (!shop || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Fetch product details from Shopify
    const response = await fetch(`https://${shop}/admin/api/${LATEST_API_VERSION}/products/${id}.json`, {
      headers: {
        'X-Shopify-Access-Token': session,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Shopify API error:', error);
      return res.status(response.status).json({ error: 'Failed to fetch product details' });
    }

    const product = await response.json();
    return res.status(200).json(product.product);
  } catch (error) {
    console.error('Product API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 