import { RouterProvider } from 'react-router/dom';
import { HelmetProvider } from 'react-helmet-async';
import { router } from './routes';
import NotistackProvider from './components/common/NotistackProvider';
import ThemeProvider from './theme';

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <NotistackProvider>
          <RouterProvider router={router} />
        </NotistackProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;