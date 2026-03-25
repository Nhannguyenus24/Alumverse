import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import LoadingScreen from "../components/LoadingScreen";

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

// Public pages
const HomePage = Loadable(lazy(() => import("../pages/public/HomePage")));
const IntroducePage = Loadable(
  lazy(() => import("../pages/public/IntroducePage")),
);
const ContactPage = Loadable(lazy(() => import("../pages/public/ContactPage")));
const FacultiesPage = Loadable(
  lazy(() => import("../pages/public/FacultiesPage")),
);

// Authentication pages
const LoginPage = Loadable(
  lazy(() => import("../pages/authentication/LoginPage")),
);
const RegisterPage = Loadable(
  lazy(() => import("../pages/authentication/RegisterPage")),
);
const SignupCodePage = Loadable(
  lazy(() => import("../pages/authentication/SignupCodePage")),
);
const ForgotPasswordPage = Loadable(
  lazy(() => import("../pages/authentication/ForgotPasswordPage")),
);
const ResetPasswordPage = Loadable(
  lazy(() => import("../pages/authentication/ResetPasswordPage")),
);

// Alumni pages
const DashboardPage = Loadable(
  lazy(() => import("../pages/alumni/DashboardPage")),
);
const FacultyCNTTPage = Loadable(
  lazy(() => import("../pages/alumni/FacultyCNTTPage")),
);
const ForumPage = Loadable(lazy(() => import("../pages/alumni/ForumPage")));
const ForumAlumniCareerPage = Loadable(
  lazy(() => import("../pages/alumni/ForumAlumniCareerPage")),
);
const ForumAlumniThreadPage = Loadable(
  lazy(() => import("../pages/alumni/ForumAlumniThreadPage")),
);
const ForumAlumniCreateTopicPage = Loadable(
  lazy(() => import("../pages/alumni/ForumAlumniCreateTopicPage")),
);
const ArticlePage = Loadable(lazy(() => import("../pages/alumni/ArticlePage")));

// Admin pages
const CreateDonationPage = Loadable(
  lazy(() => import("../pages/admin/CreateDonationPage")),
);

// Donation pages
const DonationPage = Loadable(
  lazy(() => import("../pages/donation/DonationPage")),
);
const DetailDonationPage = Loadable(
  lazy(() => import("../pages/alumni/DetailDonationPage")),
);

// Honors pages
const HonorsPage = Loadable(lazy(() => import("../pages/honors/HonorsPage")));
const HonorsAlumniPage = Loadable(
  lazy(() => import("../pages/honors/HonorsAlumniPage")),
);
const HonorsAchievementsPage = Loadable(
  lazy(() => import("../pages/honors/HonorsAchievementsPage")),
);
const HonorsRequestAchievementsPage = Loadable(
  lazy(() => import("../pages/honors/HonorsRequestAchievementsPage")),
);

// Mentorship pages
const MentorshipPage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipPage")),
);
const MentorshipSearchPage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipSearchPage")),
);
const MentorshipProfilePage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipProfilePage")),
);
const MentorshipChatPage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipChatPage")),
);

// User pages
const PostArticlePage = Loadable(
  lazy(() => import("../pages/user/PostArticlePage")),
);
const NotificationPage = Loadable(
  lazy(() => import("../pages/user/NotificationPage")),
);
const SettingPage = Loadable(lazy(() => import("../pages/user/SettingPage")));

// Error pages
const NotFoundPage = Loadable(
  lazy(() => import("../pages/error/NotFoundPage")),
);
const UnauthorizedPage = Loadable(
  lazy(() => import("../pages/error/UnauthorizedPage")),
);
const ServerErrorPage = Loadable(
  lazy(() => import("../pages/error/ServerErrorPage")),
);
const MaintenancePage = Loadable(
  lazy(() => import("../pages/error/MaintenancePage")),
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "introduction",
        element: <IntroducePage />,
      },
      {
        path: "forum",
        children: [
          {
            index: true,
            element: <ForumPage />,
          },
          {
            path: "alumni",
            children: [
              {
                path: "career",
                children: [
                  {
                    index: true,
                    element: <ForumAlumniCareerPage />,
                  },
                  {
                    path: "create-post",
                    element: (
                      <Navigate
                        to="/forum/alumni/career/create-topic"
                        replace
                      />
                    ),
                  },
                  {
                    path: "create-topic",
                    element: <ForumAlumniCreateTopicPage />,
                  },
                  {
                    path: ":threadId",
                    element: <ForumAlumniThreadPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "contact",
        element: <ContactPage />,
      },
      {
        path: "honors",
        children: [
          {
            index: true,
            element: <HonorsPage />,
          },
          {
            path: "alumni",
            element: <HonorsAlumniPage />,
          },
          {
            path: "achievements",
            element: <HonorsAchievementsPage />,
          },
          {
            path: "request-achievements",
            element: <HonorsRequestAchievementsPage />,
          },
        ],
      },
      {
        path: "chances",
        children: [
          {
            index: true,
          },
          {
            path: "mentorship",
            children: [
              {
                index: true,
                element: <MentorshipPage />,
              },
              {
                path: "search",
                element: <MentorshipSearchPage />,
              },
              {
                path: "dashboard",
              },
              {
                path: "profile",
                element: <MentorshipProfilePage />,
              },
              {
                path: "calendar",
              },
              {
                path: "appointment",
              },
            ],
          },
        ],
      },
      {
        path: "post",
        element: <PostArticlePage />,
      },
      {
        path: "article",
        element: <ArticlePage />,
      },
      {
        path: "notifications",
        element: <NotificationPage />,
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <SettingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "faculties",
        children: [
          {
            index: true,
            element: <FacultiesPage />,
          },
          {
            path: "information-technology",
            element: <FacultyCNTTPage />,
          },
        ],
      },
      {
        path: "development",
        children: [
          // {
          //   path: 'scholarships',
          //   element: <ScholarshipsPage />,
          // },
          {
            path: "mentorship",
            children: [
              {
                index: true,
                element: <MentorshipPage />,
                handle: { hideFooter: true },
              },
              {
                path: "chat",
                children: [
                  {
                    path: ":chatId",
                    element: <MentorshipChatPage />,
                    handle: { hideFooter: true },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "donations",
        children: [
          {
            index: true,
            element: <DonationPage />,
          },
          {
            path: "create",
            element: <CreateDonationPage />,
          },
          {
            path: ":id",
            element: <DetailDonationPage />,
          },
        ],
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
      {
        path: "500",
        element: <ServerErrorPage />,
      },
      {
        path: "maintenance",
        element: <MaintenancePage />,
      },
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: "register",
        element: (
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        ),
      },
      {
        path: "signup-code",
        element: (
          <PublicRoute>
            <SignupCodePage />
          </PublicRoute>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        ),
      },
      {
        path: "reset-password",
        element: (
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
