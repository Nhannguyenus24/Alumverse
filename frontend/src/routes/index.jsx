import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RequireSlugRoute from "./RequireSlugRoute";
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
const OrganizationRegistrationPage = Loadable(
  lazy(() => import("../pages/authentication/OrganizationRegistrationPage")),
);

// Alumni pages
const DashboardPage = Loadable(
  lazy(() => import("../pages/alumni/DashboardPage")),
);
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

const ArticlePage = Loadable(
  lazy(() => import("../pages/alumni/ArticlePage")));

// Admin pages
const AdminLayout = Loadable(lazy(() => import("../layouts/AdminLayout")));
const AdminDashboardPage = Loadable(lazy(() => import("../pages/admin/AdminDashboardPage")));
const AdminUsersListPage = Loadable(lazy(() => import("../pages/admin/AdminUsersListPage")));
const AdminUserDetailPage = Loadable(lazy(() => import("../pages/admin/AdminUserDetailPage")));
const AdminForumPostsPage = Loadable(lazy(() => import("../pages/admin/AdminForumPostsPage")));
const AdminForumTopicsPage = Loadable(lazy(() => import("../pages/admin/AdminForumTopicsPage")));
const AdminForumCategoriesPage = Loadable(lazy(() => import("../pages/admin/AdminForumCategoriesPage")));
const AdminOrganizationsPage = Loadable(lazy(() => import("../pages/admin/AdminOrganizationsPage")));
const AdminEventsPage = Loadable(lazy(() => import("../pages/admin/AdminEventsPage")));
const AdminMentorshipPage = Loadable(lazy(() => import("../pages/admin/AdminMentorshipPage")));
const AdminFundraisingsPage = Loadable(lazy(() => import("../pages/admin/AdminFundraisingsPage")));
const AdminAuditLogsPage = Loadable(lazy(() => import("../pages/admin/AdminAuditLogsPage")));

const CreateDonationPage = Loadable(
  lazy(() => import("../pages/admin/CreateDonationPage")),
);
const EditDonationPage = Loadable(
  lazy(() => import("../pages/admin/EditDonationPage")),
);

// Donation pages
const DonationPage = Loadable(
  lazy(() => import("../pages/donation/DonationPage")),
);
const DetailDonationPage = Loadable(
  lazy(() => import("../pages/alumni/DetailDonationPage")),
);

// Honors pages
const HonorsPage = Loadable(
  lazy(() => import("../pages/honors/HonorsPage"))
);
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
const MentorshipProfilePage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipProfilePage")),
);
const MentorshipProfileEditPage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipProfileEditPage")),
);
const MentorshipChatPage = Loadable(
  lazy(() => import("../pages/mentorship/MentorshipChatPage")),
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

// User pages
const PostArticlePage = Loadable(
  lazy(() => import("../pages/user/PostArticlePage")),
);
const PostArticleAlumniPage = Loadable(
  lazy(() => import("../pages/user/PostArticleAlumniPage")),
);
const PostArticleEventPage = Loadable(
  lazy(() => import("../pages/user/PostArticleEventPage")),
);
const PostArticleAchievementPage = Loadable(
  lazy(() => import("../pages/user/PostArticleAchievementPage")),
);
const PostArticleJobPage = Loadable(
  lazy(() => import("../pages/user/PostArticleJobPage")),
);
const PostArticleLearningPage = Loadable(
  lazy(() => import("../pages/user/PostArticleLearningPage")),
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
                    element: (
                      <Navigate
                        to="../create-topic"
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
          }
        ],
      },
      {
        path: "network/search",
        element: <NetworkPage />,
      },
      {
        path: "network/chat",
        element: <NetworkPage />,
      },
      {
        path: "post",
        element: <PostArticlePage />,
      },
      {
        path: "post/alumni",
        element: <PostArticleAlumniPage />,
      },
      {
        path: "post/event",
        element: <PostArticleEventPage />,
      },
      {
        path: "post/achievement",
        element: <PostArticleAchievementPage />,
      },
      {
        path: "post/job",
        element: <PostArticleJobPage />,
      },
      {
        path: "post/learning",
        element: <PostArticleLearningPage />,
      },
      {
        path: "post/donation",
        element: <PostArticleDonationPage />,
      },
      {
        path: "article/:id",
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
            path: 'academics',
            element: <DevelopmentAcademicsPage />,
          },
          {
            path: 'jobs',
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
                path: "dashboard",
                element: <MentorshipDashboardPage />,
              },
              {
                path: "profile",
                children: [
                  {
                    index: true,
                    element: <MentorshipProfilePage />,
                  },
                  {
                    path: "edit",
                    element: <MentorshipProfileEditPage />,
                  }
                ],
              },
              {
                path: "calendar",
                element: <MentorshipYourCalendarPage />,
              },
              {
                path: "mentors/:mentorId/book",
                element: <MentorshipBookingPage />,
              },
              {
                path: "my-bookings",
                element: <MentorshipMyBookingsPage />,
              },
              {
                path: "signup",
                element: <MentorshipSignupPage />,
              },
              {
                path: "chat",
                children: [
                  {
                    index: true,
                    element: <MentorshipChatPage />,
                    handle: { hideFooter: true },
                  },
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
        path: "admin",
        element: (
          <ProtectedRoute>
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
              <ProtectedRoute>
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
            element: <AdminForumPostsPage />,
          },
          {
            path: "forum/topics",
            element: (
              <ProtectedRoute>
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
            path: "create",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <CreateDonationPage />
              </ProtectedRoute>
            ),
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
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
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
        element: <AdminForumPostsPage />,
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