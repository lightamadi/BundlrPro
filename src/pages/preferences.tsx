import { useState, useEffect } from 'react';
import { Page, Layout, Card, Select, Button, Banner } from '@shopify/polaris';

export default function Preferences() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bundleDisplayLocation, setBundleDisplayLocation] = useState('product-form');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const data = await response.json();
      setBundleDisplayLocation(data.bundle_display_location);
    } catch (err) {
      setError('Failed to load preferences');
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bundle_display_location: bundleDisplayLocation }),
      });

      if (!response.ok) throw new Error('Failed to save preferences');

      setSuccess('Preferences saved successfully');
    } catch (err) {
      setError('Failed to save preferences');
      console.error('Error saving preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const options = [
    { label: 'Product Form', value: 'product-form' },
    { label: 'Product Description', value: 'product-description' },
    { label: 'Product Sidebar', value: 'product-sidebar' },
  ];

  return (
    <Page title="Bundle Display Preferences">
      <Layout>
        <Layout.Section>
          <Card>
            {error && (
              <Banner tone="critical" onDismiss={() => setError(null)}>
                {error}
              </Banner>
            )}
            {success && (
              <Banner tone="success" onDismiss={() => setSuccess(null)}>
                {success}
              </Banner>
            )}
            <Select
              label="Bundle Display Location"
              options={options}
              value={bundleDisplayLocation}
              onChange={setBundleDisplayLocation}
              disabled={loading}
            />
            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={loading}
              >
                Save Preferences
              </Button>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 