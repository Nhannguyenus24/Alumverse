export const getDefaultNetworkFilters = (organizationId) => (
  organizationId
    ? { all: false, program: '', major: '', organizationIds: [organizationId] }
    : { all: true, program: '', major: '', organizationIds: [] }
);

export const DEFAULT_NETWORK_INCOMING_REQUEST_FILTERS = {
  all: true,
  status: '',
};

export const getNetworkSearchFilterConfig = (t, organizations = []) => {
  const baseFilters = [
    {
      type: 'input',
      key: 'program',
      label: t('network:filter_program_label'),
      inputMode: 'text',
      placeholder: t('network:filter_program_placeholder'),
    },
    {
      type: 'input',
      key: 'major',
      label: t('network:filter_major_label'),
      inputMode: 'text',
      placeholder: t('network:filter_major_placeholder'),
    },
  ];

  if (organizations.length === 0) {
    return baseFilters;
  }

  // Multi-organization support: let members broaden the directory across
  // organizations (or "Tất cả" to span every one).
  return [
    {
      type: 'dropdown',
      key: 'organizationIds',
      label: t('network:filter_organization_label'),
      multiple: true,
      options: organizations.map((org) => ({ value: org.id, label: org.name })),
    },
    ...baseFilters,
  ];
};

export const getNetworkIncomingRequestFilterConfig = (t) => [
  {
    type: 'dropdown',
    key: 'status',
    label: t('incoming_filter_status_label'),
    multiple: false,
    options: [
      { value: 'PENDING', label: t('incoming_status_pending') },
      { value: 'SENT', label: t('incoming_status_sent') },
      { value: 'REJECTED', label: t('incoming_status_rejected') },
    ],
  },
];

export const getNetworkGuestStats = (t) => [
  { value: t('network:guest_stat_members_value'), label: t('network:guest_stat_members_label') },
  { value: t('network:guest_stat_messages_value'), label: t('network:guest_stat_messages_label') },
  { value: t('network:guest_stat_growth_value'), label: t('network:guest_stat_growth_label') },
];

export const getNetworkGuestBenefits = (t) => [
  {
    title: t('network:guest_benefit_find_title'),
    description: t('network:guest_benefit_find_desc'),
  },
  {
    title: t('network:guest_benefit_message_title'),
    description: t('network:guest_benefit_message_desc'),
  },
  {
    title: t('network:guest_benefit_safe_title'),
    description: t('network:guest_benefit_safe_desc'),
  },
];

export const getNetworkGuestSteps = (t) => [
  { step: '1', title: t('network:guest_step1_title'), text: t('network:guest_step1_text') },
  { step: '2', title: t('network:guest_step2_title'), text: t('network:guest_step2_text') },
  { step: '3', title: t('network:guest_step3_title'), text: t('network:guest_step3_text') },
];
