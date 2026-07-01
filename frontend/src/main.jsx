import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleReCaptchaProvider } from '@google-recaptcha/react';
import { router } from './routes';
import NotistackProvider from './components/NotistackProvider';
import ThemeProvider from './theme';
import './i18n';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      // Avoid redundant backend calls when the user simply switches back to the tab.
      // Freshness is still guaranteed by staleTime and the per-hook refetchOnMount settings.
      refetchOnWindowFocus: false,
    },
  },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const App = () => {
  let appContent = (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NotistackProvider>
          <RouterProvider router={router} />
        </NotistackProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );

  if (recaptchaSiteKey) {
    appContent = (
      <GoogleReCaptchaProvider type="v2-checkbox" siteKey={recaptchaSiteKey}>
        {appContent}
      </GoogleReCaptchaProvider>
    );
  }

  return (
    <HelmetProvider>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>{appContent}</GoogleOAuthProvider>
      ) : (
        appContent
      )}
    </HelmetProvider>
  );
};

const root = document.getElementById('root');
ReactDOM.createRoot(root).render(<App />);
