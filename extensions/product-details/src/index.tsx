import React from 'react';
import {
  extend,
  Banner,
  BlockStack,
  Button,
  Heading,
  InlineStack,
  Text,
  useApi,
  useTranslate,
} from '@shopify/ui-extensions-react/product-details';

interface Bundle {
  _id: string;
  name: string;
  description: string;
  discountPercentage: number;
}

extend('Playground', () => <App />);

function App() {
  const translate = useTranslate();
  const { extension } = useApi();
  const settings = extension.settings;

  const [bundles, setBundles] = React.useState<Bundle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchBundles = async () => {
      try {
        // Get the shop domain from the extension context
        const shop = extension.target.shop.domain;
        
        // Make the API call with proper authentication
        const response = await fetch(`https://${shop}/admin/api/2024-01/products/${extension.target.product.id}/metafields.json`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': extension.target.shop.accessToken,
            'X-Shopify-Shop-Domain': shop,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch product data');
        }

        const data = await response.json();
        
        // Now fetch bundles from our app's API
        const bundlesResponse = await fetch('/api/bundles/product', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Shop-Domain': shop,
            'X-Shopify-Access-Token': extension.target.shop.accessToken,
          },
          credentials: 'include',
          body: JSON.stringify({
            productId: extension.target.product.id,
            shopId: shop,
          }),
        });

        if (!bundlesResponse.ok) {
          throw new Error('Failed to fetch bundles');
        }

        const bundlesData = await bundlesResponse.json();
        setBundles(bundlesData.bundles || []);
      } catch (err) {
        console.error('Error fetching bundles:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBundles();
  }, [extension.target.product.id, extension.target.shop.id, extension.target.shop.domain, extension.target.shop.accessToken]);

  if (loading) {
    return <Text>Loading bundles...</Text>;
  }

  if (error) {
    return (
      <Banner status="critical">
        Error loading bundles: {error}
      </Banner>
    );
  }

  if (!bundles.length) {
    return null;
  }

  return (
    <BlockStack spacing="loose">
      <Heading>{settings.heading}</Heading>
      <Text>{settings.description}</Text>
      
      <BlockStack spacing="tight">
        {bundles.map((bundle) => (
          <BlockStack key={bundle._id} spacing="tight">
            <Text size="large" emphasis="bold">
              {bundle.name}
            </Text>
            <Text>
              {bundle.description}
            </Text>
            <Text emphasis="bold">
              Save {bundle.discountPercentage}% on this bundle
            </Text>
            <InlineStack spacing="base">
              <Button
                onPress={() => {
                  // Handle bundle selection
                  console.log('Selected bundle:', bundle);
                }}
              >
                Add to Cart
              </Button>
            </InlineStack>
          </BlockStack>
        ))}
      </BlockStack>
    </BlockStack>
  );
} 