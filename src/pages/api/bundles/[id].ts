import { NextApiRequest, NextApiResponse } from 'next';
import Bundle from '../../../models/Bundle';
import dbConnect from '../../../lib/dbConnect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query: { id, shop } } = req;
  console.log('API Request:', { method, id, shop });

  if (!shop) {
    console.log('Missing shop parameter');
    return res.status(400).json({ error: 'Shop parameter is required' });
  }

  if (!id || typeof id !== 'string') {
    console.log('Invalid or missing bundle ID');
    return res.status(400).json({ error: 'Bundle ID is required' });
  }

  const shopDomain = Array.isArray(shop) ? shop[0] : shop;

  try {
    await dbConnect();
    console.log('Connected to MongoDB successfully');

    switch (method) {
      case 'GET':
        console.log('Fetching bundle:', { id, shopDomain });
        const bundle = await Bundle.findOne({
          _id: id,
          shopId: shopDomain
        });

        console.log('Bundle found:', bundle);

        if (!bundle) {
          console.log('Bundle not found');
          // Let's check if the bundle exists without the shopId condition
          const bundleWithoutShop = await Bundle.findById(id);
          console.log('Bundle without shop check:', bundleWithoutShop);
          return res.status(404).json({ error: 'Bundle not found' });
        }

        return res.status(200).json(bundle);

      case 'PATCH':
        const { name, description, products, discountRules, isActive } = req.body;

        const updateResult = await Bundle.findOneAndUpdate(
          { _id: id, shopId: shopDomain },
          {
            $set: {
              name,
              description,
              products,
              discountRules,
              isActive,
              updatedAt: new Date()
            }
          },
          { new: true }
        );

        if (!updateResult) {
          return res.status(404).json({ error: 'Bundle not found' });
        }

        return res.status(200).json(updateResult);

      case 'DELETE':
        const deleteResult = await Bundle.deleteOne({
          _id: id,
          shopId: shopDomain
        });

        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ error: 'Bundle not found' });
        }

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 