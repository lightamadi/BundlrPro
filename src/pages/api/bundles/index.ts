import { NextApiRequest, NextApiResponse } from 'next';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import Bundle from '../../../models/Bundle';
import dbConnect from '../../../lib/dbConnect';
import mongoose from 'mongoose';

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
    // Get the shop from query parameters or cookies
    const shop = req.query.shop || req.cookies['shop'];
    const session = req.cookies['shopify_session'];

    if (!shop || !session) {
      console.error('Missing shop or session:', { shop, session });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Connect to database
    try {
      await dbConnect();
      console.log('Successfully connected to MongoDB');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        try {
          // Get all active bundles for the current shop
          const bundles = await Bundle.find({ 
            shopId: shop,
            isActive: true,
            $and: [
              {
                $or: [
                  { validFrom: { $exists: false } },
                  { validFrom: { $lte: new Date() } }
                ]
              },
              {
                $or: [
                  { validTo: { $exists: false } },
                  { validTo: { $gte: new Date() } }
                ]
              }
            ]
          })
          .sort({ createdAt: -1 })
          .exec();

          return res.status(200).json(bundles);
        } catch (error) {
          console.error('Error fetching bundles:', error);
          return res.status(500).json({ error: 'Failed to fetch bundles' });
        }

      case 'POST':
        try {
          // Log the request body for debugging
          console.log('Creating bundle with data:', req.body);

          // Validate bundle data
          const { name, products, discountRules } = req.body;
          
          if (!name || !products?.length || !discountRules?.length) {
            console.error('Missing required fields:', { name, products, discountRules });
            return res.status(400).json({ 
              error: 'Missing required fields: name, products, or discountRules' 
            });
          }

          // Validate products array
          if (!Array.isArray(products)) {
            console.error('Products must be an array:', products);
            return res.status(400).json({ error: 'Products must be an array' });
          }

          // Validate each product
          for (const product of products) {
            if (!product.productId || !product.variantId || !product.quantity) {
              console.error('Invalid product data:', product);
              return res.status(400).json({ 
                error: 'Invalid product data. Each product must have productId, variantId, and quantity.' 
              });
            }
          }

          // Validate discount rules
          if (!Array.isArray(discountRules)) {
            console.error('Discount rules must be an array:', discountRules);
            return res.status(400).json({ error: 'Discount rules must be an array' });
          }

          // Validate each discount rule
          for (const rule of discountRules) {
            if (!rule.type || !rule.value) {
              console.error('Invalid discount rule:', rule);
              return res.status(400).json({ 
                error: 'Invalid discount rule. Each rule must have type and value.' 
              });
            }

            // Validate rule type
            if (!['percentage', 'fixed', 'bxgy', 'tiered'].includes(rule.type)) {
              console.error('Invalid discount rule type:', rule.type);
              return res.status(400).json({ 
                error: 'Invalid discount rule type. Must be one of: percentage, fixed, bxgy, tiered.' 
              });
            }

            // Validate rule value
            if (typeof rule.value !== 'number' || rule.value < 0) {
              console.error('Invalid discount rule value:', rule.value);
              return res.status(400).json({ 
                error: 'Invalid discount rule value. Must be a non-negative number.' 
              });
            }

            // Validate additional properties based on type
            if (rule.type === 'bxgy' && (!rule.minQuantity || !rule.freeQuantity)) {
              console.error('Invalid bxgy rule:', rule);
              return res.status(400).json({ 
                error: 'Buy X Get Y rules must have minQuantity and freeQuantity.' 
              });
            }

            if (rule.type === 'tiered' && (!rule.tiers || !Array.isArray(rule.tiers))) {
              console.error('Invalid tiered rule:', rule);
              return res.status(400).json({ 
                error: 'Tiered rules must have a tiers array.' 
              });
            }
          }

          // Create a new bundle
          const newBundle = await Bundle.create({
            name,
            description: req.body.description || '',
            products,
            discountRules,
            shopId: shop,
            isActive: true,
            displaySettings: {
              showOnProduct: true,
              showOnCollection: true,
              showInCart: true,
              showOnBundlePage: true
            }
          });

          console.log('Successfully created bundle:', newBundle);
          return res.status(201).json(newBundle);
        } catch (error) {
          console.error('Error creating bundle:', error);
          if (error instanceof mongoose.Error.ValidationError) {
            const validationErrors = Object.values(error.errors).map((err) => {
              if (err instanceof mongoose.Error.ValidatorError) {
                return err.message;
              }
              return 'Invalid field value';
            });
            return res.status(400).json({ 
              error: 'Validation error', 
              details: validationErrors
            });
          }
          return res.status(500).json({ error: 'Failed to create bundle' });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Bundles API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 