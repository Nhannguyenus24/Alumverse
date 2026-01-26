import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import LoadingScreen from '../components/LoadingScreen';

const Loadable = (Component) => (props) =>
  (
    <Suspense fallback={<LoadingScreen />}>
      <Component {...props} />
    </Suspense>
  );

// Lazy load pages
const HomePage = Loadable(lazy(() => import('../pages/HomePage')));
const LoginPage = Loadable(lazy(() => import('../pages/LoginPage')));
const RegisterPage = Loadable(lazy(() => import('../pages/RegisterPage')));
const DashboardPage = Loadable(lazy(() => import('../pages/DashboardPage')));
const NotFoundPage = Loadable(lazy(() => import('../pages/NotFoundPage')));
const UnauthorizedPage = Loadable(
  lazy(() => import('../pages/UnauthorizedPage'))
);
const ServerErrorPage = Loadable(
  lazy(() => import('../pages/ServerErrorPage'))
);
const MaintenancePage = Loadable(
  lazy(() => import('../pages/MaintenancePage'))
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
      },
      {
        path: '500',
        element: <ServerErrorPage />,
      },
      {
        path: 'maintenance',
        element: <MaintenancePage />,
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);