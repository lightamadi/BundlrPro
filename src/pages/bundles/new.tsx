import React, { useState } from 'react';
import { Page, Layout, Card, Toast } from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { useRouter } from 'next/router';
import BundleForm from '../../components/BundleForm';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

export default function NewBundle() {
  const router = useRouter();
  const { shop, host } = router.query;
  const [toastProps, setToastProps] = useState<{ message: string; error?: boolean } | null>(null);
  const app = useAppBridge();

  const handleSubmit = async (data: any) => {
    try {
      // Make sure we have the shop parameter
      const shopParam = Array.isArray(shop) ? shop[0] : shop;
      const hostParam = Array.isArray(host) ? host[0] : host;
      
      if (!shopParam) {
        throw new Error('Shop parameter is missing');
      }

      // Format the bundle data according to the API's expected structure
      const bundleData = {
        name: data.name,
        description: data.description || '',
        products: data.products,
        discountRules: data.discountRules
      };

      console.log('Submitting bundle data:', bundleData);

      const fetch = authenticatedFetch(app);
      const response = await fetch(`/api/bundles?shop=${encodeURIComponent(shopParam)}&host=${encodeURIComponent(hostParam || '')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bundleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        
        if (response.status === 401) {
          // If unauthorized, redirect to Shopify admin
          window.location.href = `https://admin.shopify.com/store/${process.env.NEXT_PUBLIC_SHOPIFY_HOST}/apps/bundlrpro`;
          return;
        }
        throw new Error(errorData.message || 'Failed to create bundle');
      }

      // Show success message
      setToastProps({ message: 'Bundle created successfully!' });

      // Navigate back to the bundles list
      router.push({
        pathname: '/',
        query: { shop: shopParam, host: hostParam }
      });
    } catch (error) {
      console.error('Error creating bundle:', error);
      setToastProps({
        message: error instanceof Error ? error.message : 'Failed to create bundle',
        error: true
      });
    }
  };

  return (
    <>
      <TitleBar
        title="Create New Bundle"
        primaryAction={{
          content: 'Save',
          onAction: () => {
            const form = document.querySelector('form');
            if (form) {
              form.requestSubmit();
            }
          }
        }}
        breadcrumbs={[{
          content: 'Bundles',
          onAction: () => router.push({
            pathname: '/',
            query: { shop, host }
          })
        }]}
      />
      <Page title="Create New Bundle">
        <Layout>
          <Layout.Section>
            <Card>
              <BundleForm onSubmit={handleSubmit} />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
      {toastProps && (
        <Toast
          content={toastProps.message}
          error={toastProps.error}
          onDismiss={() => setToastProps(null)}
        />
      )}
    </>
  );
} 