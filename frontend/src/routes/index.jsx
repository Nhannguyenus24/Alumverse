import { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
} from "react-router";
import { Box, CircularProgress } from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RequireSlugRoute from "./RequireSlugRoute";
import FeatureRoute from "./FeatureRoute";
import PostArticleRouteGuard from "./PostArticleRouteGuard";
import LoadingScreen from "../components/LoadingScreen";
import { Loadable, AuthLoadable } from "./loadable";
import MentorshipFullAccessGate from "../components/mentorship/MentorshipFullAccessGate";
import MentorshipBookingGate from "../components/mentorship/MentorshipBookingGate";
import MentorshipApprovedMentorGate from "../components/mentorship/MentorshipApprovedMentorGate";
import ChatAccessGate from "../components/network/ChatAccessGate";
import MentorshipLegacyRedirect from "../components/MentorshipLegacyRedirect";

if (typeof window !== "undefined") {
  queueMicrotask(() => {
    void import("../pages/authentication/LoginPage");
  });
}

// Public pages
const HomePage = Loadable(lazy(() => import("../pages/public/HomePage")));
const OrganizationSelectionPage = Loadable(
  lazy(() => import("../pages/public/OrganizationSelectionPage")),
);
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
const ForceChangePasswordPage = AuthLoadable(
  lazy(() => import("../pages/authentication/ForceChangePasswordPage")),
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
const SavedArticlesPage = Loadable(
  lazy(() => import("../pages/user/SavedArticlesPage")),
);
const SavedEventsPage = Loadable(
  lazy(() => import("../pages/user/SavedEventsPage")),
);

// Admin pages
const AdminLayout = Loadable(lazy(() => import("../layouts/AdminLayout")));
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
const AdminForumReportsPage = Loadable(
  lazy(() => import("../pages/admin/AdminForumReportsPage")),
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
const AdminEventManagePage = Loadable(
  lazy(() => import("../pages/admin/AdminEventManagePage")),
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
const AdminArticleRequestsPage = Loadable(
  lazy(() => import("../pages/admin/AdminArticleRequestsPage")),
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
const AdminSystemMonitoringPage = Loadable(
  lazy(() => import("../pages/admin/AdminSystemMonitoringPage")),
);
const AdminAuditLogsPage = Loadable(
  lazy(() => import("../pages/admin/AdminAuditLogsPage")),
);
const AdminAIBotConfigPage = Loadable(
  lazy(() => import("../pages/admin/AdminAIBotConfigPage")),
);
const AdminEmailTemplatesPage = Loadable(
  lazy(() => import("../pages/admin/AdminEmailTemplatesPage")),
);

const EditDonationPage = Loadable(
  lazy(() => import("../pages/admin/EditDonationPage")),
);
const AdminEducationRequestsPage = Loadable(
  lazy(() => import("../pages/admin/AdminEducationRequestsPage")),
);
const AdminFormPage = Loadable(
  lazy(() => import("../pages/admin/AdminFormPage")),
);
const AdminSurveyResultsPage = Loadable(
  lazy(() => import("../pages/admin/AdminSurveyResultsPage")),
);
const SurveyFillPage = Loadable(
  lazy(() => import("../pages/user/SurveyFillPage")),
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
const ActivitiesEventsPage = Loadable(
  lazy(() => import("../pages/activities/ActivitiesEventsPage")),
);
const EventConfirmInvitationPage = Loadable(
  lazy(() => import("../pages/activities/EventConfirmInvitationPage")),
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
const ChatPage = Loadable(lazy(() => import("../pages/chat/ChatPage")));

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

const mentorshipRouteChildren = [
  {
    index: true,
    element: <MentorshipPage />,
  },
  {
    path: "browse",
    element: <Navigate to=".." replace />,
  },
  {
    path: "dashboard",
    element: (
      <MentorshipApprovedMentorGate>
        <MentorshipDashboardPage />
      </MentorshipApprovedMentorGate>
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
    ],
  },
  {
    path: "calendar",
    element: (
      <MentorshipApprovedMentorGate>
        <MentorshipYourCalendarPage />
      </MentorshipApprovedMentorGate>
    ),
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
      <MentorshipBookingGate>
        <MentorshipMyBookingsPage />
      </MentorshipBookingGate>
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
];

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
        element: (
          <FeatureRoute feature="forum">
            <Outlet />
          </FeatureRoute>
        ),
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
            path: "topic",
            children: [
              {
                path: "create-post",
                element: <Navigate to="../create-topic" replace />,
              },
              {
                path: "create-topic",
                element: (
                  <ProtectedRoute>
                    <ForumAlumniCreateTopicPage />
                  </ProtectedRoute>
                ),
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
        path: "events",
        element: (
          <FeatureRoute feature="events">
            <ActivitiesEventsPage />
          </FeatureRoute>
        ),
      },
      {
        path: "events/confirm-invitation",
        element: <EventConfirmInvitationPage />,
      },
      {
        path: "news",
        element: <ActivitiesNewsPage />,
      },
      {
        path: "activities/events",
        element: <Navigate to="../events" replace />,
      },
      {
        path: "activities/news",
        element: <Navigate to="../news" replace />,
      },
      {
        path: "network",
        element: <Outlet />,
        children: [
          {
            index: true,
            element: <NetworkPage />,
          },
          {
            path: "requests",
            element: (
              <ProtectedRoute>
                <NetworkIncomingRequestsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "connections",
            element: (
              <ProtectedRoute>
                <NetworkConnectionsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "restricted-connections",
            element: (
              <ProtectedRoute>
                <NetworkRestrictedConnectionsPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "search",
        element: <Navigate to="../network" replace />,
      },
      {
        path: "search/requests",
        element: <Navigate to="../network/requests" replace />,
      },
      {
        path: "search/connections",
        element: <Navigate to="../network/connections" replace />,
      },
      {
        path: "search/restricted-connections",
        element: <Navigate to="../network/restricted-connections" replace />,
      },
      {
        path: "chat",
        handle: { hideFooter: true },
        element: (
          <ProtectedRoute>
            <ChatAccessGate>
              <ChatPage />
            </ChatAccessGate>
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
            element: (
              <ProtectedRoute>
                <MyProfileEditPage />
              </ProtectedRoute>
            ),
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
            element: (
              <ProtectedRoute>
                <MyTicketsPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "saved-articles",
        element: (
          <ProtectedRoute>
            <SavedArticlesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "saved-events",
        element: (
          <ProtectedRoute>
            <SavedEventsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "post",
        element: (
          <ProtectedRoute>
            <PostArticleRouteGuard channel="news">
              <PostArticlePage />
            </PostArticleRouteGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: "post/event",
        element: (
          <ProtectedRoute>
            <PostArticleRouteGuard channel="event">
              <PostArticleEventPage />
            </PostArticleRouteGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: "post/event/:id",
        element: (
          <ProtectedRoute>
            <PostArticleRouteGuard channel="event">
              <PostArticleEventPage />
            </PostArticleRouteGuard>
          </ProtectedRoute>
        ),
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
        path: "post/:channel",
        element: (
          <ProtectedRoute>
            <PostArticleRouteGuard>
              <PostArticleGenericPage />
            </PostArticleRouteGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: "article/:channel/:id",
        element: <ArticlePage />,
      },
      {
        path: "notifications",
        element: (
          <ProtectedRoute>
            <NotificationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "surveys/:surveyId",
        element: (
          <ProtectedRoute>
            <SurveyFillPage mode="fill" />
          </ProtectedRoute>
        ),
      },
      {
        path: "surveys/:surveyId/my-submission",
        element: (
          <ProtectedRoute>
            <SurveyFillPage mode="review" />
          </ProtectedRoute>
        ),
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
            path: "academic",
            element: <Navigate to="../academics" replace />,
          },
          {
            path: "jobs",
            element: (
              <FeatureRoute feature="job">
                <DevelopmentJobsPage />
              </FeatureRoute>
            ),
          },
          {
            path: "mentorship/*",
            element: <MentorshipLegacyRedirect />,
          },
        ],
      },
      {
        path: "mentorship",
        element: (
          <FeatureRoute feature="mentorship">
            <Outlet />
          </FeatureRoute>
        ),
        children: mentorshipRouteChildren,
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
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
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminUsersListPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "users/:userId",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminUserDetailPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "forum/posts",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF", "MODERATOR"]}>
                <AdminForumPostsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "forum/topics",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminForumTopicsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "forum/categories",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminForumCategoriesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "forum/reports",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF", "MODERATOR"]}>
                <AdminForumReportsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "organizations",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminOrganizationsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "events",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminEventsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "events/:eventId",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminEventManagePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "surveys",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminFormPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "surveys/:surveyId/results",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminSurveyResultsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "monitoring",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminSystemMonitoringPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "events/:eventId/organize",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminEventOrganizePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "feedbacks",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminSchoolFeedbackPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "verifications",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminVerificationsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "mentorship",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminMentorshipPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "donations",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminFundraisingsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "donations/bank-accounts",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminFundReceivingInfosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "fundraising",
            element: <Navigate to="../donations" replace />,
          },
          {
            path: "fundraising/bank-accounts",
            element: <Navigate to="../donations/bank-accounts" replace />,
          },
          {
            path: "article",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF", "MODERATOR"]}>
                <AdminArticlesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "submissions",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF", "MODERATOR"]}>
                <AdminArticleRequestsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "article-requests",
            element: <Navigate to="../submissions" replace />,
          },
          {
            path: "article/:channel/:id/edit",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF", "MODERATOR"]}>
                <AdminEditArticlePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "education-requests",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <AdminEducationRequestsPage />
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
            path: "bot-config",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminAIBotConfigPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "email-templates",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminEmailTemplatesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "ai-providers",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Navigate to="../bot-config?tab=providers" replace />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "donations",
        element: (
          <FeatureRoute feature="fund">
            <Outlet />
          </FeatureRoute>
        ),
        children: [
          {
            index: true,
            element: <DonationPage />,
          },
          {
            path: ":id/edit",
            element: (
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
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
      {
        path: "change-password",
        element: (
          <ProtectedRoute>
            <ForceChangePasswordPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/admin/login",
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "/admin/change-password",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <ForceChangePasswordPage />
      </ProtectedRoute>
    ),
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
        path: "forum/reports",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
            <AdminForumReportsPage />
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
        path: "events/:eventId",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminEventManagePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "surveys",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
            <AdminFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "surveys/:surveyId/results",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
            <AdminSurveyResultsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "monitoring",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminSystemMonitoringPage />
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
        path: "donations",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminFundraisingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "donations/bank-accounts",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminFundReceivingInfosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "fundraising",
        element: <Navigate to="../donations" replace />,
      },
      {
        path: "fundraising/bank-accounts",
        element: <Navigate to="../donations/bank-accounts" replace />,
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
        path: "submissions",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
            <AdminArticleRequestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "article-requests",
        element: <Navigate to="../submissions" replace />,
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
        path: "education-requests",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminEducationRequestsPage />
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
        path: "bot-config",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminAIBotConfigPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "email-templates",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminEmailTemplatesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "ai-providers",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Navigate to="../bot-config?tab=providers" replace />
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
    element: <OrganizationSelectionPage />,
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
