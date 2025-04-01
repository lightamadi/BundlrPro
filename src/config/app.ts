interface AppConfig {
  shopify: {
    apiKey: string;
    apiSecret: string;
    scopes: string[];
    hostName: string;
  };
  mongodb: {
    uri: string;
    options: {
      useNewUrlParser: boolean;
      useUnifiedTopology: boolean;
    };
  };
  app: {
    name: string;
    description: string;
    version: string;
    webhooks: {
      productUpdate: string;
      orderCreate: string;
    };
  };
}

const config: AppConfig = {
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
    scopes: [
      'read_products',
      'write_products',
      'read_orders',
      'write_orders',
      'read_inventory',
      'write_inventory',
      'read_discounts',
      'write_discounts'
    ],
    hostName: process.env.HOST || ''
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bundlr-pro',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  app: {
    name: 'BundlrPro',
    description: 'Create and manage product bundles with dynamic pricing',
    version: '1.0.0',
    webhooks: {
      productUpdate: '/api/webhooks/products/update',
      orderCreate: '/api/webhooks/orders/create'
    }
  }
};

export default config; 