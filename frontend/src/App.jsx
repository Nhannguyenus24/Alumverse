import { RouterProvider } from 'react-router/dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes';
import NotistackProvider from './components/NotistackProvider';
import ThemeProvider from './theme';

const queryClient = new QueryClient();

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <NotistackProvider>
            <RouterProvider router={router} />
          </NotistackProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;