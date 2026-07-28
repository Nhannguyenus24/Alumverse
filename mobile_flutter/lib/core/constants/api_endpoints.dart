class ApiEndpoints {
  ApiEndpoints._();

  // ===========================================================================
  // PUBLIC / USER ENDPOINTS
  // ===========================================================================

  // --- Organization ---
  static const String organizations = '/api/organizations';
  static String organizationBySlug(String slug) => '/api/organizations/$slug';
  static String organizationIntroduction(int orgId) =>
      '/api/organizations/$orgId/introduction';
  static String organizationFeedbacks(int orgId) =>
      '/api/organizations/$orgId/feedbacks';
  static String trustedVerifiers(int orgId) =>
      '/api/organizations/$orgId/trusted-verifiers';

  // --- Auth ---
  // Mobile-specific login route: skips the reCAPTCHA verification that the web
  // /api/auth/login enforces (the app has no reCAPTCHA widget).
  static const String authLogin = '/api/auth/mobile/login';
  static const String authRegister = '/api/auth/register';
  static const String authRefresh = '/api/auth/refresh';
  static const String authLogout = '/api/auth/logout';
  static const String authGoogleLogin = '/api/auth/google-login';
  static const String authSendOtp = '/api/auth/send-otp';
  static const String authVerifyOtp = '/api/auth/verify-otp';
  static String authSwitchOrganization(int organizationId) =>
      '/api/auth/switch-organization/$organizationId';
  static String authChangePassword(int userId) => '/api/auth/password/$userId';

  // --- User Settings / Me ---
  static const String meProfile = '/api/users/me/profile';
  static const String meAvatar = '/api/users/me/avatar';
  static const String imageUpload = '/api/images/upload';
  static const String fileUpload = '/api/files/upload';
  static String publicProfile(int userId) =>
      '/api/users/$userId/public-profile';
  static const String mePassword = '/api/users/me/password';
  static const String meOrganizationMember =
      '/api/users/me/organization-member';
  static const String meNotificationSettings =
      '/api/users/me/notification-settings';
  static const String meLoginHistory = '/api/users/me/login-history';
  static const String meVerificationRequests =
      '/api/users/me/verification-requests';
  static const String meNotifications = '/api/users/me/notifications';
  static String meNotificationRead(String id) =>
      '/api/users/me/notifications/$id/read';
  static String meNotificationDelete(String id) =>
      '/api/users/me/notifications/$id';
  static const String meDeviceTokens = '/api/users/me/device-tokens';
  static String meDeviceTokenDelete(String token) =>
      '/api/users/me/device-tokens/$token';

  // Peer Verification
  static const String peerVerificationRequest =
      '/api/users/me/peer-verifications/request';
  static const String peerVerificationPending =
      '/api/users/me/peer-verifications/pending';
  static String peerVerificationAccept(String id) =>
      '/api/users/me/peer-verifications/$id/accept';

  // --- Chat ---
  static const String chatGroups = '/api/chat/groups';
  static const String chatPrivateList = '/api/chat/private/list';
  static String chatGroupMessages(String groupId) =>
      '/api/chat/groups/$groupId/messages';
  static String chatGroupBlockedContext(int groupId) =>
      '/api/chat/groups/$groupId/blocked-members-context';
  static String chatPrivatePeerStatus(int peerMemberId) =>
      '/api/chat/private/$peerMemberId/status';
  static const String chatPrivateCreate = '/api/chat/private/create';
  static const String chatPrivateInfo = '/api/chat/private';
  static const String chatRecentPreviews = '/api/chat/recent-previews';
  static String chatGroupMembers(int groupId) =>
      '/api/chat/groups/$groupId/members';
  static String chatGroupMember(int groupId, int memberId) =>
      '/api/chat/groups/$groupId/members/$memberId';
  static String chatGroupLeave(int groupId) =>
      '/api/chat/groups/$groupId/leave';
  static String chatGroupUpdate(int groupId) => '/api/chat/groups/$groupId';
  static String chatGroupAvatarUpdate(int groupId) =>
      '/api/chat/groups/$groupId/avatar';

  static const String chatConnectionStatus =
      '/api/chat/conversation-requests/connection-status';
  static const String chatConversationRequests =
      '/api/chat/conversation-requests';
  static const String chatConversationRequestRespond =
      '/api/chat/conversation-requests/respond';
  static const String chatConversationRequestSearch =
      '/api/chat/conversation-requests/search';
  static const String networkMembers = '/api/chat/network/members';
  static const String connectionsSearch = '/api/chat/connections/search';
  static const String blocks = '/api/chat/blocks';
  static String blockUser(int memberId) => '/api/chat/blocks/$memberId';

  // --- Forum --- (backend uses singular paths under /api/forum)
  static const String forumCategory = '/api/forum/category';
  static const String forumTopic = '/api/forum/topic';
  static const String forumPost = '/api/forum/post';
  static const String forumPostReact = '/api/forum/post/react';
  static String forumPostAnswer(int postId) => '/api/forum/post/$postId/answer';
  static String forumPostReactionCount(int postId) =>
      '/api/forum/post/$postId/reactions/count';
  static String forumPostUserReaction(int postId) =>
      '/api/forum/post/$postId/reactions/user';

  // --- Articles / News ---
  static const String newsPublished = '/api/articles/news/published';
  static const String alumniPostsPublished =
      '/api/articles/alumni-posts/published';
  static const String achievementsApproved =
      '/api/articles/achievements/status/APPROVED';
  static String newsDetail(int id) => '/api/articles/news/$id';
  static String alumniPostDetail(int id) => '/api/articles/alumni-posts/$id';
  static String achievementDetail(int id) => '/api/articles/achievements/$id';

  // --- Saved items (bookmarked articles) ---
  static const String savedItems = '/api/articles/saved';
  static const String savedItemCheck = '/api/articles/saved/check';
  static String savedItemsByType(String type) =>
      '/api/articles/saved/type/$type';

  // --- Events ---
  static const String events = '/api/events';
  static const String eventsUpcoming = '/api/events/upcoming';
  static const String eventsPast = '/api/events/past';
  static String eventDetail(int id) => '/api/events/$id';
  static String eventInterest(int id) => '/api/events/$id/interest';
  static String eventInterestCheck(int id) => '/api/events/$id/interest/check';
  static String eventCheckRegistered(int id) =>
      '/api/events/$id/check-registered';
  static String eventRegister(int id) => '/api/events/$id/register';
  static String eventQuestions(int id) => '/api/events/$id/questions';
  static String eventStatistics(int id) => '/api/events/$id/statistics';
  static const String eventMyTickets = '/api/events/my-tickets';
  static String eventTicketByCode(String code) =>
      '/api/events/tickets/code/$code';
  static String eventCheckIn(int eventId) =>
      '/api/events/$eventId/tickets/check-in';
  static String eventCancelTicket(String code) =>
      '/api/events/tickets/$code/cancel';
  static String eventPublish(int id) => '/api/events/$id/publish';
  static String eventUnpublish(int id) => '/api/events/$id/unpublish';

  // --- Mentorship (mentee side) ---
  // Backend splits mentee/mentor controllers: `/api/mentorship/mentee/*`
  // and `/api/mentorship/mentor/*`. Do NOT use a flat `/mentorship/...`.
  static const String menteeMentors = '/api/mentorship/mentee/mentors';
  static const String menteeMentorSearch =
      '/api/mentorship/mentee/mentors/search';
  static const String menteeMentorFilter =
      '/api/mentorship/mentee/mentors/filter';
  static const String menteeSkills = '/api/mentorship/mentee/skills';
  static String menteeMentorProfile(int memberId) =>
      '/api/mentorship/mentee/mentors/$memberId';
  static String menteeMentorExpertise(int memberId) =>
      '/api/mentorship/mentee/mentors/$memberId/expertise';
  static String menteeMentorAvailability(int memberId) =>
      '/api/mentorship/mentee/mentors/$memberId/availability';
  static String menteeMentorFeedbacks(int memberId) =>
      '/api/mentorship/mentee/mentors/$memberId/feedbacks';
  static const String menteeProfile = '/api/mentorship/mentee/profile';
  static const String menteeBookSession =
      '/api/mentorship/mentee/sessions/book';
  static const String menteeSessions = '/api/mentorship/mentee/sessions';
  static String menteeSessionDetail(int id) =>
      '/api/mentorship/mentee/sessions/$id';
  static String menteeSessionCancel(int id) =>
      '/api/mentorship/mentee/sessions/$id/cancel';
  static String menteeSessionFeedback(int id) =>
      '/api/mentorship/mentee/sessions/$id/feedback';
  static String menteeMentorFeedbacksPage(int memberId, int page, int limit) =>
      '/api/mentorship/mentee/mentors/$memberId/feedbacks?page=$page&limit=$limit';

  // --- Mentorship (mentor side) ---
  static const String mentorProfile = '/api/mentorship/mentor/profile';
  static const String mentorProfileDraft =
      '/api/mentorship/mentor/profile/draft';
  static const String mentorExpertise = '/api/mentorship/mentor/expertise';
  static const String mentorSessions = '/api/mentorship/mentor/sessions';
  static String mentorSessionStatus(int id) =>
      '/api/mentorship/mentor/sessions/$id/status';
  static const String mentorAvailability =
      '/api/mentorship/mentor/availability';
  static String mentorAvailabilityDelete(int id) =>
      '/api/mentorship/mentor/availability/$id';
  static const String mentorFeedbacks = '/api/mentorship/mentor/feedbacks';
  static const String mentorshipCvExtract = '/api/mentorship/cv/extract';
  static const String mentorshipSkillsExtract =
      '/api/mentorship/skills/extract';

  // --- Funds ---
  static const String funds = '/api/funds';
  static String fundDetail(int id) => '/api/funds/$id';
  static String fundClose(int id) => '/api/funds/$id/close';
  static const String fundStatistics = '/api/funds/statistics';
  static const String fundReceivingActive = '/api/funds/receiving-infos/active';
  static const String fundDonations = '/api/fund-donations';
  static String fundDonationsByFund(int fundId) =>
      '/api/fund-donations/$fundId';
  static String fundDonationsByUser(int userId) =>
      '/api/fund-donations/user/$userId';

  // ===========================================================================
  // ADMIN ENDPOINTS
  // ===========================================================================

  // --- Admin Organizations ---
  static const String adminOrganizations = '/api/admin/organizations';
  static String adminOrganizationDetail(int id) =>
      '/api/admin/organizations/$id';
  static String adminOrganizationIntroduction(int id) =>
      '/api/admin/organizations/$id/introduction';
  static const String adminOrganizationFeedbacks =
      '/api/admin/organizations/feedbacks';
  static String adminOrganizationFeedbackRead(int id) =>
      '/api/admin/organizations/feedbacks/$id/read';
  static String adminOrganizationFeatures(int id) =>
      '/api/admin/organizations/$id/features-config';
  static String adminOrganizationToggleFeature(int id, String feature) =>
      '/api/admin/organizations/$id/features-config/features/$feature/toggle';
  static String adminOrganizationPrograms(int id) =>
      '/api/admin/organizations/$id/programs';
  static String adminOrganizationMajors(int id) =>
      '/api/admin/organizations/$id/majors';

  // --- Admin Users ---
  static const String adminUsers = '/api/admin/users';
  static String adminUserDetail(int id) => '/api/admin/users/$id';
  static String adminUserByOrg(int orgId) =>
      '/api/admin/users/organization/$orgId';
  static const String adminUserBan = '/api/admin/users/ban';
  static const String adminUserUnban = '/api/admin/users/unban';
  static const String adminUserAdmins = '/api/admin/users/admins';
  static String adminUserActivity(int id) => '/api/admin/users/$id/activity';
  static String adminUserResetPassword(int id) =>
      '/api/admin/users/$id/reset-password';
  static const String adminVerificationRequests =
      '/api/admin/users/verification-requests';
  static String adminUserVerificationRequests(int id) =>
      '/api/admin/users/$id/verification-requests';
  static String adminReviewVerificationRequest(int id) =>
      '/api/admin/users/verification-requests/$id';
  static const String adminOrganizationMember =
      '/api/admin/users/organization-member';

  // --- Admin Audit ---
  static const String adminAuditLoginHistory = '/api/admin/audit/login-history';
  static String adminAuditLoginHistoryUser(int id) =>
      '/api/admin/audit/login-history/user/$id';
  static const String adminAuditLoginStats =
      '/api/admin/audit/login-history/stats';
  static const String adminAuditSuspiciousLogins =
      '/api/admin/audit/login-history/suspicious';

  // --- Admin Mentorship ---
  static const String adminMentorshipSessions =
      '/api/admin/mentorship/sessions';
  static const String adminMentorshipSessionsByStatus =
      '/api/admin/mentorship/sessions/by-status';
  static String adminMentorshipSessionDetail(int id) =>
      '/api/admin/mentorship/sessions/$id';
  static String adminMentorshipSessionStatus(int id) =>
      '/api/admin/mentorship/sessions/$id/status';
  static const String adminMentorshipMentors = '/api/admin/mentorship/mentors';
  static const String adminMentorshipMentorsByApproval =
      '/api/admin/mentorship/mentors/by-status';
  static String adminMentorshipApproveMentor(int memberId) =>
      '/api/admin/mentorship/mentors/$memberId/approve';
  static const String adminMentorshipStatistics =
      '/api/admin/mentorship/statistics';

  // --- Admin Events ---
  static const String adminEvents = '/api/admin/events';
  static String adminEventsByOrg(int orgId) =>
      '/api/admin/events/organization/$orgId';
  static const String adminEventSearch = '/api/admin/events/search';
  static const String adminEventByStatus = '/api/admin/events/by-status';
  static String adminEventDetail(int id) => '/api/admin/events/$id';
  static String adminEventPublish(int id) => '/api/admin/events/$id/publish';
  static String adminEventUnpublish(int id) =>
      '/api/admin/events/$id/unpublish';
  static String adminEventTickets(int id) => '/api/admin/events/$id/tickets';
  static String adminEventCancelTicket(String code) =>
      '/api/admin/events/tickets/$code/cancel';
  static String adminEventInterests(int id) =>
      '/api/admin/events/$id/interests';
  static const String adminEventStatistics = '/api/admin/events/statistics';

  // --- Admin Forum ---
  static const String adminForumStats = '/api/admin/forum/admin/statistics';
  static const String adminForumStatsContributors =
      '/api/admin/forum/admin/statistics/top-contributors';
  static const String adminForumStatsEngagement =
      '/api/admin/forum/admin/statistics/engagement';
  static const String adminForumStatsTimeline =
      '/api/admin/forum/admin/statistics/timeline';
  static const String adminForumPosts = '/api/admin/forum/admin/posts';
  static const String adminForumPostsYesterday =
      '/api/admin/forum/admin/posts/yesterday/paginated';
  static const String adminForumPostsBanned =
      '/api/admin/forum/admin/posts/banned/list';
  static String adminForumPostBan(int id) =>
      '/api/admin/forum/admin/posts/$id/ban';
  static String adminForumPostUnban(int id) =>
      '/api/admin/forum/admin/posts/$id/unban';
  static String adminForumPostDelete(int id) =>
      '/api/admin/forum/admin/posts/$id';
  static const String adminForumReports = '/api/admin/forum/reports';
  static String adminForumReportReview(int id) =>
      '/api/admin/forum/reports/$id';
  static String adminForumPostVisibility(int id) =>
      '/api/admin/forum/posts/$id/visibility';
  static const String adminForumCategories =
      '/api/admin/forum/admin/categories';
  static String adminForumCategoryDetail(int id) =>
      '/api/admin/forum/admin/categories/$id';
  static const String adminForumTopics = '/api/admin/forum/admin/topics';
  static String adminForumTopicDetail(int id) =>
      '/api/admin/forum/admin/topics/$id';
  static String adminForumTopicStatus(int id) =>
      '/api/admin/forum/admin/topics/$id/status';

  // --- WebSocket ---
  static const String wsChat = '/ws/chat';
}
