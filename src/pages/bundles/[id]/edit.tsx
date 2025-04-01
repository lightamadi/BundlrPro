import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Page,
  Layout,
  Card,
  Form,
  FormLayout,
  TextField,
  Button,
  Text,
  BlockStack,
  Box,
  Spinner,
  Banner,
  PageActions,
} from '@shopify/polaris';
import { TitleBar, useNavigate } from '@shopify/app-bridge-react';

interface Bundle {
  _id: string;
  name: string;
  description: string;
  products: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    title?: string;
    price?: string;
  }>;
  discountRules: Array<{
    type: string;
    value: number;
  }>;
  isActive: boolean;
}

export default function EditBundle() {
  const router = useRouter();
  const navigate = useNavigate();
  const { id, shop, host } = router.query;
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchBundle = useCallback(async () => {
    try {
      const shopParam = Array.isArray(shop) ? shop[0] : shop;
      if (!shopParam || !id) return;

      console.log('Fetching bundle:', { id, shop: shopParam });
      const response = await fetch(`/api/bundles/${id}?shop=${encodeURIComponent(shopParam)}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch bundle');
      }

      const data = await response.json();
      console.log('Bundle data:', data);
      setBundle(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [shop, id]);

  useEffect(() => {
    if (shop && id) {
      fetchBundle();
    }
  }, [shop, id, fetchBundle]);

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      setFormError(null);

      const shopParam = Array.isArray(shop) ? shop[0] : shop;
      if (!shopParam || !bundle) return;

      const response = await fetch(`/api/bundles/${id}?shop=${encodeURIComponent(shopParam)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bundle),
      });

      if (!response.ok) {
        throw new Error('Failed to update bundle');
      }

      const path = `/?shop=${encodeURIComponent(shopParam)}&host=${encodeURIComponent(host as string)}`;
      navigate(path);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save bundle');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    const shopParam = Array.isArray(shop) ? shop[0] : shop;
    const path = `/?shop=${encodeURIComponent(shopParam || '')}&host=${encodeURIComponent(host as string)}`;
    navigate(path);
  };

  if (isLoading) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack align="center" gap="400">
                  <Spinner accessibilityLabel="Loading bundle" size="large" />
                  <Text as="p" variant="bodyMd">Loading bundle...</Text>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (error || !bundle) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack align="center" gap="400">
                  <Text as="h2" variant="headingMd" tone="critical">Error loading bundle</Text>
                  <Text as="p" variant="bodyMd">{error || 'Bundle not found'}</Text>
                  <Button onClick={() => router.back()}>Go Back</Button>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <>
      <TitleBar
        title="Edit Bundle"
        primaryAction={{
          content: 'Save',
          loading: isSaving,
          onAction: handleSubmit,
        }}
        secondaryActions={[
          {
            content: 'Discard',
            onAction: handleDiscard,
          },
        ]}
      />
      <Page
        backAction={{
          content: 'Bundles',
          onAction: handleDiscard,
        }}
      >
        <Layout>
          {formError && (
            <Layout.Section>
              <Banner tone="critical">
                <p>{formError}</p>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <Form onSubmit={handleSubmit}>
                <FormLayout>
                  <TextField
                    label="Bundle name"
                    value={bundle.name}
                    onChange={(value) => setBundle({ ...bundle, name: value })}
                    autoComplete="off"
                  />
                  <TextField
                    label="Description"
                    value={bundle.description}
                    onChange={(value) => setBundle({ ...bundle, description: value })}
                    multiline={3}
                    autoComplete="off"
                  />
                </FormLayout>
              </Form>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <PageActions
              primaryAction={{
                content: 'Save',
                loading: isSaving,
                onAction: handleSubmit,
              }}
              secondaryActions={[
                {
                  content: 'Discard',
                  onAction: handleDiscard,
                },
              ]}
            />
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
} 