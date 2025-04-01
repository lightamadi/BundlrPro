import { NextApiRequest, NextApiResponse } from 'next';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import mongoose from 'mongoose';
import Preferences from '@/models/Preferences';

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

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) return;
    await mongoose.connect(process.env.MONGODB_URI!);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const shop = req.query.shop || req.cookies['shop'];
    const session = req.cookies['shopify_session'];

    if (!shop || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await connectDB();

    switch (req.method) {
      case 'GET':
        try {
          let preferences = await Preferences.findOne({ shopId: shop });
          
          if (!preferences) {
            // Create default preferences if none exist
            preferences = await Preferences.create({
              shopId: shop,
              bundle_display_location: 'product-form'
            });
          }

          return res.status(200).json(preferences);
        } catch (error) {
          console.error('Error fetching preferences:', error);
          return res.status(500).json({ error: 'Failed to fetch preferences' });
        }

      case 'POST':
        try {
          const { bundle_display_location } = req.body;

          if (!['product-form', 'product-description', 'product-sidebar'].includes(bundle_display_location)) {
            return res.status(400).json({ error: 'Invalid bundle display location' });
          }

          const preferences = await Preferences.findOneAndUpdate(
            { shopId: shop },
            { bundle_display_location },
            { new: true, upsert: true }
          );

          return res.status(200).json(preferences);
        } catch (error) {
          console.error('Error saving preferences:', error);
          return res.status(500).json({ error: 'Failed to save preferences' });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Preferences API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 