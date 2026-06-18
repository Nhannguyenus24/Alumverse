import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Box, CircularProgress } from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RequireSlugRoute from "./RequireSlugRoute";
import LoadingScreen from "../components/LoadingScreen";
import { Loadable, AuthLoadable } from "./loadable";
import MentorshipFullAccessGate from "../components/mentorship/MentorshipFullAccessGate";
import MentorshipBookingGate from "../components/mentorship/MentorshipBookingGate";

if (typeof window !== "undefined") {
  queueMicrotask(() => {
    void import("../pages/authentication/LoginPage");
  });
}

// Public pages
const HomePage = Loadable(lazy(() => import("../pages/public/HomePage")));
const IntroducePage = Loadable(
  lazy(() => import("../pages/public/IntroducePage")),
);
const ContactPage = Loadable(lazy(() => import("../pages/public/ContactPage")));
const FacultiesPage = Loadable(
  lazy(() => import("../pages/public/FacultiesPage")),
);

// Authentication pages (light fallback — see AuthLoadable)
const LoginPage = AuthLoadable(
  lazy(() => import("../pages/authentication/LoginPage")),
);
const RegisterPage = AuthLoadable(
  lazy(() => import("../pages/authentication/RegisterPage")),
);
const SignupCodePage = AuthLoadable(
  lazy(() => import("../pages/authentication/SignupCodePage")),
);
const ForgotPasswordPage = AuthLoadable(
  lazy(() => import("../pages/authentication/ForgotPasswordPage")),
);
const ResetPasswordPage = AuthLoadable(
  lazy(() => import("../pages/authentication/ResetPasswordPage")),
);
const OrganizationRegistrationPage = Loadable(
  lazy(() => import("../pages/authentication/OrganizationRegistrationPage")),
);

// Alumni pages
const FacultyCNTTPage = Loadable(
  lazy(() => import("../pages/alumni/FacultyCNTTPage")),
);
const ForumPage = Loadable(lazy(() => import("../pages/alumni/ForumPage")));
const ForumCategoryPage = Loadable(
  lazy(() => import("../pages/alumni/ForumCategoryPage")),
);
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

const MyProfilePage = Loadable(
  lazy(() => import("../pages/user/MyProfilePage")),
);
const MyProfileEditPage = Loadable(
  lazy(() => import("../pages/user/MyProfileEditPage")),
);

const MyTicketsPage = Loadable(
  lazy(() => import("../pages/user/MyTicketsPage")),
);

// Admin pages
const AdminLayout = Loadable(lazy(() => import("../layouts/AdminLayout")));
const AdminLoginPage = Loadable(
  lazy(() => import("../pages/admin/AdminLoginPage")),
);
const AdminDashboardPage = Loadable(
  lazy(() => import("../pages/admin/AdminDashboardPage")),
);
const AdminUsersListPage = Loadable(
  lazy(() => import("../pages/admin/AdminUsersListPage")),
);
const AdminUserDetailPage = Loadable(
  lazy(() => import("../pages/admin/AdminUserDetailPage")),
);
const AdminForumPostsPage = Loadable(
  lazy(() => import("../pages/admin/AdminForumPostsPage")),
);
const AdminForumTopicsPage = Loadable(
  lazy(() => import("../pages/admin/AdminForumTopicsPage")),
);
const AdminForumCategoriesPage = Loadable(
  lazy(() => import("../pages/admin/AdminForumCategoriesPage")),
);
const AdminOrganizationsPage = Loadable(
  lazy(() => import("../pages/admin/AdminOrganizationsPage")),
);
const AdminEventsPage = Loadable(
  lazy(() => import("../pages/admin/AdminEventsPage")),
);
const AdminEventOrganizePage = Loadable(
  lazy(() => import("../pages/admin/AdminEventOrganizePage")),
);
const AdminSchoolFeedbackPage = Loadable(
  lazy(() => import("../pages/admin/AdminSchoolFeedbackPage")),
);
const AdminVerificationsPage = Loadable(
  lazy(() => import("../pages/admin/AdminVerificationsPage")),
);
const AdminMentorshipPage = Loadable(
  lazy(() => import("../pages/admin/AdminMentorshipPage")),
);
const AdminArticlesPage = Loadable(
  lazy(() => import("../pages/admin/AdminArticlesPage")),
);
const AdminEditArticlePage = Loadable(
  lazy(() => import("../pages/admin/AdminEditArticlePage")),
);
const AdminFundraisingsPage = Loadable(
  lazy(() => import("../pages/admin/AdminFundraisingsPage")),
);
const AdminFundReceivingInfosPage = Loadable(
  lazy(() => import("../pages/admin/AdminFundReceivingInfosPage")),
);
const AdminAuditLogsPage = Loadable(
  lazy(() => import("../pages/admin/AdminAuditLogsPage")),
);

const EditDonationPage = Loadable(
  lazy(() => import("../pages/admin/EditDonationPage")),
);

// Donation pages
const DonationPage = Loadable(
  lazy(() => import("../pages/donation/DonationPage")),
);
const DonationArticlePage = Loadable(
  lazy(() => import("../pages/donation/DonationArticlePage")),
);
const DonationDetailPage = Loadable(
  lazy(() => import("../pages/donation/DonationDetailPage")),
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

// Activities pages
const ActivitiesPage = Loadable(
  lazy(() => import("../pages/activities/ActivitiesPage")),
);
const ActivitiesEventsPage = Loadable(
  lazy(() => import("../pages/activities/ActivitiesEventsPage")),
);
const ActivitiesNewsPage = Loadable(
  lazy(() => import("../pages/activities/ActivitiesNewsPage")),
);
const NetworkPage = Loadable(
  lazy(() => import("../pages/network/NetworkPage")),
);
const NetworkIncomingRequestsPage = Loadable(
  lazy(() => import("../pages/network/NetworkIncomingRequestsPage")),
);
const NetworkConnectionsPage = Loadable(
  lazy(() => import("../pages/network/NetworkConnectionsPage")),
);
const NetworkRestrictedConnectionsPage = Loadable(
  lazy(() => import("../pages/network/NetworkRestrictedConnectionsPage")),
);
const ChatPage = Loadable(
  lazy(() => import("../pages/chat/ChatPage")),
);

// Development pages
const DevelopmentPage = Loadable(
  lazy(() => import("../pages/development/DevelopmentPage")),
);
const DevelopmentAcademicsPage = Loadable(
  lazy(() => import("../pages/development/DevelopmentAcademicsPage")),
);
const DevelopmentJobsPage = Loadable(
  lazy(() => import("../pages/development/DevelopmentJobsPage")),
);

// Mentorship pages
const MentorshipPage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipPage")),
);
const MentorshipDashboardPage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipDashboardPage")),
);
const MentorshipYourCalendarPage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipYourCalendarPage")),
);
const MentorshipBookingPage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipBookingPage")),
);
const MentorshipMyBookingsPage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipMyBookingsPage")),
);
const MentorshipSignupPage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipSignupPage")),
);
const MenteeSignupPage = Loadable(
  lazy(() => import("../pages/mentorship/MenteeSignupPage")),
);

// User pages
const PostArticlePage = Loadable(
  lazy(() => import("../pages/user/PostArticlePage")),
);
const PostArticleGenericPage = Loadable(
  lazy(() => import("../pages/user/PostArticleGenericPage")),
);
const PostArticleEventPage = Loadable(
  lazy(() => import("../pages/user/PostArticleEventPage")),
);
const PostArticleDonationPage = Loadable(
  lazy(() => import("../pages/user/PostArticleDonationPage")),
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
    path: "/:slug",
    element: (
      <RequireSlugRoute>
        <MainLayout />
      </RequireSlugRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "introduction",
        children: [
          {
            index: true,
            element: <IntroducePage />,
          },
          {
            path: "leaders",
            element: <IntroducePage />,
          },
          {
            path: "team",
            element: <IntroducePage />,
          },
        ],
      },
      {
        path: "forum",
        children: [
          {
            index: true,
            element: <ForumPage />,
          },
          {
            path: "category/:categoryId",
            element: <ForumCategoryPage />,
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
                    element: <Navigate to="../create-topic" replace />,
                  },
                  {
                    path: "create-topic",
                    element: <ForumAlumniCreateTopicPage />,
                  },
                  {
                    path: ":threadId",
                    element: <ForumAlumniThreadPage />,
                  },
                  {
                    path: ":threadId/page/:pageId",
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
        path: "activities",
        children: [
          {
            index: true,
            element: <ActivitiesPage />,
          },
          {
            path: "events",
            element: <ActivitiesEventsPage />,
          },
          {
            path: "news",
            element: <ActivitiesNewsPage />,
          },
        ],
      },
      {
        path: "search",
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <NetworkPage />,
          },
          {
            path: "requests",
            element: <NetworkIncomingRequestsPage />,
          },
          {
            path: "connections",
            element: <NetworkConnectionsPage />,
          },
          {
            path: "restricted-connections",
            element: <NetworkRestrictedConnectionsPage />,
          },
        ],
      },
      {
        path: "chat",
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        children: [
          {
            index: true,
            element: <MyProfilePage />,
          },
          {
            path: "edit",
            element: <MyProfileEditPage />,
          },
          {
            path: ":id",
            element: <MyProfilePage />,
          },
        ],
      },
      {
        path: "my-tickets",
        children: [
          {
            index: true,
            element: <MyTicketsPage />,
          },
        ],
      },
      {
        path: "post",
        element: <PostArticlePage />,
      },
      {
        path: "post/event",
        element: <PostArticleEventPage />,
      },
      {
        path: "post/:channel",
        element: <PostArticleGenericPage />,
      },
      {
        path: "post/donation",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <PostArticleDonationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "article/:channel/:id",
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
        path: "organization-registration",
        element: (
          <ProtectedRoute>
            <OrganizationRegistrationPage />
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
          {
            index: true,
            element: <DevelopmentPage />,
          },
          {
            path: "academics",
            element: <DevelopmentAcademicsPage />,
          },
          {
            path: "jobs",
            element: <DevelopmentJobsPage />,
          },
          {
            path: "mentorship",
            children: [
              {
                index: true,
                element: <MentorshipPage />,
                handle: { hideFooter: true },
              },
              {
                path: "browse",
                element: <Navigate to=".." replace />,
              },
              {
                path: "dashboard",
                element: <MentorshipDashboardPage />,
              },
              {
                path: "profile",
                children: [
                  {
                    index: true,
                    element: <MyProfilePage />,
                  },
                  {
                    path: "edit",
                    element: <MyProfileEditPage />,
                  },
                ],
              },
              {
                path: "calendar",
                element: <MentorshipYourCalendarPage />,
              },
              {
                path: "mentors/:mentorId",
                element: <MyProfilePage />,
              },
              {
                path: "mentors/:mentorId/book",
                element: (
                  <MentorshipBookingGate>
                    <MentorshipBookingPage />
                  </MentorshipBookingGate>
                ),
              },
              {
                path: "my-bookings",
                element: (
                  <MentorshipFullAccessGate>
                    <MentorshipMyBookingsPage />
                  </MentorshipFullAccessGate>
                ),
              },
              {
                path: "signup",
                element: (
                  <MentorshipFullAccessGate>
                    <MentorshipSignupPage />
                  </MentorshipFullAccessGate>
                ),
              },
              {
                path: "mentee-signup",
                element: (
                  <MentorshipFullAccessGate>
                    <MenteeSignupPage />
                  </MentorshipFullAccessGate>
                ),
              },
            ],
          },
        ],
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          },
          {
            path: "users",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminUsersListPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "users/:userId",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminUserDetailPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "forum/posts",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
                <AdminForumPostsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "forum/topics",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminForumTopicsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "forum/categories",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminForumCategoriesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "organizations",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminOrganizationsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "events",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminEventsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "events/:eventId/organize",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminEventOrganizePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "feedbacks",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminSchoolFeedbackPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "verifications",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminVerificationsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "mentorship",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminMentorshipPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "fundraising",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminFundraisingsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "fundraising/bank-accounts",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminFundReceivingInfosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "article",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
                <AdminArticlesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "article/:channel/:id/edit",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
                <AdminEditArticlePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "audit-logs",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminAuditLogsPage />
              </ProtectedRoute>
            ),
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
            path: ":id/edit",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <EditDonationPage />
              </ProtectedRoute>
            ),
          },
          {
            path: ":id/contribute",
            element: <DonationDetailPage />,
          },
          {
            path: ":id",
            element: <DonationArticlePage />,
          },
        ],
      },
    ],
  },
  {
    path: "/:slug/auth",
    element: (
      <RequireSlugRoute>
        <AuthLayout />
      </RequireSlugRoute>
    ),
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
    path: "/admin/login",
    element: <AdminLoginPage />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: "users",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminUsersListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "users/:userId",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminUserDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "forum/posts",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
            <AdminForumPostsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "forum/topics",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminForumTopicsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "forum/categories",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminForumCategoriesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "organizations",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminOrganizationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "events",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminEventsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "feedbacks",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminSchoolFeedbackPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "verifications",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminVerificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "mentorship",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminMentorshipPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "fundraising",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminFundraisingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "fundraising/bank-accounts",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminFundReceivingInfosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "article",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
            <AdminArticlesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "article/:channel/:id/edit",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
            <AdminEditArticlePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "audit-logs",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminAuditLogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "analytics",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/",
    element: <Navigate to="/404" replace />,
  },
  {
    path: "/404",
    element: <NotFoundPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    path: "/500",
    element: <ServerErrorPage />,
  },
  {
    path: "/maintenance",
    element: <MaintenancePage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
