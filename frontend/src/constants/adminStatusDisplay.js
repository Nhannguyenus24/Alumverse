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

/**
 * @param {string} status
 * @param {'account' | 'organization' | 'audit'} category
 * @returns {{ label: string, color: 'success' | 'error' | 'warning' | 'default' }}
 */
export const resolveAdminStatusChip = (status, category) => {
  const key = String(status || '').toUpperCase();

  if (category === 'account') {
    if (key === 'ACTIVE') {
      return { label: formatAccountStatusLabel(status), color: 'success' };
    }
    if (key === 'BANNED') {
      return { label: formatAccountStatusLabel(status), color: 'error' };
    }
    if (key === 'INACTIVE' || key === 'SUSPENDED' || key === 'UNVERIFIED') {
      return { label: formatAccountStatusLabel(status), color: 'warning' };
    }
    if (key === 'PENDING') {
      return { label: formatAccountStatusLabel(status), color: 'info' };
    }
    if (key === 'DELETED' || key === 'DISABLED') {
      return { label: formatAccountStatusLabel(status), color: 'default' };
    }
    return { label: formatAccountStatusLabel(status), color: 'default' };
  }

  if (category === 'organization') {
    if (key === 'ACTIVE') {
      return { label: formatOrganizationStatusLabel(status), color: 'success' };
    }
    if (key === 'INACTIVE') {
      return { label: formatOrganizationStatusLabel(status), color: 'warning' };
    }
    return { label: formatOrganizationStatusLabel(status), color: 'default' };
  }

  if (category === 'audit') {
    if (key === 'SUCCESS') {
      return { label: formatAuditStatusLabel(status), color: 'success' };
    }
    if (key === 'FAILED') {
      return { label: formatAuditStatusLabel(status), color: 'error' };
    }
    if (key === 'PENDING') {
      return { label: formatAuditStatusLabel(status), color: 'warning' };
    }
    return { label: formatAuditStatusLabel(status), color: 'default' };
  }

  return { label: formatTitleCase(status), color: 'default' };
};
