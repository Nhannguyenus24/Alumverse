export const FORUM_STATUS_MENU_ORDER = ['PENDING', 'FLAGGED', 'APPROVED', 'REJECTED'];

export const FORUM_TOPIC_STATUS_OPTIONS = ['ACTIVE', 'PENDING', 'INACTIVE'];

export const getForumStatusFilterOptions = (t) => [
  { value: 'ALL', label: t('admin:filter_all') },
  { value: 'PENDING', label: t('admin:forum_status_pending') },
  { value: 'FLAGGED', label: t('admin:forum_status_flagged') },
  { value: 'APPROVED', label: t('admin:forum_status_approved') },
  { value: 'REJECTED', label: t('admin:forum_status_rejected') },
];
