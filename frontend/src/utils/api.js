import apiClient from '../utils/axios';

const unwrap = (response) => response?.data?.data;

// React Query throws if a queryFn resolves with `undefined` — fall back to an
// empty page so a missing/odd response body never crashes paginated list views.
const EMPTY_PAGE = { items: [], totalPage: 0, totalItem: 0 };

const normalizeList = (payload) => {
	if (Array.isArray(payload)) return payload;
	if (payload?.items) return payload.items;
	if (payload?.content) return payload.content;
	return [];
};

const BASE_ADMIN_USERS = '/admin/users';
const BASE_ADMIN_MENTORSHIP = '/admin/mentorship';
const BASE_ADMIN_EVENTS = '/admin/events';
const BASE_ADMIN_FORUM = '/admin/forum/admin';
const BASE_ADMIN_FORUM_V2 = '/admin/forum';
const BASE_FUND = '/funds';
const BASE_MENTEE = '/mentorship/mentee';
const BASE_MENTOR = '/mentorship/mentor';
const BACKEND_PAGE_SIZE = 5;

export const organizationApi = {
	async getOrganizationBySlug(slug) {
		const response = await apiClient.get(`/organizations/${slug}`);
		return unwrap(response);
	},

	async getAllOrganizations() {
		const response = await apiClient.get('/organizations');
		return unwrap(response) ?? [];
	},

	async createSchoolFeedback(organizationId, payload) {
		const response = await apiClient.post(`/organizations/${organizationId}/feedbacks`, payload);
		return unwrap(response);
	},

	async getIntroduction(organizationId) {
		const response = await apiClient.get(`/organizations/${organizationId}/introduction`);
		return unwrap(response);
	},
};

export const {
	getIntroduction,
} = organizationApi;

export const adminOrganizationApi = {
	async getOrganizations({ page = 0, size = 50 } = {}) {
		const response = await apiClient.get('/admin/organizations', { params: { page, size } });
		return normalizeList(unwrap(response));
	},

	async getOrganizationById(id) {
		const response = await apiClient.get(`/admin/organizations/${id}`);
		return unwrap(response);
	},

	async createOrganization(payload) {
		const response = await apiClient.post('/admin/organizations', payload);
		return unwrap(response);
	},

	async updateOrganization(id, payload) {
		const response = await apiClient.put(`/admin/organizations/${id}`, payload);
		return unwrap(response);
	},

	async deleteOrganization(id) {
		const response = await apiClient.delete(`/admin/organizations/${id}`);
		return unwrap(response);
	},

	async upsertIntroduction(id, payload) {
		const response = await apiClient.put(`/admin/organizations/${id}/introduction`, payload);
		return unwrap(response);
	},

	async getSchoolFeedbacks({ organizationId, page = 0, size = 10 } = {}) {
		const params = { page, size };
		if (organizationId) params.organizationId = organizationId;
		const response = await apiClient.get('/admin/organizations/feedbacks', { params });
		return unwrap(response);
	},

	async markSchoolFeedbackAsRead(feedbackId) {
		const response = await apiClient.patch(`/admin/organizations/feedbacks/${feedbackId}/read`);
		return unwrap(response);
	},

	async getFeaturesConfig(id) {
		const response = await apiClient.get(`/admin/organizations/${id}/features-config`);
		return unwrap(response);
	},

	async updateFeaturesConfig(id, payload) {
		const response = await apiClient.put(`/admin/organizations/${id}/features-config`, payload);
		return unwrap(response);
	},

	async toggleFeature(id, featureName) {
		const response = await apiClient.patch(`/admin/organizations/${id}/features-config/features/${featureName}/toggle`);
		return unwrap(response);
	},

	async getPrograms(id) {
		const response = await apiClient.get(`/admin/organizations/${id}/programs`);
		return unwrap(response);
	},

	async addProgram(id, value) {
		const response = await apiClient.post(`/admin/organizations/${id}/programs`, { value });
		return unwrap(response);
	},

	async updateProgram(id, oldValue, newValue) {
		const response = await apiClient.put(`/admin/organizations/${id}/programs`, { oldValue, newValue });
		return unwrap(response);
	},

	async removeProgram(id, value) {
		const response = await apiClient.delete(`/admin/organizations/${id}/programs`, { params: { value } });
		return unwrap(response);
	},

	async getMajors(id) {
		const response = await apiClient.get(`/admin/organizations/${id}/majors`);
		return unwrap(response);
	},

	async addMajor(id, value) {
		const response = await apiClient.post(`/admin/organizations/${id}/majors`, { value });
		return unwrap(response);
	},

	async updateMajor(id, oldValue, newValue) {
		const response = await apiClient.put(`/admin/organizations/${id}/majors`, { oldValue, newValue });
		return unwrap(response);
	},

	async removeMajor(id, value) {
		const response = await apiClient.delete(`/admin/organizations/${id}/majors`, { params: { value } });
		return unwrap(response);
	},
};



const adminAuditApi = {
	getLoginHistory(page = 0, size = 50, organizationId = null) {
		const params = { page, size };
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get('/admin/audit/login-history', { params });
	},

	getLoginHistoryByUser(userId, page = 0, size = 50) {
		return apiClient.get(`/admin/audit/login-history/user/${userId}`, { params: { page, size } });
	},

	getLoginStats() {
		return apiClient.get('/admin/audit/login-history/stats');
	},

	getSuspiciousLogins() {
		return apiClient.get('/admin/audit/login-history/suspicious');
	},
};

export const {
	getLoginHistoryByUser,
} = adminAuditApi;

const adminUserApi = {
	getUsers(page = 0, size = 20, search = '', role = 'ALL', status = 'ALL', organizationId = null) {
		const params = { page, size };
		if (search && search.trim()) params.search = search.trim();
		if (role && role !== 'ALL') params.role = role;
		if (status && status !== 'ALL') params.status = status;
		if (organizationId && organizationId !== 'ALL') params.organizationId = organizationId;
		return apiClient.get(BASE_ADMIN_USERS, { params });
	},

	getUserById(userId) {
		return apiClient.get(`${BASE_ADMIN_USERS}/${userId}`);
	},

	getUsersByOrganization(organizationId, page = 0, size = 20) {
		return apiClient.get(`${BASE_ADMIN_USERS}/organization/${organizationId}`, { params: { page, size } });
	},

	banUser(userId) {
		return apiClient.post(`${BASE_ADMIN_USERS}/ban`, { userId });
	},

	unbanUser(userId) {
		return apiClient.post(`${BASE_ADMIN_USERS}/unban`, { userId });
	},

	deleteUser(userId, hardDelete = false) {
		return apiClient.delete(BASE_ADMIN_USERS, { data: { userId, hardDelete } });
	},

	updateUser(userId, payload) {
		return apiClient.put(`${BASE_ADMIN_USERS}/${userId}`, payload);
	},

	resetPasswordByAdmin(userId, newPassword, reason = 'Admin reset from user management') {
		return apiClient.post(`${BASE_ADMIN_USERS}/${userId}/reset-password`, { newPassword, reason });
	},

	updateTrustedVerifier(userId, organizationId, isTrusted) {
		return apiClient.patch(`${BASE_ADMIN_USERS}/${userId}/organizations/${organizationId}/trusted-verifier`, null, {
			params: { isTrusted },
		});
	},

	createAdminAccount(body) {
		return apiClient.post(`${BASE_ADMIN_USERS}/admins`, body);
	},

	getVerificationRequests(pendingOnly = false, page = 0, size = 20, keyword = '', organizationId = null, requestType = null) {
		const params = { pendingOnly, page, size };
		if (keyword) params.keyword = keyword;
		if (organizationId) params.organizationId = organizationId;
		if (requestType) params.requestType = requestType;
		return apiClient.get(`${BASE_ADMIN_USERS}/verification-requests`, { params });
	},

	getUserVerificationRequests(userId) {
		return apiClient.get(`${BASE_ADMIN_USERS}/${userId}/verification-requests`);
	},

	reviewVerificationRequest(requestId, status, adminNote) {
		return apiClient.put(`${BASE_ADMIN_USERS}/verification-requests/${requestId}`, { status, adminNote });
	},

	reopenVerificationRequest(requestId, requestType, adminNote) {
		return apiClient.post(`${BASE_ADMIN_USERS}/verification-requests/${requestId}/reopen`, { requestType, adminNote });
	},

	addOrganizationMember(payload) {
		return apiClient.post(`${BASE_ADMIN_USERS}/organization-member`, payload);
	},

	bulkImportMembers(payload) {
		return apiClient.post(`${BASE_ADMIN_USERS}/organization-members/bulk`, payload);
	},

	getUserActivity(userId) {
		return apiClient.get(`${BASE_ADMIN_USERS}/${userId}/activity`);
	},
};

export const {
	getUsers,
	getUserById,
	banUser,
	unbanUser,
	deleteUser,
	updateUser,
	resetPasswordByAdmin,
	updateTrustedVerifier,
	getVerificationRequests,
	reviewVerificationRequest,
	reopenVerificationRequest,
	addOrganizationMember,
	bulkImportMembers,
	getUserActivity,
} = adminUserApi;

const adminMentorshipApi = {
	async getAllSessions(params = {}) {
		const response = await apiClient.get('/admin/mentorship/sessions', { params });
		return unwrap(response);
	},

	getSessionsByStatus(status, page = 0, size = 10, organizationId = null) {
		const params = { status, page, size };
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_ADMIN_MENTORSHIP}/sessions/by-status`, { params });
	},

	getSessionById(sessionId) {
		return apiClient.get(`${BASE_ADMIN_MENTORSHIP}/sessions/${sessionId}`);
	},

	updateSessionStatus(sessionId, status) {
		return apiClient.put(`${BASE_ADMIN_MENTORSHIP}/sessions/${sessionId}/status`, null, { params: { status } });
	},

	deleteSession(sessionId) {
		return apiClient.delete(`${BASE_ADMIN_MENTORSHIP}/sessions/${sessionId}`);
	},

	getAllMentorProfiles(page = 0, size = 10, organizationId = null) {
		const params = { page, size };
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_ADMIN_MENTORSHIP}/mentors`, { params });
	},

	getMentorProfilesByStatus(status, page = 0, size = 10, organizationId = null) {
		const params = { status, page, size };
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_ADMIN_MENTORSHIP}/mentors/by-status`, { params });
	},

	approveMentor(memberId) {
		return apiClient.post(`${BASE_ADMIN_MENTORSHIP}/mentors/${memberId}/approve`);
	},

	rejectMentor(memberId, reason) {
		return apiClient.post(`${BASE_ADMIN_MENTORSHIP}/mentors/${memberId}/reject`, { reason });
	},

	requestMentorUpdate(memberId, reason) {
		return apiClient.post(`${BASE_ADMIN_MENTORSHIP}/mentors/${memberId}/request-update`, { reason });
	},

	getMentees(page = 0, size = 10, organizationId = null) {
		const params = { page, size };
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_ADMIN_MENTORSHIP}/mentees`, { params });
	},

	getMentorReports(status = null, page = 0, size = 10) {
		const params = { page, size };
		if (status && status !== 'ALL') params.status = status;
		return apiClient.get(`${BASE_ADMIN_MENTORSHIP}/reports`, { params });
	},

	resolveMentorReport(reportId, action, resolutionNote) {
		return apiClient.post(`${BASE_ADMIN_MENTORSHIP}/reports/${reportId}/resolve`, { action, resolutionNote });
	},

	getMentorshipStatistics() {
		return apiClient.get(`${BASE_ADMIN_MENTORSHIP}/statistics`);
	},
};

export const {
	getAllSessions,
	getSessionsByStatus,
	getSessionById: getAdminSessionById,
	updateSessionStatus,
	deleteSession,
	getAllMentorProfiles,
	getMentorProfilesByStatus,
	approveMentor,
	rejectMentor,
	requestMentorUpdate,
	getMentees,
	getMentorReports,
	resolveMentorReport,
	getMentorshipStatistics,
} = adminMentorshipApi;

export const chatApi = {
	async listGroupChats({ text = '', page = 0, size = BACKEND_PAGE_SIZE } = {}) {
		const response = await apiClient.get('/chat/groups', { params: { text, page, size } });
		return unwrap(response);
	},

	async listPrivateChats({ text = '', page = 0, size = BACKEND_PAGE_SIZE } = {}) {
		const response = await apiClient.get('/chat/private/list', { params: { text, page, size } });
		return unwrap(response);
	},

	async getMessages(groupId, page = 0, size = 10) {
		const response = await apiClient.get(`/chat/groups/${groupId}/messages`, {
			params: { page, size },
		});
		return unwrap(response);
	},

	async createGroupChat({ title, memberIds }) {
		const response = await apiClient.post('/chat/groups', { title: title || null, memberIds });
		return unwrap(response);
	},

	async updateGroup(groupId, title) {
		const response = await apiClient.put(`/chat/groups/${groupId}`, { title });
		return unwrap(response);
	},

	async updateGroupImage(groupId, avatarUrl) {
		const response = await apiClient.put(`/chat/groups/${groupId}/avatar`, { avatarUrl });
		return unwrap(response);
	},

	async getGroupMembers(groupId, { text = '', page = 0, size = 50 } = {}) {
		const response = await apiClient.get(`/chat/groups/${groupId}/members`, {
			params: { text, page, size },
		});
		return unwrap(response);
	},

	async getGroupBlockedMembersContext(groupId) {
		const response = await apiClient.get(`/chat/groups/${groupId}/blocked-members-context`);
		return unwrap(response);
	},

	async getPeerActiveStatus(peerMemberId) {
		const response = await apiClient.get(`/chat/private/${peerMemberId}/status`);
		return unwrap(response);
	},

	async getConversationRequestStatus(targetMemberId) {
		const response = await apiClient.get('/chat/conversation-requests/connection-status', {
			params: { targetMemberId },
		});
		return unwrap(response) ?? null;
	},

	async createConversationRequest(targetMemberId, message) {
		const response = await apiClient.post('/chat/conversation-requests', {
			targetMemberId,
			message,
		});
		return unwrap(response);
	},

	async getRecentPreviews() {
		const response = await apiClient.get('/chat/recent-previews');
		return unwrap(response) ?? [];
	},

	async searchIncomingRequests({ fullName, status, page = 0, size = 10 } = {}) {
		const response = await apiClient.get('/chat/conversation-requests/search', {
			params: { fullName, status, page, size },
		});
		return unwrap(response);
	},

	async respondToConversationRequest(requestId, status) {
		const response = await apiClient.put('/chat/conversation-requests/respond', {
			id: requestId,
			status,
		});
		return unwrap(response);
	},

	async addMembersToGroup(groupId, memberIds) {
		const response = await apiClient.post(`/chat/groups/${groupId}/members`, { memberIds });
		return unwrap(response);
	},

	async removeMemberFromGroup(groupId, memberId) {
		const response = await apiClient.delete(`/chat/groups/${groupId}/members/${memberId}`);
		return unwrap(response);
	},

	async leaveGroup(groupId) {
		const response = await apiClient.delete(`/chat/groups/${groupId}/leave`);
		return unwrap(response);
	},

	async blockUser(targetMemberId) {
		const response = await apiClient.post(`/chat/blocks/${targetMemberId}`);
		return unwrap(response);
	},

	async unblockUser(targetMemberId) {
		const response = await apiClient.delete(`/chat/blocks/${targetMemberId}`);
		return unwrap(response);
	},

	async getBlockStatus(targetMemberId) {
		const response = await apiClient.get(`/chat/blocks/${targetMemberId}`);
		return unwrap(response);
	},

	async searchConnections({ fullName, page = 0, size = 5 } = {}) {
		// Connections are personal and org-agnostic — the backend returns all accepted
		// connections of the current user regardless of organization.
		const response = await apiClient.get('/chat/connections/search', {
			params: { fullName, page, size },
		});
		return unwrap(response) ?? EMPTY_PAGE;
	},

	async searchBlockedMembers({ fullName, page = 0, size = 5 } = {}) {
		const response = await apiClient.get('/chat/blocks', {
			params: { fullName, page, size },
		});
		return unwrap(response) ?? EMPTY_PAGE;
	},

	async getBlockList({ fullName, page = 0, size = 5 } = {}) {
		const response = await apiClient.get('/chat/blocks', {
			params: { fullName, page, size },
		});
		return unwrap(response) ?? EMPTY_PAGE;
	},

	async uploadChatImage(base64String) {
		const response = await apiClient.post('/images/upload', { base64String });
		return unwrap(response);
	},

	async uploadChatMedia({ base64String, fileName }) {
		const response = await apiClient.post('/files/upload', { base64String, fileName });
		return unwrap(response);
	},
};



export const eventApi = {
	async createEvent(payload) {
		const response = await apiClient.post('/events', payload);
		return unwrap(response);
	},

	async getAdminEvents(params = {}, config = {}) {
		const response = await apiClient.get('/admin/events', { params, ...config });
		return unwrap(response);
	},

	async getAdminEventsByOrganization(organizationId, params = {}, config = {}) {
		const response = await apiClient.get(`/admin/events/organization/${organizationId}`, { params, ...config });
		return unwrap(response);
	},

	async searchAdminEvents(keyword, params = {}, config = {}) {
		const response = await apiClient.get('/admin/events/search', { params: { keyword, ...params }, ...config });
		return unwrap(response);
	},

	async getAdminEventsByPublishStatus(isPublished, params = {}, config = {}) {
		const response = await apiClient.get('/admin/events/by-status', { params: { isPublished, ...params }, ...config });
		return unwrap(response);
	},

	async getAdminEventStatistics() {
		const response = await apiClient.get('/admin/events/statistics');
		return unwrap(response);
	},

	async getAdminOrganizations(params = {}) {
		return adminOrganizationApi.getOrganizations(params);
	},

	async updateAdminEvent(eventId, payload) {
		const response = await apiClient.put(`/admin/events/${eventId}`, payload);
		return unwrap(response);
	},

	async publishAdminEvent(eventId) {
		const response = await apiClient.post(`/admin/events/${eventId}/publish`);
		return unwrap(response);
	},

	async unpublishAdminEvent(eventId) {
		const response = await apiClient.post(`/admin/events/${eventId}/unpublish`);
		return unwrap(response);
	},

	async deleteAdminEvent(eventId) {
		const response = await apiClient.delete(`/admin/events/${eventId}`);
		return unwrap(response);
	},

	async getEventById(eventId) {
		const response = await apiClient.get(`/events/${eventId}`);
		return unwrap(response);
	},

	async getEvents(params = {}) {
		const response = await apiClient.get('/events', { params });
		return unwrap(response);
	},

	async getUpcomingEvents(params = {}) {
		const response = await apiClient.get('/events/upcoming', { params });
		return unwrap(response);
	},

	async updateEvent(eventId, payload) {
		const response = await apiClient.put(`/events/${eventId}`, payload);
		return unwrap(response);
	},

	async publishEvent(eventId) {
		const response = await apiClient.post(`/events/${eventId}/publish`);
		return unwrap(response);
	},

	async unpublishEvent(eventId) {
		const response = await apiClient.post(`/events/${eventId}/unpublish`);
		return unwrap(response);
	},

	async deleteEvent(eventId) {
		const response = await apiClient.delete(`/events/${eventId}`);
		return unwrap(response);
	},

	// ── Interest ─────────────────────────────────────────────────────────────
	async addInterest(eventId) {
		const response = await apiClient.post(`/events/${eventId}/interest`);
		return unwrap(response);
	},

	async removeInterest(eventId) {
		const response = await apiClient.delete(`/events/${eventId}/interest`);
		return unwrap(response);
	},

	async checkInterest(eventId) {
		const response = await apiClient.get(`/events/${eventId}/interest/check`);
		return unwrap(response);
	},

	async checkRegistered(eventId) {
		const response = await apiClient.get(`/events/${eventId}/check-registered`);
		return unwrap(response);
	},

	// ── Invitations ──────────────────────────────────────────────────────────
	async inviteUsers(eventId, payload) {
		const response = await apiClient.post(`/events/${eventId}/invitations`, payload);
		return unwrap(response);
	},

	async confirmInvitation(token) {
		const response = await apiClient.post('/events/invitations/confirm', null, { params: { token } });
		return unwrap(response);
	},

	async getInvitations(eventId, params = {}) {
		const response = await apiClient.get(`/events/${eventId}/invitations`, { params });
		return unwrap(response);
	},

	// ── Register (user self-register) ─────────────────────────────────────
	async registerForEvent(eventId, payload = {}) {
		const response = await apiClient.post(`/events/${eventId}/register`, payload);
		return unwrap(response);
	},

	// ── Reminder emails ───────────────────────────────────────────────────
	async sendReminders(eventId, payload) {
		const response = await apiClient.post(`/events/${eventId}/reminders`, payload);
		return unwrap(response);
	},

	async getEmailLogs(eventId, params = {}) {
		const response = await apiClient.get(`/events/${eventId}/email-logs`, { params });
		return unwrap(response);
	},

	// ── Ticket lifecycle ──────────────────────────────────────────────────
	async sendIssuedTicketEmails(eventId) {
		const response = await apiClient.post(`/events/${eventId}/tickets/send-emails`);
		return unwrap(response);
	},

	async getTicketsByEvent(eventId, params = {}) {
		const response = await apiClient.get(`/events/${eventId}/tickets`, { params });
		return unwrap(response);
	},

	async getTicketsByStatus(eventId, status, params = {}) {
		const response = await apiClient.get(`/events/${eventId}/tickets`, { params: { status, ...params } });
		return unwrap(response);
	},

	// Check in a ticket for an event. Pass either a scanned/encrypted `qrToken`
	// or a raw ticket `code` (manual fallback). The backend decrypts/verifies the
	// token, enforces the event scope, and returns the holder's profile to verify.
	async checkInTicket(eventId, { qrToken, code } = {}) {
		const response = await apiClient.post(`/events/${eventId}/tickets/check-in`, { qrToken, code });
		return unwrap(response);
	},

	async cancelTicketByCode(ticketCode, reason) {
		const response = await apiClient.post(`/events/tickets/${ticketCode}/cancel`, { reason });
		return unwrap(response);
	},

	async adminCancelTicketByCode(ticketCode, reason) {
		const response = await apiClient.post(`/admin/events/tickets/${ticketCode}/cancel`, { reason });
		return unwrap(response);
	},

	async adminUndoTicketByCode(ticketCode) {
		const response = await apiClient.post(`/admin/events/tickets/${ticketCode}/undo`);
		return unwrap(response);
	},

	async adminBanTicketByCode(ticketCode, reason) {
		const response = await apiClient.post(`/admin/events/tickets/${ticketCode}/ban`, { reason });
		return unwrap(response);
	},

	async getTicketByCode(ticketCode) {
		const response = await apiClient.get(`/events/tickets/code/${ticketCode}`);
		return unwrap(response);
	},

	async getEventQuestions(eventId, organizationId) {
		// Degrade gracefully: nếu backend lỗi (vd bảng event_questions chưa migrate),
		// coi như event không có câu hỏi thay vì làm vỡ trang.
		try {
			const response = await apiClient.get(`/events/${eventId}/questions`, {
				params: organizationId != null ? { organizationId } : undefined,
			});
			return unwrap(response);
		} catch (err) {
			console.warn('getEventQuestions failed, fallback []', err?.response?.status);
			return [];
		}
	},

	async createEventQuestion(eventId, payload) {
		const response = await apiClient.post(`/events/${eventId}/questions`, payload);
		return unwrap(response);
	},

	async updateEventQuestion(eventId, questionId, payload) {
		const response = await apiClient.put(`/events/${eventId}/questions/${questionId}`, payload);
		return unwrap(response);
	},

	async deleteEventQuestion(eventId, questionId) {
		const response = await apiClient.delete(`/events/${eventId}/questions/${questionId}`);
		return unwrap(response);
	},

	async reorderEventQuestions(eventId, questionIds) {
		const response = await apiClient.put(`/events/${eventId}/questions/reorder`, { questionIds });
		return unwrap(response);
	},

	async getMyTickets(params = {}) {
		const response = await apiClient.get('/events/my-tickets', { params });
		return unwrap(response);
	},

	async getEventStatisticsById(eventId) {
		const response = await apiClient.get(`/events/${eventId}/statistics`);
		return unwrap(response);
	},

	async getInterestsByEvent(eventId, params = {}) {
		const response = await apiClient.get(`/events/${eventId}/interests`, { params });
		return unwrap(response);
	},

	async getMyInterestedEvents(params = {}) {
		const response = await apiClient.get('/events/my-interests', { params });
		return unwrap(response);
	},
};





const adminForumApi = {
	getForumStatistics() {
		return apiClient.get(`${BASE_ADMIN_FORUM}/statistics`);
	},

	getTopContributors(month, year) {
		return apiClient.get(`${BASE_ADMIN_FORUM}/statistics/top-contributors`, { params: { month, year } });
	},

	getOrganizationEngagement() {
		return apiClient.get(`${BASE_ADMIN_FORUM}/statistics/engagement`);
	},

	getMonthlyTimeline(year) {
		return apiClient.get(`${BASE_ADMIN_FORUM}/statistics/timeline`, { params: { year } });
	},

	getNewPostsYesterdayPaginated(page = 0, size = 10, organizationId = null, config = {}) {
		const params = { page, size };
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_ADMIN_FORUM}/posts/yesterday/paginated`, { params, ...config });
	},

	getBannedPosts(page = 0, size = 10, organizationId = null, config = {}) {
		const params = { page, size };
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_ADMIN_FORUM}/posts/banned/list`, { params, ...config });
	},

	getAllPosts(keyword = '', page = 0, size = 20, organizationId = null, config = {}) {
		const params = { page, size };
		if (keyword) params.keyword = keyword;
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_ADMIN_FORUM}/posts`, { params, ...config });
	},

	banPost(postId) {
		return apiClient.post(`${BASE_ADMIN_FORUM}/posts/${postId}/ban`);
	},

	unbanPost(postId) {
		return apiClient.post(`${BASE_ADMIN_FORUM}/posts/${postId}/unban`);
	},

	deletePost(postId) {
		return apiClient.delete(`${BASE_ADMIN_FORUM}/posts/${postId}`);
	},

	getPendingReports(page = 0, size = 10, organizationId = null, config = {}) {
		const params = { page, size };
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_ADMIN_FORUM_V2}/reports`, { params, ...config });
	},

	reviewReport(reportId, payload) {
		return apiClient.put(`${BASE_ADMIN_FORUM_V2}/reports/${reportId}`, payload);
	},

	updatePostVisibility(postId, payload) {
		return apiClient.put(`${BASE_ADMIN_FORUM_V2}/posts/${postId}/visibility`, payload);
	},

	getAllCategories(organizationId, config = {}) {
		return apiClient.get(`${BASE_ADMIN_FORUM}/categories`, { params: { organizationId }, ...config });
	},

	getCategoryById(categoryId) {
		return apiClient.get(`${BASE_ADMIN_FORUM}/categories/${categoryId}`);
	},

	createCategory(organizationId, name, description, parentId) {
		return apiClient.post(`${BASE_ADMIN_FORUM}/categories`, null, {
			params: { organizationId, name, description, ...(parentId ? { parentId } : {}) },
		});
	},

	updateCategory(categoryId, name, description, parentId) {
		return apiClient.put(`${BASE_ADMIN_FORUM}/categories/${categoryId}`, null, {
			params: { name, description, ...(parentId ? { parentId } : {}) },
		});
	},

	deleteCategory(categoryId) {
		return apiClient.delete(`${BASE_ADMIN_FORUM}/categories/${categoryId}`);
	},

	updateCategoryStatus(categoryId, status) {
		return apiClient.put(`${BASE_ADMIN_FORUM}/categories/${categoryId}/status`, { status });
	},

	getAllTopics(organizationId, keyword = '', page = 0, size = 10, config = {}) {
		const params = { organizationId, page, size };
		if (keyword) params.keyword = keyword;
		return apiClient.get(`${BASE_ADMIN_FORUM}/topics`, { params, ...config });
	},

	getTopicById(topicId) {
		return apiClient.get(`${BASE_ADMIN_FORUM}/topics/${topicId}`);
	},

	createTopic(organizationId, categoryId, title, createdByMemberId) {
		return apiClient.post(`${BASE_ADMIN_FORUM}/topics`, null, { params: { organizationId, categoryId, title, createdByMemberId } });
	},

	updateTopic(topicId, title, categoryId) {
		return apiClient.put(`${BASE_ADMIN_FORUM}/topics/${topicId}`, null, { params: { title, categoryId } });
	},

	deleteTopic(topicId) {
		return apiClient.delete(`${BASE_ADMIN_FORUM}/topics/${topicId}`);
	},

	updateTopicStatus(topicId, status) {
		return apiClient.put(`${BASE_ADMIN_FORUM}/topics/${topicId}/status`, { status });
	},
};

export const {
	getForumStatistics,
	getTopContributors,
	getOrganizationEngagement,
	getMonthlyTimeline,
	getNewPostsYesterdayPaginated,
	getBannedPosts,
	getAllPosts,
	banPost,
	unbanPost,
	deletePost,
	getPendingReports,
	reviewReport,
	updatePostVisibility,
	getAllCategories,
	createCategory,
	updateCategory,
	deleteCategory,
	updateCategoryStatus,
	getAllTopics,
	createTopic,
	updateTopic,
	deleteTopic,
	updateTopicStatus,
} = adminForumApi;

export const fundApi = {
	async getFunds(params = {}, config = {}) {
		const response = await apiClient.get(BASE_FUND, { params, ...config });
		return unwrap(response);
	},

	async getFundDetail(id) {
		const response = await apiClient.get(`${BASE_FUND}/${id}`);
		return unwrap(response);
	},

	async getFundStatistics() {
		const response = await apiClient.get(`${BASE_FUND}/statistics`);
		return unwrap(response);
	},

	async getActiveFundReceivingInfos() {
		const response = await apiClient.get(`${BASE_FUND}/receiving-infos/active`);
		return unwrap(response) ?? [];
	},

	async getFundReceivingInfos(params = {}) {
		const response = await apiClient.get(`${BASE_FUND}/receiving-infos`, { params });
		return unwrap(response);
	},

	async getSupportedBanks() {
		const response = await apiClient.get(`${BASE_FUND}/banks`);
		return unwrap(response);
	},

	async createFundReceivingInfo(payload) {
		const response = await apiClient.post(`${BASE_FUND}/receiving-infos`, payload);
		return unwrap(response);
	},

	async getFundDonationsByFundId(fundId, params = {}) {
		const response = await apiClient.get(`/fund-donations/${fundId}`, { params });
		return unwrap(response);
	},

	async getAllFundDonationsForExport(fundId) {
		const response = await apiClient.get(`/admin/fundraising/funds/${fundId}/donations/all`);
		return unwrap(response) ?? [];
	},

	async createFundDonation(payload) {
		const response = await apiClient.post('/fund-donations', payload);
		return unwrap(response);
	},

	async createFund(payload) {
		const response = await apiClient.post(BASE_FUND, payload);
		return unwrap(response);
	},

	async updateFund(fundId, payload) {
		const response = await apiClient.put(`${BASE_FUND}/${fundId}`, payload);
		return unwrap(response);
	},

	async updateFundBasicInfo(fundId, payload) {
		const response = await apiClient.patch(`${BASE_FUND}/${fundId}/basic-info`, payload);
		return unwrap(response);
	},

	async closeFund(fundId) {
		const response = await apiClient.put(`${BASE_FUND}/${fundId}/close`);
		return unwrap(response);
	},

	async updateDonationVisibility(fundId, isPublic) {
		const response = await apiClient.put(`${BASE_FUND}/${fundId}/donation-visibility`, { isPublic });
		return unwrap(response);
	},
};



export const networkApi = {
	async searchMembers(params = {}) {
		const response = await apiClient.get('/chat/network/members', {
			params,
			// Repeat array keys without brackets (organizationIds=1&organizationIds=2)
			// so Spring binds them to List<Integer>; axios defaults to ids[]=1.
			paramsSerializer: { indexes: null },
		});
		return unwrap(response) ?? EMPTY_PAGE;
	},
};



const userApi = {
	joinOrganization(payload) {
		const toStringList = (value) => {
			const list = Array.isArray(value) ? value : value ? [value] : [];
			return list.map((item) => String(item).trim()).filter(Boolean);
		};
		const toNumberList = (value) => {
			const list = Array.isArray(value) ? value : value ? [value] : [];
			return list
				.map((item) => Number(item))
				.filter((item) => Number.isFinite(item));
		};
		const body = {
			organizationId: Number(payload.organizationId),
			studentId: payload.studentId ?? payload.studentCode ?? null,
			startedYear: toStringList(payload.startedYear ?? payload.startYear),
			graduatedYear: toNumberList(payload.graduatedYear),
			graduationStatus: toStringList(payload.graduationStatus),
			program: toStringList(payload.program),
			major: toStringList(payload.major),
		};
		return apiClient.post('/users/me/organization-member', body);
	},

	getTrustedVerifiers(organizationId) {
		return apiClient.get(`/organizations/${Number(organizationId)}/trusted-verifiers`);
	},

	requestPeerVerification({ organizationId, verifierUserId }) {
		return apiClient.post('/users/me/peer-verifications/request', {
			organizationId: Number(organizationId),
			verifierUserId: Number(verifierUserId),
		});
	},

	createVerificationRequest(payload) {
		return apiClient.post('/users/me/verification-requests', payload);
	},
};

export const {
	joinOrganization,
	getTrustedVerifiers,
	requestPeerVerification,
	createVerificationRequest,
} = userApi;

export const userSettingsApi = {
	async getProfile(organizationId) {
		const response = await apiClient.get('/users/me/profile', {
			params: { organizationId },
		});
		return unwrap(response);
	},

	async getOrganizationMember(organizationId) {
		const response = await apiClient.get('/users/me/organization-member', {
			params: { organizationId },
		});
		return unwrap(response);
	},

	async getNotificationSettings() {
		const response = await apiClient.get('/users/me/notification-settings');
		return unwrap(response);
	},

	async updateProfile(payload) {
		const response = await apiClient.put('/users/me/profile', payload);
		return unwrap(response);
	},

	// Accepts either a raw base64/data-URL string (sent as avatarBase64 so the backend
	// converts to WebP and stores it) or an explicit payload object ({ avatarBase64 } / { avatarUrl }).
	async updateAvatar(input) {
		const body = typeof input === 'string' ? { avatarBase64: input } : input;
		const response = await apiClient.put('/users/me/avatar', body);
		return unwrap(response);
	},

	async updateCover(input) {
		const body = typeof input === 'string' ? { coverBase64: input } : input;
		const response = await apiClient.put('/users/me/cover', body);
		return unwrap(response);
	},

	async updateNotificationSettings(payload) {
		const response = await apiClient.put('/users/me/notification-settings', payload);
		return unwrap(response);
	},

	async changePassword(payload) {
		const response = await apiClient.put('/users/me/password', payload);
		return unwrap(response);
	},

	async getLoginHistory(params = { page: 0, limit: 10 }) {
		const response = await apiClient.get('/users/me/login-history', { params });
		return unwrap(response) ?? [];
	},

	async getPendingPeerVerifications(organizationId) {
		const response = await apiClient.get('/users/me/peer-verifications/pending', {
			params: { organizationId },
		});
		return unwrap(response) ?? [];
	},

	async acceptPeerVerification(requestId) {
		const response = await apiClient.patch(`/users/me/peer-verifications/${requestId}/accept`);
		return unwrap(response);
	},

	async getPeerVerificationCounterparts(organizationId) {
		const response = await apiClient.get('/users/me/peer-verifications/counterparts', {
			params: { organizationId },
		});
		return unwrap(response) ?? [];
	},

	async submitEducationRequest(payload) {
		const response = await apiClient.post('/education-requests', payload);
		return unwrap(response);
	},

	async getPendingEducationRequest(organizationId) {
		const response = await apiClient.get('/education-requests/pending', { params: { organizationId } });
		return unwrap(response);
	},

	async cancelEducationRequest(requestId, organizationId) {
		const response = await apiClient.delete(`/education-requests/${requestId}`, { params: { organizationId } });
		return unwrap(response);
	},
};

export const adminEducationApi = {
	async getRequests(params) {
		const response = await apiClient.get('/admin/education-requests', { params });
		return unwrap(response);
	},

	async reviewRequest(requestId, payload) {
		const response = await apiClient.put(`/admin/education-requests/${requestId}`, payload);
		return unwrap(response);
	},
};

// Saved (bookmarked / "quan tâm") articles. itemType is "NEWS" for articles.
export const savedItemApi = {
	async check(itemType, itemId) {
		const response = await apiClient.get('/articles/saved/check', {
			params: { itemType, itemId },
		});
		const data = unwrap(response);
		return data?.saved ?? data?.isSaved ?? false;
	},

	async save(itemType, itemId) {
		const response = await apiClient.post('/articles/saved', { itemType, itemId });
		return unwrap(response);
	},

	async unsave(itemType, itemId) {
		const response = await apiClient.delete('/articles/saved', {
			params: { itemType, itemId },
		});
		return unwrap(response);
	},

	async listByType(itemType, params = { page: 0, limit: 50 }) {
		const response = await apiClient.get(`/articles/saved/type/${itemType}`, { params });
		return unwrap(response);
	},
};



const mentorshipApi = {
	saveMenteeProfile(payload) {
		return apiClient.post(`${BASE_MENTEE}/profile`, payload);
	},

	getMyMenteeProfile() {
		return apiClient.get(`${BASE_MENTEE}/profile`);
	},

	getApprovedMentors(page = 0, limit = 12, organizationId = null) {
		const params = { page, limit };
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_MENTEE}/mentors`, { params });
	},

	getMentorProfile(mentorMemberId, organizationId = null) {
		const params = {};
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_MENTEE}/mentors/${mentorMemberId}`, { params });
	},

	searchMentors(keyword, page = 0, limit = 12, organizationId = null) {
		const params = { keyword, page, limit };
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_MENTEE}/mentors/search`, { params });
	},

	filterMentors(params = {}) {
		return apiClient.get(`${BASE_MENTEE}/mentors/filter`, {
			params,
			// Repeat array keys without brackets (skillIds=1&skillIds=2) so Spring
			// binds them to List<Integer>; axios defaults to skillIds[]=1.
			paramsSerializer: { indexes: null },
		});
	},

	// Skill catalog: mentors sort/select these tags at signup; the browse page
	// filters by them (multi-select, %LIKE% search, backed by the "skills" table).
	searchSkills(params = {}) {
		return apiClient.get(`${BASE_MENTEE}/skills`, { params });
	},

	getMentorExpertise(mentorMemberId, organizationId = null) {
		const params = {};
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_MENTEE}/mentors/${mentorMemberId}/expertise`, { params });
	},

	getMentorAvailableSlots(mentorMemberId, organizationId = null) {
		const params = {};
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_MENTEE}/mentors/${mentorMemberId}/availability`, { params });
	},

	getMentorFeedbacks(mentorMemberId, page = 0, limit = 10, organizationId = null) {
		const params = { page, limit };
		if (organizationId) params.organizationId = organizationId;
		return apiClient.get(`${BASE_MENTEE}/mentors/${mentorMemberId}/feedbacks`, { params });
	},

	bookSession(payload) {
		return apiClient.post(`${BASE_MENTEE}/sessions/book`, payload);
	},

	checkBookingConflicts(availabilityId) {
		return apiClient.get(`${BASE_MENTEE}/sessions/check-conflict`, {
			params: { availabilityId },
		});
	},

	getMyMenteeSessions(params = {}) {
		return apiClient.get(`${BASE_MENTEE}/sessions`, { params });
	},

	getMenteeSessionById(sessionId) {
		return apiClient.get(`${BASE_MENTEE}/sessions/${sessionId}`);
	},

	cancelSession(sessionId, cancelReason) {
		const params = cancelReason ? { cancelReason } : {};
		return apiClient.post(`${BASE_MENTEE}/sessions/${sessionId}/cancel`, null, { params });
	},

	respondReschedule(sessionId, accept) {
		return apiClient.post(`${BASE_MENTEE}/sessions/${sessionId}/reschedule-response`, null, {
			params: { accept },
		});
	},

	createSessionFeedback(sessionId, payload) {
		return apiClient.post(`${BASE_MENTEE}/sessions/${sessionId}/feedback`, payload);
	},

	reportSession(sessionId, payload) {
		return apiClient.post(`${BASE_MENTEE}/sessions/${sessionId}/report`, payload);
	},

	joinMenteeSession(sessionId) {
		return apiClient.post(`${BASE_MENTEE}/sessions/${sessionId}/join`);
	},

	createMentorProfile(payload) {
		return apiClient.post(`${BASE_MENTOR}/profile`, payload);
	},

	saveMentorProfileDraft(payload) {
		return apiClient.post(`${BASE_MENTOR}/profile/draft`, payload);
	},

	updateMentorProfile(payload) {
		return apiClient.put(`${BASE_MENTOR}/profile`, payload);
	},

	getMyMentorProfile() {
		return apiClient.get(`${BASE_MENTOR}/profile`);
	},

	addMyExpertise(payload) {
		return apiClient.post(`${BASE_MENTOR}/expertise`, payload);
	},

	// ME-02: AI-assisted skill tag extraction from a free-text description.
	extractMentorshipSkills(text) {
		return apiClient.post('/mentorship/skills/extract', { text });
	},

	// AI-assisted CV upload: OCR + Gemini auto-fill of the signup profile step.
	extractMentorshipCv({ base64File, originalFileName }) {
		return apiClient.post('/mentorship/cv/extract', { base64File, originalFileName });
	},

	getMyExpertise() {
		return apiClient.get(`${BASE_MENTOR}/expertise`);
	},

	deleteMyExpertise(expertiseId) {
		return apiClient.delete(`${BASE_MENTOR}/expertise/${expertiseId}`);
	},

	updateMyExpertise(expertiseId, payload) {
		return apiClient.put(`${BASE_MENTOR}/expertise/${expertiseId}`, payload);
	},

	addMyAvailability(payload) {
		return apiClient.post(`${BASE_MENTOR}/availability`, payload);
	},

	getMyAvailabilities() {
		return apiClient.get(`${BASE_MENTOR}/availability`);
	},

	deleteMyAvailability(availabilityId) {
		return apiClient.delete(`${BASE_MENTOR}/availability/${availabilityId}`);
	},

	updateMyAvailability(availabilityId, payload) {
		return apiClient.put(`${BASE_MENTOR}/availability/${availabilityId}`, payload);
	},

	getMyMentorSessions(params = {}) {
		return apiClient.get(`${BASE_MENTOR}/sessions`, { params });
	},

	updateSessionStatus(sessionId, payload) {
		return apiClient.put(`${BASE_MENTOR}/sessions/${sessionId}/status`, payload);
	},

	updateSessionMeetingLink(sessionId, meetingLink) {
		return apiClient.put(`${BASE_MENTOR}/sessions/${sessionId}/meeting-link`, { meetingLink });
	},

	cancelMentorSession(sessionId, cancelReason) {
		const params = cancelReason ? { cancelReason } : {};
		return apiClient.post(`${BASE_MENTOR}/sessions/${sessionId}/cancel`, null, { params });
	},

	joinMentorSession(sessionId) {
		return apiClient.post(`${BASE_MENTOR}/sessions/${sessionId}/join`);
	},

	postponeMentorSession(sessionId, { reason, proposedStartTime, proposedEndTime }) {
		return apiClient.post(`${BASE_MENTOR}/sessions/${sessionId}/postpone`, {
			reason,
			proposedStartTime,
			proposedEndTime,
		});
	},

	getMyMentorFeedbacks(page = 0, limit = 10) {
		return apiClient.get(`${BASE_MENTOR}/feedbacks`, { params: { page, limit } });
	},

	uploadCvFile({ base64String, fileName }) {
		return apiClient.post(`${BASE_MENTOR}/cv/upload`, { base64String, fileName });
	},

	getHubStats(limit = 5) {
		return apiClient.get('/api/mentorship/hub/stats', { params: { limit } });
	},
};

export const {
	saveMenteeProfile,
	getMyMenteeProfile,
	getApprovedMentors,
	getMentorProfile,
	searchMentors,
	filterMentors,
	searchSkills,
	getMentorExpertise,
	getMentorAvailableSlots,
	getMentorFeedbacks,
	bookSession,
	checkBookingConflicts,
	getMyMenteeSessions,
	cancelSession,
	respondReschedule,
	createSessionFeedback,
	reportSession,
	joinMenteeSession,
	joinMentorSession,
	cancelMentorSession,
	postponeMentorSession,
	createMentorProfile,
	saveMentorProfileDraft,
	updateMentorProfile,
	getMyMentorProfile,

	extractMentorshipSkills,
	extractMentorshipCv,
	getMyExpertise,

	addMyAvailability,
	getMyAvailabilities,
	deleteMyAvailability,
	updateMyAvailability,
	getMyMentorSessions,
	updateSessionStatus: updateMentorSessionStatus,
	updateSessionMeetingLink: updateMentorSessionMeetingLink,
	getMyMentorFeedbacks,
	uploadCvFile,
	getHubStats,
} = mentorshipApi;

export const notificationApi = {
	async getNotifications() {
		const response = await apiClient.get('/users/me/notifications');
		return unwrap(response) ?? [];
	},

	async markAsRead(notificationId) {
		const response = await apiClient.put(`/users/me/notifications/${notificationId}/read`);
		return unwrap(response);
	},

	async deleteNotification(notificationId) {
		const response = await apiClient.delete(`/users/me/notifications/${notificationId}`);
		return unwrap(response);
	},

	async deleteAllNotifications() {
		const response = await apiClient.delete('/users/me/notifications');
		return unwrap(response);
	},
};

// ===================== Surveys / Forms =====================
const BASE_ADMIN_SURVEYS = '/admin/surveys';
const BASE_SURVEYS = '/surveys';

export const surveyApi = {
	// ---- Admin ----
	async listAdminSurveys(params = {}, config = {}) {
		const response = await apiClient.get(BASE_ADMIN_SURVEYS, { params, ...config });
		return unwrap(response);
	},

	async getAdminSurvey(id, params = {}) {
		const response = await apiClient.get(`${BASE_ADMIN_SURVEYS}/${id}`, { params });
		return unwrap(response);
	},

	async createSurvey(payload) {
		const response = await apiClient.post(BASE_ADMIN_SURVEYS, payload);
		return unwrap(response);
	},

	async updateSurvey(id, payload) {
		const response = await apiClient.put(`${BASE_ADMIN_SURVEYS}/${id}`, payload);
		return unwrap(response);
	},

	async openSurvey(id) {
		const response = await apiClient.post(`${BASE_ADMIN_SURVEYS}/${id}/open`);
		return unwrap(response);
	},

	async closeSurvey(id) {
		const response = await apiClient.post(`${BASE_ADMIN_SURVEYS}/${id}/close`);
		return unwrap(response);
	},

	async deleteSurvey(id) {
		const response = await apiClient.delete(`${BASE_ADMIN_SURVEYS}/${id}`);
		return unwrap(response);
	},

	async getSubmissions(id, params = {}) {
		const response = await apiClient.get(`${BASE_ADMIN_SURVEYS}/${id}/submissions`, { params });
		return unwrap(response);
	},

	async getSummary(id, params = {}) {
		const response = await apiClient.get(`${BASE_ADMIN_SURVEYS}/${id}/summary`, { params });
		return unwrap(response);
	},

	async getInsight(id, params = {}) {
		const response = await apiClient.get(`${BASE_ADMIN_SURVEYS}/${id}/insight`, { params });
		return unwrap(response);
	},

	// ---- User ----
	async getActiveSurveys() {
		const response = await apiClient.get(`${BASE_SURVEYS}/active`);
		return unwrap(response) ?? [];
	},

	async getSurvey(id) {
		const response = await apiClient.get(`${BASE_SURVEYS}/${id}`);
		return unwrap(response);
	},

	async submitSurvey(id, answers) {
		const response = await apiClient.post(`${BASE_SURVEYS}/${id}/submit`, { answers });
		return unwrap(response);
	},

	async getMySubmission(id) {
		const response = await apiClient.get(`${BASE_SURVEYS}/${id}/my-submission`);
		return unwrap(response);
	},
};
