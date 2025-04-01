import React from 'react';
import { extend } from '@shopify/checkout-ui-extensions-react';
import BundleCustomizer from '../../src/components/BundleCustomizer';

extend('Checkout::Dynamic::Render', () => <App />);

function App() {
  const { shop, productId } = window.location.pathname.match(/\/products\/(?<productId>[^/]+)/)?.groups || {};
  
  if (!shop || !productId) {
    return null;
  }

  return (
    <div id="bundle-customizer">
      <BundleCustomizer
        productId={productId}
        shop={shop}
      />
    </div>
  );
} 