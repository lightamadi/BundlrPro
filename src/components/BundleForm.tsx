import React, { useState, useCallback, useEffect } from 'react';
import {
  FormLayout,
  TextField,
  Select,
  Button,
  Card,
  ResourceList,
  ResourceItem,
  Text,
  BlockStack,
  InlineStack,
  Banner,
  Badge,
  ButtonGroup,
  Modal,
  TextContainer,
  Thumbnail,
  Box
} from '@shopify/polaris';
import { ResourcePicker } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';
import { useAppBridge } from '@shopify/app-bridge-react';

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

interface BundleFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
}

export default function BundleForm({ initialData, onSubmit }: BundleFormProps) {
  const app = useAppBridge();
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [discountType, setDiscountType] = useState<DiscountRule['type']>(initialData?.discountType || 'percentage');
  const [discountValue, setDiscountValue] = useState(initialData?.discountValue || '');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(initialData?.products || []);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate prices when products or discount changes
  useEffect(() => {
    const calculatePrices = async () => {
      if (!selectedProducts.length) {
        setTotalPrice(0);
        setDiscountedPrice(0);
        return;
      }

      const total = selectedProducts.reduce((sum, product) => {
        const price = parseFloat(product.price || '0');
        return sum + (price * product.quantity);
      }, 0);

      setTotalPrice(total);

      // Calculate discounted price
      let discounted = total;
      if (discountType === 'percentage' && discountValue) {
        const discount = total * (parseFloat(discountValue) / 100);
        discounted = total - discount;
      } else if (discountType === 'fixed' && discountValue) {
        discounted = total - parseFloat(discountValue);
      }

      setDiscountedPrice(discounted);
    };

    calculatePrices();
  }, [selectedProducts, discountType, discountValue]);

  const validateForm = useCallback(() => {
    if (!name.trim()) {
      setError('Bundle name is required');
      return false;
    }

    if (!selectedProducts.length) {
      setError('At least one product is required');
      return false;
    }

    if (!discountValue) {
      setError('Discount value is required');
      return false;
    }

    const value = parseFloat(discountValue);
    if (isNaN(value)) {
      setError('Invalid discount value');
      return false;
    }

    if (discountType === 'percentage' && (value <= 0 || value >= 100)) {
      setError('Percentage discount must be between 0 and 100');
      return false;
    }

    if (discountType === 'fixed' && value <= 0) {
      setError('Fixed discount must be greater than 0');
      return false;
    }

    setError(null);
    return true;
  }, [name, selectedProducts, discountType, discountValue]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const discountRule: DiscountRule = {
        type: discountType,
        value: parseFloat(discountValue)
      };

      // Add additional properties based on discount type
      if (discountType === 'bxgy') {
        discountRule.minQuantity = 2;
        discountRule.freeQuantity = 1;
      } else if (discountType === 'tiered') {
        discountRule.tiers = [
          { quantity: 2, discount: 5 },
          { quantity: 3, discount: 10 },
          { quantity: 5, discount: 15 }
        ];
      }

      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        discountRules: [discountRule],
        products: selectedProducts
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error instanceof Error ? error.message : 'Failed to create bundle');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, discountType, discountValue, selectedProducts, onSubmit, isSubmitting, validateForm]);

  const handleProductSelection = useCallback(async (resources: any) => {
    try {
      console.log('ResourcePicker selection:', resources);
      
      const products = resources.selection.map((product: any) => {
        console.log('Processing product:', product);
        
        // Get the first variant
        const variant = product.variants[0];
        if (!variant) {
          console.error('No variants found for product:', product);
          return null;
        }

        const newProduct = {
          productId: product.id,
          variantId: variant.id,
          quantity: 1,
          title: product.title,
          price: variant.price,
          image: product.images?.[0]?.src
        };

        console.log('Created product object:', newProduct);
        return newProduct;
      });

      // Filter out any null values and add valid products
      const validProducts = products.filter((p: Product | null): p is Product => p !== null);
      console.log('Valid products to add:', validProducts);

      setSelectedProducts(prev => {
        const updated = [...prev, ...validProducts];
        console.log('Updated selected products:', updated);
        return updated;
      });
      
      setShowResourcePicker(false);
    } catch (error) {
      console.error('Error selecting products:', error);
      setError('Failed to add products. Please try again.');
    }
  }, []);

  const handleDeleteProduct = useCallback((productId: string) => {
    setProductToDelete(productId);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(() => {
    setSelectedProducts(products => products.filter(p => p.productId !== productToDelete));
    setShowDeleteModal(false);
    setProductToDelete(null);
  }, [productToDelete]);

  const handleDiscountTypeChange = useCallback((value: string) => {
    setDiscountType(value as DiscountRule['type']);
    setDiscountValue('');
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      <FormLayout>
        {error && (
          <Banner tone="critical">
            <p>{error}</p>
          </Banner>
        )}
        
        <Card>
          <BlockStack gap="400">
            <TextField
              label="Bundle Name"
              value={name}
              onChange={setName}
              autoComplete="off"
              requiredIndicator
            />
            <TextField
              label="Description"
              value={description}
              onChange={setDescription}
              multiline={4}
              autoComplete="off"
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Products</Text>
            <Button onClick={() => setShowResourcePicker(true)} disabled={isSubmitting}>
              Add products
            </Button>
            <ResourceList
              items={selectedProducts}
              renderItem={(item) => (
                <ResourceItem
                  id={item.productId}
                  onClick={() => {}}
                >
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="400" blockAlign="center">
                      {item.image && (
                        <Thumbnail
                          source={item.image}
                          alt={item.title || ''}
                        />
                      )}
                      <BlockStack>
                        <Text as="span" variant="bodyMd" fontWeight="bold">
                          {item.title || item.productId}
                        </Text>
                        <Text as="span" variant="bodySm" tone="subdued">
                          ${item.price} × {item.quantity}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Button
                      tone="critical"
                      onClick={() => handleDeleteProduct(item.productId)}
                    >
                      Remove
                    </Button>
                  </InlineStack>
                </ResourceItem>
              )}
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Discount</Text>
            <Select
              label="Discount Type"
              options={[
                { label: 'Percentage off', value: 'percentage' },
                { label: 'Fixed amount off', value: 'fixed' },
                { label: 'Buy X Get Y', value: 'bxgy' },
                { label: 'Tiered discount', value: 'tiered' }
              ]}
              value={discountType}
              onChange={handleDiscountTypeChange}
            />
            <TextField
              label="Discount Value"
              type="number"
              value={discountValue}
              onChange={setDiscountValue}
              autoComplete="off"
              requiredIndicator
            />
          </BlockStack>
        </Card>

        {selectedProducts.length > 0 && (
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Price Summary</Text>
              <InlineStack align="space-between">
                <Text as="span">Original Price:</Text>
                <Text as="span">${totalPrice.toFixed(2)}</Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span">Discount:</Text>
                <Text as="span">
                  {discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`}
                </Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span" fontWeight="bold">Final Price:</Text>
                <Text as="span" fontWeight="bold">${discountedPrice.toFixed(2)}</Text>
              </InlineStack>
            </BlockStack>
          </Card>
        )}

        <ButtonGroup>
          <Button submit tone="success" loading={isSubmitting}>
            Save Bundle
          </Button>
        </ButtonGroup>
      </FormLayout>

      <ResourcePicker
        resourceType="Product"
        open={showResourcePicker}
        onCancel={() => setShowResourcePicker(false)}
        onSelection={handleProductSelection}
        selectMultiple
        showVariants={false}
        allowMultiple={true}
        initialQuery=""
        showHidden={false}
        showArchived={false}
      />

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Remove product"
        primaryAction={{
          content: 'Remove',
          onAction: confirmDelete,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowDeleteModal(false),
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>Are you sure you want to remove this product from the bundle?</p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </form>
  );
} 