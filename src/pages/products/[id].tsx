import React from 'react';
import { useRouter } from 'next/router';
import { Page, Layout, Card } from '@shopify/polaris';
import BundleCustomizer from '../../components/BundleCustomizer';

export default function ProductPage() {
  const router = useRouter();
  const { id, shop } = router.query;

  if (!id || !shop) {
    return null;
  }

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <BundleCustomizer
              productId={id as string}
              shop={shop as string}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 