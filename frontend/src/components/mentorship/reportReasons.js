const getReportReasons = (t) => [
  { value: 'NO_SHOW', label: t('report_reason_no_show'), statuses: ['EXPIRED', 'COMPLETED'] },
  { value: 'LATE_OR_LEFT_EARLY', label: t('report_reason_late_or_left_early'), statuses: ['COMPLETED'] },
  { value: 'INAPPROPRIATE_BEHAVIOR', label: t('report_reason_inappropriate_behavior'), statuses: ['COMPLETED'] },
  { value: 'OFF_TOPIC_UNPROFESSIONAL', label: t('report_reason_off_topic'), statuses: ['COMPLETED'] },
  { value: 'TECHNICAL_ISSUE', label: t('report_reason_technical_issue'), statuses: ['COMPLETED', 'EXPIRED'] },
  { value: 'OTHER', label: t('report_reason_other'), statuses: ['COMPLETED', 'EXPIRED'] },
];

export const reasonsForStatus = (status, t) =>
  getReportReasons(t).filter((r) => r.statuses.includes(status));
