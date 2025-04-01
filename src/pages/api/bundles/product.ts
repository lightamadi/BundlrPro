import { NextApiRequest, NextApiResponse } from 'next';
import Bundle from '../../../models/Bundle';
import dbConnect from '../../../lib/dbConnect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query: { shop, productId } } = req;
  console.log('Product bundles API called with:', { method, shop, productId });

  if (!shop) {
    console.log('Missing shop parameter');
    return res.status(400).json({ error: 'Shop parameter is required' });
  }

  if (!productId) {
    console.log('Missing productId parameter');
    return res.status(400).json({ error: 'Product ID is required' });
  }

  const shopDomain = Array.isArray(shop) ? shop[0] : shop;
  console.log('Processing request for shop:', shopDomain);

  try {
    await dbConnect();
    console.log('Connected to MongoDB successfully');

    switch (method) {
      case 'GET':
        console.log('Fetching bundles for product:', productId);
        // Find all active bundles that contain this product
        const bundles = await Bundle.find({
          shopId: shopDomain,
          isActive: true,
          'products.productId': productId
        });
        console.log('Found bundles:', bundles);

        return res.status(200).json(bundles);

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 