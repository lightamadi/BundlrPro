import { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhook } from '@shopify/shopify-api/auth';
import Bundle from '../../../../models/Bundle';
import dbConnect from '../../../../lib/dbConnect';

interface OrderItem {
  variant_id: string;
  quantity: number;
  price: string;
  properties: Array<{
    name: string;
    value: string;
  }>;
}

interface Order {
  id: string;
  line_items: OrderItem[];
  total_price: string;
  shop_id: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify webhook authenticity
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const shop = req.headers['x-shopify-shop-domain'];

    if (!hmac || !topic || !shop || topic !== 'orders/create') {
      return res.status(401).json({ message: 'Invalid webhook' });
    }

    const isValid = await verifyWebhook(
      JSON.stringify(req.body),
      hmac as string,
      process.env.SHOPIFY_API_SECRET as string
    );

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    await dbConnect();

    const order: Order = req.body;
    const bundleItems = order.line_items.filter(item =>
      item.properties.some(prop => prop.name === '_bundle_id')
    );

    if (bundleItems.length === 0) {
      return res.status(200).json({ message: 'No bundles in order' });
    }

    // Group items by bundle
    const bundleGroups = bundleItems.reduce((groups, item) => {
      const bundleId = item.properties.find(prop => prop.name === '_bundle_id')?.value;
      if (!bundleId) return groups;

      if (!groups[bundleId]) {
        groups[bundleId] = [];
      }
      groups[bundleId].push(item);
      return groups;
    }, {} as { [key: string]: OrderItem[] });

    // Process each bundle
    for (const [bundleId, items] of Object.entries(bundleGroups)) {
      const bundle = await Bundle.findById(bundleId);
      if (!bundle) continue;

      // Update bundle analytics
      await Bundle.findByIdAndUpdate(bundleId, {
        $inc: {
          'analytics.totalOrders': 1,
          'analytics.totalRevenue': items.reduce(
            (sum, item) => sum + parseFloat(item.price) * item.quantity,
            0
          )
        },
        $push: {
          'analytics.orders': {
            orderId: order.id,
            items: items.map(item => ({
              variantId: item.variant_id,
              quantity: item.quantity,
              price: item.price
            })),
            createdAt: new Date()
          }
        }
      });
    }

    res.status(200).json({ message: 'Order processed successfully' });
  } catch (error) {
    console.error('Error processing order webhook:', error);
    res.status(500).json({ message: 'Error processing order' });
  }
}

export default handler;

// Disable body parsing, we need the raw body for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
}; 