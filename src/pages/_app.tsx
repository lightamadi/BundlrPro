import React from 'react';
import { AppProps } from 'next/app';
import { AppProvider, Frame } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import '@shopify/polaris/build/esm/styles.css';
import enTranslations from '@shopify/polaris/locales/en.json';

function MyApp({ Component, pageProps }: AppProps) {
  const host = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('host') : null;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
    host: host!,
    forceRedirect: true
  };

  return (
    <AppBridgeProvider config={config}>
      <AppProvider i18n={enTranslations}>
        <Frame>
          <Component {...pageProps} />
        </Frame>
      </AppProvider>
    </AppBridgeProvider>
  );
}

export default MyApp;
