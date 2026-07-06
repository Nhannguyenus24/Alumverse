export const DEFAULT_DONATION_FILTERS = {
  all: true,
  timeStartedFrom: '',
  timeStartedTo: '',
  trending: '',
  amountMin: '',
  amountMax: '',
};

export const getDonationFilterConfig = (t) => [
  { type: 'date', key: 'timeStartedFrom', label: t('donation:filter_from_date') },
  { type: 'date', key: 'timeStartedTo', label: t('donation:filter_to_date') },
  {
    type: 'dropdown',
    key: 'trending',
    label: t('donation:filter_trending'),
    multiple: false,
    options: [
      { value: 'asc', label: t('common:oldest') },
      { value: 'desc', label: t('common:newest') },
    ],
  },
  { type: 'range-input', key: 'amount', label: t('donation:filter_amount_range') },
];
