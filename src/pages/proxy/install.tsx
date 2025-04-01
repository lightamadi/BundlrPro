import { BlockStack, Button, Text } from '@shopify/polaris';

export default function InstallScript() {
  const installationScript = `<script>
  (function() {
    // Create a container for our bundles
    const container = document.createElement('div');
    container.id = 'bundlrpro-bundles';
    container.setAttribute('data-product-id', '{{ product.id }}');
    
    // Find the product form to insert after
    const productForm = document.querySelector('form[action="/cart/add"]');
    if (productForm) {
      productForm.parentNode.insertBefore(container, productForm.nextSibling);
      
      // Load the bundles interface
      const productId = container.dataset.productId;
      const proxyUrl = 'https://{{ shop.permanent_domain }}/apps/bundlrpro/bundles?product_id=' + productId;
      
      fetch(proxyUrl)
        .then(response => response.text())
        .then(html => {
          container.innerHTML = html;
        })
        .catch(error => {
          console.error('Error loading BundlrPro bundles:', error);
        });
    }
  })();
</script>`;

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">Installation Instructions</Text>
      <Text as="p">
        Follow these simple steps to add BundlrPro to your store:
      </Text>
      <BlockStack gap="300">
        <Text as="p">1. Go to your Shopify admin</Text>
        <Text as="p">2. Navigate to Online Store > Themes</Text>
        <Text as="p">3. Click "Actions" > "Edit code" on your active theme</Text>
        <Text as="p">4. In the Templates folder, find your product template (usually product.liquid or product.json)</Text>
        <Text as="p">5. Copy and paste the following code just before the closing &lt;/body&gt; tag:</Text>
      </BlockStack>
      
      <pre style={{ backgroundColor: '#f4f4f4', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
        {installationScript}
      </pre>
      
      <Text as="p">
        That's it! The BundlrPro bundles interface will automatically appear on your product pages.
        No further configuration is needed.
      </Text>
      
      <Button
        onClick={() => {
          // Copy the script to clipboard
          navigator.clipboard.writeText(installationScript);
        }}
      >
        Copy to Clipboard
      </Button>
    </BlockStack>
  );
} 