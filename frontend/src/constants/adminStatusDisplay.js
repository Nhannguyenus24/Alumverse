const formatTitleCase = (raw) => {
  if (raw == null || raw === '') {
    return '—';
  }
  const s = String(raw).replace(/_/g, ' ').trim().toLowerCase();
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
};

export const formatAccountStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    BANNED: 'Banned',
    SUSPENDED: 'Suspended',
    DELETED: 'Deleted',
    DISABLED: 'Disabled',
    PENDING: 'Pending',
    UNVERIFIED: 'Unverified',
  };
  return map[key] || formatTitleCase(status);
};

const formatOrganizationStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
  };
  return map[key] || formatTitleCase(status);
};

const formatAuditStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    SUCCESS: 'Success',
    FAILED: 'Failed',
    PENDING: 'Pending',
  };
  return map[key] || formatTitleCase(status);
};

const formatForumStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();

  const map = {
    PENDING: 'Pending',
    FLAGGED: 'Flagged',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };

  return map[key] || formatTitleCase(status);
};

const formatFeedbackStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();

  const map = {
    NEW: 'New',
    READ: 'Read',
  };

  return map[key] || formatTitleCase(status);
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

  SUCCESS: 'success',
  FAILED: 'error',

  FLAGGED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',

  NEW: 'primary',
  READ: 'default',
};

/**
 * @param {string} status
 * @param {'account' | 'organization' | 'audit'} category
 */
export const resolveAdminStatusChip = (status, category) => {
  const key = String(status || '').toUpperCase();

  let label;

  switch (category) {
    case 'account':
      label = formatAccountStatusLabel(status);
      break;

    case 'organization':
      label = formatOrganizationStatusLabel(status);
      break;

    case 'audit':
      label = formatAuditStatusLabel(status);
      break;

    case 'forum':
      label = formatForumStatusLabel(status);
      break;

    case 'feedback':
      label = formatFeedbackStatusLabel(status);
      break;

    default:
      label = formatTitleCase(status);
  }

  return {
    label,
    color: STATUS_COLORS[key] || 'default',
  };
};