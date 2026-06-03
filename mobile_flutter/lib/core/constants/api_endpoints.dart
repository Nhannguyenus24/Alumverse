class ApiEndpoints {
  ApiEndpoints._();

  // ===========================================================================
  // PUBLIC / USER ENDPOINTS
  // ===========================================================================

  // --- Organization ---
  static const String organizations = '/api/organizations';
  static String organizationBySlug(String slug) => '/api/organizations/$slug';
  static String organizationIntroduction(int orgId) => '/api/organizations/$orgId/introduction';
  static String organizationFeedbacks(int orgId) => '/api/organizations/$orgId/feedbacks';
  static String trustedVerifiers(int orgId) => '/api/organizations/$orgId/trusted-verifiers';

  // --- Auth ---
  static const String authLogin = '/api/auth/login';
  static const String authRegister = '/api/auth/register';
  static const String authRefresh = '/api/auth/refresh';
  static const String authLogout = '/api/auth/logout';
  static const String authGoogle = '/api/auth/google';
  static const String authMe = '/api/auth/me';

  // --- User Settings / Me ---
  static const String meProfile = '/api/users/me/profile';
  static const String mePassword = '/api/users/me/password';
  static const String meOrganizationMember = '/api/users/me/organization-member';
  static const String meNotificationSettings = '/api/users/me/notification-settings';
  static const String meLoginHistory = '/api/users/me/login-history';
  static const String meVerificationRequests = '/api/users/me/verification-requests';
  static const String meNotifications = '/api/users/me/notifications';
  static String meNotificationRead(String id) => '/api/users/me/notifications/$id/read';
  static String meNotificationDelete(String id) => '/api/users/me/notifications/$id';
  
  // Peer Verification
  static const String peerVerificationRequest = '/api/users/me/peer-verifications/request';
  static const String peerVerificationPending = '/api/users/me/peer-verifications/pending';
  static String peerVerificationAccept(String id) => '/api/users/me/peer-verifications/$id/accept';

  // --- Chat ---
  static const String chatGroups = '/api/chat/groups';
  static const String chatPrivateList = '/api/chat/private/list';
  static String chatGroupMessages(String groupId) => '/api/chat/groups/$groupId/messages';
  static const String chatRecentPreviews = '/api/chat/recent-previews';
  static const String chatConnectionStatus = '/api/chat/conversation-requests/connection-status';
  static const String chatConversationRequests = '/api/chat/conversation-requests';
  static const String chatConversationRequestRespond = '/api/chat/conversation-requests/respond';
  static const String chatConversationRequestSearch = '/api/chat/conversation-requests/search';
  static const String networkMembers = '/api/chat/network/members';

  // --- Forum ---
  static const String forumCategories = '/api/forum/categories';
  static const String forumTopics = '/api/forum/topics';
  static const String forumPosts = '/api/forum/posts';

  // --- Events ---
  static const String events = '/api/events';
  static String eventDetail(int id) => '/api/events/$id';
  static String eventPublish(int id) => '/api/events/$id/publish';
  static String eventUnpublish(int id) => '/api/events/$id/unpublish';

  // --- Mentorship ---
  static const String mentorshipMenteeProfile = '/api/mentorship/mentee-profile';
  static const String mentorshipMentors = '/api/mentorship/mentors';
  static const String mentorshipMentorSearch = '/api/mentorship/mentors/search';
  static const String mentorshipMentorFilter = '/api/mentorship/mentors/filter';
  static const String mentorshipExpertiseTopics = '/api/mentorship/expertise/topics';
  static const String mentorshipExpertiseCategories = '/api/mentorship/expertise/categories';
  static String mentorshipMentorExpertise(int memberId) => '/api/mentorship/mentors/$memberId/expertise';
  static String mentorshipMentorAvailability(int memberId) => '/api/mentorship/mentors/$memberId/availability';
  static String mentorshipMentorFeedbacks(int memberId) => '/api/mentorship/mentors/$memberId/feedbacks';
  static const String mentorshipSessions = '/api/mentorship/sessions';
  static const String mentorshipSessionsMentee = '/api/mentorship/sessions/mentee';
  static const String mentorshipSessionsMentor = '/api/mentorship/sessions/mentor';
  static String mentorshipSessionDetail(int id) => '/api/mentorship/sessions/$id';
  static String mentorshipSessionCancel(int id) => '/api/mentorship/sessions/$id/cancel';
  static String mentorshipSessionFeedback(int id) => '/api/mentorship/sessions/$id/feedback';
  static String mentorshipSessionStatus(int id) => '/api/mentorship/sessions/$id/status';
  static const String mentorshipProfile = '/api/mentorship/profile';
  static const String mentorshipProfileDraft = '/api/mentorship/profile/draft';
  static const String mentorshipExpertise = '/api/mentorship/expertise';
  static String mentorshipExpertiseDelete(int id) => '/api/mentorship/expertise/$id';
  static const String mentorshipAvailability = '/api/mentorship/availability';
  static String mentorshipAvailabilityDelete(int id) => '/api/mentorship/availability/$id';
  static const String mentorshipFeedbacks = '/api/mentorship/feedbacks';
  static const String mentorshipCvUpload = '/api/mentorship/cv/upload';

  // --- Funds ---
  static const String funds = '/api/funds';
  static String fundDetail(int id) => '/api/funds/$id';
  static String fundClose(int id) => '/api/funds/$id/close';
  static const String fundStatuses = '/api/fund-statuses';
  static const String fundStatistics = '/api/funds/statistics';
  static const String fundReceivingActive = '/api/funds/receiving-infos/active';
  static const String fundDonations = '/api/fund-donations';
  static String fundDonationsByFund(int fundId) => '/api/fund-donations/$fundId';

  // ===========================================================================
  // ADMIN ENDPOINTS
  // ===========================================================================

  // --- Admin Organizations ---
  static const String adminOrganizations = '/api/admin/organizations';
  static String adminOrganizationDetail(int id) => '/api/admin/organizations/$id';
  static String adminOrganizationIntroduction(int id) => '/api/admin/organizations/$id/introduction';
  static const String adminOrganizationFeedbacks = '/api/admin/organizations/feedbacks';
  static String adminOrganizationFeedbackRead(int id) => '/api/admin/organizations/feedbacks/$id/read';
  static String adminOrganizationFeatures(int id) => '/api/admin/organizations/$id/features-config';
  static String adminOrganizationToggleFeature(int id, String feature) => '/api/admin/organizations/$id/features-config/features/$feature/toggle';
  static String adminOrganizationPrograms(int id) => '/api/admin/organizations/$id/programs';
  static String adminOrganizationMajors(int id) => '/api/admin/organizations/$id/majors';

  // --- Admin Users ---
  static const String adminUsers = '/api/admin/users';
  static String adminUserDetail(int id) => '/api/admin/users/$id';
  static String adminUserByOrg(int orgId) => '/api/admin/users/organization/$orgId';
  static const String adminUserBan = '/api/admin/users/ban';
  static const String adminUserUnban = '/api/admin/users/unban';
  static const String adminUserAdmins = '/api/admin/users/admins';
  static const String adminUserActivity(int id) => '/api/admin/users/$id/activity';
  static const String adminUserResetPassword(int id) => '/api/admin/users/$id/reset-password';
  static const String adminVerificationRequests = '/api/admin/users/verification-requests';
  static String adminUserVerificationRequests(int id) => '/api/admin/users/$id/verification-requests';
  static String adminReviewVerificationRequest(int id) => '/api/admin/users/verification-requests/$id';
  static const String adminOrganizationMember = '/api/admin/users/organization-member';

  // --- Admin Audit ---
  static const String adminAuditLoginHistory = '/api/admin/audit/login-history';
  static String adminAuditLoginHistoryUser(int id) => '/api/admin/audit/login-history/user/$id';
  static const String adminAuditLoginStats = '/api/admin/audit/login-history/stats';
  static const String adminAuditSuspiciousLogins = '/api/admin/audit/login-history/suspicious';

  // --- Admin Mentorship ---
  static const String adminMentorshipSessions = '/api/admin/mentorship/sessions';
  static const String adminMentorshipSessionsByStatus = '/api/admin/mentorship/sessions/by-status';
  static String adminMentorshipSessionDetail(int id) => '/api/admin/mentorship/sessions/$id';
  static String adminMentorshipSessionStatus(int id) => '/api/admin/mentorship/sessions/$id/status';
  static const String adminMentorshipMentors = '/api/admin/mentorship/mentors';
  static const String adminMentorshipMentorsByApproval = '/api/admin/mentorship/mentors/by-approval';
  static String adminMentorshipApproveMentor(int memberId) => '/api/admin/mentorship/mentors/$memberId/approve';
  static const String adminMentorshipStatistics = '/api/admin/mentorship/statistics';

  // --- Admin Events ---
  static const String adminEvents = '/api/admin/events';
  static String adminEventsByOrg(int orgId) => '/api/admin/events/organization/$orgId';
  static const String adminEventSearch = '/api/admin/events/search';
  static const String adminEventByStatus = '/api/admin/events/by-status';
  static String adminEventDetail(int id) => '/api/admin/events/$id';
  static String adminEventPublish(int id) => '/api/admin/events/$id/publish';
  static String adminEventUnpublish(int id) => '/api/admin/events/$id/unpublish';
  static String adminEventTickets(int id) => '/api/admin/events/$id/tickets';
  static String adminEventCancelTicket(String code) => '/api/admin/events/tickets/$code/cancel';
  static String adminEventInterests(int id) => '/api/admin/events/$id/interests';
  static const String adminEventStatistics = '/api/admin/events/statistics';

  // --- Admin Forum ---
  static const String adminForumStats = '/api/admin/forum/admin/statistics';
  static const String adminForumStatsContributors = '/api/admin/forum/admin/statistics/top-contributors';
  static const String adminForumStatsEngagement = '/api/admin/forum/admin/statistics/engagement';
  static const String adminForumStatsTimeline = '/api/admin/forum/admin/statistics/timeline';
  static const String adminForumPosts = '/api/admin/forum/admin/posts';
  static const String adminForumPostsYesterday = '/api/admin/forum/admin/posts/yesterday/paginated';
  static const String adminForumPostsBanned = '/api/admin/forum/admin/posts/banned/list';
  static String adminForumPostBan(int id) => '/api/admin/forum/admin/posts/$id/ban';
  static String adminForumPostUnban(int id) => '/api/admin/forum/admin/posts/$id/unban';
  static String adminForumPostDelete(int id) => '/api/admin/forum/admin/posts/$id';
  static const String adminForumReports = '/api/admin/forum/reports';
  static String adminForumReportReview(int id) => '/api/admin/forum/reports/$id';
  static String adminForumPostVisibility(int id) => '/api/admin/forum/posts/$id/visibility';
  static const String adminForumCategories = '/api/admin/forum/admin/categories';
  static String adminForumCategoryDetail(int id) => '/api/admin/forum/admin/categories/$id';
  static const String adminForumTopics = '/api/admin/forum/admin/topics';
  static String adminForumTopicDetail(int id) => '/api/admin/forum/admin/topics/$id';
  static String adminForumTopicLock(int id) => '/api/admin/forum/topics/$id/lock';

  // --- WebSocket ---
  static const String wsChat = '/ws/chat';
}
