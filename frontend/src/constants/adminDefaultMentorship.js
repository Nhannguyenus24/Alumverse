export const getAdminMentorshipSessionStatusOptions = (t) => [
  { value: 'ALL', label: t('mentorship_status_all') },
  { value: 'Pending', label: t('mentorship_status_pending') },
  { value: 'Confirmed', label: t('mentorship_status_confirmed') },
  { value: 'Completed', label: t('mentorship_status_completed') },
  { value: 'Cancelled', label: t('mentorship_status_cancelled') },
  { value: 'Rejected', label: t('mentorship_status_rejected') },
];

export const getAdminMentorshipApprovalOptions = (t) => [
  { value: 'ALL', label: t('mentorship_approval_all') },
  { value: 'PENDING', label: t('mentorship_approval_pending') },
  { value: 'APPROVED', label: t('mentorship_approval_approved') },
];
