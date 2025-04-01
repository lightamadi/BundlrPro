import { useEffect, useState } from 'react';
import { Banner, BlockStack, Button, Text, InlineStack } from '@shopify/polaris';

interface Bundle {
  _id: string;
  name: string;
  description: string;
  discountPercentage: number;
}

declare global {
  interface Window {
    Shopify: {
      shop: string;
    };
  }
}

export default function BundlesProxy() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        // Get the product ID from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('product_id');
        
        if (!productId) {
          throw new Error('Product ID is required');
        }

        const response = await fetch('/api/bundles/product', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            shopId: window.Shopify.shop,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bundles');
        }

        const data = await response.json();
        setBundles(data.bundles || []);
      } catch (err) {
        console.error('Error fetching bundles:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBundles();
  }, []);

  if (loading) {
    return <Text as="p">Loading bundles...</Text>;
  }

  if (error) {
    return (
      <Banner tone="critical">
        Error loading bundles: {error}
      </Banner>
    );
  }

  if (!bundles.length) {
    return null;
  }

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">Available Bundles</Text>
      <Text as="p">Choose from our available bundles to save on your purchase</Text>
      
      <BlockStack gap="300">
        {bundles.map((bundle) => (
          <BlockStack key={bundle._id} gap="300">
            <Text as="h3" variant="headingSm">
              {bundle.name}
            </Text>
            <Text as="p">
              {bundle.description}
            </Text>
            <Text as="p" variant="headingSm">
              Save {bundle.discountPercentage}% on this bundle
            </Text>
            <InlineStack gap="300">
              <Button
                onClick={() => {
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