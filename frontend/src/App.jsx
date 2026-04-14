import { RouterProvider } from 'react-router/dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { router } from './routes';
import NotistackProvider from './components/NotistackProvider';
import ThemeProvider from './theme';

const queryClient = new QueryClient();
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const App = () => {
  const appContent = (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NotistackProvider>
          <RouterProvider router={router} />
        </NotistackProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );

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

export default App;