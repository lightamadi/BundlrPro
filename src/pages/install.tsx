import { Page, Layout, Card, Button, Text, BlockStack } from '@shopify/polaris';
import { useRouter } from 'next/router';

export default function Install() {
  const router = useRouter();

  const handleInstall = async () => {
    try {
      // Get the shop domain from the URL
      const shop = router.query.shop as string;
      if (!shop) {
        throw new Error('Shop domain is required');
      }

      // Create a script tag to inject our bundles interface
      const script = document.createElement('script');
      script.src = `https://${shop}/apps/bundlrpro/install`;
      script.async = true;
      document.body.appendChild(script);

      // Show success message
      alert('BundlrPro has been successfully installed! The bundles interface will now appear on your product pages.');
    } catch (error) {
      console.error('Installation error:', error);
      alert('There was an error installing BundlrPro. Please try again.');
    }
  };

  return (
    <Page title="Install BundlrPro">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Welcome to BundlrPro!
              </Text>
              <Text as="p">
                BundlrPro helps you create and manage product bundles to increase your sales.
                With just one click, you can add the bundles interface to your product pages.
              </Text>
              <Button
                variant="primary"
                onClick={handleInstall}
              >
                Install BundlrPro
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 