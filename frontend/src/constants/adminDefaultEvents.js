export const ADMIN_EVENT_STATUS_OPTIONS = [
  { value: 'ALL', labelKey: 'admin:event_status_all' },
  { value: 'PUBLISHED', labelKey: 'admin:event_status_published' },
  { value: 'DRAFT', labelKey: 'admin:event_status_draft' },
];

export const ADMIN_EVENT_SORT_OPTIONS = [
  { value: 'startTime', labelKey: 'admin:event_sort_start_time' },
  { value: 'createdAt', labelKey: 'admin:event_sort_created_at' },
  { value: 'title', labelKey: 'admin:event_sort_title' },
  { value: 'interestedCount', labelKey: 'admin:event_sort_interested_count' },
];

export const getAdminEventStatusOptions = (t) => (
  ADMIN_EVENT_STATUS_OPTIONS.map((option) => ({
    ...option,
    label: t(option.labelKey),
  }))
);

export const getAdminEventSortOptions = (t) => (
  ADMIN_EVENT_SORT_OPTIONS.map((option) => ({
    ...option,
    label: t(option.labelKey),
  }))
);
