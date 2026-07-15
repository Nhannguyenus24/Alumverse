const formatSentenceCase = (raw) => {
  if (raw == null || raw === '') {
    return '—';
  }
  const s = String(raw).replace(/_/g, ' ').trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const resolveLabel = (t, map, key, fallback) => {
  const i18nKey = map[key];
  return i18nKey && t ? t(i18nKey) : formatSentenceCase(fallback);
};

export const formatAccountStatusLabel = (status, t) => {
  const key = String(status || '').toUpperCase();
  const map = {
    ACTIVE: 'admin:status_active',
    INACTIVE: 'admin:status_inactive',
    BANNED: 'admin:status_banned',
    SUSPENDED: 'admin:status_suspended',
    DELETED: 'admin:status_deleted',
    DISABLED: 'admin:status_disabled',
    PENDING: 'admin:status_pending',
    VERIFYING: 'admin:status_verifying',
    UNVERIFIED: 'admin:status_unverified',
  };
  return resolveLabel(t, map, key, status);
};

const formatOrganizationStatusLabel = (status, t) => {
  const key = String(status || '').toUpperCase();
  const map = {
    ACTIVE: 'admin:status_active',
    INACTIVE: 'admin:status_inactive',
  };
  return resolveLabel(t, map, key, status);
};

const formatAuditStatusLabel = (status, t) => {
  const key = String(status || '').toUpperCase();
  const map = {
    SUCCESS: 'admin:status_success',
    FAILED: 'admin:status_failed',
    PENDING: 'admin:status_processing',
    SENT: 'admin:status_sent',
  };
  return resolveLabel(t, map, key, status);
};

const formatForumStatusLabel = (status, t) => {
  const key = String(status || '').toUpperCase();

  const map = {
    PENDING: 'admin:forum_status_pending',
    FLAGGED: 'admin:forum_status_flagged',
    APPROVED: 'admin:forum_status_approved',
    REJECTED: 'admin:forum_status_rejected',
    ACTIVE: 'admin:forum_status_active',
    INACTIVE: 'admin:forum_status_inactive',
  };

  return resolveLabel(t, map, key, status);
};

const formatFeedbackStatusLabel = (status, t) => {
  const key = String(status || '').toUpperCase();

  const map = {
    NEW: 'admin:feedback_new',
    READ: 'admin:feedback_read',
  };

  return resolveLabel(t, map, key, status);
};

const formatFundDonationStatusLabel = (status, t) => {
  const key = String(status || '').toUpperCase();
  const map = {
    SUCCESS: 'admin:status_success',
    PENDING: 'admin:fund_donation_status_pending',
    FAILED: 'admin:status_failed',
  };
  return resolveLabel(t, map, key, status);
};

const formatFundraisingStatusLabel = (status, t) => {
  const key = String(status || '').toUpperCase();
  const map = {
    UPCOMING: 'admin:fund_phase_upcoming',
    ACTIVE: 'admin:fund_phase_active',
    ENDED: 'admin:fund_phase_ended',
  };
  return resolveLabel(t, map, key, status);
};

const formatArticleStatusLabel = (status, t) => {
  const key = String(status || '').toUpperCase();
  const map = {
    PUBLISHED: 'admin:article_status_published',
    APPROVED: 'admin:forum_status_approved',
    REJECTED: 'admin:article_status_rejected',
    HIDDEN: 'admin:article_status_hidden',
    PENDING: 'admin:forum_status_pending',
    DRAFT: 'admin:draft_chip',
    UNSUPPORTED: 'admin:article_status_unsupported',
  };
  return resolveLabel(t, map, key, status);
};

const formatEventStatusLabel = (status, t) => {
  const key = String(status || '').toUpperCase();
  const map = {
    PUBLISHED: 'admin:event_status_published',
    DRAFT: 'admin:event_status_draft',
    UPCOMING: 'admin:stats_upcoming',
    ONGOING: 'admin:stats_ongoing',
    PAST: 'admin:stats_past',
    REGISTERED: 'admin:event_ticket_registered',
    PENDING: 'admin:event_ticket_pending',
    ISSUED: 'admin:event_ticket_issued',
    CHECKED_IN: 'admin:event_ticket_checked_in',
    USED: 'admin:event_ticket_used',
    CANCELLED: 'admin:event_ticket_cancelled',
    EXPIRED: 'admin:event_ticket_expired',
    CONFIRMED: 'admin:status_success',
    DECLINED: 'admin:forum_status_rejected',
  };
  return resolveLabel(t, map, key, status);
};

const formatMentorshipStatusLabel = (status, t) => {
  const key = String(status || '').toUpperCase();
  const map = {
    PENDING: 'admin:mentorship_status_pending',
    CONFIRMED: 'admin:mentorship_status_confirmed',
    COMPLETED: 'admin:mentorship_status_completed',
    CANCELLED: 'admin:mentorship_status_cancelled',
    REJECTED: 'admin:mentorship_status_rejected',
    APPROVED: 'admin:mentorship_approval_approved',
  };
  return resolveLabel(t, map, key, status);
};

const FUNDRAISING_STATUS_COLORS = {
  UPCOMING: 'info',
  ACTIVE: 'primary',
  ENDED: 'default',
};

const STATUS_COLORS = {
  PENDING: 'info',

  ACTIVE: 'success',
  INACTIVE: 'warning',
  BANNED: 'error',
  SUSPENDED: 'warning',
  DELETED: 'secondary',
  DISABLED: 'tertiary',
  UNVERIFIED: 'primary',
  VERIFYING: 'info',

  SUCCESS: 'success',
  FAILED: 'error',
  SENT: 'success',

  FLAGGED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',

  NEW: 'primary',
  READ: 'default',

  PUBLISHED: 'success',
  DRAFT: 'warning',
  HIDDEN: 'warning',
  UNSUPPORTED: 'default',

  UPCOMING: 'info',
  ONGOING: 'primary',
  PAST: 'default',
  REGISTERED: 'info',
  ISSUED: 'info',
  CHECKED_IN: 'success',
  USED: 'success',
  CANCELLED: 'error',
  EXPIRED: 'default',
  CONFIRMED: 'info',
  COMPLETED: 'success',
};

const TICKET_STATUS_COLORS = {
  PENDING: 'warning',
  REGISTERED: 'primary',
  ISSUED: 'info',
  CHECKED_IN: 'success',
  USED: 'success',
  CANCELLED: 'error',
  EXPIRED: 'default',
  CONFIRMED: 'success',
  DECLINED: 'error',
  REJECTED: 'error',
};

/**
 * @param {string} status
 * @param {'account' | 'organization' | 'audit'} category
 */
export const resolveAdminStatusChip = (status, category, t) => {
  const key = String(status || '').toUpperCase();

  let label;

  switch (category) {
    case 'account':
      label = formatAccountStatusLabel(status, t);
      break;

    case 'organization':
      label = formatOrganizationStatusLabel(status, t);
      break;

    case 'audit':
      label = formatAuditStatusLabel(status, t);
      break;

    case 'forum':
      label = formatForumStatusLabel(status, t);
      break;

    case 'feedback':
      label = formatFeedbackStatusLabel(status, t);
      break;

    case 'fundraising':
      label = formatFundraisingStatusLabel(status, t);
      break;

    case 'fund-donation':
      label = formatFundDonationStatusLabel(status, t);
      break;

    case 'article':
      label = formatArticleStatusLabel(status, t);
      break;

    case 'event':
    case 'ticket':
      label = formatEventStatusLabel(status, t);
      break;

    case 'education':
    case 'verification':
    case 'report':
      label = formatForumStatusLabel(status, t);
      break;

    case 'mentorship':
      label = formatMentorshipStatusLabel(status, t);
      break;

    default:
      label = formatSentenceCase(status);
  }

  return {
    label,
    color: category === 'fundraising'
      ? (FUNDRAISING_STATUS_COLORS[key] || 'default')
      : category === 'ticket'
        ? (TICKET_STATUS_COLORS[key] || 'default')
        : (STATUS_COLORS[key] || 'default'),
  };
};
