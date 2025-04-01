import { NextApiRequest, NextApiResponse } from 'next';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the shop domain from the request
    const shop = req.headers['x-shopify-shop-domain'] as string;
    if (!shop) {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    // Create the installation script
    const script = `
      (function() {
        // Create a container for our bundles
        const container = document.createElement('div');
        container.id = 'bundlrpro-bundles';
        container.setAttribute('data-product-id', '{{ product.id }}');
        
        // Find the product form to insert after
        const productForm = document.querySelector('form[action="/cart/add"]');
        if (productForm) {
          productForm.parentNode.insertBefore(container, productForm.nextSibling);
          
          // Load the bundles interface
          const productId = container.dataset.productId;
          const proxyUrl = 'https://${shop}/apps/bundlrpro/bundles?product_id=' + productId;
          
          fetch(proxyUrl)
            .then(response => response.text())
            .then(html => {
              container.innerHTML = html;
            })
            .catch(error => {
              console.error('Error loading BundlrPro bundles:', error);
            });
        }
      })();
    `;

    // Return the script
    res.setHeader('Content-Type', 'application/javascript');
    res.status(200).send(script);
  } catch (error) {
    console.error('Error in install endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 