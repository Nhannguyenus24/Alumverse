export const ADMIN_FILTER_BAR_SX = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  flexWrap: 'wrap',
  gap: 2,
  mb: 2,
  alignItems: { xs: 'stretch', md: 'center' },
};

export const ADMIN_PRIMARY_ACTION_BUTTON_SX = {
  textTransform: 'none',
  fontWeight: 700,
};

export const ADMIN_STATUS_CHIP_SX = {
  fontWeight: 600,
  minWidth: 110,
  justifyContent: 'center',
};

export const formatStatusLabel = (status) =>
  String(status || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
