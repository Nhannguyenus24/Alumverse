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
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Không hoạt động',
    BANNED: 'Bị cấm',
    SUSPENDED: 'Tạm ngưng',
    DELETED: 'Đã xóa',
    DISABLED: 'Vô hiệu hóa',
    PENDING: 'Chờ duyệt',
    UNVERIFIED: 'Chưa xác minh',
  };
  return map[key] || formatTitleCase(status);
};

const formatOrganizationStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Không hoạt động',
  };
  return map[key] || formatTitleCase(status);
};

const formatAuditStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    SUCCESS: 'Thành công',
    FAILED: 'Thất bại',
    PENDING: 'Chờ xử lý',
    SENT: 'Đã gửi',
  };
  return map[key] || formatTitleCase(status);
};

const formatForumStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();

  const map = {
    PENDING: 'Chờ duyệt',
    FLAGGED: 'Bị báo cáo',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
    ACTIVE: 'Hiển thị',
    INACTIVE: 'Đã ẩn',
  };

  return map[key] || formatTitleCase(status);
};

const formatFeedbackStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();

  const map = {
    NEW: 'Mới',
    READ: 'Đã đọc',
  };

  return map[key] || formatTitleCase(status);
};

const formatFundraisingStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    UPCOMING: 'Sắp diễn ra',
    ACTIVE: 'Đang hoạt động',
    ENDED: 'Đã kết thúc',
  };
  return map[key] || formatTitleCase(status);
};

const formatArticleStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    PUBLISHED: 'Đã hiển thị',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Đã từ chối',
    HIDDEN: 'Chờ duyệt/ẩn',
    PENDING: 'Chờ duyệt',
    DRAFT: 'Bản nháp',
    UNSUPPORTED: 'Không hỗ trợ',
  };
  return map[key] || formatTitleCase(status);
};

const formatEventStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    PUBLISHED: 'Đã công bố',
    DRAFT: 'Bản nháp',
    UPCOMING: 'Sắp diễn ra',
    ONGOING: 'Đang diễn ra',
    PAST: 'Đã diễn ra',
    REGISTERED: 'Đã đăng ký',
    PENDING: 'Chờ xử lý',
    CHECKED_IN: 'Đã check-in',
    USED: 'Đã sử dụng',
    CANCELLED: 'Đã hủy',
    EXPIRED: 'Hết hạn',
  };
  return map[key] || formatTitleCase(status);
};

const formatMentorshipStatusLabel = (status) => {
  const key = String(status || '').toUpperCase();
  const map = {
    PENDING: 'Đang chờ',
    CONFIRMED: 'Đã xác nhận',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    REJECTED: 'Bị từ chối',
    APPROVED: 'Đã duyệt',
  };
  return map[key] || formatTitleCase(status);
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
  CHECKED_IN: 'success',
  USED: 'success',
  CANCELLED: 'error',
  EXPIRED: 'default',
  CONFIRMED: 'info',
  COMPLETED: 'success',
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

    case 'fundraising':
      label = formatFundraisingStatusLabel(status);
      break;

    case 'article':
      label = formatArticleStatusLabel(status);
      break;

    case 'event':
    case 'ticket':
      label = formatEventStatusLabel(status);
      break;

    case 'education':
    case 'verification':
    case 'report':
      label = formatForumStatusLabel(status);
      break;

    case 'mentorship':
      label = formatMentorshipStatusLabel(status);
      break;

    default:
      label = formatTitleCase(status);
  }

  return {
    label,
    color: category === 'fundraising'
      ? (FUNDRAISING_STATUS_COLORS[key] || 'default')
      : (STATUS_COLORS[key] || 'default'),
  };
};
