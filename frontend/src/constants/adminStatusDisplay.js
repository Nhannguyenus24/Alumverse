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

export const formatOrganizationStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
  };
  return map[key] || formatTitleCase(status);
};

export const formatAuditStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    SUCCESS: 'Success',
    FAILED: 'Failed',
    PENDING: 'Pending',
  };
  return map[key] || formatTitleCase(status);
};

const STATUS_COLORS = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  BANNED: 'error',
  SUSPENDED: 'warning',
  DELETED: 'secondary',
  DISABLED: 'tertiary',
  UNVERIFIED: 'primary',
  PENDING: 'info',

  SUCCESS: 'success',
  FAILED: 'error',
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

    default:
      label = formatTitleCase(status);
  }

  return {
    label,
    color: STATUS_COLORS[key] || 'default',
  };
};