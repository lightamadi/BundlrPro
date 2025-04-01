import React, { useEffect, useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  DataTable,
  EmptyState,
  Spinner,
  Text,
  Button,
  BlockStack,
  Modal,
  Badge,
  ButtonGroup,
  InlineStack,
  Box,
  DropZone,
  Popover,
  ActionList,
  LegacyStack,
  TextField,
  Banner,
  Toast
} from '@shopify/polaris';
import { TitleBar, useNavigate, useAppBridge } from '@shopify/app-bridge-react';
import { useRouter } from 'next/router';
import { authenticatedFetch } from '@shopify/app-bridge-utils';
import { Redirect } from '@shopify/app-bridge/actions';

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
  createdAt: string;
}

export default function Index() {
  const router = useRouter();
  const navigate = useNavigate();
  const app = useAppBridge();
  const { shop, host } = router.query;
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBundles, setSelectedBundles] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);

  const fetchBundles = useCallback(async () => {
    try {
      const shopParam = Array.isArray(shop) ? shop[0] : shop;
      const hostParam = Array.isArray(host) ? host[0] : host;
      
      if (!shopParam) {
        throw new Error('Shop parameter is missing');
      }

      console.log('Fetching bundles for shop:', shopParam);
      const fetch = authenticatedFetch(app);
      const response = await fetch(`/api/bundles?shop=${encodeURIComponent(shopParam)}&host=${encodeURIComponent(hostParam || '')}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        
        if (response.status === 401) {
          // If unauthorized, redirect to Shopify admin
          const redirectUrl = `https://${shopParam}/admin/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_APP_SCOPES}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_SHOPIFY_APP_URL + '/api/auth/callback')}&state=${Math.random().toString(36).substring(2, 15)}`;
          console.log('Redirecting to Shopify admin:', redirectUrl);
          window.location.href = redirectUrl;
          return;
        }
        throw new Error(errorData.message || 'Failed to fetch bundles');
      }

      const data = await response.json();
      console.log('Fetched bundles:', data);
      setBundles(data);
    } catch (err) {
      console.error('Error fetching bundles:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [shop, host, app]);

  useEffect(() => {
    // Add CSP headers for Shopify embedded app
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Security-Policy');
    meta.setAttribute('content', "frame-ancestors https://*.myshopify.com https://admin.shopify.com; default-src 'self' https://*.shopify.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.shopify.com; style-src 'self' 'unsafe-inline' https://*.shopify.com; img-src 'self' data: https://*.shopify.com; connect-src 'self' https://*.shopify.com;");
    document.head.appendChild(meta);

    if (shop) {
      console.log('Shop parameter detected, fetching bundles...');
      fetchBundles();
    } else {
      console.log('No shop parameter detected');
      setIsLoading(false);
    }
  }, [shop, fetchBundles]);

  const handleCreateBundle = () => {
    const path = `/bundles/new?shop=${encodeURIComponent(shop as string)}&host=${encodeURIComponent(host as string)}`;
    navigate(path);
  };

  const handleEditBundle = (bundleId: string) => {
    console.log('Editing bundle with ID:', bundleId);
    const shopParam = Array.isArray(shop) ? shop[0] : shop;
    const hostParam = Array.isArray(host) ? host[0] : host;
    console.log('Current bundle data:', bundles.find(b => b._id === bundleId));
    console.log('Shop parameter:', shopParam);
    const path = `/bundles/${bundleId}/edit?shop=${encodeURIComponent(shopParam || '')}&host=${encodeURIComponent(hostParam || '')}`;
    console.log('Navigation path:', path);
    navigate(path);
  };

  const handleDeleteBundle = async () => {
    if (!bundleToDelete) return;

    try {
      const shopParam = Array.isArray(shop) ? shop[0] : shop;
      if (!shopParam) return;

      const response = await fetch(`/api/bundles/${bundleToDelete}?shop=${encodeURIComponent(shopParam)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete bundle');
      }

      await fetchBundles();
      setDeleteModalOpen(false);
      setBundleToDelete(null);
    } catch (err) {
      console.error('Error deleting bundle:', err);
      // Show error message to user
    }
  };

  const handleToggleStatus = async (bundleId: string, currentStatus: boolean) => {
    try {
      const shopParam = Array.isArray(shop) ? shop[0] : shop;
      if (!shopParam) return;

      const response = await fetch(`/api/bundles/${bundleId}?shop=${encodeURIComponent(shopParam)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bundle status');
      }

      await fetchBundles();
    } catch (err) {
      console.error('Error updating bundle status:', err);
      // Show error message to user
    }
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate') => {
    try {
      const shopParam = Array.isArray(shop) ? shop[0] : shop;
      if (!shopParam) return;

      const promises = selectedBundles.map((bundleId) => {
        const endpoint = `/api/bundles/${bundleId}?shop=${encodeURIComponent(shopParam)}`;
        const method = action === 'delete' ? 'DELETE' : 'PATCH';
        const body = action !== 'delete' ? JSON.stringify({ isActive: action === 'activate' }) : undefined;

        return fetch(endpoint, {
          method,
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body,
        });
      });

      await Promise.all(promises);
      await fetchBundles();
      setSelectedBundles([]);
    } catch (err) {
      console.error('Error performing bulk action:', err);
      // Show error message to user
    }
  };

  if (isLoading) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack align="center" gap="400">
                  <Spinner accessibilityLabel="Loading bundles" size="large" />
                  <Text as="p" variant="bodyMd">Loading bundles...</Text>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack align="center" gap="400">
                  <Text as="h2" variant="headingMd" tone="critical">Error loading bundles</Text>
                  <Text as="p" variant="bodyMd">{error}</Text>
                  <Button onClick={() => window.location.reload()}>Try Again</Button>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (bundles.length === 0) {
    return (
      <>
        <TitleBar
          title="Product Bundles"
          primaryAction={{
            content: 'Create bundle',
            onAction: handleCreateBundle,
          }}
        />
        <Page title="Product Bundles">
          <Layout>
            <Layout.Section>
              <Card>
                <EmptyState
                  heading="Create your first product bundle"
                  action={{
                    content: 'Create bundle',
                    onAction: handleCreateBundle,
                  }}
                  image="/empty-state-illustration.svg"
                >
                  <p>Create attractive product bundles with dynamic pricing to boost your sales.</p>
                </EmptyState>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </>
    );
  }

  const rows = bundles.map((bundle) => [
    <InlineStack align="start" gap="200">
      <Box paddingInlineEnd="200">
        <input
          type="checkbox"
          checked={selectedBundles.includes(bundle._id)}
          onChange={(e) => {
            setSelectedBundles(
              e.target.checked
                ? [...selectedBundles, bundle._id]
                : selectedBundles.filter(id => id !== bundle._id)
            );
          }}
        />
      </Box>
      <Text as="span" variant="bodyMd" fontWeight="semibold">{bundle.name}</Text>
    </InlineStack>,
    <Text as="span" variant="bodyMd">{bundle.description || '—'}</Text>,
    <Text as="span" variant="bodyMd" alignment="center">{bundle.products.length}</Text>,
    <Box paddingInline="200">
      <Badge tone={bundle.isActive ? 'success' : 'critical'}>
        {bundle.isActive ? 'Active' : 'Inactive'}
      </Badge>
    </Box>,
    <Text as="span" variant="bodyMd" alignment="center">
      {bundle.discountRules[0]?.type === 'percentage' 
        ? `${bundle.discountRules[0].value}% off`
        : `$${bundle.discountRules[0]?.value} off`}
    </Text>,
    <Text as="span" variant="bodyMd">{new Date(bundle.createdAt).toLocaleDateString()}</Text>,
    <Box>
      <ButtonGroup>
        <Button size="slim" onClick={() => handleEditBundle(bundle._id)}>Edit</Button>
        <Button
          size="slim"
          variant="primary"
          tone={bundle.isActive ? 'critical' : 'success'}
          onClick={() => handleToggleStatus(bundle._id, bundle.isActive)}
        >
          {bundle.isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button 
          size="slim"
          variant="primary"
          tone="critical"
          onClick={() => {
            setBundleToDelete(bundle._id);
            setDeleteModalOpen(true);
          }}
        >
          Delete
        </Button>
      </ButtonGroup>
    </Box>
  ]);

  return (
    <>
      <style jsx global>{`
        @media (max-width: 768px) {
          .Polaris-DataTable__Cell {
            padding: 8px !important;
          }
          .Polaris-ButtonGroup {
            flex-wrap: wrap;
            gap: 4px;
          }
          .Polaris-ButtonGroup__Item {
            margin-top: 4px;
          }
        }
      `}</style>
      <TitleBar
        title="Product Bundles"
        primaryAction={{
          content: 'Create bundle',
          onAction: handleCreateBundle,
        }}
        secondaryActions={selectedBundles.length > 0 ? [
          {
            content: `${selectedBundles.length} selected`,
            disabled: true,
          },
          {
            content: 'Bulk actions',
            onAction: () => setActionMenuOpen(true),
          },
        ] : undefined}
      />
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <div className="table-wrapper" style={{ overflowX: 'auto', margin: '0 -2rem' }}>
              <DataTable
                columnContentTypes={['text', 'text', 'numeric', 'text', 'text', 'text', 'text']}
                headings={[
                  <Text as="span" variant="bodyMd" fontWeight="bold">Name</Text>,
                  <Text as="span" variant="bodyMd" fontWeight="bold">Description</Text>,
                  <Text as="span" variant="bodyMd" fontWeight="bold" alignment="center">Products</Text>,
                  <Text as="span" variant="bodyMd" fontWeight="bold">Status</Text>,
                  <Text as="span" variant="bodyMd" fontWeight="bold">Discount</Text>,
                  <Text as="span" variant="bodyMd" fontWeight="bold">Created</Text>,
                  <Text as="span" variant="bodyMd" fontWeight="bold">Actions</Text>
                ]}
                rows={rows}
                truncate
              />
            </div>
          </Layout.Section>
        </Layout>
      </Page>

      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setBundleToDelete(null);
        }}
        title="Delete Bundle"
        primaryAction={{
          content: 'Delete bundle',
          destructive: true,
          onAction: handleDeleteBundle,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => {
              setDeleteModalOpen(false);
              setBundleToDelete(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">Are you sure you want to delete this bundle? This action cannot be undone.</Text>
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Popover
        active={actionMenuOpen}
        activator={<div style={{ display: 'none' }} />}
        onClose={() => setActionMenuOpen(false)}
      >
        <ActionList
          actionRole="menuitem"
          items={[
            {
              content: 'Activate bundles',
              onAction: () => handleBulkAction('activate'),
            },
            {
              content: 'Deactivate bundles',
              onAction: () => handleBulkAction('deactivate'),
            },
            {
              content: 'Delete bundles',
              onAction: () => handleBulkAction('delete'),
            },
          ]}
        />
      </Popover>
    </>
  );
} 