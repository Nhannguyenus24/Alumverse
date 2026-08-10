import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleReCaptchaProvider } from '@google-recaptcha/react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { router } from './routes';
import NotistackProvider from './components/NotistackProvider';
import RealtimeEventsProvider from './components/RealtimeEventsProvider';
import OrganizationFaviconProvider from './components/OrganizationFaviconProvider';
import SessionExpiredDialog from './components/SessionExpiredDialog';
import ThemeProvider from './theme';
import './i18n';

import '@fontsource/nunito/200.css';
import '@fontsource/nunito/300.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import '@fontsource/montserrat/100.css';
import '@fontsource/montserrat/200.css';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        if (error?.response?.status === 429) return false;
        return failureCount < 1;
      },
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
          <RealtimeEventsProvider />
          <OrganizationFaviconProvider />
          <SessionExpiredDialog />
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
      <Analytics />
      <SpeedInsights />
    </HelmetProvider>
  );
};

const root = document.getElementById('root');
ReactDOM.createRoot(root).render(<App />);
