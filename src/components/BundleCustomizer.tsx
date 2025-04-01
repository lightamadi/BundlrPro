import React, { useEffect, useState } from 'react';
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Badge,
  Thumbnail,
  Banner,
  Spinner,
  Box
} from '@shopify/polaris';

interface Product {
  productId: string;
  variantId: string;
  quantity: number;
  title?: string;
  price?: string;
  image?: string;
}

interface DiscountRule {
  type: 'percentage' | 'fixed' | 'bxgy' | 'tiered';
  value: number;
  minQuantity?: number;
  freeQuantity?: number;
  tiers?: Array<{
    quantity: number;
    discount: number;
  }>;
}

interface Bundle {
  _id: string;
  name: string;
  description: string;
  products: Product[];
  discountRules: DiscountRule[];
  isActive: boolean;
}

interface BundleCustomizerProps {
  productId: string;
  shop: string;
}

export default function BundleCustomizer({ productId, shop }: BundleCustomizerProps) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        const response = await fetch(`/api/bundles?shop=${encodeURIComponent(shop)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bundles');
        }
        const data = await response.json();
        // Filter bundles that contain the current product
        const relevantBundles = data.filter((bundle: Bundle) => 
          bundle.isActive && bundle.products.some(p => p.productId === productId)
        );
        setBundles(relevantBundles);
      } catch (err) {
        console.error('Error fetching bundles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bundles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBundles();
  }, [productId, shop]);

  const calculateBundlePrice = (bundle: Bundle) => {
    const total = bundle.products.reduce((sum, product) => {
      const price = parseFloat(product.price || '0');
      const quantity = selectedQuantities[product.productId] || 0;
      return sum + (price * quantity);
    }, 0);

    const discountRule = bundle.discountRules[0];
    if (!discountRule) return total;

    let discount = 0;
    switch (discountRule.type) {
      case 'percentage':
        discount = total * (discountRule.value / 100);
        break;
      case 'fixed':
        discount = discountRule.value;
        break;
      case 'bxgy':
        // Implement BXGY logic
        break;
      case 'tiered':
        // Implement tiered discount logic
        break;
    }

    return total - discount;
  };

  const handleQuantityChange = (productId: string, change: number) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change)
    }));
  };

  const handleAddToCart = async (bundle: Bundle) => {
    // Implement add to cart logic
    console.log('Adding bundle to cart:', bundle);
  };

  if (isLoading) {
    return (
      <Box padding="400">
        <BlockStack align="center" gap="400">
          <Spinner accessibilityLabel="Loading bundles" size="large" />
          <Text as="p" variant="bodyMd">Loading bundles...</Text>
        </BlockStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding="400">
        <Banner tone="critical">
          <p>{error}</p>
        </Banner>
      </Box>
    );
  }

  if (bundles.length === 0) {
    return null;
  }

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">Available Bundles</Text>
      {bundles.map((bundle) => (
        <Card key={bundle._id}>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="h3" variant="headingSm">{bundle.name}</Text>
              <Badge tone="success">{`Save up to ${bundle.discountRules[0]?.value.toString()}%`}</Badge>
            </InlineStack>
            
            <Text as="p" variant="bodyMd">{bundle.description}</Text>
            
            <BlockStack gap="200">
              {bundle.products.map((product) => (
                <InlineStack key={product.productId} align="space-between" blockAlign="center">
                  <InlineStack gap="400" blockAlign="center">
                    {product.image && (
                      <Thumbnail
                        source={product.image}
                        alt={product.title || ''}
                      />
                    )}
                    <BlockStack>
                      <Text as="span" variant="bodyMd" fontWeight="bold">
                        {product.title || product.productId}
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        ${product.price}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                  
                  <InlineStack gap="200">
                    <Button
                      size="slim"
                      onClick={() => handleQuantityChange(product.productId, -1)}
                    >
                      -
                    </Button>
                    <Text as="span" variant="bodyMd">
                      {selectedQuantities[product.productId] || 0}
                    </Text>
                    <Button
                      size="slim"
                      onClick={() => handleQuantityChange(product.productId, 1)}
                    >
                      +
                    </Button>
                  </InlineStack>
                </InlineStack>
              ))}
            </BlockStack>

            <InlineStack align="space-between">
              <BlockStack>
                <Text as="span" variant="bodySm" tone="subdued">Original Price:</Text>
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  ${bundle.products.reduce((sum, p) => 
                    sum + (parseFloat(p.price || '0') * (selectedQuantities[p.productId] || 0)), 0
                  ).toFixed(2)}
                </Text>
              </BlockStack>
              <BlockStack>
                <Text as="span" variant="bodySm" tone="subdued">Bundle Price:</Text>
                <Text as="span" variant="bodyMd" fontWeight="bold" tone="success">
                  ${calculateBundlePrice(bundle).toFixed(2)}
                </Text>
              </BlockStack>
            </InlineStack>

            <Button
              fullWidth
              onClick={() => handleAddToCart(bundle)}
            >
              Add Bundle to Cart
            </Button>
          </BlockStack>
        </Card>
      ))}
    </BlockStack>
  );
} 