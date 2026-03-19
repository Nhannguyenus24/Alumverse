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
const SignupCodePage = Loadable(lazy(() => import('../pages/SignupCodePage')));
const ForgotPasswordPage = Loadable(
  lazy(() => import('../pages/ForgotPasswordPage'))
);
const ResetPasswordPage = Loadable(
  lazy(() => import('../pages/ResetPasswordPage'))
);
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
const IntroducePage = Loadable(lazy(() => import('../pages/IntroducePage')));
const FacultiesPage = Loadable(lazy(() => import('../pages/FacultiesPage')));
const FacultyCNTTPage = Loadable(lazy(() => import('../pages/FacultyCNTTPage')));
const ForumPage = Loadable(lazy(() => import('../pages/ForumPage')));
const ForumAlumniCareerPage = Loadable(
  lazy(() => import('../pages/ForumAlumniCareerPage'))
);
const ForumAlumniThreadPage = Loadable(
  lazy(() => import('../pages/ForumAlumniThreadPage'))
);
const ForumAlumniCreatePostPage = Loadable(
  lazy(() => import('../pages/ForumAlumniCreatePostPage'))
);
const ContactPage = Loadable(lazy(() => import('../pages/ContactPage')));
const HonorsPage = Loadable(
  lazy(() => import('../pages/HonorsPage'))
);
const HonorsAlumniPage = Loadable(
  lazy(() => import('../pages/HonorsAlumniPage'))
);
const HonorsAchievementsPage = Loadable(
  lazy(() => import('../pages/HonorsAchievementsPage'))
);
const HonorsRequestAchievementsPage = Loadable(
  lazy(() => import('../pages/HonorsRequestAchievementsPage'))
);
const PostArticlePage = Loadable(
  lazy(() => import('../pages/PostArticlePage'))
);
const ArticlePage = Loadable(
  lazy(() => import('../pages/ArticlePage'))
);
const NotificationPage = Loadable(
  lazy(() => import('../pages/NotificationPage'))
);
const SettingPage = Loadable(
  lazy(() => import('../pages/SettingPage'))
);
const DonationPage = Loadable(
  lazy(() => import('../pages/DonationPage'))
);
const DetailDonationPage = Loadable(
  lazy(() => import('../pages/DetailDonationPage'))
);
const CreateDonationPage = Loadable(
  lazy(() => import('../pages/CreateDonationPage'))
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
        path: 'introduction',
        element: <IntroducePage />,
      },
      {
        path: 'forum',
        children: [
          {
            index: true,
            element: <ForumPage />,
          },
          {
            path: 'alumni',
            children: [
              {
                path: 'career',
                children: [
                  {
                    index: true,
                    element: <ForumAlumniCareerPage />,
                  },
                  {
                    path: 'create-post',
                    element: <ForumAlumniCreatePostPage />,
                  },
                  {
                    path: ':threadId',
                    element: <ForumAlumniThreadPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: 'contact',
        element: <ContactPage />,
      },
      {
        path: 'honors',
        children: [
          {
            index: true,
            element: <HonorsPage />,
          },
          {
            path: 'alumni',
            element: <HonorsAlumniPage />,
          },
          {
            path: 'achievements',
            element: <HonorsAchievementsPage />,
          },
          {
            path: 'request-achievements',
            element: <HonorsRequestAchievementsPage />,
          },
        ],
      },
      {
        path: 'post',
        element: <PostArticlePage />,
      },
      {
        path: 'article',
        element: <ArticlePage />,
      },
      {
        path: 'notifications',
        element: <NotificationPage />,
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'faculties',
        children: [
          {
            index: true,
            element: <FacultiesPage />,
          },
          {
            path: 'information-technology',
            element: <FacultyCNTTPage />,
          },
        ],
      },
      {
        path: 'donations',
        children: [
          {
            index: true,
            element: <DonationPage />,
          },
          {
            path: 'create',
            element: <CreateDonationPage />,
          },
          {
            path: ':id',
            element: <DetailDonationPage />,
          },
        ],
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
      {
        path: 'signup-code',
        element: (
          <PublicRoute>
            <SignupCodePage />
          </PublicRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <PublicRoute>
            <ResetPasswordPage />
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