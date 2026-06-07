import apiClient from '../utils/axios';
import useAuthStore from '../stores/authStore';

const unwrap = (response) => response?.data?.data;

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
	getOrganizationBySlug,
	getAllOrganizations,
	createSchoolFeedback,
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

export const {
	getOrganizations,
	getOrganizationById,
	createOrganization,
	updateOrganization,
	deleteOrganization,
	upsertIntroduction,
	getSchoolFeedbacks,
	markSchoolFeedbackAsRead,
	getFeaturesConfig,
	updateFeaturesConfig,
	toggleFeature,
	getPrograms,
	addProgram,
	updateProgram,
	removeProgram,
	getMajors,
	addMajor,
	updateMajor,
	removeMajor,
} = adminOrganizationApi;

export const adminAuditApi = {
	getLoginHistory(page = 0, size = 50) {
		return apiClient.get('/admin/audit/login-history', { params: { page, size } });
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
	getLoginHistory: getAdminLoginHistory,
	getLoginHistoryByUser,
	getLoginStats,
	getSuspiciousLogins,
} = adminAuditApi;

export const adminUserApi = {
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

	createAdminAccount(body) {
		return apiClient.post(`${BASE_ADMIN_USERS}/admins`, body);
	},

	getVerificationRequests(pendingOnly = false, page = 0, size = 20) {
		return apiClient.get(`${BASE_ADMIN_USERS}/verification-requests`, { params: { pendingOnly, page, size } });
	},

	getUserVerificationRequests(userId) {
		return apiClient.get(`${BASE_ADMIN_USERS}/${userId}/verification-requests`);
	},

	reviewVerificationRequest(requestId, status, adminNote) {
		return apiClient.put(`${BASE_ADMIN_USERS}/verification-requests/${requestId}`, { status, adminNote });
	},

	addOrganizationMember(payload) {
		return apiClient.post(`${BASE_ADMIN_USERS}/organization-member`, payload);
	},

	getUserActivity(userId) {
		return apiClient.get(`${BASE_ADMIN_USERS}/${userId}/activity`);
	},
};

export const {
	getUsers,
	getUserById,
	getUsersByOrganization,
	banUser,
	unbanUser,
	deleteUser,
	updateUser,
	createAdminAccount,
	getVerificationRequests,
	getUserVerificationRequests,
	reviewVerificationRequest,
	addOrganizationMember,
	getUserActivity,
} = adminUserApi;

export const adminMentorshipApi = {
	async getAllSessions(params = {}) {
		const response = await apiClient.get('/admin/mentorship/sessions', { params });
		return unwrap(response);
	},

	getSessionsByStatus(status, page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_MENTORSHIP}/sessions/by-status`, { params: { status, page, size } });
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

	getAllMentorProfiles(page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_MENTORSHIP}/mentors`, { params: { page, size } });
	},

	getMentorProfilesByApproval(isApproved, page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_MENTORSHIP}/mentors/by-approval`, { params: { isApproved, page, size } });
	},

	approveMentor(memberId) {
		return apiClient.post(`${BASE_ADMIN_MENTORSHIP}/mentors/${memberId}/approve`);
	},

	getMentorshipStatistics() {
		return apiClient.get(`${BASE_ADMIN_MENTORSHIP}/statistics`);
	},
};

export const {
	getAllSessions,
	getSessionsByStatus,
	getSessionById,
	updateSessionStatus,
	deleteSession,
	getAllMentorProfiles,
	getMentorProfilesByApproval,
	approveMentor,
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

	async getGroupMembers(groupId, { text = '', page = 0, size = 50 } = {}) {
		const response = await apiClient.get(`/chat/groups/${groupId}/members`, {
			params: { text, page, size },
		});
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
};

export const {
	listGroupChats,
	listPrivateChats,
	getMessages,
	getConversationRequestStatus,
	createConversationRequest,
	getRecentPreviews,
	searchIncomingRequests,
	respondToConversationRequest,
	createGroupChat,
	getGroupMembers,
} = chatApi;

export const eventApi = {
	async createEvent(payload) {
		const response = await apiClient.post('/events', payload);
		return unwrap(response);
	},

	async getAdminEvents(params = {}) {
		const response = await apiClient.get('/admin/events', { params });
		return unwrap(response);
	},

	async getAdminEventsByOrganization(organizationId, params = {}) {
		const response = await apiClient.get(`/admin/events/organization/${organizationId}`, { params });
		return unwrap(response);
	},

	async searchAdminEvents(keyword, params = {}) {
		const response = await apiClient.get('/admin/events/search', { params: { keyword, ...params } });
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

	async getEvents(params = {}) {
		const response = await apiClient.get('/events', { params });
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

	// ── Approve / Reject ──────────────────────────────────────────────────
	async approveTicket(ticketId) {
		const response = await apiClient.post(`/events/tickets/${ticketId}/approve`);
		return unwrap(response);
	},

	async rejectTicket(ticketId, payload = {}) {
		const response = await apiClient.post(`/events/tickets/${ticketId}/reject`, payload);
		return unwrap(response);
	},

	async bulkApproveTickets(eventId, payload) {
		const response = await apiClient.post(`/events/${eventId}/tickets/bulk-approve`, payload);
		return unwrap(response);
	},

	async approveAllPending(eventId) {
		const response = await apiClient.post(`/events/${eventId}/tickets/approve-all`);
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

	async activateTickets(eventId) {
		const response = await apiClient.post(`/events/${eventId}/tickets/activate`);
		return unwrap(response);
	},

	async expireTickets(eventId) {
		const response = await apiClient.post(`/events/${eventId}/tickets/expire`);
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

	async checkInTicket(ticketCode) {
		const response = await apiClient.post(`/events/tickets/${ticketCode}/check-in`);
		return unwrap(response);
	},

	async cancelTicketByCode(ticketCode) {
		const response = await apiClient.post(`/events/tickets/${ticketCode}/cancel`);
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
};

export const adminEventApi = {
	getAllEvents(page = 0, size = 10) {
		return apiClient.get(BASE_ADMIN_EVENTS, { params: { page, size } });
	},

	getEventsByOrganization(organizationId, page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_EVENTS}/organization/${organizationId}`, { params: { page, size } });
	},

	searchAllEvents(keyword, page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_EVENTS}/search`, { params: { keyword, page, size } });
	},

	getEventsByPublishStatus(isPublished, page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_EVENTS}/by-status`, { params: { isPublished, page, size } });
	},

	getEventById(eventId) {
		return apiClient.get(`${BASE_ADMIN_EVENTS}/${eventId}`);
	},

	updateEvent(eventId, payload) {
		return apiClient.put(`${BASE_ADMIN_EVENTS}/${eventId}`, payload);
	},

	deleteEvent(eventId) {
		return apiClient.delete(`${BASE_ADMIN_EVENTS}/${eventId}`);
	},

	publishEvent(eventId) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/${eventId}/publish`);
	},

	unpublishEvent(eventId) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/${eventId}/unpublish`);
	},

	getTicketsByEvent(eventId, page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_EVENTS}/${eventId}/tickets`, { params: { page, size } });
	},

	getTicketsByEventAndStatus(eventId, status, page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_EVENTS}/${eventId}/tickets`, { params: { status, page, size } });
	},

	cancelTicket(ticketCode) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/tickets/${ticketCode}/cancel`);
	},

	approveTicket(ticketId) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/tickets/${ticketId}/approve`);
	},

	rejectTicket(ticketId, payload = {}) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/tickets/${ticketId}/reject`, payload);
	},

	bulkApproveTickets(eventId, payload) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/${eventId}/tickets/bulk-approve`, payload);
	},

	approveAllPending(eventId) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/${eventId}/tickets/approve-all`);
	},

	sendIssuedTicketEmails(eventId) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/${eventId}/tickets/send-emails`);
	},

	activateTickets(eventId) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/${eventId}/tickets/activate`);
	},

	expireTickets(eventId) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/${eventId}/tickets/expire`);
	},

	inviteUsers(eventId, payload) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/${eventId}/invitations`, payload);
	},

	getInvitations(eventId, page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_EVENTS}/${eventId}/invitations`, { params: { page, size } });
	},

	sendReminders(eventId, payload) {
		return apiClient.post(`${BASE_ADMIN_EVENTS}/${eventId}/reminders`, payload);
	},

	getEmailLogs(eventId, page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_EVENTS}/${eventId}/email-logs`, { params: { page, size } });
	},

	getInterestsByEvent(eventId, page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_EVENTS}/${eventId}/interests`, { params: { page, size } });
	},

	getEventStatistics() {
		return apiClient.get(`${BASE_ADMIN_EVENTS}/statistics`);
	},

	getEventStatisticsById(eventId) {
		return apiClient.get(`${BASE_ADMIN_EVENTS}/${eventId}/statistics`);
	},
};

export const {
	getAllEvents,
	getEventsByOrganization,
	searchAllEvents,
	getEventsByPublishStatus,
	getEventById,
	updateEvent: updateAdminEvent,
	deleteEvent: deleteAdminEvent,
	publishEvent: publishAdminEvent,
	unpublishEvent: unpublishAdminEvent,
	getTicketsByEvent,
	getTicketsByEventAndStatus,
	cancelTicket,
	approveTicket,
	rejectTicket,
	bulkApproveTickets,
	approveAllPending,
	sendIssuedTicketEmails,
	activateTickets,
	expireTickets,
	inviteUsers: inviteEventUsers,
	getInvitations: getEventInvitations,
	sendReminders,
	getEmailLogs,
	getInterestsByEvent,
	getEventStatistics,
	getEventStatisticsById,
} = adminEventApi;

export const adminForumApi = {
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

	getNewPostsYesterdayPaginated(page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_FORUM}/posts/yesterday/paginated`, { params: { page, size } });
	},

	getBannedPosts(page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_FORUM}/posts/banned/list`, { params: { page, size } });
	},

	getAllPosts(keyword = '', page = 0, size = 20) {
		const params = { page, size };
		if (keyword) params.keyword = keyword;
		return apiClient.get(`${BASE_ADMIN_FORUM}/posts`, { params });
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

	getPendingReports(page = 0, size = 10) {
		return apiClient.get(`${BASE_ADMIN_FORUM_V2}/reports`, { params: { page, size } });
	},

	reviewReport(reportId, payload) {
		return apiClient.put(`${BASE_ADMIN_FORUM_V2}/reports/${reportId}`, payload);
	},

	updatePostVisibility(postId, payload) {
		return apiClient.put(`${BASE_ADMIN_FORUM_V2}/posts/${postId}/visibility`, payload);
	},

	getAllCategories(organizationId) {
		return apiClient.get(`${BASE_ADMIN_FORUM}/categories`, { params: { organizationId } });
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

	getAllTopics(organizationId, keyword = '', page = 0, size = 10) {
		const params = { organizationId, page, size };
		if (keyword) params.keyword = keyword;
		return apiClient.get(`${BASE_ADMIN_FORUM}/topics`, { params });
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

	updateTopicLock(topicId, payload) {
		return apiClient.put(`${BASE_ADMIN_FORUM_V2}/topics/${topicId}/lock`, payload);
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
	getCategoryById,
	createCategory,
	updateCategory,
	deleteCategory,
	getAllTopics,
	getTopicById,
	createTopic,
	updateTopic,
	deleteTopic,
	updateTopicLock,
} = adminForumApi;

export const fundApi = {
	async getFunds(params = {}) {
		const response = await apiClient.get(BASE_FUND, { params });
		return unwrap(response);
	},

	async getFundDetail(id) {
		const response = await apiClient.get(`${BASE_FUND}/${id}`);
		return unwrap(response);
	},

	async getFundStatuses() {
		const response = await apiClient.get('/fund-statuses');
		return unwrap(response) ?? [];
	},

	async getFundStatistics() {
		const response = await apiClient.get(`${BASE_FUND}/statistics`);
		return unwrap(response);
	},

	async getActiveFundReceivingInfos() {
		const response = await apiClient.get(`${BASE_FUND}/receiving-infos/active`);
		return unwrap(response) ?? [];
	},

	async getFundDonationsByFundId(fundId, params = {}) {
		const response = await apiClient.get(`/fund-donations/${fundId}`, { params });
		return unwrap(response);
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

	async closeFund(fundId) {
		const response = await apiClient.put(`${BASE_FUND}/${fundId}/close`);
		return unwrap(response);
	},
};

export const {
	getFunds,
	getFundDetail,
	getFundStatuses,
	getFundStatistics,
	getActiveFundReceivingInfos,
	getFundDonationsByFundId,
	createFundDonation,
	createFund,
	updateFund,
	closeFund,
} = fundApi;

export const networkApi = {
	async searchMembers(params = {}) {
		const response = await apiClient.get('/chat/network/members', { params });
		return unwrap(response);
	},
};

export const { searchMembers } = networkApi;

export const userApi = {
	joinOrganization(payload) {
		const userId = useAuthStore.getState().user?.id;
		const body = {
			organizationId: Number(payload.organizationId),
			userId: Number(userId),
			graduatedYear: payload.graduatedYear ? [Number(payload.graduatedYear)] : null,
			graduationStatus: payload.graduationStatus ?? null,
			program: payload.program ?? null,
			major: payload.major ?? null,
			verificationLevel: 0,
			status: 'active',
		};
		return apiClient.post('/admin/users/organization-member', body);
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
	async getProfile() {
		const response = await apiClient.get('/users/me/profile');
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
};

export const {
	getProfile,
	getOrganizationMember,
	getNotificationSettings,
	updateProfile,
	updateNotificationSettings,
	changePassword,
	getLoginHistory,
	getPendingPeerVerifications,
	acceptPeerVerification,
} = userSettingsApi;

export const mentorshipApi = {
	saveMenteeProfile(payload) {
		return apiClient.post(`${BASE_MENTEE}/profile`, payload);
	},

	getMyMenteeProfile() {
		return apiClient.get(`${BASE_MENTEE}/profile`);
	},

	getApprovedMentors(page = 0, limit = 12) {
		return apiClient.get(`${BASE_MENTEE}/mentors`, { params: { page, limit } });
	},

	getMentorProfile(mentorMemberId) {
		return apiClient.get(`${BASE_MENTEE}/mentors/${mentorMemberId}`);
	},

	searchMentors(keyword, page = 0, limit = 12) {
		return apiClient.get(`${BASE_MENTEE}/mentors/search`, { params: { keyword, page, limit } });
	},

	filterMentors(params = {}) {
		return apiClient.get(`${BASE_MENTEE}/mentors/filter`, { params });
	},

	getExpertiseTopics() {
		return apiClient.get(`${BASE_MENTEE}/expertise-topics`);
	},

	getExpertiseCategories() {
		return apiClient.get(`${BASE_MENTEE}/expertise-categories`);
	},

	getMentorExpertise(mentorMemberId) {
		return apiClient.get(`${BASE_MENTEE}/mentors/${mentorMemberId}/expertise`);
	},

	getMentorAvailableSlots(mentorMemberId) {
		return apiClient.get(`${BASE_MENTEE}/mentors/${mentorMemberId}/availability`);
	},

	getMentorFeedbacks(mentorMemberId, page = 0, limit = 10) {
		return apiClient.get(`${BASE_MENTEE}/mentors/${mentorMemberId}/feedbacks`, { params: { page, limit } });
	},

	bookSession(payload) {
		return apiClient.post(`${BASE_MENTEE}/sessions/book`, payload);
	},

	getMyMenteeSessions(params = {}) {
		return apiClient.get(`${BASE_MENTEE}/sessions`, { params });
	},

	getMenteeSessionById(sessionId) {
		return apiClient.get(`${BASE_MENTEE}/sessions/${sessionId}`);
	},

	cancelSession(sessionId) {
		return apiClient.post(`${BASE_MENTEE}/sessions/${sessionId}/cancel`);
	},

	createSessionFeedback(sessionId, payload) {
		return apiClient.post(`${BASE_MENTEE}/sessions/${sessionId}/feedback`, payload);
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

	getMyMentorFeedbacks(page = 0, limit = 10) {
		return apiClient.get(`${BASE_MENTOR}/feedbacks`, { params: { page, limit } });
	},

	uploadCvFile({ base64String, fileName }) {
		return apiClient.post(`${BASE_MENTOR}/cv/upload`, { base64String, fileName });
	},
};

export const {
	saveMenteeProfile,
	getMyMenteeProfile,
	getApprovedMentors,
	getMentorProfile,
	searchMentors,
	filterMentors,
	getExpertiseTopics,
	getExpertiseCategories,
	getMentorExpertise,
	getMentorAvailableSlots,
	getMentorFeedbacks,
	bookSession,
	getMyMenteeSessions,
	getMenteeSessionById,
	cancelSession,
	createSessionFeedback,
	createMentorProfile,
	saveMentorProfileDraft,
	updateMentorProfile,
	getMyMentorProfile,
	addMyExpertise,
	getMyExpertise,
	deleteMyExpertise,
	updateMyExpertise,
	addMyAvailability,
	getMyAvailabilities,
	deleteMyAvailability,
	updateMyAvailability,
	getMyMentorSessions,
	updateSessionStatus: updateMentorSessionStatus,
	getMyMentorFeedbacks,
	uploadCvFile,
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

export const {
	getNotifications,
	markAsRead,
	deleteNotification,
	deleteAllNotifications,
} = notificationApi;

export const api = {
	organizationApi,
	adminOrganizationApi,
	adminAuditApi,
	adminUserApi,
	adminMentorshipApi,
	chatApi,
	eventApi,
	adminEventApi,
	adminForumApi,
	fundApi,
	networkApi,
	userApi,
	userSettingsApi,
	mentorshipApi,
	notificationApi,
};

export default api;
